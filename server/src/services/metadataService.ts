import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseBuffer } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExtractedMetadata {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  duration: string;
  version: string;
}

export interface PreparedTrack {
  metadata: ExtractedMetadata;
  cover_image_url: string | null;
  gdrive_file_id: null;
  audio_filename: string;
  file_size: number;
  mime_type: string;
}

const ARTWORK_DIR = path.resolve(__dirname, '../../uploads/artwork');
if (!fs.existsSync(ARTWORK_DIR)) {
  fs.mkdirSync(ARTWORK_DIR, { recursive: true });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseKeyFromMetadata(keyStr: string): string {
  const cleaned = keyStr.replace(/^Key\s*/i, '').trim();
  return cleaned || '';
}

function parseBpm(bpm: unknown): number {
  if (typeof bpm === 'number') return Math.round(bpm);
  if (typeof bpm === 'string') return Math.round(parseFloat(bpm));
  return 0;
}

function saveCoverArt(buffer: Uint8Array): string | null {
  const fileName = `cover_${Date.now()}.jpg`;
  const filePath = path.join(ARTWORK_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return `/uploads/artwork/${fileName}`;
}

export async function prepareAudioFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<PreparedTrack> {
  const metadata = await parseBuffer(buffer, mimeType, {
    duration: true,
    skipCovers: false,
    includeChapters: false,
  });

  const { format, common } = metadata;

  const title = common.title?.trim() || path.basename(originalName, path.extname(originalName));
  const artist = common.artist?.trim() || 'Unknown Artist';
  const genre = common.genre?.[0]?.trim() || 'Uncategorized';
  const bpm = parseBpm(common.bpm);
  const keyRaw = common.key?.trim() || '';
  const key = keyRaw ? parseKeyFromMetadata(keyRaw) : '';
  const duration = format.duration ? formatDuration(format.duration) : '0:00';

  let cover_image_url: string | null = null;
  if (common.picture?.[0]) {
    const pic = common.picture[0];
    cover_image_url = saveCoverArt(pic.data);
  }

  return {
    metadata: {
      title,
      artist,
      genre,
      bpm,
      key,
      duration,
      version: '',
    },
    cover_image_url,
    gdrive_file_id: null,
    audio_filename: originalName,
    file_size: buffer.length,
    mime_type: mimeType,
  };
}
