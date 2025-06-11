import express from 'express';
import upload from '../middleware/multer.js';
import {
  getHomeFeed,
  likePost,
  unlikePost,
  getPostComments,
  getUserProfile,
  uploadMedia,
  createPost,
  addCommentToPost,
  getPostDetails,
  editComment,
  deleteComment,
  savePost,
  getSavedPosts,
  getMyPosts,
  unsavePost,
  getPostsByUser,
} from '../controllers/postcontroller.js';
import authenticate from '../middleware/authenticate.js';
const router = express.Router();

router.post('/posts', authenticate, upload.array('media'), createPost);
router.get('/feed', authenticate, getHomeFeed);
router.get('/my-posts', authenticate, getMyPosts);
router.get('/user/:userId', authenticate, getPostsByUser);
router.post('/like/:postId', authenticate, likePost);
router.delete('/unlike/:postId', authenticate, unlikePost);
router.get('/posts/getcomments/:postId', getPostComments);
router.get('/users/:username', getUserProfile);
router.get('/posts/:postId', getPostDetails);
router.post('/media/upload', authenticate, upload.single('file'), uploadMedia);
router.post('/posts/comments/:postId', authenticate, addCommentToPost);
router.put('/comments/:commentId', authenticate, editComment);
router.delete('/comments/:commentId', authenticate, deleteComment);
router.post('/save/:postId', authenticate, savePost);
router.delete('/unsave-post/:postId', authenticate, unsavePost);
router.get('/saved', authenticate, getSavedPosts);

export default router;
