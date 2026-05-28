import { Router } from 'express';
import toolController from '../controller/tool.controller';

const router = Router();

router.post('/tool', toolController.createTool);
router.get('/tools', toolController.getTools);
router.get('/tool/:id', toolController.getToolById);
router.patch('/tool/:id', toolController.updateTool);
router.delete('/tool/:id', toolController.deleteTool);

export default router;