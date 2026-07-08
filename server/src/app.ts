import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import musicRoutes from './routes/music.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import stripeRoutes from './routes/stripe.js';
import downloadRoutes from './routes/download.js';
import previewRoutes from './routes/preview.js';
import prepareRoutes from './routes/prepare.js';
import adminRoutes from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.fun')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/prepare', prepareRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (_req, res) => {
  res.json({ name: 'DJ Marketplace API', version: '1.0.0', status: 'running' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const e = (err && typeof err === 'object') ? err as Record<string, unknown> : {};
  const status = (e.status as number) || (e.statusCode as number) || 500;
  const message = (e && 'message' in e) ? String((e as Record<string, unknown>).message) : String(err);
  console.error('Unhandled server error:', message);
  res.status(status).json({
    error: message || 'Internal Server Error',
  });
});

export default app;
