import { Router } from 'express';
import { getTracks, getTrackById, createTrack, updateTrack, deleteTrack } from '../controllers/musicController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const uploadFields = upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'artworkFile', maxCount: 1 },
]);

router.get('/', getTracks);
router.get('/:id', getTrackById);
router.post('/', authenticateToken, adminOnly, uploadFields, createTrack);
router.put('/:id', authenticateToken, adminOnly, uploadFields, updateTrack);
router.delete('/:id', authenticateToken, adminOnly, deleteTrack);

export default router;
