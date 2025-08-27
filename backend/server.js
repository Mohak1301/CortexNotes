import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

// Import routes
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import sourcesRoutes from "./routes/sourcesRoutes.js";

dotenv.config();
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://cortex-notes-delta.vercel.app', // Your actual Vercel frontend URL
  'http://localhost:3000' // For local development
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Routes
app.use("/api", chatRoutes);
app.use("/api", uploadRoutes);
app.use("/api/sources", sourcesRoutes);

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});
