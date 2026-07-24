import app from './app.js';
import { connectDB, sequelize } from './config/db.js';
import { Track } from './models/index.js';

const PORT = process.env.PORT || 5001;

const seedInitialTracks = async () => {
  const count = await Track.count();
  if (count === 0) {
    console.log('Seeding initial DJ tracks...');
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
        price: 0.00,
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        artwork_url: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?w=600&h=600&fit=crop',
        is_new: false,
        is_hot: false,
      }
    ];
    await Track.bulkCreate(initialTracks);
    console.log('Seeding completed successfully.');
  }
};

const startServer = async () => {
  await connectDB();
  await sequelize.sync({ alter: false });
  console.log('Models synced to database.');
  await seedInitialTracks();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Server failed to start:', error);
});
