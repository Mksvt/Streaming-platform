const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['LIVE', 'PROCESSING', 'FINISHED', 'FAILED'],
    default: 'LIVE'
  },
  streamKey: {
    type: String,
    required: true
  },
  // RTMP stream info
  rtmpUrl: {
    type: String,
    default: null
  },
  // HLS playback URLs
  playbackUrl: {
    type: String,
    default: null
  },
  // VOD (Video on Demand) URLs after stream ends
  vodUrl: {
    type: String,
    default: null
  },
  // Local file paths for processing
  localFilePath: {
    type: String,
    default: null
  },
  // Stream metadata
  category: {
    type: String,
    default: 'Just Chatting'
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Stream statistics
  viewerCount: {
    type: Number,
    default: 0
  },
  peakViewers: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  // Processing info
  processingStatus: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  processingError: {
    type: String,
    default: null
  },
  // Thumbnail
  thumbnail: {
    type: String,
    default: null
  },
  // Privacy settings
  isPublic: {
    type: Boolean,
    default: true
  },
  // Stream start/end times
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
streamSchema.index({ user: 1, status: 1 });
streamSchema.index({ status: 1, createdAt: -1 });
streamSchema.index({ streamKey: 1 });

// Virtual for stream duration
streamSchema.virtual('durationFormatted').get(function() {
  if (!this.duration) return '0:00';
  
  const hours = Math.floor(this.duration / 3600);
  const minutes = Math.floor((this.duration % 3600) / 60);
  const seconds = this.duration % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for isLive
streamSchema.virtual('isLive').get(function() {
  return this.status === 'LIVE';
});

// Method to end stream
streamSchema.methods.endStream = function() {
  this.status = 'PROCESSING';
  this.endedAt = new Date();
  if (this.startedAt) {
    this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  }
  return this.save();
};

// Method to mark as finished
streamSchema.methods.markAsFinished = function(vodUrl) {
  this.status = 'FINISHED';
  this.vodUrl = vodUrl;
  this.processingStatus = 'COMPLETED';
  return this.save();
};

// Method to mark as failed
streamSchema.methods.markAsFailed = function(error) {
  this.status = 'FAILED';
  this.processingStatus = 'FAILED';
  this.processingError = error;
  return this.save();
};

// Ensure virtual fields are serialized
streamSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Stream', streamSchema);
