import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  queryCount: {
    type: Number,
    default: 0
  },
  queryLimit: {
    type: Number,
    default: 20
  },
  lastQueryReset: {
    type: Date,
    default: Date.now
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7 * 24 * 60 * 60 // 7 days
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to increment query count
userSchema.methods.incrementQueryCount = async function() {
  this.queryCount += 1;
  return await this.save();
};

// Method to check if user has reached query limit
userSchema.methods.hasReachedLimit = function() {
  return this.queryCount >= this.queryLimit;
};

// Method to check and reset daily query count
userSchema.methods.checkAndResetDailyQueries = async function() {
  const now = new Date();
  const lastReset = new Date(this.lastQueryReset);
  
  // Check if it's a new day (different date)
  if (now.toDateString() !== lastReset.toDateString()) {
    this.queryCount = 0;
    this.lastQueryReset = now;
    await this.save();
  }
};


userSchema.methods.addRefreshToken = async function(token) {
  this.refreshTokens.push({ token });
  return await this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
  return await this.save();
};


userSchema.methods.hasRefreshToken = function(token) {
  return this.refreshTokens.some(rt => rt.token === token);
};

const User = mongoose.model('User', userSchema);

export default User;
