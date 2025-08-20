import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const checkQueryLimit = async (req, res, next) => {
  try {
    // Check and reset daily queries if it's a new day
    await req.user.checkAndResetDailyQueries();
    
    if (req.user.hasReachedLimit()) {
      return res.status(403).json({ 
        error: 'Daily query limit reached', 
        queryCount: req.user.queryCount,
        queryLimit: req.user.queryLimit,
        resetTime: req.user.lastQueryReset
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check query limit' });
  }
};


