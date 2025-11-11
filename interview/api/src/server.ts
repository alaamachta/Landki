import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRouter from './routes/chat.js';
import feedbackRouter from './routes/feedback.js';
import speechRouter from './routes/speech.js';
import healthRouter from './routes/health.js';
import adminRouter from './routes/admin.js';
import { logger } from './utils/logger.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Look for .env in parent directory (interview root)
const envPath = path.resolve(__dirname, '../../.env');
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.error('Failed to load .env file:', envResult.error);
  console.error('Tried path:', envPath);
}

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
// Restrict to production domain only for security
const ALLOWED_ORIGINS = ['https://landki.com'];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // server-to-server/no origin
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    logger.warn('CORS blocked origin', { origin });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Admin-Token'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Routes
app.use('/api/chat', chatRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/admin', adminRouter);
app.use('/api', speechRouter);
app.use('/api', healthRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  logger.info(`Interview API server running on http://127.0.0.1:${PORT}`, {
    version: '1.0.0',
    nodeVersion: process.version,
    env: process.env.NODE_ENV || 'development',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});
