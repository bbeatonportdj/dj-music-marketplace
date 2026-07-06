/**
 * Admin Controller
 *
 * Admin-only endpoints for system maintenance:
 *   - POST /api/admin/organize-gdrive   →  organize Drive folder by genre
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { organizeByGenre } from '../services/organizeGdriveService.js';

/**
 * POST /api/admin/organize-gdrive
 *
 * Body (JSON):
 *   { "folderId": "1C3RaRyGAU0zFkzDHq5ig_idiyuue8Kuu", "dryRun": true }
 *
 * - folderId (required) : Google Drive folder ID to organize
 * - dryRun  (optional)  : if true, only scan & log (no actual moves)
 */
export const organizeDrive = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { folderId, dryRun } = req.body;

    if (!folderId || typeof folderId !== 'string') {
      return res.status(400).json({
        success: false,
        error: '"folderId" is required in request body.',
      });
    }

    console.log(`🗂 Organize Drive: folder=${folderId} dryRun=${!!dryRun}`);

    const result = await organizeByGenre(folderId, dryRun === true);

    return res.json({
      success: true,
      message: dryRun
        ? 'Dry run complete — no files were moved'
        : `Organized ${result.moved} files into genre folders`,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Organize Drive error:', message);
    return res.status(500).json({ success: false, error: message });
  }
};
