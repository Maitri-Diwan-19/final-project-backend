import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client.js';
import { sendEmail, sendResetPasswordEmail } from '../utils/sendEmail.js';
import {
  registrationSchema,
  loginSchema,
  activationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationschema.js';
const prisma = new PrismaClient();

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const handleYupError = (err, res) => {
  if (err.name === 'ValidationError') {
    const errors = err.inner.map((e) => e.message);
    return res.status(400).json({ errors });
  }
};
export const register = async (req, res) => {
  try {
    await registrationSchema.validate(req.body, { abortEarly: false });
    const { username, email, password, confirmPassword } = req.body;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
    const activationToken = jwt.sign({ userId: user.id }, process.env.ACTIVATION_SECRET, {
      expiresIn: '1d',
    });
    const activationLink = `${process.env.CLIENT_URL}/activate/${activationToken}`;
    // Send email
    const emailSent = await sendEmail(
      user.email,
      'Activate your SocioFeed Account',
      activationLink
    );

    if (!emailSent) {
      await prisma.user.delete({ where: { id: user.id } });
      console.error('Email sending failed:', error);
      return res.status(500).json({ error: 'Failed to send activation email' });
    }

    return res.status(201).json({
      message: 'Registration successful. Check your email to activate your account.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') return handleYupError(error, res);

    return res.status(500).json({ error: 'User registration failed' });
  }
};

export const activate = async (req, res) => {
  try {
    await activationSchema.validate(req.body, { abortEarly: false });
    const { token } = req.body;
    const { userId } = jwt.verify(token, process.env.ACTIVATION_SECRET);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isActive) return res.status(400).json({ error: 'Account already activated' });

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    res.json({ message: 'Account activated successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') return handleYupError(err, res);
    console.error('Token Error:', err.message);
    res.status(400).json({ error: 'Invalid or expired activation token' });
  }
};

export const login = async (req, res) => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account not activated. Check your email.' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await prisma.token.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Login successful', accessToken });
  } catch (err) {
    if (err.name === 'ValidationError') return handleYupError(err, res);
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
export const forgotPassword = async (req, res) => {
  try {
    await forgotPasswordSchema.validate(req.body, { abortEarly: false });
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resetToken = jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: '1h' });

    await prisma.user.update({
      where: { email },
      data: { resetToken },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log('[DEBUG] Generated reset link:', resetLink);

    const emailSent = await sendResetPasswordEmail(
      email,
      'Reset Your SocioFeed Password',
      resetLink
    );

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return handleYupError(error, res);
    }

    console.error('[ERROR] Forgot password process failed:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    res.status(500).json({
      error: 'Failed to process password reset request',
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    await resetPasswordSchema.validate(req.body, { abortEarly: false });
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.RESET_SECRET);
    const user = await prisma.user.findUnique({ where: { email: decoded.email } });

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: decoded.email },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'ValidationError') return handleYupError(error, res);
    console.error(error);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await prisma.token.deleteMany({ where: { token: refreshToken } });
      res.clearCookie('refreshToken');
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};
