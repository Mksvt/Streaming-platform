const NodeMediaServer = require('node-media-server');
const path = require('path');
require('dotenv').config();

// Create media root directory
const mediaRoot = path.join(__dirname, 'media');

const config = {
  rtmp: {
    port: parseInt(process.env.RTMP_PORT) || 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: parseInt(process.env.HTTP_PORT) || 8000,
    mediaroot: mediaRoot,
    allow_origin: '*'
  },
  // Removed trans block to avoid 'version is not defined' error
};

const nms = new NodeMediaServer(config);

// Handle RTMP publish events
nms.on('prePublish', (id, StreamPath, args) => {
  console.log('🎬 [NodeEvent] prePublish:', StreamPath);
  
  // Extract stream key from path (e.g., /live/streamKey)
  const streamKey = StreamPath.split('/')[2];
  console.log('🔑 Stream key:', streamKey);
  
  if (streamKey) {
    console.log('🎥 RTMP stream started:', streamKey);
  }
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('✅ [NodeEvent] postPublish:', StreamPath);
  console.log('📺 Stream is now live');
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('⏹️ [NodeEvent] donePublish:', StreamPath);
  console.log('🔄 Stream ended');
});

nms.on('prePlay', (id, StreamPath, args) => {
  console.log('👀 [NodeEvent] prePlay:', StreamPath);
});

nms.on('postPlay', (id, StreamPath, args) => {
  console.log('🎮 [NodeEvent] postPlay:', StreamPath);
});

nms.on('donePlay', (id, StreamPath, args) => {
  console.log('👋 [NodeEvent] donePlay:', StreamPath);
});

nms.run();

console.log('🚀 Node Media Server started');
console.log(`📡 RTMP Server: rtmp://localhost:${config.rtmp.port}/live`);
console.log(`🌐 HTTP Server: http://localhost:${config.http.port}`);
console.log(`📁 Media Root: ${mediaRoot}`);
console.log('✅ RTMP streaming enabled (HLS will be handled by FFmpeg)');
