const FALLBACK_TRACKS = [
  {
    id: 'fallback-midnight-drop',
    title: 'Midnight Drop',
    artist: 'DJ Axiom',
    version: 'Extended Mix',
    version_type: 'extended',
    duration: '3:45',
    bpm: 124,
    key: 'A Minor',
    genre: 'House',
    price: 0,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    artwork_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop',
    is_new: true,
    is_hot: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'fallback-sunset-rewind',
    title: 'Sunset Rewind',
    artist: 'Maya Voss',
    version: 'Radio Edit',
    version_type: 'radio',
    duration: '3:18',
    bpm: 108,
    key: 'F Sharp Minor',
    genre: 'Pop',
    price: 0,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    artwork_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&h=600&fit=crop',
    is_new: true,
    is_hot: false,
    created_at: new Date().toISOString(),
  },
];

export default async function handler(req, res) {
  const targetBase = process.env.BACKEND_API_URL || process.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001';
  const base = targetBase.replace(/\/$/, '');

  const requestUrl = new URL(req.url || '/', 'http://localhost');
  if (requestUrl.pathname.startsWith('/api/music')) {
    res.status(200).json(FALLBACK_TRACKS);
    return;
  }
  const pathParam = req.query?.path;
  const pathValue = Array.isArray(pathParam)
    ? pathParam.join('/')
    : (typeof pathParam === 'string' ? pathParam : '');

  const upstreamPath = pathValue
    ? (pathValue.startsWith('/') ? pathValue : `/${pathValue}`)
    : requestUrl.pathname;

  const targetUrl = new URL(`${base}${upstreamPath}${requestUrl.search}`);
  const headers = { ...(req.headers || {}) };
  delete headers.host;
  delete headers.connection;

  const options = {
    method: req.method,
    headers,
  };

  if (req.method && !['GET', 'HEAD'].includes(req.method.toUpperCase())) {
    const body = await readBody(req);
    if (body) {
      options.body = body;
    }
  }

  const response = await fetch(targetUrl, options);
  res.status(response.status);

  response.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (!['content-length', 'transfer-encoding', 'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'trailer', 'upgrade'].includes(normalized)) {
      res.setHeader(key, value);
    }
  });

  const responseText = await response.text();
  if (responseText) {
    res.send(responseText);
  } else {
    res.end();
  }
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}
