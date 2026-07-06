/**
 * ============================================================
 *  Metadata Extraction Service
 * ============================================================
 *
 *  📦 Required packages (npm install):
 *     - music-metadata       ^10.x   (parse MP3/WAV/FLAC ID3 tags)
 *     - (built-in) fs, path, url     (file I/O)
 *
 *  🔧 What this service does:
 *     1. Parse audio file buffer → extract ID3/ metadata tags
 *     2. Extract embedded album art (cover) → save as .jpg
 *     3. Return structured payload ready for DB insert
 *
 *  📥 Input :  Multer file buffer (memoryStorage)
 *  📤 Output:  PreparedTrack object (metadata + cover_url + file info)
 * ============================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { parseBuffer } from 'music-metadata';

// ── Path Setup ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Folder for saving extracted album art
const ARTWORK_DIR = path.resolve(__dirname, '../../uploads/artwork');
if (!fs.existsSync(ARTWORK_DIR)) {
  fs.mkdirSync(ARTWORK_DIR, { recursive: true });
}

// ── Type Definitions ────────────────────────────────────────

/** Metadata that was extracted from audio file ID3 tags */
export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string;
  genre: string;
  bpm: number;
  key: string;
  duration: string;
  year: number;
  track_number: number;
  version: string;
  comment: string;
}

/** Full prepared payload returned to frontend */
export interface PreparedTrack {
  metadata: ExtractedMetadata;
  cover_image_url: string | null;
  cover_mime_type: string | null;
  gdrive_file_id: null;                  // placeholder — filled after GDrive sync
  audio_filename: string;
  file_size: number;
  mime_type: string;
}

// ── Helper Functions ────────────────────────────────────────

/**
 * Convert duration seconds → "M:SS" format
 * @example 197.5 → "3:17"
 */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Clean up key string:
 * - Remove "Key " prefix that some taggers add
 * - Return empty string if nothing valid
 */
function cleanKey(raw: string): string {
  return raw.replace(/^Key\s*/i, '').trim();
}

/**
 * Safely parse BPM value from ID3 tag.
 * Accept number or string, return 0 as fallback.
 */
function safeBpm(value: unknown): number {
  if (typeof value === 'number') return Math.round(value);
  if (typeof value === 'string') return Math.round(parseFloat(value));
  return 0;
}

/**
 * Save extracted album art (cover image) to disk.
 * @param data     Uint8Array of image data from music-metadata
 * @param format   MIME type (image/jpeg, image/png, ...)
 * @returns        Public URL path or null on failure
 */
function saveCoverArt(data: Uint8Array, format: string): string | null {
  try {
    // Determine file extension from MIME type
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png':  '.png',
      'image/webp': '.webp',
      'image/gif':  '.gif',
    };
    const ext = extMap[format] || '.jpg';
    const fileName = `cover_${Date.now()}${ext}`;
    const filePath = path.join(ARTWORK_DIR, fileName);

    // Write to disk
    fs.writeFileSync(filePath, Buffer.from(data));

    // Return public URL (served via express.static at /uploads)
    return `/uploads/artwork/${fileName}`;
  } catch (err) {
    console.error('Failed to save cover art:', err);
    return null;
  }
}

/**
 * Extract the track year from metadata.
 * Prefers `common.year`, falls back to parsing `common.date`.
 */
function extractYear(common: { year?: number | string; date?: string }): number {
  if (typeof common.year === 'number') return common.year;
  if (typeof common.date === 'string') {
    const y = parseInt(common.date.slice(0, 4), 10);
    if (!isNaN(y)) return y;
  }
  return 0;
}

// ── Main Function ───────────────────────────────────────────

/**
 * Scan audio file buffer → extract all metadata + cover art.
 *
 * @param buffer         Raw audio file bytes (from Multer memoryStorage)
 * @param mimeType       MIME type string (e.g. "audio/mpeg")
 * @param originalName   Original file name for fallback title
 * @returns              PreparedTrack object ready for JSON response
 */
export async function prepareAudioFile(
  buffer: Buffer,
  mimeType: string,
  originalName: string,
): Promise<PreparedTrack> {
  // ── Step 1: Parse ID3 / metadata tags ──────────────────
  const metadata = await parseBuffer(buffer, mimeType, {
    duration: true,     // compute duration from bitrate
    skipCovers: false,  // do NOT skip — we need album art
    includeChapters: false,
  });

  const { format, common } = metadata;

  // ── Step 2: Extract text metadata ───────────────────────
  const title       = common.title?.trim() || path.basename(originalName, path.extname(originalName));
  const artist      = common.artist?.trim() || 'Unknown Artist';
  const album       = common.album?.trim() || '';
  const genre       = common.genre?.[0]?.trim() || 'Uncategorized';
  const bpm         = safeBpm(common.bpm);
  const keyRaw      = common.key?.trim() || '';
  const key         = keyRaw ? cleanKey(keyRaw) : '';
  const duration    = format.duration ? formatDuration(format.duration) : '0:00';
  const year        = extractYear(common);
  const trackNo = typeof common.track === 'object' && common.track !== null
    ? (common.track as { no?: number }).no || 0
    : (typeof common.track === 'number' ? common.track : 0);
  const comment = Array.isArray(common.comment) && common.comment.length > 0
    ? (typeof common.comment[0] === 'string' ? common.comment[0] : (common.comment[0] as { text?: string }).text || '')
    : (typeof common.comment === 'string' ? common.comment : '');

  // ── Step 3: Extract & save album art ────────────────────
  let coverImageUrl: string | null = null;
  let coverMimeType: string | null = null;

  if (common.picture && common.picture.length > 0) {
    const pic = common.picture[0];
    coverImageUrl  = saveCoverArt(pic.data, pic.format);
    coverMimeType  = pic.format || null;
    console.log(`🎨 Cover art extracted: ${pic.format}, ${pic.data.length} bytes`);
  }

  // ── Step 4: Return structured payload ───────────────────
  return {
    metadata: {
      title,
      artist,
      album,
      genre,
      bpm,
      key,
      duration,
      year,
      track_number: trackNo,
      version: '',
      comment,
    },
    cover_image_url:  coverImageUrl,
    cover_mime_type:  coverMimeType,
    gdrive_file_id:   null,
    audio_filename:   originalName,
    file_size:        buffer.length,
    mime_type:        mimeType,
  };
}
