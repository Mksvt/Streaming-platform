const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists.' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || username
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isStreamer: user.isStreamer,
        isLive: user.isLive
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        isStreamer: user.isStreamer,
        isLive: user.isLive,
        streamKey: user.streamKey
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
        bio: req.user.bio,
        isStreamer: req.user.isStreamer,
        isLive: req.user.isLive,
        streamKey: req.user.streamKey,
        followerCount: req.user.followerCount,
        followingCount: req.user.followingCount,
        totalViews: req.user.totalViews
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error while fetching profile.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { displayName, bio, avatar } = req.body;
    const updates = {};

    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error while updating profile.' });
  }
});

// @route   POST /api/auth/become-streamer
// @desc    Make user a streamer and generate stream key
// @access  Private
router.post('/become-streamer', auth, async (req, res) => {
  try {
    if (req.user.isStreamer) {
      return res.status(400).json({ error: 'User is already a streamer.' });
    }

    const user = await User.findById(req.user._id);
    user.isStreamer = true;
    user.streamKey = user.generateStreamKey();
    await user.save();

    res.json({
      message: 'User is now a streamer',
      streamKey: user.streamKey,
      rtmpUrl: `rtmp://${process.env.MEDIA_SERVER_URL || 'localhost'}:1935/live`
    });
  } catch (error) {
    console.error('Become streamer error:', error);
    res.status(500).json({ error: 'Server error while becoming streamer.' });
  }
});

// @route   POST /api/auth/regenerate-stream-key
// @desc    Generate new stream key for streamer
// @access  Private
router.post('/regenerate-stream-key', auth, async (req, res) => {
  try {
    if (!req.user.isStreamer) {
      return res.status(400).json({ error: 'User is not a streamer.' });
    }

    const user = await User.findById(req.user._id);
    user.streamKey = user.generateStreamKey();
    await user.save();

    res.json({
      message: 'Stream key regenerated successfully',
      streamKey: user.streamKey,
      rtmpUrl: `rtmp://${process.env.MEDIA_SERVER_URL || 'localhost'}:1935/live`
    });
  } catch (error) {
    console.error('Regenerate stream key error:', error);
    res.status(500).json({ error: 'Server error while regenerating stream key.' });
  }
});

module.exports = router;
