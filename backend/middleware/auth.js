const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error during authentication.' });
  }
};

// Middleware to check if user is the owner of a resource
const isOwner = (resourceField = 'user') => {
  return async (req, res, next) => {
    try {
      const resource = await req.model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found.' });
      }

      if (resource[resourceField].toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied. Not the owner.' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      res.status(500).json({ error: 'Server error during ownership check.' });
    }
  };
};

// Middleware to check if user is a streamer
const isStreamer = async (req, res, next) => {
  if (!req.user.isStreamer) {
    return res.status(403).json({ error: 'Access denied. Streamer privileges required.' });
  }
  next();
};

// Middleware to check if user is live
const isLive = async (req, res, next) => {
  if (!req.user.isLive) {
    return res.status(400).json({ error: 'User is not currently live.' });
  }
  next();
};

// Middleware to verify webhook secret
const verifyWebhook = (req, res, next) => {
  const webhookSecret = req.headers['x-webhook-secret'];
  
  if (!webhookSecret || webhookSecret !== process.env.MEDIA_SERVER_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret.' });
  }
  
  next();
};

module.exports = {
  auth,
  isOwner,
  isStreamer,
  isLive,
  verifyWebhook
};
