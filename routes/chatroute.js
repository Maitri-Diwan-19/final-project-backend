import express from 'express';
import {
  createOrGetChat,
  getUserChats,
  sendMessage,
  getChatMessages,
} from '../controllers/chatcontroller.js';

import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Create a new chat or get existing chat between sender and receiver
router.post('/create/:receiverId', authenticate, createOrGetChat);

//  Get all chats for the logged-in user
router.get('/', authenticate, getUserChats);

//  Send a message in a chat
router.post('/message', authenticate, sendMessage);

// Get all messages for a chat
router.get('/messages/:chatId', authenticate, getChatMessages);

export default router;
