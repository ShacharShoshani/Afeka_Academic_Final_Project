import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const listQuerySchema = z.object({
  role: z.enum(['owner', 'caretaker', 'admin']).optional(),
});

// GET /api/users — public list (auth-gated). Excludes the caller and strips sensitive fields.
router.get('/', requireAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
    return;
  }

  const { role } = parsed.data;
  const callerId = req.user!.id;

  const users = await prisma.user.findMany({
    where: {
      id: { not: callerId },
      ...(role ? { role } : {}),
    },
    select: {
      id: true,
      name: true,
      residence: true,
      role: true,
      bio: true,
      dateOfBirth: true,
      careTypes: true,
      availability: true,
      profilePhoto: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
});

export { router as usersRouter };
