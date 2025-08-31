const { Server } = require('socket.io');
const {
  getLiveStreams,
  addLiveStream,
  removeLiveStream,
} = require('./streamService');

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    try {
      const streams = await getLiveStreams();
      socket.emit('streams-updated', streams);
    } catch (error) {
      console.error('Error sending initial streams:', error);
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  console.log('Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}

async function broadcastStreamUpdate() {
  try {
    const streams = await getLiveStreams();
    getIO().emit('streams-updated', streams);
    console.log('Broadcasted stream updates to clients.');
  } catch (error) {
    console.error('Error broadcasting stream updates:', error);
  }
}

module.exports = { initSocket, getIO, broadcastStreamUpdate };
