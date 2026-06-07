import { Router } from 'express'
import userController from '../controller/user.controller';
const router = Router();

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);

export default router;
