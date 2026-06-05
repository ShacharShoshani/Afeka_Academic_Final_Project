import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { petsRouter } from './routes/pets.routes.js';
import { plantsRouter } from './routes/plants.routes.js';
import { strayAnimalsRouter } from './routes/stray-animals.routes.js';
import { jobRouter } from './routes/job.routes.js';
import { swipeRouter } from './routes/swipe.routes.js';
import { connectionsRouter } from './routes/connections.routes.js';
import { preferencesRouter } from './routes/preferences.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { blockRouter } from './routes/block.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';

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

// Body parsing with size limit to prevent large-payload attacks.
// Profile photos are sent inline as base64 data URLs, which inflate the payload
// by ~33%, so the limit must accommodate the frontend's 5 MB image cap.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/pets', requireAuth, petsRouter);
app.use('/api/plants', requireAuth, plantsRouter);
app.use('/api/stray-animals', requireAuth, strayAnimalsRouter);
app.use('/api/jobs', requireAuth, jobRouter);
app.use('/api/swipe', requireAuth, swipeRouter);
app.use('/api/connections', requireAuth, connectionsRouter);
app.use('/api/preferences', requireAuth, preferencesRouter);
app.use('/api/reviews', requireAuth, reviewRouter);
app.use('/api/blocks', requireAuth, blockRouter);
app.use('/api/reports', requireAuth, reportRouter);
app.use('/api/notifications', requireAuth, notificationRouter);

// Global error handler (must be registered last)
app.use(errorHandler);

export { app };
