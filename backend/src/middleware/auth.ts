import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'livin_token';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        residence: string;
        role: string;
        bio: string;
        dateOfBirth: string;
        careTypes: string[];
        availability: string[];
        profilePhoto: string;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
