import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const CARE_TYPES = ['dogs', 'cats', 'birds', 'fish', 'rabbits', 'hamsters', 'reptiles', 'plants', 'stray_animals'] as const;
const SERVICES = ['feeding', 'walking', 'watering_plants', 'cleaning', 'stray_care', 'other'] as const;
const AVAILABILITY = ['mornings', 'afternoons', 'evenings', 'weekends'] as const;
const RATE_TYPES = ['hourly', 'daily', 'weekly'] as const;

// Fields used to create a fresh preference row for a user that has none yet.
const PREFERENCE_DEFAULTS = {
    careTypesWanted: [],
    services: [],
    availabilityWanted: [],
    canHostAtMine: false,
    canTravelToOther: false,
    workType: 'both' as const,
    paymentRateTypes: [],
    minPayment: null,
    maxPayment: null,
    maxDistanceKm: null,
    residenceFilter: null,
};

// GET /api/preferences — caller's matching preferences, lazily created with defaults.
router.get('/', async (req, res) => {
    const userId = req.user!.id;

    const preference = await prisma.matchPreference.upsert({
        where: { userId },
        create: { userId, ...PREFERENCE_DEFAULTS },
        update: {},
    });

    res.json(preference);
});

const updateSchema = z.object({
    careTypesWanted: z.array(z.enum(CARE_TYPES)),
    services: z.array(z.enum(SERVICES)),
    availabilityWanted: z.array(z.enum(AVAILABILITY)),
    canHostAtMine: z.boolean(),
    canTravelToOther: z.boolean(),
    workType: z.enum(['paid', 'volunteer', 'both']),
    paymentRateTypes: z.array(z.enum(RATE_TYPES)),
    minPayment: z.number().int().min(0).nullable(),
    maxPayment: z.number().int().min(0).nullable(),
    maxDistanceKm: z.number().int().min(0).nullable(),
    residenceFilter: z.string().trim().max(100).nullable(),
});

// PUT /api/preferences — upsert the caller's matching preferences.
router.put('/', validate(updateSchema), async (req, res) => {
    const userId = req.user!.id;
    const data = req.body as z.infer<typeof updateSchema>;

    const preference = await prisma.matchPreference.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
    });

    res.json(preference);
});

export { router as preferencesRouter };
