import { Router } from 'express';
import repairHistoryController from '../controller/repair_history.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/repair-history', repairHistoryController.createRepairHistory);
router.get('/repair-history/user/:user_id', repairHistoryController.getRepairHistoryByUserId);
router.get('/repair-history/:id', repairHistoryController.getRepairHistoryById);
router.patch('/repair-history/:id', repairHistoryController.updateRepairHistory);
router.delete('/repair-history/:id', repairHistoryController.deleteRepairHistory);

export default router;