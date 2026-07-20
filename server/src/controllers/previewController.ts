import { Request, Response } from 'express';
import { Track } from '../models/index.js';
import https from 'https';
import http from 'http';

export const streamPreview = async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findByPk(trackId);
    if (!track || !track.audio_url) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const audioUrl = track.audio_url;
    const url = new URL(audioUrl);
    const client = url.protocol === 'https:' ? https : http;

    const filename = `${track.title.replace(/[^\w\s\-().&',]/g, ' ').replace(/\s+/g, ' ').trim()}_Preview.mp3`;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    const reqStream = client.get(audioUrl, (audioRes) => {
      if (audioRes.statusCode && audioRes.statusCode >= 300 && audioRes.statusCode < 400 && audioRes.headers.location) {
        const location = String(audioRes.headers.location);
        const redirectClient = location.startsWith('https') ? https : http;
        const redirectReq = redirectClient.get(location, (redirectRes) => {
          passthrough(redirectRes, res);
        });
        redirectReq.on('error', (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error('Preview redirect error:', message);
          res.status(500).json({ error: 'Failed to stream preview' });
        });
        return;
      }

      if (audioRes.headers['content-length']) {
        res.setHeader('Content-Length', String(audioRes.headers['content-length']));
      }

      passthrough(audioRes, res);
    });

    reqStream.on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Preview stream error:', message);
      res.status(500).json({ error: 'Failed to stream preview' });
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Preview error:', message);
    return res.status(500).json({ error: message || 'Preview failed' });
  }
};

function passthrough(source: http.IncomingMessage, dest: Response) {
  source.pipe(dest);
  source.on('error', (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Stream error:', message);
    dest.end();
  });
}
