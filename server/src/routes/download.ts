import { Router } from 'express';
import { downloadTrack, getDownloadInfo } from '../controllers/downloadController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken, getDownloadInfo);
router.get('/:trackId', authenticateToken, downloadTrack);

export default router;
