const express = require('express');
const User = require('../models/User');
const {
  addLiveStream,
  removeLiveStream,
} = require('../services/streamService');
const { broadcastStreamUpdate } = require('../services/socket');

const router = express.Router();

// This webhook is called by Node-Media-Server when a stream starts publishing
router.post('/on-publish', async (req, res) => {
  // In node-media-server's config, the stream key is passed as 'name'
  const { name: streamKey } = req.body;
  console.log(`[Webhook] on-publish received for stream key: ${streamKey}`);

  if (!streamKey) {
    console.log('[Webhook] on-publish rejected: No stream key provided.');
    return res.status(400).send('No stream key provided');
  }

  try {
    // We only authorize users who are designated streamers
    const user = await User.findOne({ streamKey, isStreamer: true });

    if (!user) {
      console.log(
        `[Webhook] on-publish rejected: Invalid stream key: ${streamKey}`
      );
      // Returning 404 tells node-media-server to reject the connection
      return res.status(404).send('Invalid stream key');
    }

    // Update user status in the main database
    user.isLive = true;
    await user.save();

    // Add the stream to our live list in Redis and notify clients via WebSocket
    await addLiveStream(streamKey);
    await broadcastStreamUpdate();

    console.log(`[Webhook] User ${user.username} is now live.`);
    res.status(200).send('Stream started successfully');
  } catch (error) {
    console.error('[Webhook] on-publish error:', error);
    res.status(500).send('Server error during on-publish');
  }
});

// This webhook is called by Node-Media-Server when a stream stops publishing
router.post('/on-done', async (req, res) => {
  const { name: streamKey } = req.body;
  console.log(`[Webhook] on-done received for stream key: ${streamKey}`);

  if (!streamKey) {
    console.log('[Webhook] on-done: No stream key provided.');
    return res.status(400).send('No stream key provided');
  }

  try {
    const user = await User.findOne({ streamKey });

    if (user) {
      // Update user status in the main database
      user.isLive = false;
      await user.save();
      console.log(`[Webhook] User ${user.username} is no longer live.`);
    } else {
      // This can happen if the user was deleted while streaming
      console.warn(
        `[Webhook] on-done: User not found for stream key ${streamKey}, proceeding to remove from Redis.`
      );
    }

    // Remove the stream from our live list in Redis and notify clients
    await removeLiveStream(streamKey);
    await broadcastStreamUpdate();

    res.status(200).send('Stream stopped successfully');
  } catch (error) {
    console.error('[Webhook] on-done error:', error);
    res.status(500).send('Server error during on-done');
  }
});

module.exports = router;
