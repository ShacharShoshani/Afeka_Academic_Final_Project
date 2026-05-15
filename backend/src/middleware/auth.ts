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

export function ownershipGuard(model: 'pet' | 'plant' | 'strayAnimal') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    try {
      let ownerId: string | null = null;

      if (model === 'pet') {
        const record = await prisma.pet.findUnique({ where: { id }, select: { ownerId: true } });
        ownerId = record?.ownerId ?? null;
      } else if (model === 'plant') {
        const record = await prisma.plant.findUnique({ where: { id }, select: { ownerId: true } });
        ownerId = record?.ownerId ?? null;
      } else {
        const record = await prisma.strayAnimal.findUnique({ where: { id }, select: { reporterId: true } });
        ownerId = record?.reporterId ?? null;
      }

      if (ownerId === null) {
        res.status(404).json({ error: 'Not found' });
        return;
      }

      if (ownerId !== userId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}