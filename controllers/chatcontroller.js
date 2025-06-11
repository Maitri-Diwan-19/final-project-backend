import * as chatService from '../services/chatservice.js';

// Get all chats for the authenticated user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await chatService.getUserChats(userId);

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chats',
      error: error.message,
    });
  }
};

// Create or get existing chat between two users
export const createOrGetChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required',
      });
    }

    if (participantId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create chat with yourself',
      });
    }

    const chat = await chatService.createOrGetChat(userId, participantId);

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create or get chat',
      error: error.message,
    });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    const messages = await chatService.getChatMessages(
      chatId,
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      error: error.message,
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { chatId, content, receiverId } = req.body;

    if (!userId) {
      console.error(' User ID missing in request (auth issue)');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated',
      });
    }

    if (!chatId || !content || !receiverId) {
      console.error(' Missing required fields:', { chatId, content, receiverId });
      return res.status(400).json({
        success: false,
        message: 'Chat ID, content, and receiver ID are required',
      });
    }

    console.log(`Sending message from user ${userId} to receiver ${receiverId} in chat ${chatId}`);

    const message = await chatService.sendMessage(userId, receiverId, chatId, content);

    console.log(' Message created successfully:', message);

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message,
    });
  }
};

// Get chat details
export const getChatDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        message: 'Chat ID is required',
      });
    }

    const chat = await chatService.getChatDetails(chatId, userId);
    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error('Error getting chat details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch chat details',
      error: error.message,
    });
  }
};
