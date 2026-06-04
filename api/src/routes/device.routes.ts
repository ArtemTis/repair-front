import { Router } from 'express';
import deviceController from '../controller/device.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.use(requireAuth);

router.post('/device', deviceController.createDevice);
router.get('/devices/user/:user_id', deviceController.getDevicesByUserId);
router.get('/device/:id', deviceController.getDeviceById);
router.patch('/device/:id', deviceController.updateDevice);
router.delete('/device/:id', deviceController.deleteDevice);

export default router;