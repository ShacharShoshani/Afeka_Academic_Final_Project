import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const COOKIE_NAME = 'livin_token';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function setCookie(res: import('express').Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.JWT_EXPIRES_IN * 1000, // Convert seconds to milliseconds
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { password, ...userData } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: userData.email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { ...userData, passwordHash },
  });

  const token = signToken(user.id);
  setCookie(res, token);

  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json(safeUser);
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = signToken(user.id);
  setCookie(res, token);

  const { passwordHash: _, ...safeUser } = user;
  res.json(safeUser);
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ message: 'Logged out' });
});

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/).regex(/[^A-Za-z0-9]/),
});

// POST /api/auth/forgot-password — generate reset token (dev mode: returns token directly).
router.post('/forgot-password', authLimiter, validate(forgotSchema), async (req, res) => {
  const { email } = req.body as { email: string };
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return 200 to avoid user enumeration.
  if (!user) {
    res.json({ message: 'If that email exists, a reset token has been generated.' });
    return;
  }

  const token = randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  // DEV MODE: return the token directly (no email provider configured).
  res.json({ message: 'Reset token generated.', token, note: 'In production this would be emailed.' });
});

// POST /api/auth/reset-password — validate token, hash new password, clear token.
router.post('/reset-password', authLimiter, validate(resetSchema), async (req, res) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };

  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ message: 'Password reset successfully' });
});

// POST /api/auth/change-password — change password for logged-in user.
router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) { res.status(401).json({ error: 'Current password is incorrect' }); return; }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  res.json({ message: 'Password changed successfully' });
});

export { router as authRouter };
