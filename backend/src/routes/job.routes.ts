import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createJobSchema, updateJobSchema } from '../validators/job.validators';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────────────────

function flattenJob(job: any) {
    const { pets, plants, strayAnimals, ...rest } = job;
    return {
        ...rest,
        pets: pets.map((p: any) => p.pet),
        plants: plants.map((p: any) => p.plant),
        strayAnimals: strayAnimals.map((s: any) => s.strayAnimal),
    };
}

const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    residence: true,
    role: true,
    bio: true,
    profilePhoto: true,
} as const;

const jobIncludes = {
    owner: { select: PUBLIC_USER_SELECT },
    caretaker: { select: PUBLIC_USER_SELECT },
    pets: { include: { pet: true } },
    plants: { include: { plant: true } },
    strayAnimals: { include: { strayAnimal: true } },
} as const;

/**
 * Validates that all supplied pet / plant / stray-animal IDs are owned by
 * (or reported by, for strays) the given user.
 *
 * Returns an error message string when validation fails, or null on success.
 */
async function validateAssociationOwnership(
    userId: string,
    petIds: string[],
    plantIds: string[],
    strayAnimalIds: string[],
): Promise<string | null> {
    if (petIds.length) {
        const owned = await prisma.pet.findMany({
            where: { id: { in: petIds }, ownerId: userId },
            select: { id: true },
        });
        if (owned.length !== petIds.length) {
            return 'One or more pets do not belong to you';
        }
    }

    if (plantIds.length) {
        const owned = await prisma.plant.findMany({
            where: { id: { in: plantIds }, ownerId: userId },
            select: { id: true },
        });
        if (owned.length !== plantIds.length) {
            return 'One or more plants do not belong to you';
        }
    }

    if (strayAnimalIds.length) {
        const owned = await prisma.strayAnimal.findMany({
            where: { id: { in: strayAnimalIds }, reporterId: userId },
            select: { id: true },
        });
        if (owned.length !== strayAnimalIds.length) {
            return 'One or more stray animals were not reported by you';
        }
    }

    return null;
}

// ── POST / — create a job ────────────────────────────────────────────────────

router.post('/', validate(createJobSchema), async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const {
        title,
        description,
        startDate,
        endDate,
        locationLat,
        locationLng,
        locationAddress,
        locationCity,
        locationCountry,
        paymentMethod,
        paymentAmount,
        paymentCurrency,
        paymentMethodList,
        currency,
        minPayment,
        maxPayment,
        isSwipeJob,
        services,
        estimatedHours,
        behaviorNotes,
        friendliness,
        petIds = [],
        plantIds = [],
        strayAnimalIds = [],
    } = req.body;

    const ownershipError = await validateAssociationOwnership(userId, petIds, plantIds, strayAnimalIds);
    if (ownershipError) {
        res.status(403).json({ error: ownershipError });
        return;
    }

    const job = await prisma.job.create({
        data: {
            ownerId: userId,
            title,
            description,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(),
            locationLat: locationLat ?? 0,
            locationLng: locationLng ?? 0,
            locationAddress: locationAddress ?? null,
            locationCity: locationCity ?? null,
            locationCountry: locationCountry ?? null,
            paymentMethod: paymentMethod ?? '',
            paymentAmount: paymentAmount ?? 0,
            paymentCurrency: paymentCurrency ?? 'ILS',
            paymentMethodList: paymentMethodList ?? [],
            currency: currency ?? 'ILS',
            minPayment: minPayment ?? null,
            maxPayment: maxPayment ?? null,
            isSwipeJob: isSwipeJob ?? false,
            services: services ?? [],
            estimatedHours: estimatedHours ?? null,
            behaviorNotes: behaviorNotes ?? null,
            friendliness: friendliness ?? null,
            status: 'pending',
            ...(petIds.length && {
                pets: { create: petIds.map((petId: string) => ({ petId })) },
            }),
            ...(plantIds.length && {
                plants: { create: plantIds.map((plantId: string) => ({ plantId })) },
            }),
            ...(strayAnimalIds.length && {
                strayAnimals: {
                    create: strayAnimalIds.map((strayAnimalId: string) => ({ strayAnimalId })),
                },
            }),
        },
        include: jobIncludes,
    });

    res.status(201).json({ message: 'Job created successfully', job: flattenJob(job) });
});

// ── GET / — list all jobs ────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
    const jobs = await prisma.job.findMany({ include: jobIncludes });
    res.json(jobs.map(flattenJob));
});

// ── GET /:id — single job ────────────────────────────────────────────────────

router.get('/:id', async (req, res) => {
    const jobId = req.params.id as string;
    const userId = req.user?.id;

    const job = await prisma.job.findUnique({ where: { id: jobId }, include: jobIncludes });
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    // Only participants (owner or caretaker) can view a confirmed/swipe-mode job.
    if (job.connectionId && userId !== job.ownerId && userId !== job.caretakerId) {
        res.status(403).json({ error: 'Not a participant in this job' });
        return;
    }

    res.json(flattenJob(job));
});

// ── PUT /:id — update a job ──────────────────────────────────────────────────

router.put('/:id', validate(updateJobSchema), async (req, res) => {
    const jobId = req.params.id as string;
    const userId = req.user?.id;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    // For swipe-confirmed jobs (connectionId set), both owner and caretaker can update.
    // For regular job-post-mode jobs, only the owner can update.
    const isParticipant = job.connectionId
        ? (userId === job.ownerId || userId === job.caretakerId)
        : userId === job.ownerId;

    if (!userId || !isParticipant) {
        res.status(403).json({ error: 'You do not have permission to update this job' });
        return;
    }

    const {
        petIds,
        plantIds,
        strayAnimalIds,
        startDate,
        endDate,
        ...scalarFields
    } = req.body as {
        petIds?: string[];
        plantIds?: string[];
        strayAnimalIds?: string[];
        startDate?: string;
        endDate?: string;
        [key: string]: unknown;
    };

    const ownershipError = await validateAssociationOwnership(
        userId,
        petIds ?? [],
        plantIds ?? [],
        strayAnimalIds ?? [],
    );
    if (ownershipError) {
        res.status(403).json({ error: ownershipError });
        return;
    }

    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: {
            ...scalarFields,
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            // Replace junction rows when IDs are explicitly supplied
            ...(petIds !== undefined && {
                pets: {
                    deleteMany: {},
                    create: petIds.map((petId: string) => ({ petId })),
                },
            }),
            ...(plantIds !== undefined && {
                plants: {
                    deleteMany: {},
                    create: plantIds.map((plantId: string) => ({ plantId })),
                },
            }),
            ...(strayAnimalIds !== undefined && {
                strayAnimals: {
                    deleteMany: {},
                    create: strayAnimalIds.map((strayAnimalId: string) => ({ strayAnimalId })),
                },
            }),
        },
        include: jobIncludes,
    });

    res.json({ message: 'Job updated successfully', job: flattenJob(updatedJob) });
});

// ── DELETE /:id — delete a job ───────────────────────────────────────────────

router.delete('/:id', async (req, res) => {
    const jobId = req.params.id as string;
    const userId = req.user?.id;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    if (!userId || userId !== job.ownerId) {
        res.status(403).json({ error: 'You can only delete your own jobs' });
        return;
    }

    // Remove junction rows first to avoid FK constraint violations
    await prisma.$transaction([
        prisma.petsPerJob.deleteMany({ where: { jobId } }),
        prisma.plantsPerJob.deleteMany({ where: { jobId } }),
        prisma.strayAnimalsPerJob.deleteMany({ where: { jobId } }),
        prisma.job.delete({ where: { id: jobId } }),
    ]);

    res.json({ message: 'Job deleted successfully' });
});

export { router as jobRouter };
