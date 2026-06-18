import { Router } from 'express';
import { getCurrentUser, login, logout } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
