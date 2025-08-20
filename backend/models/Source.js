import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PDF', 'TEXT', 'URL'],
    required: true
  },
  size: {
    type: Number,
    default: 0
  },
  originalFilename: {
    type: String,
    default: null
  },
  sourceUrl: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
sourceSchema.index({ userId: 1, uploadedAt: -1 });

const Source = mongoose.model('Source', sourceSchema);

export default Source;
