import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { authMiddleware, checkQueryLimit } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = crypto.randomBytes(64).toString('hex');
  
  return { accessToken, refreshToken };
};

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({ email, password });
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    await user.addRefreshToken(refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        queryCount: user.queryCount,
        queryLimit: user.queryLimit,
        lastQueryReset: user.lastQueryReset
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    
    // Save refresh token
    await user.addRefreshToken(refreshToken);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        queryCount: user.queryCount,
        queryLimit: user.queryLimit,
        lastQueryReset: user.lastQueryReset
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token route
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Find user with this refresh token
    const user = await User.findOne({ 'refreshTokens.token': refreshToken });
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if refresh token exists
    if (!user.hasRefreshToken(refreshToken)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        email: user.email,
        queryCount: user.queryCount,
        queryLimit: user.queryLimit,
        lastQueryReset: user.lastQueryReset
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Logout route
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await req.user.removeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Protected route example
router.get('/protected', authMiddleware, checkQueryLimit, async (req, res) => {
  try {
    // Increment query count
    await req.user.incrementQueryCount();

    res.json({
      message: 'Protected route accessed successfully',
      user: {
        id: req.user._id,
        email: req.user.email,
        queryCount: req.user.queryCount,
        queryLimit: req.user.queryLimit,
        lastQueryReset: req.user.lastQueryReset
      }
    });
  } catch (error) {
    console.error('Protected route error:', error);
    res.status(500).json({ error: 'Protected route access failed' });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        queryCount: req.user.queryCount,
        queryLimit: req.user.queryLimit,
        lastQueryReset: req.user.lastQueryReset,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

export default router;
