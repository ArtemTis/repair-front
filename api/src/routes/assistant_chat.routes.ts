import { Router } from 'express';
import assistantChatController from '../controller/assistant_chat.controller';

const router = Router();

router.get('/me/assistant-chats', assistantChatController.getMyChats);
router.post('/me/assistant-chats', assistantChatController.createChat);
router.get('/me/assistant-chats/:id', assistantChatController.getChatById);
router.patch('/me/assistant-chats/:id', assistantChatController.updateChat);
router.post('/me/assistant-chats/:id/messages', assistantChatController.addMessage);
router.delete('/me/assistant-chats/:id', assistantChatController.deleteChat);

export default router;
