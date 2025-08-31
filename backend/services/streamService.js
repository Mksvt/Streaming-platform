const { redisClient } = require('../config/redis');
const User = require('../models/User');

const LIVE_STREAMS_KEY = 'live_streams';

async function getLiveStreams() {
  try {
    const streamsJson = await redisClient.get(LIVE_STREAMS_KEY);
    return streamsJson ? JSON.parse(streamsJson) : [];
  } catch (error) {
    console.error('Error getting streams from Redis:', error);
    return [];
  }
}

async function addLiveStream(streamKey) {
  try {
    const user = await User.findOne({ streamKey });
    if (!user) {
      console.warn(
        `Attempted to add a stream for a user that doesn't exist. Key: ${streamKey}`
      );
      return;
    }

    const streams = await getLiveStreams();

    // Avoid duplicates
    if (streams.some((stream) => stream.username === user.username)) {
      console.log(`Stream for ${user.username} is already in the live list.`);
      return;
    }

    const newStream = {
      username: user.username,
      displayName: user.displayName,
      streamKey: user.streamKey, // For constructing the URL on the frontend
      isLive: true,
      startTime: new Date().toISOString(),
    };

    streams.push(newStream);
    await redisClient.set(LIVE_STREAMS_KEY, JSON.stringify(streams));
    console.log(`Stream added to Redis: ${user.username}`);
  } catch (error) {
    console.error('Error adding stream to Redis:', error);
  }
}

async function removeLiveStream(streamKey) {
  try {
    let streams = await getLiveStreams();
    const initialCount = streams.length;

    streams = streams.filter((stream) => stream.streamKey !== streamKey);

    if (streams.length < initialCount) {
      await redisClient.set(LIVE_STREAMS_KEY, JSON.stringify(streams));
      console.log(`Stream removed from Redis. Key: ${streamKey}`);
    } else {
      console.warn(
        `Attempted to remove a stream that was not in the live list. Key: ${streamKey}`
      );
    }
  } catch (error) {
    console.error('Error removing stream from Redis:', error);
  }
}

module.exports = {
  getLiveStreams,
  addLiveStream,
  removeLiveStream,
};
