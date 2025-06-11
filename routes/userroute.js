import express from 'express';
import {
  getFollowers,
  getFollowing,
  getProfile,
  getProfileById,
  searchUsers,
  toggleFollowUser,
  updateProfile,
} from '../controllers/usercontroller.js';
import authenticate from '../middleware/authenticate.js';
import upload from '../middleware/multer.js';
const router = express.Router();

router.get('/profile/:username', getProfile);
router.get('/profilebyid/:id', authenticate, getProfileById);
router.post('/follow-toggle/:followedId', authenticate, toggleFollowUser);
router.get('/search', searchUsers);
router.get('/followers/:userId', getFollowers);
router.get('/following/:userId', getFollowing);
router.put('/profile/edit', authenticate, upload.single('avatar'), updateProfile);

export default router;
