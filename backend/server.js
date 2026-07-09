import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import memberRoutes from './routes/memberRoutes.js';
import authRoutes from './routes/authRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Global error handler: catch synchronous uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('CRITICAL: Uncaught Exception thrown!');
  console.error(err?.stack || err?.message || err);
  
  // Uncaught exception means the application is in an unstable state. Exit quickly.
  setTimeout(() => process.exit(1), 1000).unref();
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    mongoose.connection.close().finally(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Validate required JWT secrets at startup
if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  console.error('FATAL: ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 6000;

// Trust reverse proxy for correct client IP in rate limiting
app.set('trust proxy', 1);

// Connect to Database
connectDB();

// Middleware
const corsOrigin = (process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || process.env.ORIGIN)
  ? (process.env.FRONTEND_ORIGIN || process.env.FRONTEND_URL || process.env.ORIGIN)
      .split(',')
      .map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser()); // Register cookie-parser to access HTTP-only cookies

// Request logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Centralized Error Handler (must be registered last)
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});

// Helper for graceful shutdown
const gracefulShutdown = (signal, exitCode = 0) => {
  console.log(`[SHUTDOWN] Received: ${signal}. Shutting down gracefully...`);
  
  // Set a backup timeout to force exit if closing takes too long
  setTimeout(() => {
    console.error('[SHUTDOWN] Forcefully shutting down because graceful shutdown timed out.');
    process.exit(exitCode);
  }, 4000).unref();

  if (server) {
    server.close(() => {
      console.log('[SHUTDOWN] Express HTTP server closed.');
      closeMongoose(exitCode);
    });
  } else {
    closeMongoose(exitCode);
  }
};

const closeMongoose = (exitCode) => {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    mongoose.connection.close()
      .then(() => {
        console.log('[SHUTDOWN] MongoDB connection closed.');
        process.exit(exitCode);
      })
      .catch((err) => {
        console.error('[SHUTDOWN] Error closing MongoDB connection:', err);
        process.exit(exitCode);
      });
  } else {
    process.exit(exitCode);
  }
};

// Process listeners for asynchronous rejections and system signals
process.on('unhandledRejection', (reason) => {
  console.error('CRITICAL: Unhandled Promise Rejection detected!');
  console.error(reason?.stack || reason?.message || reason);
  gracefulShutdown('unhandledRejection', 1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));
