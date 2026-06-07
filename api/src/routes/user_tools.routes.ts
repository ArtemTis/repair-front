import { Router } from 'express';
import userToolController from '../controller/user_tool.controller';

const router = Router();

router.get('/me/user-tools', userToolController.getAllUserTools);
router.post('/me/user-tools', userToolController.addUserTool);
router.get('/me/user-tools/tool/:tool_id', userToolController.getUserToolsByTool);
router.get('/me/user-tools/:tool_id', userToolController.getUserToolByIds);
router.patch('/me/user-tools/:tool_id', userToolController.updateUserToolQuantity);
router.delete('/me/user-tools/:tool_id', userToolController.deleteUserTool);

export default router;
