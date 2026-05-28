import { Router } from 'express';
import adminController from '../controller/admin.controller';

const router = Router();

router.get('/admin/stats', adminController.getStats);
router.get('/admin/users', adminController.getUsers);
router.patch('/admin/users/:id/skill-level', adminController.updateUserSkillLevel);

export default router;
