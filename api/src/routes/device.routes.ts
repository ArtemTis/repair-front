import { Router } from 'express';
import deviceController from '../controller/device.controller';

const router = Router();

router.post('/device', deviceController.createDevice);
router.get('/devices/user/:user_id', deviceController.getDevicesByUserId);
router.get('/device/:id', deviceController.getDeviceById);
router.patch('/device/:id', deviceController.updateDevice);
router.delete('/device/:id', deviceController.deleteDevice);

export default router;