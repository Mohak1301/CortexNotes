import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config, assertProductionConfig } from './config.js';
import {
  errorHandler,
  notFound,
  rateLimit,
  requestContext,
} from './middleware/security.js';
import { requireAuth, requireCsrf } from './middleware/auth.js';
import { demoRateSubject } from './middleware/demo.js';

// Import routes
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import sourcesRoutes from "./routes/sourcesRoutes.js";
import authRoutes from './routes/authRoutes.js';
import conversationsRoutes from './routes/conversationsRoutes.js';

assertProductionConfig();
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(requestContext);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: config.nodeEnv === 'production' ? { maxAge: 31_536_000, includeSubDomains: true } : false,
}));

// CORS configuration for production
const allowedOrigins = new Set(config.frontendOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Non-browser clients still pass through API access controls below.
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(Object.assign(new Error('Origin is not allowed'), { status: 403 }));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: false, limit: '64kb', parameterLimit: 20 }));

// Health check endpoint for Render
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.use('/api', requireCsrf);
// Before any limiter, so demo visitors are counted one by one.
app.use('/api', demoRateSubject);
app.use('/api', rateLimit({ limit: config.generalRateLimit, name: 'general' }));
app.use("/api", chatRoutes);
app.use("/api", uploadRoutes);
app.use("/api/sources", sourcesRoutes);
app.use('/api/conversations', conversationsRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
});

server.requestTimeout = config.requestTimeoutMs + 5_000;
server.headersTimeout = Math.min(65_000, server.requestTimeout + 1_000);
server.keepAliveTimeout = 5_000;

const shutdown = (signal) => {
  console.log(`${signal} received; shutting down`);
  server.close((error) => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
