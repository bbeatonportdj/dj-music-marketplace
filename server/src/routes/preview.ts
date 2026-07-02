import { Router } from 'express';
import { streamPreview } from '../controllers/previewController.js';

const router = Router();

router.get('/:trackId', streamPreview);

export default router;
