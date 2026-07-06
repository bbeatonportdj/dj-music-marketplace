import { Router } from 'express';
import { register, login, oauthLogin, getMe, updateProfile, updateUserRole, getUsers } from '../controllers/authController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/oauth', oauthLogin);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/role', authenticateToken, adminOnly, updateUserRole);
router.get('/users', authenticateToken, adminOnly, getUsers);

export default router;
