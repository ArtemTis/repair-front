import { Router } from 'express';
import repairHistoryController from '../controller/repair_history.controller';

const router = Router();

router.get('/me/repair-history', repairHistoryController.getMyRepairHistory);
router.post('/me/repair-history', repairHistoryController.createRepairHistory);
router.get('/me/repair-history/:id', repairHistoryController.getRepairHistoryById);
router.patch('/me/repair-history/:id', repairHistoryController.updateRepairHistory);
router.delete('/me/repair-history/:id', repairHistoryController.deleteRepairHistory);

export default router;
