const express = require('express');
const User = require('../models/User');
const Stream = require('../models/Stream');
const { auth, isOwner } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:username
// @desc    Get user profile by username
// @access  Public
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username })
      .select('-password -streamKey')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Get user's live stream if any
    const liveStream = await Stream.findOne({
      user: user._id,
      status: 'LIVE'
    }).select('title description category tags viewerCount startedAt');

    // Get recent VODs
    const recentVideos = await Stream.find({
      user: user._id,
      status: 'FINISHED',
      isPublic: true
    })
    .select('title description thumbnail duration durationFormatted endedAt')
    .sort({ endedAt: -1 })
    .limit(6);

    res.json({
      user: {
        ...user.toJSON(),
        liveStream: liveStream || null,
        recentVideos
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error while fetching user profile.' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by username or display name
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters long.' });
    }

    const query = {
      $or: [
        { username: { $regex: q.trim(), $options: 'i' } },
        { displayName: { $regex: q.trim(), $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('username displayName avatar bio isStreamer isLive followerCount')
      .sort({ followerCount: -1, username: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error while searching users.' });
  }
});

// @route   GET /api/users/top-streamers
// @desc    Get top streamers by follower count
// @access  Public
router.get('/top-streamers', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topStreamers = await User.find({ isStreamer: true })
      .select('username displayName avatar bio followerCount totalViews')
      .sort({ followerCount: -1, totalViews: -1 })
      .limit(parseInt(limit));

    res.json({
      streamers: topStreamers
    });
  } catch (error) {
    console.error('Get top streamers error:', error);
    res.status(500).json({ error: 'Server error while fetching top streamers.' });
  }
});

// @route   POST /api/users/follow/:userId
// @desc    Follow a user
// @access  Private
router.post('/follow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User to follow not found.' });
    }

    // Check if already following
    if (req.user.following.includes(userId)) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }

    // Add to following list
    req.user.following.push(userId);
    await req.user.save();

    // Add to user's followers list
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    res.json({
      message: `You are now following ${userToFollow.displayName}`,
      following: req.user.following,
      followerCount: req.user.followerCount
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Server error while following user.' });
  }
});

// @route   POST /api/users/unfollow/:userId
// @desc    Unfollow a user
// @access  Private
router.post('/unfollow/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot unfollow yourself.' });
    }

    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ error: 'User to unfollow not found.' });
    }

    // Check if following
    if (!req.user.following.includes(userId)) {
      return res.status(400).json({ error: 'You are not following this user.' });
    }

    // Remove from following list
    req.user.following = req.user.following.filter(id => id.toString() !== userId);
    await req.user.save();

    // Remove from user's followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== req.user._id.toString());
    await userToUnfollow.save();

    res.json({
      message: `You have unfollowed ${userToUnfollow.displayName}`,
      following: req.user.following,
      followerCount: req.user.followerCount
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Server error while unfollowing user.' });
  }
});

// @route   GET /api/users/following
// @desc    Get users that current user is following
// @access  Private
router.get('/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('following', 'username displayName avatar bio isStreamer isLive')
      .select('following');

    res.json({
      following: user.following
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Server error while fetching following list.' });
  }
});

// @route   GET /api/users/followers
// @desc    Get users following current user
// @access  Private
router.get('/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('followers', 'username displayName avatar bio isStreamer isLive')
      .select('followers');

    res.json({
      followers: user.followers
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Server error while fetching followers list.' });
  }
});

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const { emailNotifications, streamNotifications, privacySettings } = req.body;
    const updates = {};

    if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
    if (streamNotifications !== undefined) updates.streamNotifications = streamNotifications;
    if (privacySettings !== undefined) updates.privacySettings = privacySettings;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Settings updated successfully',
      user
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error while updating settings.' });
  }
});

module.exports = router;
