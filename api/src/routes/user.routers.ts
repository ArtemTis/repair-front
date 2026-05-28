import { Router } from 'express'
import userController from '../controller/user.controller';
const router = Router();

router.post('/user', userController.createUser);
router.get('/users', userController.getUsers);
router.get('/user/:id', userController.getUserById);
router.patch('/user/:id', userController.updateUser);
router.delete('/user/:id', userController.deleteUser);

export default router;