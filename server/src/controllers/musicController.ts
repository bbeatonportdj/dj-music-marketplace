import { Request, Response } from 'express';
import { Track } from '../models/index.js';
import { StorageService } from '../services/storageService.js';

export const getTracks = async (req: Request, res: Response) => {
  try {
    const tracks = await Track.findAll({
      order: [['created_at', 'DESC']],
    });
    return res.json(tracks);
  } catch (error: any) {
    console.error('Error fetching tracks:', error);
    return res.status(500).json({ error: error.message || 'Server error fetching tracks' });
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error fetching track' });
  }
};

export const createTrack = async (req: Request, res: Response) => {
  try {
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
    });

    return res.status(201).json(track);
  } catch (error: any) {
    console.error('Error creating track:', error);
    return res.status(500).json({ error: error.message || 'Server error creating track' });
  }
};

export const updateTrack = async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    console.error('Error updating track:', error);
    return res.status(500).json({ error: error.message || 'Server error updating track' });
  }
};

export const deleteTrack = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const track = await Track.findByPk(id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    await track.destroy();
    return res.json({ message: 'Track deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting track:', error);
    return res.status(500).json({ error: error.message || 'Server error deleting track' });
  }
};
