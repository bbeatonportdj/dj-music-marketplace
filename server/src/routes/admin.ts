/**
 * Admin Routes — all require admin role
 */

import { Router } from 'express';
import { organizeDrive } from '../controllers/adminController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import { User, Track, Order } from '../models/index.js';

const router = Router();

router.post('/organize-gdrive', authenticateToken, adminOnly, organizeDrive);

router.get('/stats', authenticateToken, adminOnly, async (_req, res) => {
  try {
    const [userCount, trackCount, orderCount, revenueResult] = await Promise.all([
      User.count(),
      Track.count(),
      Order.count(),
      Order.sum('total_amount', { where: { status: 'paid' } }),
    ]);

    res.json({
      users: userCount,
      tracks: trackCount,
      orders: orderCount,
      revenue: revenueResult || 0,
    });
  } catch (err) {
    console.error('Failed to fetch admin stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
