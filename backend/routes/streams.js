const express = require('express');
const Stream = require('../models/Stream');
const User = require('../models/User');
const { auth, isOwner, isStreamer } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

let ffmpegProcesses = {}; // Store ffmpeg processes by stream ID

// Function to stop a specific FFmpeg process
const stopFfmpeg = (streamId) => {
  if (ffmpegProcesses[streamId]) {
    console.log(`[FFmpeg] Stopping process for stream ${streamId}`);
    ffmpegProcesses[streamId].kill('SIGKILL');
    delete ffmpegProcesses[streamId];
  }
};

// Graceful shutdown
process.on('exit', () => {
  console.log('[Server] Shutting down. Killing all FFmpeg processes.');
  Object.keys(ffmpegProcesses).forEach(stopFfmpeg);
});

// @route   GET /api/streams/live
// @desc    Get all live streams
// @access  Public
router.get('/live', async (req, res) => {
  try {
    const liveStreams = await Stream.find({
      status: 'LIVE',
      isPublic: true,
    })
      .populate('user', 'username displayName avatar isLive')
      .sort({ startedAt: -1 });

    res.json({
      streams: liveStreams,
      count: liveStreams.length,
    });
  } catch (error) {
    console.error('Get live streams error:', error);
    res
      .status(500)
      .json({ error: 'Server error while fetching live streams.' });
  }
});

// @route   GET /api/streams/user/:username
// @desc    Get current live stream for a specific user
// @access  Public
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const liveStream = await Stream.findOne({
      user: user._id,
      status: 'LIVE',
    }).populate('user', 'username displayName avatar isLive');

    if (!liveStream) {
      return res
        .status(404)
        .json({ error: 'No live stream found for this user.' });
    }

    res.json({
      stream: liveStream,
    });
  } catch (error) {
    console.error('Get user stream error:', error);
    res.status(500).json({ error: 'Server error while fetching user stream.' });
  }
});

// @route   GET /api/streams/user/:username/videos
// @desc    Get all finished streams (VODs) for a specific user
// @access  Public
router.get('/user/:username/videos', async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { endedAt: -1 },
    };

    const streams = await Stream.find({
      user: user._id,
      status: 'FINISHED',
      isPublic: true,
    })
      .populate('user', 'username displayName avatar')
      .sort({ endedAt: -1 })
      .limit(options.limit)
      .skip((options.page - 1) * options.limit);

    const total = await Stream.countDocuments({
      user: user._id,
      status: 'FINISHED',
      isPublic: true,
    });

    res.json({
      streams,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalStreams: total,
        hasNextPage: options.page * options.limit < total,
        hasPrevPage: options.page > 1,
      },
    });
  } catch (error) {
    console.error('Get user videos error:', error);
    res.status(500).json({ error: 'Server error while fetching user videos.' });
  }
});

// @route   GET /api/streams/:id
// @desc    Get stream by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id).populate(
      'user',
      'username displayName avatar isLive'
    );

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found.' });
    }

    res.json({
      stream,
    });
  } catch (error) {
    console.error('Get stream error:', error);
    res.status(500).json({ error: 'Server error while fetching stream.' });
  }
});

// @route   POST /api/streams/start
// @desc    Start a new stream
// @access  Private (Streamer only)
router.post('/start', auth, isStreamer, async (req, res) => {
  try {
    const { title, description, category, tags, isPublic = true } = req.body;

    // Check if user already has a live stream
    const existingLiveStream = await Stream.findOne({
      user: req.user._id,
      status: 'LIVE',
    });

    if (existingLiveStream) {
      return res.status(400).json({ error: 'User already has a live stream.' });
    }

    // Create new stream
    const newStream = new Stream({
      title: title || `${req.user.displayName}'s Live Stream`,
      description: description || '',
      user: req.user._id,
      streamKey: req.user.streamKey,
      category: category || 'Just Chatting',
      tags: tags || [],
      isPublic,
      rtmpUrl: `rtmp://${
        process.env.MEDIA_SERVER_URL || 'localhost'
      }:1935/live`,
      playbackUrl: `http://${
        process.env.MEDIA_SERVER_URL || 'localhost'
      }:8000/live/${req.user.streamKey}/index.m3u8`,
    });

    await newStream.save();

    // Update user status
    await User.findByIdAndUpdate(req.user._id, { isLive: true });

    res.status(201).json({
      message: 'Stream started successfully',
      stream: newStream,
    });
  } catch (error) {
    console.error('Start stream error:', error);
    res.status(500).json({ error: 'Server error while starting stream.' });
  }
});

// @route   PUT /api/streams/:id/update
// @desc    Update stream metadata
// @access  Private (Stream owner only)
router.put('/:id/update', auth, async (req, res) => {
  try {
    req.model = Stream;
    await isOwner()(req, res, async () => {
      const { title, description, category, tags, isPublic } = req.body;
      const updates = {};

      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      if (isPublic !== undefined) updates.isPublic = isPublic;

      const updatedStream = await Stream.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      ).populate('user', 'username displayName avatar');

      res.json({
        message: 'Stream updated successfully',
        stream: updatedStream,
      });
    });
  } catch (error) {
    console.error('Update stream error:', error);
    res.status(500).json({ error: 'Server error while updating stream.' });
  }
});

// @route   POST /api/streams/:id/end
// @desc    End a live stream
// @access  Private (Stream owner only)
router.post('/:id/end', auth, async (req, res) => {
  try {
    req.model = Stream;
    await isOwner()(req, res, async () => {
      if (req.resource.status !== 'LIVE') {
        return res.status(400).json({ error: 'Stream is not live.' });
      }

      await req.resource.endStream();

      // Update user status
      await User.findByIdAndUpdate(req.user._id, { isLive: false });

      res.json({
        message: 'Stream ended successfully',
        stream: req.resource,
      });
    });
  } catch (error) {
    console.error('End stream error:', error);
    res.status(500).json({ error: 'Server error while ending stream.' });
  }
});

// @route   GET /api/streams/search
// @desc    Search streams by title, category, or tags
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, category, status = 'LIVE', page = 1, limit = 10 } = req.query;

    const query = { isPublic: true };

    if (status) query.status = status;
    if (category) query.category = category;
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    const streams = await Stream.find(query)
      .populate('user', 'username displayName avatar isLive')
      .sort({ startedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Stream.countDocuments(query);

    res.json({
      streams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalStreams: total,
        hasNextPage: parseInt(page) * parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error('Search streams error:', error);
    res.status(500).json({ error: 'Server error while searching streams.' });
  }
});

// @route   POST /api/streams/on-publish
// @desc    Webhook from media server when a stream starts
// @access  Internal
router.post('/on-publish', async (req, res) => {
  const { username } = req.body;
  console.log(`[Webhook] Received on-publish for username: ${username}`);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`[Webhook] User not found for username: ${username}`);
      return res.status(404).send('User not found');
    }

    // Use findOneAndUpdate with upsert to create or update the stream
    const stream = await Stream.findOneAndUpdate(
      { user: user._id, status: { $ne: 'FINISHED' } }, // Find a non-finished stream for this user
      {
        $set: {
          status: 'LIVE',
          startedAt: new Date(),
          title: `${user.displayName}'s Live Stream`,
          description: 'Live from OBS/Streaming Software',
          streamKey: user.streamKey,
          user: user._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(user._id, { isLive: true });

    console.log(
      `[Webhook] Stream ${stream._id} is now LIVE for user ${username}.`
    );
    res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook] on-publish error:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/streams/on-done
// @desc    Webhook from media server when a stream ends
// @access  Internal
router.post('/on-done', async (req, res) => {
  const { username } = req.body;
  console.log(`[Webhook] Received on-done for username: ${username}`);
  try {
    const user = await User.findOne({ username });
    if (!user) {
      console.error(`[Webhook] User not found for username: ${username}`);
      return res.status(404).send('User not found');
    }

    const stream = await Stream.findOneAndUpdate(
      { user: user._id, status: 'LIVE' },
      { $set: { status: 'FINISHED', endedAt: new Date() } }
    );

    await User.findByIdAndUpdate(user._id, { isLive: false });

    if (stream) {
      console.log(
        `[Webhook] Stream ${stream._id} is now FINISHED for user ${username}.`
      );
    } else {
      console.log(
        `[Webhook] No active stream found for user ${username} to mark as finished.`
      );
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook] on-done error:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/streams/validate-key
// @desc    Validate a stream key (used by media server)
// @access  Internal
router.post('/validate-key', async (req, res) => {
  const { streamKey } = req.body;
  console.log(`[Backend] Validating stream key: ${streamKey}`);

  if (!streamKey) {
    return res
      .status(400)
      .json({ valid: false, error: 'Stream key is required.' });
  }

  try {
    const user = await User.findOne({ streamKey });

    if (user) {
      console.log(`[Backend] Stream key is valid for user: ${user.username}`);
      res.json({ valid: true, username: user.username });
    } else {
      console.log(`[Backend] Invalid stream key: ${streamKey}`);
      res.status(404).json({ valid: false, error: 'Invalid stream key.' });
    }
  } catch (error) {
    console.error('[Backend] Error validating stream key:', error);
    res.status(500).json({ valid: false, error: 'Server error.' });
  }
});

module.exports = router;
