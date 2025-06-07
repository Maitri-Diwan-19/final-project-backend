import { PrismaClient } from '../generated/prisma/client.js';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const prisma = new PrismaClient();

export const fetchProfile = async (username) => {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      followers: true,
      following: true,
      posts: { orderBy: { createdAt: 'desc' } },
    },
  });
};

export const fetchProfileById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      posts: { orderBy: { createdAt: 'desc' } },
      _count: { select: { followers: true, following: true } },
    },
  });
};

export const checkIfFollowing = async (followerId, followingId) => {
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  });
};

export const toggleFollow = async (followerId, followingId) => {
  const existing = await checkIfFollowing(followerId, followingId);
  if (existing) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
    return { message: 'Unfollowed successfully', isFollowing: false };
  } else {
    await prisma.follow.create({
      data: { followerId, followingId },
    });
    return { message: 'Followed successfully', isFollowing: true };
  }
};

export const uploadAvatar = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const updateUserProfile = async (userId, username, bio, avatarUrl) => {
  return prisma.user.update({
    where: { id: userId },
    data: { username, bio, ...(avatarUrl && { avatarUrl }) },
  });
};

export const getFollowersList = async (userId) => {
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  return followers.map((f) => f.follower);
};

export const getFollowingList = async (userId) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: { select: { id: true, username: true, avatarUrl: true } },
    },
  });
  return following.map((f) => f.following);
};

export const searchUsersByQuery = async (query) => {
  return prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, username: true, avatarUrl: true },
    take: 10,
  });
};
