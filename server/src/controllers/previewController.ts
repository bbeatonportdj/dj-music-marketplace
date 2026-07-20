import { Request, Response } from 'express';
import { Track } from '../models/index.js';
import https from 'https';
import http from 'http';

const PREVIEW_DURATION = 90;

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
          streamWithLimit(redirectRes, res);
        });
        redirectReq.on('error', (err: unknown) => {
          const message = err instanceof Error ? err.message : String(err);
          console.error('Preview redirect error:', message);
          res.status(500).json({ error: 'Failed to stream preview' });
        });
        return;
      }

      const contentLength = audioRes.headers['content-length'];
      if (contentLength) {
        const totalBytes = parseInt(contentLength, 10);
        const trackDuration = getDurationFromMetadata(audioRes) || PREVIEW_DURATION;
        const bytesPerSecond = totalBytes / trackDuration;
        const previewBytes = Math.floor(bytesPerSecond * PREVIEW_DURATION);

        if (previewBytes > 0 && previewBytes < totalBytes) {
          res.setHeader('Content-Length', previewBytes.toString());
        }
      }

      streamWithLimit(audioRes, res);
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

function streamWithLimit(source: http.IncomingMessage, dest: Response) {
  let bytesRead = 0;
  const maxBytes = 5 * 1024 * 1024;
  let aborted = false;

  source.on('data', (chunk: Buffer) => {
    if (aborted) return;
    bytesRead += chunk.length;

    if (bytesRead > maxBytes) {
      const remaining = maxBytes - (bytesRead - chunk.length);
      if (remaining > 0) {
        dest.write(chunk.subarray(0, remaining));
      }
      dest.end();
      source.destroy();
      aborted = true;
      return;
    }

    dest.write(chunk);
  });

  source.on('end', () => {
    if (!aborted) {
      dest.end();
    }
  });

  source.on('error', (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Stream error:', message);
    if (!aborted) {
      dest.end();
    }
  });
}

function getDurationFromMetadata(res: http.IncomingMessage): number | null {
  const contentType = res.headers['content-type'] || '';
  const contentLength = res.headers['content-length'];

  if (!contentLength) return null;

  const estimatedBitrate = contentType.includes('audio/mpeg') ? 128 : 64;
  const totalBytes = parseInt(contentLength, 10);
  const estimatedDuration = totalBytes / (estimatedBitrate * 1000 / 8);

  return estimatedDuration;
}
