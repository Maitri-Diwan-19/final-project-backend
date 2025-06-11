import express from 'express';
import {
  register,
  activate,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  refreshToken,
} from '../controllers/authcontroller.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post('/register', register);
router.post('/activate', activate);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
