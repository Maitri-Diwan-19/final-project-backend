import {
  fetchProfile,
  fetchProfileById,
  checkIfFollowing,
  toggleFollow,
  uploadAvatar,
  updateUserProfile,
  getFollowersList,
  getFollowingList,
  searchUsersByQuery,
} from '../services/userservice.js';

export const getProfile = async (req, res) => {
  try {
    const user = await fetchProfile(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[ERROR] Failed to fetch profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const user = await fetchProfileById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isFollowing =
      currentUserId && currentUserId !== id ? !!(await checkIfFollowing(currentUserId, id)) : false;

    res.json({
      ...user,
      isFollowing,
      isOwnProfile: currentUserId === id,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    });
  } catch (err) {
    console.error('[ERROR] Failed to fetch profile by ID:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const toggleFollowUser = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { followedId } = req.params;

    if (followerId === followedId) return res.status(400).json({ error: "Can't follow yourself" });

    const result = await toggleFollow(followerId, followedId);
    res.json(result);
  } catch (error) {
    console.error('[Toggle Follow Error]', error);
    res.status(500).json({ error: 'Could not toggle follow status' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { username, bio } = req.body;
    let avatarUrl;

    if (req.file) {
      const result = await uploadAvatar(req.file.buffer);
      avatarUrl = result.secure_url;
    }

    const updated = await updateUserProfile(userId, username, bio, avatarUrl);
    res.json(updated);
  } catch (error) {
    console.error('[Update Error]', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const data = await getFollowersList(req.params.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching followers' });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const data = await getFollowingList(req.params.userId);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching following' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const results = await searchUsersByQuery(req.query.query);
    if (results.length === 0) return res.status(404).json({ message: 'No users found' });
    res.json(results);
  } catch (err) {
    console.error('[Search Error]', err);
    res.status(500).json({ error: 'Search failed' });
  }
};
