import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB, sequelize } from './config/db.js';

// Import Routes
import authRoutes from './routes/auth.js';
import musicRoutes from './routes/music.js';
import orderRoutes from './routes/order.js';
import paymentRoutes from './routes/payment.js';
import stripeRoutes from './routes/stripe.js';
import downloadRoutes from './routes/download.js';
import previewRoutes from './routes/preview.js';

// Import Models for Sync
import { Track } from './models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Apply Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use(limiter);

// Configure CORS Whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// Raw body for Stripe webhook (must be before express.json())
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/preview', previewRoutes);

// Root
app.get('/', (_req, res) => {
  res.json({ name: 'DJ Marketplace API', version: '1.0.0', status: 'running' });
});

// Health Check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

// Seed Initial Tracks if DB is Empty
const seedInitialTracks = async () => {
  const count = await Track.count();
  if (count === 0) {
    console.log('🌱 Database is empty. Seeding initial DJ tracks...');
    const initialTracks = [
      {
        title: 'Espresso',
        artist: 'Sabrina Carpenter',
        version: 'UGEEZY Intro Edit',
        version_type: 'intro',
        duration: '3:20',
        bpm: 120,
        key: '8A',
        genre: 'Pop',
        price: 1.99,
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        artwork_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop',
        is_new: true,
        is_hot: true,
      },
      {
        title: 'Get Lucky',
        artist: 'Daft Punk ft. Pharrell Williams',
        version: 'Disco Dan House Remix',
        version_type: 'clean',
        duration: '4:15',
        bpm: 124,
        key: '11B',
        genre: 'House',
        price: 2.49,
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        artwork_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop',
        is_new: true,
        is_hot: false,
      },
      {
        title: 'Not Like Us',
        artist: 'Kendrick Lamar',
        version: 'Dirty Intro Edit',
        version_type: 'dirty',
        duration: '4:35',
        bpm: 96,
        key: '4A',
        genre: 'Hip Hop',
        price: 1.99,
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        artwork_url: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=600&h=600&fit=crop',
        is_new: false,
        is_hot: true,
      },
      {
        title: 'Pepas',
        artist: 'Farruko',
        version: 'Latin Club Edit',
        version_type: 'clean',
        duration: '3:58',
        bpm: 130,
        key: '8B',
        genre: 'Latin',
        price: 0.00, // Free track
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        artwork_url: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop',
        is_new: false,
        is_hot: false,
      }
    ];
    await Track.bulkCreate(initialTracks);
    console.log('🌱 Seeding completed successfully.');
  }
};

// Start Server & Sync DB
const startServer = async () => {
  await connectDB();
  
  // Sync all models (force: false preserves data, alter: true updates schema structure)
  await sequelize.sync({ alter: true });
  console.log('✅ Models synced to database.');
  
  await seedInitialTracks();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('❌ Server failed to start:', error);
});
