import { Router } from 'express';
import authController from '../controller/auth.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/refresh', authController.refresh);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', requireAuth, authController.me);

export default router;
