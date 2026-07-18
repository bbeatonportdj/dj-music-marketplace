// Simplified OAuth handler for Auth.tsx
// After Supabase OAuth redirect, extract the access_token and send to our API

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Disc, Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { apiUrl } from '../lib/apiBase';
import '../styles/auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMethod, setForgotMethod] = useState<'email' | 'phone'>('email');
  const [forgotPhone, setForgotPhone] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const { t } = useLanguage();
  const { showNotification } = useNotifications();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/browse');
    }
  }, [user, navigate]);

  // Handle OAuth redirect from Supabase
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isOauth = params.get('oauth') === '1';
    if (!isOauth) return;

    (async () => {
      if (!supabase) {
        showNotification('OAuth is not configured.', 'error');
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.access_token) {
          showNotification('OAuth session not found. Try signing in again.', 'error');
          return;
        }

        const res = await fetch(apiUrl('/api/auth/oauth'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: session.access_token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'OAuth exchange failed');
        }

        window.location.href = '/browse';
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showNotification(msg || 'OAuth flow failed', 'error');
      }
    })();
  }, [showNotification]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMsg(null);

    if (password.length < 6) {
      const msg = 'Password must be at least 6 characters';
      setErrorMsg(msg);
      showNotification(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      showNotification('Login successful!', 'success');
      navigate('/browse');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotLoading) return;

    if (forgotMethod === 'phone') {
      // Send SMS OTP
      if (!forgotPhone) return;
      setForgotLoading(true);
      try {
        const res = await fetch(apiUrl('/api/auth/forgot-password-phone'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: forgotPhone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send SMS');
        setOtpMode(true);
        showNotification('OTP code sent to your phone!', 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        showNotification(msg, 'error');
      } finally {
        setForgotLoading(false);
      }
      return;
    }

    // Email reset
    if (!email) return;
    setForgotLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setForgotSent(true);
      showNotification('Password reset email sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpLoading || !otpCode || !forgotPhone) return;
    setOtpLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/verify-phone-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, token: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      showNotification('Phone verified! You are now logged in.', 'success');
      window.location.href = '/browse';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      showNotification(msg, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-bg-circle auth-bg-circle-1" />
        <div className="auth-bg-circle auth-bg-circle-2" />
      </div>

      <div className="auth-card-wrapper">
        <div className="auth-logo">
          <Disc size={36} style={{ color: 'var(--accent-color)' }} />
          <span>DJ Music Marketplace</span>
        </div>

        <div className="auth-card">
          <div className="auth-form-area">
            {forgotSent ? (
              <div className="auth-success-state">
                <div className="auth-success-icon">
                  <CheckCircle size={48} />
                </div>
                <h2>Check your email</h2>
                <p>
                  We've sent a password reset link to <strong>{email}</strong>.
                  Please check your inbox and follow the instructions.
                </p>
                <button
                  className="auth-submit-btn"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setEmail('');
                    setPassword('');
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : forgotMode ? (
              <>
                <button
                  className="auth-back-btn"
                  onClick={() => { setForgotMode(false); setErrorMsg(null); setOtpMode(false); setOtpCode(''); }}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
                <h1 className="auth-title">
                  {otpMode ? 'Enter OTP Code' : 'Reset Password'}
                </h1>
                <p className="auth-subtitle">
                  {otpMode
                    ? `Enter the 6-digit code sent to ${forgotPhone}`
                    : 'Choose how you want to reset your password.'
                  }
                </p>

                {errorMsg && (
                  <div className="auth-error-message" role="alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {otpMode ? (
                  <form onSubmit={handleVerifyOtp} className="auth-form">
                    <div className="auth-input-group">
                      <label>OTP Code</label>
                      <div className="auth-input-wrapper">
                        <Lock size={16} className="auth-input-icon" />
                        <input
                          type="text"
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="auth-input-otp"
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={otpLoading || otpCode.length < 6} className="auth-submit-btn">
                      {otpLoading ? (
                        <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                      ) : (
                        <>Verify & Sign In <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="auth-forgot-toggle">
                      <button
                        type="button"
                        className={`auth-forgot-tab ${forgotMethod === 'email' ? 'active' : ''}`}
                        onClick={() => setForgotMethod('email')}
                      >
                        <Mail size={16} /> Email
                      </button>
                      <button
                        type="button"
                        className={`auth-forgot-tab ${forgotMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => setForgotMethod('phone')}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                        Phone
                      </button>
                    </div>

                    <form onSubmit={handleForgotPassword} className="auth-form">
                      {forgotMethod === 'email' ? (
                        <div className="auth-input-group">
                          <label>{t('auth.email')}</label>
                          <div className="auth-input-wrapper">
                            <Mail size={16} className="auth-input-icon" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="dj@example.com"
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="auth-input-group">
                          <label>Phone Number</label>
                          <div className="auth-input-wrapper">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="auth-input-icon"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                            <input
                              type="tel"
                              value={forgotPhone}
                              onChange={(e) => setForgotPhone(e.target.value)}
                              placeholder="+66 81 234 5678"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <button type="submit" disabled={forgotLoading} className="auth-submit-btn">
                        {forgotLoading ? (
                          <><Loader2 size={18} className="animate-spin" /> Sending...</>
                        ) : (
                          <>{forgotMethod === 'email' ? 'Send Reset Link' : 'Send OTP Code'} <ArrowRight size={18} /></>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : (
              <>
                <h1 className="auth-title">{t('auth.welcome')}</h1>
                <p className="auth-subtitle">{t('auth.login_msg')}</p>

                {errorMsg && (
                  <div className="auth-error-message" role="alert">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="auth-form">
                  <div className="auth-input-group">
                    <label>{t('auth.email')}</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="dj@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label>{t('auth.password')}</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="auth-eye-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-forgot-row">
                    <button
                      type="button"
                      className="auth-forgot-link"
                      onClick={() => { setForgotMode(true); setErrorMsg(null); }}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="auth-submit-btn">
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> {t('auth.processing')}</>
                    ) : (
                      <>{t('auth.login')} <ArrowRight size={18} /></>
                    )}
                  </button>
                </form>

                <p className="auth-switch-text">
                  {t('auth.no_account')}{' '}
                  <Link to="/register" className="auth-switch-link">
                    {t('auth.signup')}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        <p className="auth-footer-note">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Auth;
