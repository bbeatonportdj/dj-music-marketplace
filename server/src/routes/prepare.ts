import { Router } from 'express';
import { prepareUpload } from '../controllers/prepareController.js';
import { authenticateToken, producerOrAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

const prepareUploadFields = upload.fields([
  { name: 'audioFile', maxCount: 1 },
]);

router.post('/upload', authenticateToken, producerOrAdmin, prepareUploadFields, prepareUpload);

export default router;
