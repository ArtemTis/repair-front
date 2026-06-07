import { Router } from 'express';
import deviceController from '../controller/device.controller';

const router = Router();

router.get('/me/devices', deviceController.getMyDevices);
router.post('/me/devices', deviceController.createDevice);
router.get('/me/devices/:id', deviceController.getDeviceById);
router.patch('/me/devices/:id', deviceController.updateDevice);
router.delete('/me/devices/:id', deviceController.deleteDevice);

export default router;
