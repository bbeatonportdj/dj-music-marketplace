/**
 * ============================================================
 *  Prepare Upload Controller
 * ============================================================
 *
 *  📦 Required middleware:
 *     - multer        (file upload → memoryStorage)
 *     - authenticateToken  (JWT validation)
 *     - producerOrAdmin    (role guard)
 *
 *  📥 POST /api/prepare/upload
 *     Content-Type: multipart/form-data
 *     Fields:
 *       - audioFile  (required, .mp3/.wav/.m4a/.flac)
 *
 *  📤 Response (200):
 *     {
 *       success: true,
 *       message: "Metadata extracted successfully",
 *       data: {
 *         metadata: { title, artist, album, genre, bpm, key, duration, year, ... },
 *         cover_image_url: "/uploads/artwork/cover_xxx.jpg",
 *         cover_mime_type: "image/jpeg",
 *         gdrive_file_id: null,
 *         audio_filename: "track.mp3",
 *         file_size: 5242880,
 *         mime_type: "audio/mpeg"
 *       }
 *     }
 *
 *  🔁 Full pipeline:
 *     Client uploads MP3
 *       → Multer saves to memoryBuffer
 *       → music-metadata parses ID3 tags
 *       → Album art extracted & saved to disk
 *       → JSON returned with all data
 *       → Frontend shows preview, user confirms
 *       → POST /api/music with gdrive_file_id to finalize
 * ============================================================
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prepareAudioFile } from '../services/metadataService.js';

/**
 * Handler: POST /api/prepare/upload
 *
 * Step-by-step:
 *   1. Verify user is authenticated
 *   2. Read audioFile from multipart upload
 *   3. Pass buffer to metadata service → extract tags + cover art
 *   4. Return all extracted data as JSON for frontend preview
 */
export const prepareUpload = async (req: AuthRequest, res: Response) => {
  try {
    // ── Step 1: Authentication check ──────────────────────
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    // ── Step 2: Extract uploaded file from request ────────
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audioFile']?.[0];

    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: 'Audio file is required. Send as multipart/form-data with field name "audioFile".',
      });
    }

    console.log(`📤 Preparing upload: ${audioFile.originalname} (${(audioFile.size / 1024 / 1024).toFixed(1)} MB)`);

    // ── Step 3: Extract metadata + cover art ──────────────
    const prepared = await prepareAudioFile(
      audioFile.buffer,        // raw bytes from multer memoryStorage
      audioFile.mimetype,      // e.g. "audio/mpeg"
      audioFile.originalname,  // e.g. "My Track.mp3"
    );

    console.log(`✅ Metadata extracted: "${prepared.metadata.title}" — ${prepared.metadata.artist}`);

    // ── Step 4: Return full payload ───────────────────────
    return res.json({
      success: true,
      message: 'Metadata extracted successfully',
      data: prepared,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Prepare upload error:', message);

    // Handle specific music-metadata errors
    if (message.includes('No audio') || message.includes('not recognized')) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported or corrupted audio file. Supported formats: MP3, WAV, M4A, FLAC.',
      });
    }

    return res.status(500).json({
      success: false,
      error: message || 'Failed to prepare audio file',
    });
  }
};
