import { PrismaClient } from '../generated/prisma/client.js';

const prisma = new PrismaClient();

// Get all chats for a user
export const getUserChats = async (userId) => {
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: { id: userId },
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
  return chats.map((chat) => {
    const otherParticipant = chat.participants.find((p) => p.id !== userId);
    const latestMessage = chat.messages[0] || null;

    return {
      id: chat.id,
      otherParticipant,
      latestMessage,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  });
};

// Create a new chat or get existing one between two users
export const createOrGetChat = async (userId, participantId) => {
  let existingChat = await prisma.chat.findFirst({
    where: {
      participants: {
        every: {
          id: { in: [userId, participantId] },
        },
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });

  if (existingChat) {
    const otherParticipant = existingChat.participants.find((p) => p.id !== userId);
    return {
      id: existingChat.id,
      otherParticipant,
      createdAt: existingChat.createdAt,
      updatedAt: existingChat.updatedAt,
    };
  }
  const participant = await prisma.user.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      isActive: true,
    },
  });

  if (!participant) {
    throw new Error('User not found');
  }

  // Create new chat
  const newChat = await prisma.chat.create({
    data: {
      participants: {
        connect: [{ id: userId }, { id: participantId }],
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });

  const otherParticipant = newChat.participants.find((p) => p.id !== userId);
  return {
    id: newChat.id,
    otherParticipant,
    createdAt: newChat.createdAt,
    updatedAt: newChat.updatedAt,
  };
};

// Get messages for a specific chat
export const getChatMessages = async (chatId, userId, page = 1, limit = 50) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: { id: userId },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found or access denied');
  }

  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: { chatId },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });

  const totalMessages = await prisma.message.count({
    where: { chatId },
  });

  return {
    messages: messages.reverse(),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalMessages / limit),
      totalMessages,
      hasMore: skip + messages.length < totalMessages,
    },
  };
};

// Send a message
export const sendMessage = async (senderId, receiverId, chatId, content) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: { id: senderId },
      },
    },
  });

  if (!chat) {
    throw new Error('Chat not found or access denied');
  }

  // Create message
  const message = await prisma.message.create({
    data: {
      content,
      senderId,
      receiverId,
      chatId,
    },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
      receiver: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  await prisma.chat.update({
    where: { id: chatId },
    data: { updatedAt: new Date() },
  });

  return message;
};

// Get chat details
export const getChatDetails = async (chatId, userId) => {
  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      participants: {
        some: {
          id: userId,
        },
      },
    },
    include: {
      participants: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });

  if (!chat) {
    console.error(' Chat not found or access denied');
    throw new Error('Chat not found or access denied');
  }

  const otherParticipant = chat.participants.find((p) => p.id !== userId);
  if (!otherParticipant) {
    throw new Error('No other participant found in chat');
  }

  return {
    id: chat.id,
    otherParticipant,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
};
