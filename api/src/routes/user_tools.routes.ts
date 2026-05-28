import { Router } from 'express';
import userToolController from '../controller/user_tool.controller';

const router = Router();

// Основные CRUD-подобные маршруты для связи
router.post('/user-tool', userToolController.addUserTool);
router.get('/user-tools', userToolController.getAllUserTools);
router.get('/user-tools/user/:user_id', userToolController.getUserToolsByUser);
router.get('/user-tools/tool/:tool_id', userToolController.getUserToolsByTool);
router.get('/user-tool/:user_id/:tool_id', userToolController.getUserToolByIds);
router.patch('/user-tool/:user_id/:tool_id', userToolController.updateUserToolQuantity);
router.delete('/user-tool/:user_id/:tool_id', userToolController.deleteUserTool);

export default router;