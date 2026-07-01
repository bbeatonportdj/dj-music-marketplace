import { Router } from 'express';
import { createCheckoutSession, handleStripeWebhook, getStripePublicKey } from '../controllers/stripeController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/create-checkout-session', authenticateToken, createCheckoutSession);
router.get('/public-key', getStripePublicKey);
router.post('/webhook', handleStripeWebhook);

export default router;
