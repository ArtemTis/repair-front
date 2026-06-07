import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import userRouter from './user.routers';
import deviceRouter from './device.routes';
import repairGuide from './repair_guide.routes';
import repairHistory from './repair_history.routes';
import assistantChats from './assistant_chat.routes';
import userTools from './user_tools.routes';
import repairGuideTools from './repair_guide_tool.routes';

const protectedRouter = Router();

protectedRouter.use(requireAuth);
protectedRouter.use(userRouter);
protectedRouter.use(deviceRouter);
protectedRouter.use(repairGuide);
protectedRouter.use(repairHistory);
protectedRouter.use(assistantChats);
protectedRouter.use(userTools);
protectedRouter.use(repairGuideTools);

export default protectedRouter;
