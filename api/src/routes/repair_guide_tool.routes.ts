import { Router } from 'express';
import repairGuideToolController from '../controller/repair_guide_tool.controller';

const router = Router();

router.get('/me/repair-guide-tools', repairGuideToolController.getAllRepairGuideTools);
router.post('/me/repair-guide-tools', repairGuideToolController.addToolToGuide);
router.get('/me/repair-guide-tools/guide/:repair_guide_id', repairGuideToolController.getToolsByGuide);
router.get('/me/repair-guide-tools/tool/:tool_id', repairGuideToolController.getGuidesByTool);
router.get('/me/repair-guide-tools/:repair_guide_id/:tool_id', repairGuideToolController.getRepairGuideToolByIds);
router.patch('/me/repair-guide-tools/:repair_guide_id/:tool_id', repairGuideToolController.updateRepairGuideTool);
router.delete('/me/repair-guide-tools/:repair_guide_id/:tool_id', repairGuideToolController.deleteRepairGuideTool);

export default router;
