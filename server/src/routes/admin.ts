/**
 * Admin Routes — all require admin role
 */

import { Router } from 'express';
import { organizeDrive } from '../controllers/adminController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/organize-gdrive', authenticateToken, adminOnly, organizeDrive);

export default router;
