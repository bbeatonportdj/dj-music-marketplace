import { Request, Response } from 'express';
import { Track } from '../models/index.js';
import { StorageService } from '../services/storageService.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTracks = async (req: Request, res: Response) => {
  try {
    const tracks = await Track.findAll({
      order: [['created_at', 'DESC']],
    });
    return res.json(tracks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching tracks:', message);
    return res.status(500).json({ error: message || 'Server error fetching tracks' });
  }
};

export const getTrackById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const track = await Track.findByPk(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    return res.json(track);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message || 'Server error fetching track' });
  }
};

export const getMyTracks = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const tracks = await Track.findAll({
      where: { uploaded_by: req.user.id },
      order: [['created_at', 'DESC']],
    });
    return res.json(tracks);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message || 'Server error fetching tracks' });
  }
};

export const createTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const {
      title,
      artist,
      version,
      version_type,
      duration,
      bpm,
      key,
      genre,
      price,
      is_new,
      is_hot,
    } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ error: 'Title and Artist are required' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audioFile']?.[0];
    const artworkFile = files?.['artworkFile']?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const host = req.get('host') || 'localhost:5000';

    // Upload audio file
    const audioUrl = await StorageService.uploadFile(audioFile, 'audio', host);

    // Upload artwork file or use default
    let artworkUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop';
    if (artworkFile) {
      artworkUrl = await StorageService.uploadFile(artworkFile, 'artwork', host);
    }

    const track = await Track.create({
      title,
      artist,
      version: version || '',
      version_type: version_type || 'clean',
      duration: duration || '0:00',
      bpm: parseInt(bpm) || 0,
      key: key || '',
      genre: genre || 'Top 40',
      price: parseFloat(price) || 0.00,
      audio_url: audioUrl,
      artwork_url: artworkUrl,
      is_new: is_new === 'true' || is_new === true,
      is_hot: is_hot === 'true' || is_hot === true,
      uploaded_by: req.user.id,
    });

    return res.status(201).json(track);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating track:', message);
    return res.status(500).json({ error: message || 'Server error creating track' });
  }
};

export const updateTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const {
      title,
      artist,
      version,
      version_type,
      duration,
      bpm,
      key,
      genre,
      price,
      is_new,
      is_hot,
    } = req.body;

    const track = await Track.findByPk(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Ownership check: admin can edit any track, producer can only edit own
    if (req.user.role !== 'admin' && track.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own tracks' });
    }

    // Update fields
    track.title = title !== undefined ? title : track.title;
    track.artist = artist !== undefined ? artist : track.artist;
    track.version = version !== undefined ? version : track.version;
    track.version_type = version_type !== undefined ? version_type : track.version_type;
    track.duration = duration !== undefined ? duration : track.duration;
    track.bpm = bpm !== undefined ? parseInt(bpm) : track.bpm;
    track.key = key !== undefined ? key : track.key;
    track.genre = genre !== undefined ? genre : track.genre;
    track.price = price !== undefined ? parseFloat(price) : track.price;
    track.is_new = is_new !== undefined ? (is_new === 'true' || is_new === true) : track.is_new;
    track.is_hot = is_hot !== undefined ? (is_hot === 'true' || is_hot === true) : track.is_hot;

    // Handle files if new uploads are provided
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audioFile']?.[0];
    const artworkFile = files?.['artworkFile']?.[0];
    const host = req.get('host') || 'localhost:5000';

    if (audioFile) {
      track.audio_url = await StorageService.uploadFile(audioFile, 'audio', host);
    }
    if (artworkFile) {
      track.artwork_url = await StorageService.uploadFile(artworkFile, 'artwork', host);
    }

    await track.save();
    return res.json(track);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating track:', message);
    return res.status(500).json({ error: message || 'Server error updating track' });
  }
};

export const deleteTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { id } = req.params;
    const track = await Track.findByPk(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    // Ownership check: admin can delete any track, producer can only delete own
    if (req.user.role !== 'admin' && track.uploaded_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own tracks' });
    }

    await track.destroy();
    return res.json({ message: 'Track deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error deleting track:', message);
    return res.status(500).json({ error: message || 'Server error deleting track' });
  }
};
