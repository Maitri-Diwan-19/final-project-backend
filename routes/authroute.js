import express from 'express';
import {
  register,
  activate,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from '../controllers/authcontroller.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', register);

// @route   POST /api/auth/activate
// @desc    Activate user account via token
router.post('/activate', activate);

// @route   POST /api/auth/login
// @desc    Login user and send access token + set refresh token cookie
router.post('/login', login);

// @route   POST /api/auth/logout
// @desc    Logout user and clear refresh token
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
