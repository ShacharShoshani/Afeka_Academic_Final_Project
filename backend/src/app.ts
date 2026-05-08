import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Request logging
app.use(morgan('combined'));

// Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS — only allow the frontend origin
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Cookie parsing
app.use(cookieParser());

// Body parsing with size limit to prevent large-payload attacks
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Global error handler (must be registered last)
app.use(errorHandler);

export { app };
