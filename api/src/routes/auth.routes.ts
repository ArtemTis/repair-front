import { Router } from 'express';
import authController from '../controller/auth.controller';

const router = Router();

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

export default router;
