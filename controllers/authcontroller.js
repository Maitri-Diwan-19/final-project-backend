import {
  getUserById,
  registerUser,
  activateUser,
  loginUser,
  initiatePasswordReset,
  resetUserPassword,
  logoutUser,
} from '../services/authservice.js';

import {
  registrationSchema,
  loginSchema,
  activationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validationschema.js';

const handleYupError = (err, res) => {
  const errors = err.errors;
  return res.status(400).json({ errors });
};

export const getMe = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const register = async (req, res) => {
  try {
    await registrationSchema.validate(req.body, { abortEarly: false });
    const { username, email, password } = req.body;

    const { user, emailSent, activationToken } = await registerUser({ username, email, password });

    if (!emailSent) {
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(500).json({ error: 'Failed to send activation email' });
    }

    res.status(201).json({
      message: 'Registration successful. Check your email to activate your account.',
    });
  } catch (error) {
    if (error.name === 'ValidationError') return handleYupError(error, res);
    res.status(500).json({ error: 'User registration failed' });
  }
};

export const activate = async (req, res) => {
  try {
    await activationSchema.validate(req.body, { abortEarly: false });
    const result = await activateUser(req.body.token);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Account activated successfully' });
  } catch (err) {
    if (err.name === 'ValidationError') return handleYupError(err, res);
    res.status(400).json({ error: 'Invalid or expired activation token' });
  }
};

export const login = async (req, res) => {
  try {
    await loginSchema.validate(req.body, { abortEarly: false });

    const result = await loginUser(req.body);
    if (result.error) return res.status(401).json({ error: result.error });

    const { user, accessToken, refreshToken } = result;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: 'Login successful', accessToken, refreshToken, user });
  } catch (err) {
    if (err.name === 'ValidationError') return handleYupError(err, res);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await forgotPasswordSchema.validate(req.body, { abortEarly: false });
    const { emailSent, resetLink } = await initiatePasswordReset(req.body.email);
    if (!emailSent) return res.status(500).json({ error: 'Failed to send reset email' });

    res.json({ message: 'Password reset link sent to your email.' });
  } catch (error) {
    if (error.name === 'ValidationError') return handleYupError(error, res);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    await resetPasswordSchema.validate(req.body, { abortEarly: false });
    const result = await resetUserPassword(token, req.body.password);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'ValidationError') return handleYupError(error, res);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await logoutUser(refreshToken);
      res.clearCookie('refreshToken');
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};
