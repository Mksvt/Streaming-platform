const NodeMediaServer = require('node-media-server');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    mediaroot: './media',
    allow_origin: '*',
  },
  trans: {
    ffmpeg: process.env.FFMPEG_PATH || 'ffmpeg',
    tasks: [
      {
        app: 'live',
        hls: true,
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        hlsKeep: false,
      },
    ],
  },
  auth: {
    api: true,
    api_user: 'admin',
    api_pass: 'admin', 
  },
};

const nms = new NodeMediaServer(config);

nms.on('prePublish', async (id, StreamPath, args) => {
  const streamKey = StreamPath.split('/').pop();
  console.log(`[MediaServer] prePublish: Validating stream key: ${streamKey}`);

  try {
    const response = await axios.post(
      `${process.env.BACKEND_API_URL}/api/webhooks/on-publish`,
      { streamKey }
    );

    if (response.status === 200) {
      console.log(
        `[MediaServer] Stream key VALID for user: ${response.data.username}`
      );
      const session = nms.getSession(id);
      session.publishStreamPath = `/live/${response.data.username}`;
    } else {
      throw new Error('Invalid stream key from backend');
    }
  } catch (error) {
    console.error(
      `[MediaServer] Stream key validation FAILED for key ${streamKey}. Rejecting session.`,
      error.message
    );
    const session = nms.getSession(id);
    session.reject();
  }
});

nms.on('postPublish', async (id, StreamPath, args) => {
  const username = StreamPath.split('/').pop();
  console.log(
    `[MediaServer] postPublish: Stream started for user: ${username}`
  );
  try {
    await axios.post(`${process.env.BACKEND_API_URL}/api/webhooks/on-publish`, {
      username,
    });
    console.log(
      `[MediaServer] Notified backend that stream for ${username} is LIVE.`
    );
  } catch (error) {
    console.error(
      `[MediaServer] Error notifying backend of postPublish for ${username}:`,
      error.message
    );
  }
});

nms.on('donePublish', async (id, StreamPath, args) => {
  const username = StreamPath.split('/').pop();
  console.log(`[MediaServer] donePublish: Stream ended for user: ${username}`);
  try {
    await axios.post(`${process.env.BACKEND_API_URL}/api/webhooks/on-done`, {
      username,
    });
    console.log(
      `[MediaServer] Notified backend that stream for ${username} has FINISHED.`
    );
  } catch (error) {
    console.error(
      `[MediaServer] Error notifying backend of donePublish for ${username}:`,
      error.message
    );
  }
});

nms.run();

console.log(`[MediaServer] RTMP server listening on port ${config.rtmp.port}`);
console.log(`[MediaServer] HTTP server running on port ${config.http.port}`);
