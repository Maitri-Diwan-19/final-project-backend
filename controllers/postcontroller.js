import * as postService from '../services/postservice.js';

export const createPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;
    const files = req.files || [];

    const newPost = await postService.createPostService(userId, content, files);

    res.status(201).json({ message: 'Post created successfully.', post: newPost });
  } catch (error) {
    console.error('[Create Post Error]', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const addCommentToPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const newComment = await postService.addCommentService(userId, postId, content);

    res.status(201).json({ message: 'Comment added successfully.', comment: newComment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(400).json({ error: error.message || 'Internal server error' });
  }
};

export const getHomeFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;

    const posts = await postService.getHomeFeedService(userId, page);

    res.json(posts);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Unable to fetch feed' });
  }
};

export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;

    const posts = await postService.getMyPostsService(userId, page);

    res.json(posts);
  } catch (error) {
    console.error('My Posts error:', error);
    res.status(500).json({ error: 'Unable to fetch your posts' });
  }
};

export const likePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const { likesCount, likedUsers } = await postService.likePostService(userId, postId);

    res.status(201).json({ message: 'Post liked', likesCount, likedUsers });
  } catch (error) {
    console.error('Like error:', error);
    res.status(400).json({ error: error.message || 'Already liked or post not found' });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const likesCount = await postService.unlikePostService(userId, postId);

    res.json({ message: 'Post unliked', likesCount });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(400).json({ error: error.message || 'Like not found' });
  }
};

export const getPostComments = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await postService.getPostCommentsService(postId);

    res.json(comments);
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ error: 'Unable to fetch comments' });
  }
};

export const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const updated = await postService.editCommentService(userId, commentId, content);

    res.status(200).json(updated);
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(400).json({ error: error.message || 'Failed to edit comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    await postService.deleteCommentService(userId, commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete comment' });
  }
};

export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const save = await postService.savePostService(userId, postId);

    res.status(201).json({ message: 'Post saved', save });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
};

export const unsavePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await postService.unsavePostService(userId, postId);

    res.status(200).json({ message: 'Post unsaved', result });
  } catch (error) {
    if (error.message === 'Post was not saved by user') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Unsave post error:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
};

export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const savedPosts = await postService.getSavedPostsService(userId);

    res.json(savedPosts);
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({ error: 'Failed to load saved posts' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await postService.getUserProfileService(username);

    res.json(user);
  } catch (error) {
    console.error('User profile error:', error);
    res.status(404).json({ error: error.message || 'Unable to fetch profile' });
  }
};

export const getPostDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const post = await postService.getPostDetailsService(postId, userId);

    res.json(post);
  } catch (error) {
    console.error('Post detail error:', error);
    res.status(404).json({ error: error.message || 'Unable to fetch post' });
  }
};

export const uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const result = await postService.uploadMediaService(file.buffer);

    res.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await postService.getPostsByUserService(userId);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts.' });
  }
};
