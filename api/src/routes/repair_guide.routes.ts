import { Router } from 'express';
import repairGuideController from '../controller/repair_guide.controller';

const router = Router();

router.get('/me/repair-guides', repairGuideController.getMyRepairGuides);
router.post('/me/repair-guides', repairGuideController.createRepairGuide);
router.get('/me/repair-guides/:id', repairGuideController.getRepairGuideById);
router.patch('/me/repair-guides/:id', repairGuideController.updateRepairGuide);
router.delete('/me/repair-guides/:id', repairGuideController.deleteRepairGuide);

export default router;
