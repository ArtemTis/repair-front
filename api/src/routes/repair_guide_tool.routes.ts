import { Router } from 'express';
import repairGuideToolController from '../controller/repair_guide_tool.controller';

const router = Router();

// Маршруты для repair_guide_tools
router.post('/repair-guide-tool', repairGuideToolController.addToolToGuide);
router.get('/repair-guide-tools', repairGuideToolController.getAllRepairGuideTools);
router.get('/repair-guide-tools/guide/:repair_guide_id', repairGuideToolController.getToolsByGuide);
router.get('/repair-guide-tools/tool/:tool_id', repairGuideToolController.getGuidesByTool);
router.get('/repair-guide-tool/:repair_guide_id/:tool_id', repairGuideToolController.getRepairGuideToolByIds);
router.patch('/repair-guide-tool/:repair_guide_id/:tool_id', repairGuideToolController.updateRepairGuideTool);
router.delete('/repair-guide-tool/:repair_guide_id/:tool_id', repairGuideToolController.deleteRepairGuideTool);

export default router;