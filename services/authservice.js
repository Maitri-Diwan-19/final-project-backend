import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client.js';
import { sendEmail, sendResetPasswordEmail } from '../utils/sendEmail.js';

const prisma = new PrismaClient();

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true },
  });
};

export const registerUser = async ({ username, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword },
  });

  const activationToken = jwt.sign({ userId: user.id }, process.env.ACTIVATION_SECRET, {
    expiresIn: '1d',
  });

  const activationLink = `${process.env.CLIENT_URL}/activate/${activationToken}`;
  const emailSent = await sendEmail(user.email, 'Activate your SocioFeed Account', activationLink);

  return { user, emailSent, activationToken };
};

export const activateUser = async (token) => {
  const { userId } = jwt.verify(token, process.env.ACTIVATION_SECRET);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return { error: 'User not found' };
  if (user.isActive) return { error: 'Account already activated' };

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true, activationToken: null },
  });

  return { success: true };
};

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'Invalid email or password' };

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return { error: 'Invalid email or password' };

  if (!user.isActive) return { error: 'Account not activated' };

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.token.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, accessToken, refreshToken };
};

export const initiatePasswordReset = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: 'User not found' };

  const resetToken = jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: '1h' });

  await prisma.user.update({
    where: { email },
    data: { resetToken },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const emailSent = await sendResetPasswordEmail(email, 'Reset Your SocioFeed Password', resetLink);

  return { emailSent, resetLink };
};

export const resetUserPassword = async (token, newPassword) => {
  const decoded = jwt.verify(token, process.env.RESET_SECRET);
  const user = await prisma.user.findUnique({ where: { email: decoded.email } });

  if (!user || user.resetToken !== token) return { error: 'Invalid or expired token' };

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: decoded.email },
    data: {
      password: hashedPassword,
      resetToken: null,
    },
  });

  return { success: true };
};

export const logoutUser = async (refreshToken) => {
  await prisma.token.deleteMany({ where: { token: refreshToken } });
};
