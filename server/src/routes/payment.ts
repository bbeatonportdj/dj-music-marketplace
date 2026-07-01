import { Router } from 'express';
import { verifyPayment, handleWebhook } from '../controllers/paymentController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/verify', authenticateToken, upload.single('slipFile'), verifyPayment);
router.post('/webhook', handleWebhook);

export default router;
