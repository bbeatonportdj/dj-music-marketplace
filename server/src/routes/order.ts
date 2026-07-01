import { Router } from 'express';
import { createOrder, getOrders, getPurchasedTracks } from '../controllers/orderController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.get('/', authenticateToken, getOrders);
router.get('/purchased', authenticateToken, getPurchasedTracks);

export default router;
