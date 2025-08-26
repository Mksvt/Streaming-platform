const express = require('express');
const Stream = require('../models/Stream');
const User = require('../models/User');
const { auth, isOwner, isStreamer } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// @route   GET /api/streams/live
// @desc    Get all live streams
// @access  Public
router.get('/live', async (req, res) => {
  try {
    const liveStreams = await Stream.find({ 
      status: 'LIVE',
      isPublic: true 
    })
    .populate('user', 'username displayName avatar isLive')
    .sort({ startedAt: -1 });

    res.json({
      streams: liveStreams,
      count: liveStreams.length
    });
  } catch (error) {
    console.error('Get live streams error:', error);
    res.status(500).json({ error: 'Server error while fetching live streams.' });
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
      status: 'LIVE'
    }).populate('user', 'username displayName avatar isLive');

    if (!liveStream) {
      return res.status(404).json({ error: 'No live stream found for this user.' });
    }

    res.json({
      stream: liveStream
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
      sort: { endedAt: -1 }
    };

    const streams = await Stream.find({
      user: user._id,
      status: 'FINISHED',
      isPublic: true
    })
    .populate('user', 'username displayName avatar')
    .sort({ endedAt: -1 })
    .limit(options.limit)
    .skip((options.page - 1) * options.limit);

    const total = await Stream.countDocuments({
      user: user._id,
      status: 'FINISHED',
      isPublic: true
    });

    res.json({
      streams,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalStreams: total,
        hasNextPage: options.page * options.limit < total,
        hasPrevPage: options.page > 1
      }
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
    const stream = await Stream.findById(req.params.id)
      .populate('user', 'username displayName avatar isLive');

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found.' });
    }

    res.json({
      stream
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
      status: 'LIVE'
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
      rtmpUrl: `rtmp://${process.env.MEDIA_SERVER_URL || 'localhost'}:1935/live`,
      playbackUrl: `http://${process.env.MEDIA_SERVER_URL || 'localhost'}:8000/live/${req.user.streamKey}/index.m3u8`
    });

    await newStream.save();

    // Update user status
    await User.findByIdAndUpdate(req.user._id, { isLive: true });

    res.status(201).json({
      message: 'Stream started successfully',
      stream: newStream
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
        stream: updatedStream
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
        stream: req.resource
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
        { tags: { $in: [new RegExp(q, 'i')] } }
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
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Search streams error:', error);
    res.status(500).json({ error: 'Server error while searching streams.' });
  }
});

// Start streaming with test video
router.post('/start-test-stream', auth, async (req, res) => {
  try {
    console.log('🔐 Auth middleware passed, user:', req.user);
    console.log('📝 Request body:', req.body);
    
    const { title, description } = req.body;
    const userId = req.user.id;
    
    console.log('👤 User ID:', userId);
    console.log('📺 Title:', title);
    console.log('📝 Description:', description);

    // Create stream record
    console.log('📝 Creating Stream object...');
    
    // Generate a unique stream key for this test stream
    const streamKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔑 Generated stream key:', streamKey);
    
    const stream = new Stream({
      title: title || 'Test Stream',
      description: description || 'Automated test stream',
      user: userId,
      streamKey: streamKey,
      status: 'LIVE',
      startedAt: new Date()
    });

    console.log('💾 Stream object created:', stream);
    console.log('💾 Saving stream to database...');
    
    await stream.save();
    
    console.log('✅ Stream saved successfully, ID:', stream._id);

    // Start FFmpeg to generate HLS files directly
    console.log('🎬 Starting FFmpeg process...');
         console.log('🎬 HLS Output:', `../../media-server/media/live/${streamKey}/`);
    
    let ffmpegProcess = null;
    
    try {
                    // Create HLS output directory
       const hlsOutputDir = path.join(__dirname, '..', '..', 'media-server', 'media', 'live', streamKey);
       await fs.ensureDir(hlsOutputDir);
       console.log('📁 Created HLS output directory:', hlsOutputDir);
       
       const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
               ffmpegProcess = spawn(ffmpegPath, [
          '-re', // Read input at native frame rate
          '-f', 'lavfi', // Use lavfi input format
          '-i', 'testsrc=size=1280x720:rate=30', // Generate test pattern
          '-f', 'lavfi', 
          '-i', 'sine=frequency=1000:duration=0', // Generate test audio
          '-c:v', 'libx264', // Video codec
          '-preset', 'ultrafast', // Fast encoding
          '-tune', 'zerolatency', // Low latency
          '-c:a', 'aac', // Audio codec
          '-f', 'hls', // Output format: HLS
          '-hls_time', '2', // Segment duration (2 seconds) - швидше створення
          '-hls_list_size', '3', // Number of segments to keep - краща синхронізація
          '-hls_flags', 'delete_segments+omit_endlist', // Видаляти старі + не закривати плейлист
          '-hls_allow_cache', '0', // Не кешувати сегменти
          '-hls_segment_filename', `media-server/media/live/${streamKey}/%d.ts`, // Segment filename pattern - проста нумерація
          `media-server/media/live/${streamKey}/index.m3u8` // HLS playlist output
        ], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..', '..') // Set working directory to streaming-platform folder
      });
      
      console.log('✅ FFmpeg process started, PID:', ffmpegProcess.pid);
      
             // Wait for initial segments to be created before making stream available
       let segmentCount = 0;
               const requiredSegments = 3; // Потрібно 3 сегменти для стабільного відтворення
      
      // Handle FFmpeg process events
      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

             // Check for segments every 2 seconds
       const segmentCheckInterval = setInterval(async () => {
         try {
           const files = await fs.readdir(hlsOutputDir);
           const tsFiles = files.filter(file => file.endsWith('.ts'));
           
           if (tsFiles.length >= requiredSegments) {
             console.log(`🎯 Stream ready! Found ${tsFiles.length} segments`);
             clearInterval(segmentCheckInterval);
           }
         } catch (error) {
           console.log('⚠️ Error checking segments:', error.message);
         }
       }, 2000);
       
       ffmpegProcess.stderr.on('data', (data) => {
         console.log(`FFmpeg stderr: ${data}`);
       });

      ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`);
        // Update stream status when FFmpeg stops
        Stream.findByIdAndUpdate(stream._id, { 
          status: 'FINISHED', 
          endedAt: new Date() 
        });
      });
      
      // Handle FFmpeg spawn errors
      ffmpegProcess.on('error', (error) => {
        console.log('⚠️ FFmpeg process error:', error.message);
        console.log('⚠️ FFmpeg not available, continuing without video generation');
        ffmpegProcess = null; // Reset to null so we continue without FFmpeg
      });
      
    } catch (ffmpegError) {
      console.log('⚠️ FFmpeg not available, continuing without video generation');
      console.log('⚠️ FFmpeg error:', ffmpegError.message);
      ffmpegProcess = null;
    }

    // Store FFmpeg process for later termination (if available)
    if (ffmpegProcess) {
      console.log('💾 Storing FFmpeg process in stream...');
      stream.ffmpegProcess = ffmpegProcess;
      
      console.log('💾 Saving stream with FFmpeg process...');
      await stream.save();
      
      console.log('✅ Stream updated with FFmpeg process');
    } else {
      console.log('💾 No FFmpeg process to store, saving stream without it...');
      await stream.save();
      
      console.log('✅ Stream saved without FFmpeg process');
    }

    const response = {
      success: true,
      message: ffmpegProcess ? 'Test stream started with FFmpeg!' : 'Test stream started! (FFmpeg not available)',
      streamId: stream._id,
      streamKey: streamKey,
      rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
      hlsUrl: `http://localhost:8000/live/${streamKey}/index.m3u8`,
      ffmpegAvailable: !!ffmpegProcess,
      note: ffmpegProcess ? 'Video stream is being generated' : 'Stream created but no video content (FFmpeg required)'
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Error starting test stream:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    
    res.status(500).json({ 
      error: 'Failed to start test stream',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Stop streaming
router.post('/:id/stop', auth, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Stop FFmpeg process if it exists
    if (stream.ffmpegProcess) {
      stream.ffmpegProcess.kill('SIGTERM');
    }

    // Update stream status
    stream.status = 'FINISHED';
    stream.endedAt = new Date();
    await stream.save();

    res.json({ success: true, message: 'Stream stopped' });

  } catch (error) {
    console.error('Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream' });
  }
});

module.exports = router;
