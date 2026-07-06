import { Router } from 'express';
import { getTracks, getTrackById, getMyTracks, createTrack, updateTrack, deleteTrack } from '../controllers/musicController.js';
import { authenticateToken, producerOrAdmin, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const uploadFields = upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'artworkFile', maxCount: 1 },
]);

router.get('/', getTracks);
router.get('/my', authenticateToken, getMyTracks);
router.get('/:id', getTrackById);
router.post('/', authenticateToken, producerOrAdmin, uploadFields, createTrack);
router.put('/:id', authenticateToken, producerOrAdmin, uploadFields, updateTrack);
router.delete('/:id', authenticateToken, producerOrAdmin, deleteTrack);

export default router;
