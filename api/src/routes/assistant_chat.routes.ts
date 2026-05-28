import { Router } from 'express';
import assistantChatController from '../controller/assistant_chat.controller';

const router = Router();

router.post('/assistant-chats', assistantChatController.createChat);
router.get('/assistant-chats/user/:user_id', assistantChatController.getChatsByUserId);
router.get('/assistant-chats/:id', assistantChatController.getChatById);
router.patch('/assistant-chats/:id', assistantChatController.updateChat);
router.post('/assistant-chats/:id/messages', assistantChatController.addMessage);
router.delete('/assistant-chats/:id', assistantChatController.deleteChat);

export default router;
