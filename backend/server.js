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
  origin: 'https://cortex-notes-delta.vercel.app', 
  credentials: true
}));

app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;


mongoose.connect(mongoURI, {// Explicitly specify database name
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    // Connected to MongoDB Atlas
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);
app.use("/api", uploadRoutes);
app.use("/api/sources", sourcesRoutes);


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  // Server running on port ${PORT}
});
