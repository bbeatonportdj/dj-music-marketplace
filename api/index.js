import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import Stripe from 'stripe';
import Busboy from 'busboy';

// Rate limiting

// Input validation helpers
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

let driveClient = null;

// In-memory cache for audio metadata (file URLs, MIME types, sizes)
const audioCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedAudio(fileId) {
  const cached = audioCache.get(fileId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  audioCache.delete(fileId);
  return null;
}

function setCachedAudio(fileId, data) {
  // Limit cache size to 1000 entries
  if (audioCache.size > 1000) {
    const oldestKey = audioCache.keys().next().value;
    audioCache.delete(oldestKey);
  }
  audioCache.set(fileId, { data, timestamp: Date.now() });
}

function getDriveClient() {
  if (driveClient) return driveClient;
  const raw = process.env.GOOGLE_DRIVE_CREDENTIALS;
  if (!raw) return null;
  try {
    const creds = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    driveClient = google.drive({ version: 'v3', auth });
    return driveClient;
  } catch (e) {
    console.error('Failed to init Drive client:', e.message);
    return null;
  }
}

function cors(res, req) {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req?.headers?.origin || '';
  
  // SECURITY: If no allowed origins configured, block all cross-origin requests
  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', 'https://djmusicmarketplace.fun');
  } else {
    const isAllowed = allowedOrigins.includes(origin);
    res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin : allowedOrigins[0]);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://fbwqgbsalqgcrfxhoure.supabase.co https://api.omise.co; media-src 'self' https: blob:; frame-ancestors 'none';");
}

const COOKIE_NAME = 'sb_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function setAuthCookie(res, token) {
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/api',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearAuthCookie(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/api',
    'Max-Age=0',
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function getCookie(req, name) {
  const cookieStr = req.headers.cookie || '';
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── Rate Limiter ─────────────────────────────────────────────────
// In-memory rate limiter (per-invocation in serverless — best-effort only)
const rateLimitStore = new Map();
const authRateLimitStore = new Map();

function checkRateLimit(key, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key).filter(t => t > windowStart);
  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  rateLimitStore.set(key, requests);
  return true;
}

// SECURITY: Stricter rate limit for auth endpoints (5 attempts per minute)
function checkAuthRateLimit(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!authRateLimitStore.has(key)) {
    authRateLimitStore.set(key, []);
  }

  const requests = authRateLimitStore.get(key).filter(t => t > windowStart);
  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  authRateLimitStore.set(key, requests);
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────

async function getBody(req, maxSize = 1048576) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => { resolve(body); });
    req.on('error', (err) => { reject(err); });
  });
}

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(status).json(data);
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

async function getAuthUser(req, supabase) {
  // Try cookie first
  const cookieToken = getCookie(req, COOKIE_NAME);
  if (cookieToken) {
    const { data, error } = await supabase.auth.getUser(cookieToken);
    if (!error && data?.user) return data.user;
  }

  // Fallback to Authorization header (for backward compat)
  const auth = req.headers.authorization || '';
  const headerToken = auth.replace('Bearer ', '');
  if (headerToken) {
    const { data, error } = await supabase.auth.getUser(headerToken);
    if (!error && data?.user) return data.user;
  }

  return null;
}

async function getProfile(supabase, userId) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

function profileToUser(profile) {
  return {
    id: profile.id,
    email: profile.email,
    display_name: profile.full_name || profile.email?.split('@')[0] || '',
    role: profile.role || 'user',
  };
}

export default async function handler(req, res) {
  cors(res, req);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Rate limiting
  const ip = getClientIp(req);
  const rlKey = `${ip}:${req.method}:${req.url}`;
  if (!checkRateLimit(rlKey)) {
    return json(res, 429, { error: 'Too many requests. Please slow down.' });
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const path = url.pathname;

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fbwqgbsalqgcrfxhoure.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY || supabaseKey;
    const authClient = supabaseKey !== anonKey ? createClient(supabaseUrl, anonKey) : supabase;

    // Health
    if (path === '/api/' || path === '/health' || path === '/api/health') {
      return json(res, 200, { status: 'OK', timestamp: new Date().toISOString() });
    }

    // ─── Auth: Register ───────────────────────────────────────────────
    if (path === '/api/auth/register' && req.method === 'POST') {
      // SECURITY: Auth-specific rate limiting
      const authRlKey = `auth:${ip}`;
      if (!checkAuthRateLimit(authRlKey)) {
        return json(res, 429, { error: 'Too many attempts. Please try again later.' });
      }

      const body = JSON.parse(await getBody(req));
      const { email, password, display_name, phone } = body;
      const role = 'user';

      if (!email || !password) {
        return json(res, 400, { error: 'Email and password are required' });
      }

      // SECURITY: Enforce password minimum length
      if (password.length < 6) {
        return json(res, 400, { error: 'Password must be at least 6 characters' });
      }

      // SECURITY: Basic email format check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(res, 400, { error: 'Invalid email format' });
      }

      const { data, error } = await authClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: display_name || email.split('@')[0], role, phone: phone || '' },
        },
      });

      if (error) {
        const errMsg = error.message || error.error_description || error.msg || 'Registration failed';
        // Don't leak internal Supabase errors
        if (errMsg.includes('supabase') || errMsg.includes('database') || errMsg.includes('internal')) {
          return json(res, 400, { error: 'Registration failed. Please try again.' });
        }
        return json(res, 400, { error: errMsg });
      }

      if (!data.user) {
        return json(res, 400, { error: 'User creation failed' });
      }

      // Insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: display_name || email.split('@')[0],
          role,
          phone: phone || null,
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile insert error:', profileError.message);
      }

      // Set HttpOnly cookie
      if (data.session?.access_token) {
        setAuthCookie(res, data.session.access_token);
      }

      return json(res, 201, {
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: display_name || email.split('@')[0],
          role,
        },
      });
    }

    // ─── Auth: Login ──────────────────────────────────────────────────
    if (path === '/api/auth/login' && req.method === 'POST') {
      // SECURITY: Auth-specific rate limiting
      const authRlKey = `auth:${ip}`;
      if (!checkAuthRateLimit(authRlKey)) {
        return json(res, 429, { error: 'Too many attempts. Please try again later.' });
      }

      const body = JSON.parse(await getBody(req));
      const { email, password } = body;

      if (!email || !password) {
        return json(res, 400, { error: 'Email and password are required' });
      }

      const { data, error } = await authClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        return json(res, 401, { error: error?.message || 'Invalid credentials' });
      }

      // Get or create profile
      let profile = await getProfile(supabase, data.user.id);
      if (!profile) {
        const { insErr } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: data.user.user_metadata?.role || 'user',
          }, { onConflict: 'id' });
        if (insErr) console.error('Profile insert error:', insErr.message);
        profile = await getProfile(supabase, data.user.id);
      }

      // Set HttpOnly cookie
      setAuthCookie(res, data.session.access_token);

      return json(res, 200, {
        user: profileToUser(profile),
      });
    }

    // ─── Auth: Logout ─────────────────────────────────────────────────
    if (path === '/api/auth/logout' && req.method === 'POST') {
      clearAuthCookie(res);
      return json(res, 200, { message: 'Logged out' });
    }

    // ─── Auth: Forgot Password ────────────────────────────────────────
    if (path === '/api/auth/forgot-password' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      const { email } = body;

      if (!email) {
        return json(res, 400, { error: 'Email is required' });
      }

      const { error } = await authClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.headers.origin || 'https://djmusicmarketplace.fun'}/reset-password`,
      });

      if (error) {
        console.error('Forgot password error:', error.message);
      }

      // Always return success to prevent email enumeration
      return json(res, 200, { message: 'If that email is registered, a reset link has been sent.' });
    }

    // ─── Auth: Forgot Password via Phone (SMS) ────────────────────────
    if (path === '/api/auth/forgot-password-phone' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      const { phone } = body;

      if (!phone) {
        return json(res, 400, { error: 'Phone number is required' });
      }

      // Normalize phone: ensure it starts with + (international format)
      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      // Find user by phone in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('phone', normalizedPhone)
        .single();

      if (!profile?.email) {
        // Always return success to prevent phone enumeration
        return json(res, 200, { message: 'If that phone number is registered, an OTP has been sent.' });
      }

      // Send OTP via Supabase phone auth
      const { error } = await authClient.auth.signInWithOtp({
        phone: normalizedPhone,
      });

      if (error) {
        console.error('SMS OTP error:', error.message);
      }

      return json(res, 200, { message: 'If that phone number is registered, an OTP has been sent.' });
    }

    // ─── Auth: Verify Phone OTP ────────────────────────────────────────
    if (path === '/api/auth/verify-phone-otp' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      const { phone, token } = body;

      if (!phone || !token) {
        return json(res, 400, { error: 'Phone number and OTP code are required' });
      }

      const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

      const { data, error } = await authClient.auth.verifyOtp({
        phone: normalizedPhone,
        token,
        type: 'sms',
      });

      if (error || !data?.session) {
        return json(res, 401, { error: error?.message || 'Invalid OTP code' });
      }

      // Find profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', normalizedPhone)
        .single();

      if (profile) {
        setAuthCookie(res, data.session.access_token);
        return json(res, 200, {
          user: profileToUser(profile),
          message: 'Phone verified successfully',
        });
      }

      // If no profile found, create one
      const userId = data.session.user?.id;
      if (userId) {
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: data.session.user.email || '',
            full_name: data.session.user.user_metadata?.full_name || 'User',
            role: 'user',
            phone: normalizedPhone,
          }, { onConflict: 'id' });

        const newProfile = await getProfile(supabase, userId);
        setAuthCookie(res, data.session.access_token);
        return json(res, 200, {
          user: profileToUser(newProfile || { id: userId, email: data.session.user.email || '', full_name: 'User', role: 'user' }),
          message: 'Phone verified successfully',
        });
      }

      return json(res, 500, { error: 'Failed to verify phone' });
    }

    // ─── Auth: OAuth (Google/Facebook) ────────────────────────────────
    if (path === '/api/auth/oauth' && req.method === 'POST') {
      const body = JSON.parse(await getBody(req));
      const { access_token } = body;

      if (!access_token) {
        return json(res, 400, { error: 'Access token is required' });
      }

      // Verify the token with Supabase
      const { data: userData, error: userErr } = await supabase.auth.getUser(access_token);
      if (userErr || !userData?.user) {
        return json(res, 401, { error: 'Invalid OAuth token' });
      }

      const sbUser = userData.user;
      const email = sbUser.email;
      const meta = sbUser.user_metadata || {};
      const fullName = meta.full_name || meta.name || email?.split('@')[0] || 'User';

      // Get or create profile
      let profile = await getProfile(supabase, sbUser.id);
      if (!profile) {
        await supabase
          .from('profiles')
          .upsert({
            id: sbUser.id,
            email,
            full_name: fullName,
            role: 'user',
          }, { onConflict: 'id' });
        profile = await getProfile(supabase, sbUser.id);
      }

      // Set HttpOnly cookie with the Supabase access token
      setAuthCookie(res, access_token);

      return json(res, 200, {
        user: profileToUser(profile || { id: sbUser.id, email, full_name: fullName, role: 'user' }),
      });
    }

    // ─── Auth: Me ─────────────────────────────────────────────────────
    if (path === '/api/auth/me' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) {
        return json(res, 401, { error: 'Not authenticated' });
      }

      const profile = await getProfile(supabase, user.id);
      return json(res, 200, {
        user: profileToUser(profile || { id: user.id, email: user.email, full_name: user.email?.split('@')[0], role: 'user' }),
      });
    }

    // ─── Auth: Profile Update ─────────────────────────────────────────
    if (path === '/api/auth/profile' && req.method === 'PUT') {
      const user = await getAuthUser(req, supabase);
      if (!user) {
        return json(res, 401, { error: 'Not authenticated' });
      }

      const body = JSON.parse(await getBody(req));
      const { display_name } = body;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: display_name || user.email?.split('@')[0],
        }, { onConflict: 'id' });

      if (error) {
        return json(res, 500, { error: 'Failed to update profile' });
      }

      const profile = await getProfile(supabase, user.id);
      return json(res, 200, {
        user: profileToUser(profile),
      });
    }

    // ─── Orders: Create ────────────────────────────────────────────────
    if (path === '/api/orders' && req.method === 'POST') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const body = JSON.parse(await getBody(req));
      const { track_ids, payment_method } = body;

      if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
        return json(res, 400, { error: 'Track IDs are required' });
      }

      const { data: tracks, error: trackError } = await supabase
        .from('tracks')
        .select('id, title, artist, price')
        .in('id', track_ids);

      if (trackError || !tracks || tracks.length === 0) {
        return json(res, 400, { error: 'No valid tracks found' });
      }

      const USD_TO_THB = 33.41;
      const total_amount_usd = tracks.reduce((sum, t) => sum + Number(t.price || 0), 0);
      const total_amount_thb = Math.round(total_amount_usd * USD_TO_THB * 100) / 100;
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const promptpay_ref = `PP-${timestamp}-${random}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email,
          total_amount: total_amount_usd,
          status: total_amount_usd === 0 ? 'paid' : 'pending',
          payment_method: payment_method || 'promptpay',
          promptpay_ref,
        })
        .select()
        .single();

      if (orderError) return json(res, 500, { error: orderError.message });

      const orderItems = tracks.map(t => ({
        order_id: order.id,
        track_id: t.id,
        price_at_purchase: t.price,
      }));
      await supabase.from('order_items').insert(orderItems);

      let qr_code_url = '';
      if (order.status === 'pending' && total_amount_usd > 0) {
        // Local QR generation using promptpay-qr (no TEST MODE banner)
        const promptpayId = process.env.VITE_PROMPTPAY_ID || '0820014084';
        try {
          const payload = generatePayload(promptpayId, { amount: total_amount_thb });
          qr_code_url = await QRCode.toDataURL(payload, { 
            width: 300, 
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' }
          });
          console.log(`QR generated for order ${order.id}: ฿${total_amount_thb}`);
        } catch (qrErr) {
          console.error('QR generation failed:', qrErr);
          return json(res, 500, { error: 'Failed to generate QR code' });
        }
      }

      if (order.status === 'paid') {
        await supabase.from('user_purchases').upsert(
          tracks.map(t => ({ user_id: user.id, track_id: t.id, purchased_at: new Date() })),
          { onConflict: 'user_id,track_id', ignoreDuplicates: true }
        );
      }

      return json(res, 201, {
        order,
        qr_code_url,
        tracks: tracks.map(t => ({ id: t.id, title: t.title, artist: t.artist, price: t.price })),
      });
    }

    // ─── Orders: List ──────────────────────────────────────────────────
    if (path === '/api/orders' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`*, order_items(id, price_at_purchase, track_id)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return json(res, 500, { error: 'Failed to load orders' });

      // Enrich order items with track data
      const enriched = await Promise.all(orders.map(async (order) => {
        const items = order.order_items || [];
        const trackIds = items.map(i => i.track_id);
        let tracks = [];
        if (trackIds.length > 0) {
          const { data: t } = await supabase.from('tracks').select('id, title, artist, artwork_url').in('id', trackIds);
          tracks = t || [];
        }
        return {
          ...order,
          order_items: items.map(item => ({
            ...item,
            track: tracks.find(t => t.id === item.track_id) || null,
          })),
        };
      }));

      return json(res, 200, enriched);
    }

    // ─── Orders: Purchased Tracks ──────────────────────────────────────
    if (path === '/api/orders/purchased' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const { data: purchases, error } = await supabase
        .from('user_purchases')
        .select('track_id')
        .eq('user_id', user.id);

      if (error) return json(res, 500, { error: 'Failed to load purchases' });

      const trackIds = purchases.map(p => p.track_id);
      if (trackIds.length === 0) return json(res, 200, []);

      const { data: tracks } = await supabase
        .from('tracks')
        .select('*')
        .in('id', trackIds);

      return json(res, 200, tracks || []);
    }

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: 10 * 1024 * 1024 }, // 10MB max
    });
    let orderId = null;
    let fileBuffer = null;

    bb.on('field', (name, val) => {
      if (name === 'orderId') orderId = val;
    });

    bb.on('file', (fieldname, file, info) => {
      const chunks = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', () => resolve({ orderId, fileBuffer }));
    bb.on('error', reject);

    req.pipe(bb);
  });
}

    // ─── Payments: Verify PromptPay via SlipOK ────────────────────────
    if (path === '/api/payments/verify' && req.method === 'POST') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const contentType = req.headers['content-type'] || '';

      let orderId;
      let slipBuffer = null;

      if (contentType.includes('multipart/form-data')) {
        const parsed = await parseMultipart(req);
        orderId = parsed.orderId;
        slipBuffer = parsed.fileBuffer;
      } else {
        const raw = await getBody(req);
        try { orderId = JSON.parse(raw).orderId; } catch { orderId = null; }
      }

      if (!orderId) return json(res, 400, { error: 'Order ID is required' });

      // SECURITY: Validate order ID format
      if (!isValidUUID(orderId)) {
        return json(res, 400, { error: 'Invalid order ID format' });
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) return json(res, 404, { error: 'Order not found' });
      if (order.status === 'paid') return json(res, 200, { message: 'Order is already paid', order });
      if (order.user_id !== user.id) return json(res, 403, { error: 'Not your order' });

      // SlipOK verification (optional - for extra security)
      const slipokKey = process.env.SLIPOK_KEY || process.env.SLIPOK_API_KEY;

      if (slipokKey && slipBuffer) {
        // Verify with SlipOK API
        try {
          const formData = new FormData();
          const blob = new Blob([slipBuffer], { type: 'image/png' });
          formData.append('file', blob, 'slip.png');

          const slipokRes = await fetch(`https://api.slipok.com/api/line/apikey/${slipokKey}`, {
            method: 'POST',
            headers: {
              'x-authorization': slipokKey,
              'x-provider': 'slipok',
            },
            body: formData,
          });

          const slipokData = await slipokRes.json();

          if (!slipokRes.ok || slipokData.code !== '200') {
            return json(res, 400, { error: 'Slip verification failed. Please upload a valid payment slip.' });
          }

          // Verify amount matches (slip is in THB, order stored in USD)
          const transAmount = parseFloat(slipokData.data?.amount || '0');
          const expectedThb = Math.round(Number(order.total_amount) * 33.41 * 100) / 100;
          if (transAmount < expectedThb) {
            return json(res, 400, { error: `Payment amount mismatch. Expected THB ${expectedThb}, received THB ${transAmount}` });
          }
          console.log(`SlipOK verified: order ${orderId}, amount ฿${transAmount}`);
        } catch (err) {
           console.error('SlipOK error:', err);
           return json(res, 500, { error: 'Payment verification failed' });
        }
      } else {
        // Direct confirmation (user confirms payment manually)
        // In production, this should be combined with bank webhook or manual review
        console.log(`Payment confirmed by user: order ${orderId}`);
      }

      // Mark order as paid
      await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

      const { data: items } = await supabase
        .from('order_items')
        .select('track_id')
        .eq('order_id', orderId);

      if (items && items.length > 0) {
        await supabase.from('user_purchases').upsert(
          items.map(i => ({ user_id: user.id, track_id: i.track_id, purchased_at: new Date() })),
          { onConflict: 'user_id,track_id', ignoreDuplicates: true }
        );
      }

      const { data: updated } = await supabase.from('orders').select('*').eq('id', orderId).single();
      return json(res, 200, { message: 'Payment verified successfully', order: updated });
    }

    // ─── Stripe: Create Checkout Session ──────────────────────────────
    if (path === '/api/stripe/create-checkout-session' && req.method === 'POST') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const body = JSON.parse(await getBody(req));
      const { track_ids } = body;

      if (!track_ids || !Array.isArray(track_ids) || track_ids.length === 0) {
        return json(res, 400, { error: 'Track IDs are required' });
      }

      const { data: tracks, error: trackError } = await supabase
        .from('tracks')
        .select('id, title, artist, price')
        .in('id', track_ids);

      if (trackError || !tracks) return json(res, 400, { error: 'Invalid tracks' });

      const total_amount = tracks.reduce((sum, t) => sum + Number(t.price || 0), 0);

      if (total_amount <= 0) {
        return json(res, 400, { error: 'Total amount must be greater than 0' });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey.includes('your_stripe_secret_key')) {
        return json(res, 500, { error: 'Stripe is not configured' });
      }

      const stripe = new Stripe(stripeKey);

      // Create pending order in DB
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const promptpay_ref = `STRIPE-${timestamp}-${random}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          email: user.email,
          total_amount,
          status: 'pending',
          payment_method: 'stripe',
          promptpay_ref,
        })
        .select()
        .single();

      if (orderError) return json(res, 500, { error: 'Failed to create order' });

      await supabase.from('order_items').insert(
        tracks.map(t => ({ order_id: order.id, track_id: t.id, price_at_purchase: t.price }))
      );

      // Create Stripe Checkout Session
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const session = await stripe.checkout.sessions.create({
        line_items: tracks.map(t => ({
          price_data: {
            currency: 'usd',
            product_data: {
              name: t.title || 'Untitled Track',
              description: t.artist || '',
            },
            unit_amount: Math.round(Number(t.price) * 100),
          },
          quantity: 1,
        })),
        mode: 'payment',
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/cart`,
        metadata: {
          order_id: order.id,
          user_id: user.id,
        },
      });

      return json(res, 200, { url: session.url, order });
    }

    // ─── Stripe: Webhook ──────────────────────────────────────────────
    if (path === '/api/stripe/webhook' && req.method === 'POST') {
      const rawBody = await getBody(req);
      const sig = req.headers['stripe-signature'];

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripeKey || stripeKey.includes('your_stripe_secret_key')) {
        return json(res, 500, { error: 'Stripe is not configured' });
      }

      if (!webhookSecret || webhookSecret.includes('your_stripe_webhook_secret')) {
        return json(res, 500, { error: 'Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET in environment variables.' });
      }

      const stripe = new Stripe(stripeKey);

      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err) {
         return json(res, 400, { error: 'Invalid webhook signature' });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.order_id;
        const userId = session.metadata?.user_id;

        if (orderId && userId) {
          // Mark order as paid
          await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);

          // Create user_purchases
          const { data: items } = await supabase
            .from('order_items')
            .select('track_id')
            .eq('order_id', orderId);

          if (items && items.length > 0) {
            await supabase.from('user_purchases').upsert(
              items.map(i => ({ user_id: userId, track_id: i.track_id, purchased_at: new Date() })),
              { onConflict: 'user_id,track_id', ignoreDuplicates: true }
            );
          }
        }
      }

      return json(res, 200, { received: true });
    }

    // ─── Stripe: Session Status ──────────────────────────────────────
    if (path === '/api/stripe/session-status' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const sessionId = url.searchParams.get('session_id');
      if (!sessionId) return json(res, 400, { error: 'Missing session_id' });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey.includes('your_stripe_secret_key')) {
        return json(res, 500, { error: 'Stripe is not configured' });
      }

      const stripe = new Stripe(stripeKey);

      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return json(res, 200, {
          status: session.status,
          payment_status: session.payment_status,
          order_id: session.metadata?.order_id,
        });
      } catch (err) {
        return json(res, 500, { error: 'Failed to retrieve session' });
      }
    }

    // ─── Omise Webhook ─────────────────────────────────────────────────
    if (path === '/api/webhooks/omise' && req.method === 'POST') {
      const omiseSkey = process.env.OMISE_SKEY;

      if (!omiseSkey || !omiseSkey.startsWith('skey_')) {
        return json(res, 500, { error: 'Omise is not configured' });
      }

      // Verify webhook signature if OMISE_WEBHOOK_SECRET is set
      const webhookSecret = process.env.OMISE_WEBHOOK_SECRET;
      if (webhookSecret) {
        const sigHeader = req.headers['x-omise-signature'] || req.headers['authorization'] || '';
        if (!sigHeader.includes(webhookSecret)) {
          return json(res, 403, { error: 'Invalid webhook signature' });
        }
      }

      try {
        const rawBody = await getBody(req);
        const event = JSON.parse(rawBody);
        if (event.key === 'charge.complete') {
          const chargeId = event.data?.id;
          if (chargeId) {
            const { data: order } = await supabase
              .from('orders')
              .select('id, user_id, status')
              .eq('omise_charge_id', chargeId)
              .single();

            if (order && order.status !== 'paid') {
              await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id);
              const { data: items } = await supabase
                .from('order_items')
                .select('track_id')
                .eq('order_id', order.id);
              if (items && items.length > 0) {
                await supabase.from('user_purchases').upsert(
                  items.map(i => ({ user_id: order.user_id, track_id: i.track_id, purchased_at: new Date() })),
                  { onConflict: 'user_id,track_id', ignoreDuplicates: true }
                );
              }
            }
          }
        }
        return json(res, 200, { received: true });
      } catch (err) {
        return json(res, 400, { error: 'Invalid webhook payload' });
      }
    }

    // ─── Order Status (for polling) ────────────────────────────────────
    if (path === '/api/orders/status' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Not authenticated' });

      const orderId = url.searchParams.get('order_id');
      if (!orderId) return json(res, 400, { error: 'Missing order_id' });

      // SECURITY: Validate order ID format
      if (!isValidUUID(orderId)) {
        return json(res, 400, { error: 'Invalid order ID format' });
      }

      const { data: order } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();
      if (!order) return json(res, 404, { error: 'Order not found' });
      return json(res, 200, order);
    }

    // ─── Music Catalog ────────────────────────────────────────────────
    if (path === '/api/music' && req.method === 'GET') {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, artist, version, version_type, duration, bpm, key, genre, price, audio_url, created_at, is_new, is_hot')
        .order('created_at', { ascending: false })
        .limit(100000);
      if (error) {
        return json(res, 500, { error: 'Failed to load catalog' });
      }
      return json(res, 200, data);
    }

    // ─── Artwork for a single track ───────────────────────────────────
    if (path.startsWith('/api/artwork/') && req.method === 'GET') {
      const id = path.replace('/api/artwork/', '');
      const { data: track } = await supabase
        .from('tracks')
        .select('artwork_url')
        .eq('id', id)
        .single();
      if (track?.artwork_url) {
        return json(res, 200, { artwork_url: track.artwork_url });
      }
      return json(res, 404, { artwork_url: '' });
    }

    // ─── Single Track ─────────────────────────────────────────────────
    if (path.startsWith('/api/music/') && req.method === 'GET' && !path.startsWith('/api/music')) {
      // handled below
    }

    // ─── Preview (requires auth, streams 90s clip for audio playback) ────
    if (path.startsWith('/api/preview/') && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Please sign in to preview' });

      const id = path.replace('/api/preview/', '');
      const { data: track, error } = await supabase
        .from('tracks')
        .select('id, title, artist, gdrive_file_id, audio_url, price')
        .eq('id', id)
        .single();
      if (error || !track) {
        return json(res, 404, { error: 'Track not found' });
      }
      if (!track.gdrive_file_id && !track.audio_url) {
        return json(res, 404, { error: 'No audio available' });
      }

      // If user already purchased, serve full file via download endpoint
      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('track_id')
        .eq('user_id', user.id)
        .eq('track_id', id)
        .single();

      if (purchase) {
        // Redirect to download endpoint for full file
        return res.redirect(302, `/api/downloads/${id}`);
      }

      // Free tracks — serve full stream with download rate limit
      if (!track.price || Number(track.price) === 0) {
        // Rate limit free previews too (prevent abuse)
        const prevKey = `prev:${user.id}`;
        if (!checkRateLimit(prevKey, 30, 3600000)) {
          return json(res, 429, { error: 'Preview limit reached. Max 30 per hour.' });
        }

        const drive = getDriveClient();
        if (track.gdrive_file_id && drive) {
          try {
            // Check cache first
            let cached = getCachedAudio(track.gdrive_file_id);
            let mimeType = 'audio/mpeg';
            
            if (!cached) {
              const fileMeta = await drive.files.get({
                fileId: track.gdrive_file_id,
                fields: 'mimeType, size',
              });
              mimeType = fileMeta.data.mimeType || 'audio/mpeg';
              setCachedAudio(track.gdrive_file_id, { mimeType, size: parseInt(fileMeta.data.size || '0', 10) });
            } else {
              mimeType = cached.mimeType;
            }

            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            
            const response = await drive.files.get(
              { fileId: track.gdrive_file_id, alt: 'media' },
              { responseType: 'stream' }
            );
            response.data.pipe(res);
            return;
          } catch (driveErr) {
            return json(res, 404, { error: 'Audio file not accessible.' });
          }
        }
        if (track.audio_url) {
          return res.redirect(302, track.audio_url);
        }
        return json(res, 404, { error: 'No audio source found' });
      }

      // Paid tracks — serve 90-second preview clip via Google Drive range request
      const PREVIEW_DURATION_SECONDS = 90;
      const drive = getDriveClient();
      if (track.gdrive_file_id && drive) {
        try {
          // Check cache first
          let cached = getCachedAudio(track.gdrive_file_id);
          let mimeType = 'audio/mpeg';
          let fileSize = 0;
          
          if (!cached) {
            const fileMeta = await drive.files.get({
              fileId: track.gdrive_file_id,
              fields: 'mimeType, size',
            });
            mimeType = fileMeta.data.mimeType || 'audio/mpeg';
            fileSize = parseInt(fileMeta.data.size || '0', 10);
            setCachedAudio(track.gdrive_file_id, { mimeType, size: fileSize });
          } else {
            mimeType = cached.mimeType;
            fileSize = cached.size;
          }

          // For MP3, 90s ≈ ~1.4MB at 128kbps; use first 1.5MB to be safe
          const previewBytes = Math.min(Math.ceil(128 * 1024 / 8 * PREVIEW_DURATION_SECONDS), fileSize);

          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('Content-Length', String(previewBytes));
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800');
          res.setHeader('X-Content-Type-Options', 'nosniff');

          const response = await drive.files.get(
            { fileId: track.gdrive_file_id, alt: 'media' },
            { responseType: 'stream' }
          );

          let bytesSent = 0;
          response.data.on('data', (chunk) => {
            bytesSent += chunk.length;
            if (bytesSent <= previewBytes) {
              res.write(chunk);
            } else {
              // Truncate — only send the portion needed for 90s preview
              const remaining = previewBytes - (bytesSent - chunk.length);
              if (remaining > 0) {
                res.write(chunk.slice(0, remaining));
              }
              response.data.destroy();
              res.end();
            }
          });

          response.data.on('end', () => {
            if (!res.writableEnded) res.end();
          });

          response.data.on('error', () => {
            if (!res.writableEnded) res.end();
          });

          return;
        } catch (driveErr) {
          return json(res, 404, { error: 'Audio preview not available.' });
        }
      }

      if (track.audio_url) {
        // For Supabase-hosted audio, redirect (can't easily range-limit)
        return res.redirect(302, track.audio_url);
      }

      return json(res, 404, { error: 'No audio source found' });
    }

    // ─── Downloads: List All Purchased Tracks ─────────────────────────
    if (path === '/api/downloads' && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Please sign in' });

      const { data: purchases, error } = await supabase
        .from('user_purchases')
        .select('track_id')
        .eq('user_id', user.id);

      if (error) return json(res, 500, { error: 'Failed to load downloads' });

      const trackIds = purchases.map(p => p.track_id);
      if (trackIds.length === 0) return json(res, 200, []);

      const { data: tracks } = await supabase
        .from('tracks')
        .select('*')
        .in('id', trackIds);

      return json(res, 200, tracks || []);
    }

    // ─── Downloads (requires auth + purchase) ─────────────────────────
    if (path.startsWith('/api/downloads/') && req.method === 'GET') {
      const user = await getAuthUser(req, supabase);
      if (!user) return json(res, 401, { error: 'Please sign in to download' });

      const id = path.replace('/api/downloads/', '');

      // Rate limit: max 20 downloads per hour per user
      const dlKey = `dl:${user.id}`;
      if (!checkRateLimit(dlKey, 20, 3600000)) {
        return json(res, 429, { error: 'Download limit reached. Max 20 downloads per hour.' });
      }

      const { data: track, error } = await supabase
        .from('tracks')
        .select('id, title, artist, gdrive_file_id, audio_url, price')
        .eq('id', id)
        .single();
      if (error || !track) return json(res, 404, { error: 'Track not found' });
      if (!track.gdrive_file_id && !track.audio_url) return json(res, 404, { error: 'No audio available for this track' });

      const isFree = !track.price || Number(track.price) === 0;

      // Check purchase
      let { data: purchase } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('track_id', id)
        .single();

      // Free tracks: auto-create purchase record if not exists
      if (!purchase && isFree) {
        const { data: newPurchase } = await supabase
          .from('user_purchases')
          .upsert(
            { user_id: user.id, track_id: id, download_count: 0, purchased_at: new Date() },
            { onConflict: 'user_id,track_id' }
          )
          .select()
          .single();
        purchase = newPurchase || { download_count: 0 };
      }

      if (!purchase) return json(res, 403, { error: 'You have not purchased this track' });

      // Increment download count
      await supabase.from('user_purchases').update({ download_count: (purchase.download_count || 0) + 1 }).eq('user_id', user.id).eq('track_id', id);

      const drive = getDriveClient();
      if (track.gdrive_file_id && drive) {
        try {
          const fileMeta = await drive.files.get({
            fileId: track.gdrive_file_id,
            fields: 'mimeType, name, size',
          });
          const mimeType = fileMeta.data.mimeType || 'audio/mpeg';
          const fileName = track.title
            ? `${track.title.replace(/[^\w\s\-().&',]/g, ' ').replace(/\s+/g, ' ').trim() || 'track'}.mp3`
            : `${track.id}.mp3`;

          res.setHeader('Content-Type', mimeType);
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'private, no-store');
          res.setHeader('X-Content-Type-Options', 'nosniff');

          const response = await drive.files.get(
            { fileId: track.gdrive_file_id, alt: 'media' },
            { responseType: 'stream' }
          );
          response.data.pipe(res);
          return;
        } catch (driveErr) {
          return json(res, 500, { error: 'Failed to stream audio. File may not be accessible.' });
        }
      }

      if (track.gdrive_file_id) {
        return json(res, 500, { error: 'Audio file is not accessible' });
      }

      if (track.audio_url) {
        try {
          const audioRes = await fetch(track.audio_url);
          if (!audioRes.ok) throw new Error('Failed to fetch audio');
          const ext = track.audio_url.split('?')[0].split('.').pop()?.toLowerCase() || 'mp3';
          const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac', aac: 'audio/aac', m4a: 'audio/mp4', webm: 'audio/webm' };
          const ct = mimeMap[ext] || 'audio/mpeg';
          const fileName = `${(track.title || 'track').replace(/[^\w\s\-().&',]/g, ' ').replace(/\s+/g, ' ').trim() || 'track'}.mp3`;
          res.setHeader('Content-Type', ct);
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Cache-Control', 'private, no-store');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          // Stream the response instead of buffering in memory
          const reader = audioRes.body?.getReader();
          if (reader) {
            const pump = async () => {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
              }
              res.end();
            };
            pump().catch(() => { if (!res.writableEnded) res.end(); });
          } else {
            const buffer = Buffer.from(await audioRes.arrayBuffer());
            return res.end(buffer);
          }
          return;
        } catch (fetchErr) {
          return json(res, 500, { error: 'Failed to fetch audio file' });
        }
      }

      return json(res, 404, { error: 'No audio source found' });
    }

    // ─── Track by ID (fallback) ───────────────────────────────────────
    const musicIdMatch = path.match(/^\/api\/music\/(.+)$/);
    if (musicIdMatch && req.method === 'GET') {
      const id = musicIdMatch[1];
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, artist, version, version_type, duration, bpm, key, genre, price, audio_url, artwork_url, created_at, is_new, is_hot')
        .eq('id', id)
        .single();
      if (error || !data) {
        return json(res, 404, { error: 'Track not found' });
      }
      return json(res, 200, data);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('API error:', msg);
    // SECURITY: Handle body too large specifically
    if (msg === 'Body too large') {
      return json(res, 413, { error: 'Request body too large' });
    }
    return json(res, 500, { error: 'Internal server error' });
  }
}
