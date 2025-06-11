import { PrismaClient } from '../generated/prisma/client.js';
import { v2 as cloudinary } from 'cloudinary';
import upload from '../middleware/multer.js';
import streamifier from 'streamifier';
import connectCloudinary from '../constants/cloudinary.js';

const prisma = new PrismaClient();
await connectCloudinary();

export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const createPostService = async (userId, content, files) => {
  if (!content && files.length === 0) {
    throw new Error('Post must have content or media.');
  }
  if (files.length > 4) {
    throw new Error('You can upload a maximum of 4 images.');
  }

  const uploadedMedia = await Promise.all(
    files.map(async (file) => {
      const result = await uploadToCloudinary(file.buffer);
      return {
        url: result.secure_url,
        type: result.resource_type,
      };
    })
  );

  const newPost = await prisma.post.create({
    data: {
      content,
      userId,
      media: {
        create: uploadedMedia,
      },
    },
    include: { media: true },
  });

  return newPost;
};

export const getPostByIdService = async (postId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: { id: true, username: true, avatarUrl: true },
      },
      media: true,
      likes: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      comments: {
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return post;
};
export const addCommentService = async (userId, postId, content) => {
  if (!content) throw new Error('Comment content is required.');

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error('Post not found.');

  const newComment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId,
    },
    include: {
      user: { select: { username: true, avatarUrl: true } },
    },
  });

  return newComment;
};

export const getHomeFeedService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);
  followingIds.push(userId); //  Add the user's own ID

  const posts = await prisma.post.findMany({
    where: { userId: { in: followingIds } },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { username: true, avatarUrl: true } },
      media: true,
      likes: {
        select: {
          user: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return posts;
};

export const getMyPostsService = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      media: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  return posts;
};

export const likePostService = async (userId, postId) => {
  await prisma.like.create({ data: { userId, postId } });

  const likesWithUsers = await prisma.like.findMany({
    where: { postId },
    include: {
      user: { select: { id: true, username: true } },
    },
  });

  const likedUsers = likesWithUsers.map((like) => like.user);
  const likesCount = likedUsers.length;

  return { likesCount, likedUsers };
};

export const unlikePostService = async (userId, postId) => {
  await prisma.like.delete({ where: { userId_postId: { userId, postId } } });

  const likesCount = await prisma.like.count({ where: { postId } });

  return likesCount;
};

export const getPostCommentsService = async (postId) => {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { username: true, avatarUrl: true } } },
  });
  return comments;
};

export const editCommentService = async (userId, commentId, content) => {
  if (!content || content.trim() === '') {
    throw new Error('Content cannot be empty');
  }

  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing) throw new Error('Comment not found');

  if (existing.userId !== userId) {
    throw new Error('Not allowed to edit this comment');
  }

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content: content.trim(), updatedAt: new Date() },
  });

  return updated;
};

export const deleteCommentService = async (userId, commentId) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: { select: { userId: true } } },
  });

  if (!comment) throw new Error('Comment not found');

  const isCommentOwner = comment.userId === userId;
  const isPostOwner = comment.post.userId === userId;

  if (!isCommentOwner && !isPostOwner) throw new Error('Unauthorized to delete this comment');

  await prisma.comment.delete({ where: { id: commentId } });
};

export const savePostService = async (userId, postId) => {
  const save = await prisma.savePost.create({ data: { userId, postId } });
  return save;
};

export const unsavePostService = async (userId, postId) => {
  const existingSave = await prisma.savePost.findFirst({
    where: { userId, postId },
  });

  if (!existingSave) {
    throw new Error('Post was not saved by user');
  }

  return await prisma.savePost.deleteMany({
    where: { userId, postId },
  });
};

export const getSavedPostsService = async (userId) => {
  const saved = await prisma.savePost.findMany({
    where: { userId },
    include: {
      post: {
        include: {
          user: { select: { username: true, avatarUrl: true } },
          media: true,
          likes: true,
          comments: true,
        },
      },
    },
  });
  return saved.map((s) => ({
    ...s.post,
    id: s.post.id,
    isSaved: true,
    likesCount: s.post.likes.length,
    commentsCount: s.post.comments.length,
  }));
};

export const getUserProfileService = async (username) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
      posts: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          media: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });

  if (!user) throw new Error('User not found');

  return user;
};

export const getPostDetailsService = async (postId, userId) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { username: true, avatarUrl: true } },
      media: true,
      _count: { select: { likes: true, comments: true } },
      likes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
    },
  });

  if (!post) throw new Error('Post not found');

  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    user: post.user,
    media: post.media,
    likesCount: post._count.likes,
    commentsCount: post._count.comments,
    likedByCurrentUser: userId ? post.likes.length > 0 : false,
  };
};

export const uploadMediaService = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'sociofeed-posts',
      },
      (error, result) => {
        if (error) reject(error);
        else
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            type: result.resource_type,
          });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

export const getPostsByUserService = async (userId) => {
  return await prisma.post.findMany({
    where: {
      userId: userId,
    },
    include: {
      media: true,
      comments: true,
      likes: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
