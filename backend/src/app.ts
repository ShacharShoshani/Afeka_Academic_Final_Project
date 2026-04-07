import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS — only allow the frontend origin
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing with size limit to prevent large-payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Routes
app.use('/api/health', healthRouter);

// Global error handler (must be registered last)
app.use(errorHandler);

export { app };
