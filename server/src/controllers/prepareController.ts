import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { prepareAudioFile } from '../services/metadataService.js';

export const prepareUpload = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const audioFile = files?.['audioFile']?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const prepared = await prepareAudioFile(
      audioFile.buffer,
      audioFile.mimetype,
      audioFile.originalname
    );

    return res.json({
      success: true,
      message: 'Metadata extracted successfully',
      data: prepared,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Prepare upload error:', message);
    return res.status(500).json({ error: message || 'Failed to prepare audio file' });
  }
};
