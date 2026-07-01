import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { Purchase, Track } from '../models/index.js';
import https from 'https';
import http from 'http';

export const downloadTrack = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { trackId } = req.params;

    const purchase = await Purchase.findOne({
      where: {
        user_id: req.user.id,
        track_id: trackId,
      },
    });

    if (!purchase) {
      return res.status(403).json({ error: 'You have not purchased this track' });
    }

    const track = await Track.findByPk(trackId);
    if (!track || !track.audio_url) {
      return res.status(404).json({ error: 'Track file not found' });
    }

    purchase.set('download_count', (Number(purchase.get('download_count') || 0)) + 1);
    await purchase.save();

    const filename = `${track.title.replace(/[^a-zA-Z0-9]/g, '_')}_${track.artist.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'audio/mpeg');

    const url = new URL(track.audio_url);
    const client = url.protocol === 'https:' ? https : http;

    client.get(track.audio_url, (audioRes) => {
      if (audioRes.statusCode && audioRes.statusCode >= 300 && audioRes.statusCode < 400 && audioRes.headers.location) {
        const redirectUrl = new URL(audioRes.headers.location);
        const redirectClient = redirectUrl.protocol === 'https:' ? https : http;
        redirectClient.get(audioRes.headers.location, (redirectRes) => {
          redirectRes.pipe(res);
        });
        return;
      }
      audioRes.pipe(res);
    }).on('error', (err) => {
      console.error('Download stream error:', err);
      res.status(500).json({ error: 'Failed to stream file' });
    });

  } catch (error: any) {
    console.error('Download error:', error);
    return res.status(500).json({ error: error.message || 'Download failed' });
  }
};

export const getDownloadInfo = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const purchases = await Purchase.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Track,
          as: 'track',
          attributes: ['id', 'title', 'artist', 'version', 'artwork_url', 'audio_url', 'bpm', 'key', 'genre', 'duration'],
        },
      ],
      order: [['purchased_at', 'DESC']],
    });

    return res.json(
      purchases
        .filter((p) => p.track)
        .map((p) => ({
          ...p.track!.toJSON(),
          purchased_at: p.purchased_at,
          download_count: p.get('download_count') || 0,
        }))
    );
  } catch (error: any) {
    console.error('Error fetching downloads:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch downloads' });
  }
};
