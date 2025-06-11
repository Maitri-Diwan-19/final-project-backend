import express from 'express';
import * as chatController from '../controllers/chatcontroller.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.use(authenticate);

router.get('/', chatController.getUserChats);
router.post('/create', chatController.createOrGetChat);
router.get('/:chatId/messages', chatController.getChatMessages);
router.post('/send-message', chatController.sendMessage);
router.get('/:chatId', chatController.getChatDetails);

export default router;
