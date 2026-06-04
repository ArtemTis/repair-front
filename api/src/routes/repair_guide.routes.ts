import { Router } from 'express';
import repairGuideController from '../controller/repair_guide.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/repair-guide', repairGuideController.createRepairGuide);
router.get('/repair-guides/user/:user_id', repairGuideController.getRepairGuidesByUserId);
router.get('/repair-guide/:id', repairGuideController.getRepairGuideById);
router.patch('/repair-guide/:id', repairGuideController.updateRepairGuide);
router.delete('/repair-guide/:id', repairGuideController.deleteRepairGuide);

export default router;

