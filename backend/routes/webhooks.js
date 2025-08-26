const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const Stream = require('../models/Stream');
const User = require('../models/User');
const { verifyWebhook } = require('../middleware/auth');

const router = express.Router();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Helper function to get stream key from stream path
function getStreamKeyFromStreamPath(streamPath) {
  const parts = streamPath.split('/');
  return parts[parts.length - 1];
}

// @route   POST /api/webhooks/live-start
// @desc    Webhook called when stream starts
// @access  Media Server only
router.post('/live-start', verifyWebhook, async (req, res) => {
  try {
    const { streamKey } = req.body;
    
    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key is required' });
    }

    console.log(`🎬 Stream started: ${streamKey}`);

    // Find user by stream key
    const user = await User.findOne({ streamKey });
    if (!user) {
      console.error(`❌ User not found for stream key: ${streamKey}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if stream already exists
    let stream = await Stream.findOne({
      user: user._id,
      status: 'LIVE'
    });

    if (!stream) {
      // Create new stream if it doesn't exist
      stream = new Stream({
        title: `${user.displayName}'s Live Stream`,
        user: user._id,
        streamKey: streamKey,
        status: 'LIVE',
        rtmpUrl: `rtmp://${process.env.MEDIA_SERVER_URL || 'localhost'}:1935/live`,
        playbackUrl: `http://${process.env.MEDIA_SERVER_URL || 'localhost'}:8000/live/${streamKey}/index.m3u8`,
        localFilePath: path.join(__dirname, `../../media-server/media/live/${streamKey}.flv`)
      });
      await stream.save();
    }

    // Update user status
    await User.findByIdAndUpdate(user._id, { isLive: true });

    console.log(`✅ Stream started successfully for user: ${user.username}`);

    res.status(200).json({ 
      message: 'Stream start webhook processed successfully',
      streamId: stream._id
    });
  } catch (error) {
    console.error('❌ Live start webhook error:', error);
    res.status(500).json({ error: 'Server error processing live start webhook' });
  }
});

// @route   POST /api/webhooks/live-end
// @desc    Webhook called when stream ends
// @access  Media Server only
router.post('/live-end', verifyWebhook, async (req, res) => {
  try {
    const { streamKey } = req.body;
    
    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key is required' });
    }

    console.log(`🛑 Stream ended: ${streamKey}`);

    // Find the live stream
    const stream = await Stream.findOne({
      streamKey: streamKey,
      status: 'LIVE'
    }).populate('user');

    if (!stream) {
      console.error(`❌ Live stream not found for stream key: ${streamKey}`);
      return res.status(404).json({ error: 'Live stream not found' });
    }

    // Mark stream as processing
    stream.status = 'PROCESSING';
    stream.endedAt = new Date();
    if (stream.startedAt) {
      stream.duration = Math.floor((stream.endedAt - stream.startedAt) / 1000);
    }
    await stream.save();

    // Update user status
    await User.findByIdAndUpdate(stream.user._id, { isLive: false });

    // Respond immediately to avoid blocking the media server
    res.status(200).json({ 
      message: 'Stream end webhook processed successfully',
      streamId: stream._id
    });

    // Process video in background
    processVideoInBackground(stream, streamKey);

  } catch (error) {
    console.error('❌ Live end webhook error:', error);
    res.status(500).json({ error: 'Server error processing live end webhook' });
  }
});

// Background video processing function
async function processVideoInBackground(stream, streamKey) {
  try {
    console.log(`🔄 Starting video processing for stream: ${stream._id}`);

    const inputPath = path.join(__dirname, `../../media-server/media/live/${streamKey}.flv`);
    const outputFilename = `${stream._id}.mp4`;
    const outputPath = path.join(__dirname, `../../media-server/media/processed/${outputFilename}`);

    // Ensure processed directory exists
    const processedDir = path.dirname(outputPath);
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Input file not found: ${inputPath}`);
      await stream.markAsFailed('Input video file not found');
      return;
    }

    // Convert video using FFmpeg
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -c:a aac -preset fast -crf 23 "${outputPath}"`;

    exec(ffmpegCommand, async (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ FFmpeg error: ${error.message}`);
        await stream.markAsFailed(`FFmpeg processing failed: ${error.message}`);
        return;
      }

      console.log(`✅ Video processing completed: ${outputFilename}`);

      // Upload to S3
      try {
        const fileContent = fs.readFileSync(outputPath);
        const s3Params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: `videos/${outputFilename}`,
          Body: fileContent,
          ContentType: 'video/mp4',
          ACL: 'public-read'
        };

        const uploadResult = await s3.upload(s3Params).promise();
        console.log(`✅ Video uploaded to S3: ${uploadResult.Location}`);

        // Mark stream as finished
        await stream.markAsFinished(uploadResult.Location);

        // Clean up local files
        try {
          fs.unlinkSync(inputPath);
          fs.unlinkSync(outputPath);
          console.log(`🧹 Local files cleaned up`);
        } catch (cleanupError) {
          console.warn(`⚠️ Warning: Could not clean up local files: ${cleanupError.message}`);
        }

        console.log(`🎉 Stream processing completed successfully: ${stream._id}`);

      } catch (s3Error) {
        console.error(`❌ S3 upload error: ${s3Error.message}`);
        await stream.markAsFailed(`S3 upload failed: ${s3Error.message}`);
      }
    });

  } catch (error) {
    console.error(`❌ Video processing error: ${error.message}`);
    await stream.markAsFailed(`Video processing failed: ${error.message}`);
  }
}

// @route   POST /api/webhooks/stream-error
// @desc    Webhook called when stream encounters an error
// @access  Media Server only
router.post('/stream-error', verifyWebhook, async (req, res) => {
  try {
    const { streamKey, error: errorMessage } = req.body;
    
    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key is required' });
    }

    console.log(`❌ Stream error: ${streamKey} - ${errorMessage}`);

    // Find the stream and mark it as failed
    const stream = await Stream.findOne({ streamKey });
    if (stream) {
      await stream.markAsFailed(errorMessage || 'Unknown error occurred');
    }

    // Update user status
    const user = await User.findOne({ streamKey });
    if (user) {
      await User.findByIdAndUpdate(user._id, { isLive: false });
    }

    res.status(200).json({ message: 'Stream error webhook processed successfully' });
  } catch (error) {
    console.error('❌ Stream error webhook error:', error);
    res.status(500).json({ error: 'Server error processing stream error webhook' });
  }
});

// @route   GET /api/webhooks/health
// @desc    Health check for webhooks
// @access  Public
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is healthy'
  });
});

module.exports = router;
