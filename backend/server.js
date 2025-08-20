import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import helmet from "helmet";

// Import routes
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import authRoutes from "./routes/auth.js";
import sourcesRoutes from "./routes/sourcesRoutes.js";

dotenv.config();
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Update with your frontend URL
  credentials: true
}));

app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
console.log('Connecting to MongoDB with URI:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Log URI without credentials

mongoose.connect(mongoURI, {// Explicitly specify database name
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", uploadRoutes);
app.use("/api/sources", sourcesRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
