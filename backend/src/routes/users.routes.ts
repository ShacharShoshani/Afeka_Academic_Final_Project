import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const PUBLIC_USER_SELECT = {
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
} as const;

const CARE_TYPES = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'] as const;
const AVAILABILITY = ['mornings', 'afternoons', 'evenings', 'weekends'] as const;

// Accepts comma-separated values: ?careTypes=dogs,cats — splits, trims, validates each token.
const csvEnumArray = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((v) => v.trim()).filter(Boolean) : []))
    .pipe(z.array(z.enum(values)));

const listQuerySchema = z.object({
  role: z.enum(['owner', 'caretaker', 'admin']).optional(),
  careTypes: csvEnumArray(CARE_TYPES),
  availability: csvEnumArray(AVAILABILITY),
  residence: z.string().trim().min(1).max(100).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

// GET /api/users — public list (auth-gated). Excludes the caller and strips sensitive fields.
router.get('/', requireAuth, async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
    return;
  }

  const { role, careTypes, availability, residence } = parsed.data;
  const callerId = req.user!.id;

  const users = await prisma.user.findMany({
    where: {
      id: { not: callerId },
      ...(role ? { role } : {}),
      ...(careTypes.length ? { careTypes: { hasSome: careTypes } } : {}),
      ...(availability.length ? { availability: { hasSome: availability } } : {}),
      ...(residence ? { residence: { contains: residence, mode: 'insensitive' } } : {}),
    },
    select: PUBLIC_USER_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  res.json(users);
});

// GET /api/users/:id — single public profile (auth-gated).
router.get('/:id', requireAuth, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: PUBLIC_USER_SELECT,
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

// GET /api/users/:id/pets — pets belonging to user :id. Any authed user can read.
router.get('/:id/pets', requireAuth, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  const pets = await prisma.pet.findMany({
    where: { ownerId: parsed.data.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(pets);
});

// GET /api/users/:id/plants
router.get('/:id/plants', requireAuth, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  const plants = await prisma.plant.findMany({
    where: { ownerId: parsed.data.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(plants);
});

// GET /api/users/:id/strays — stray animals reported by user :id.
router.get('/:id/strays', requireAuth, async (req, res) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid user id' });
    return;
  }
  const strays = await prisma.strayAnimal.findMany({
    where: { reporterId: parsed.data.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(strays);
});

export { router as usersRouter };
