import { Router } from 'express';
import { validate } from '../middleware/validate';
import { createJobSchema, jobFilterSchema, updateJobSchema } from '../validators/job.validators';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.post('/', validate(createJobSchema), async (req, res) => {
    const jobData = req.body;

    const owner = await prisma.user.findUnique({ where: { id: jobData.ownerId } });
    if (!owner) {
        res.status(400).json({ error: 'Invalid ownerId' });
        return;
    }

    const isOwner = req.user && req.user.id === jobData.ownerId;
    if (!isOwner) {
        res.status(403).json({ error: 'You can only create jobs for yourself' });
        return;
    }

    const job = await prisma.job.create({
        data: {
            ...jobData,
            status: "open",
        },
    });

    res.status(201).json({ message: 'Job created successfully', job });
});

router.get('/', async (req, res) => {
    const jobs = await prisma.job.findMany({
        include: {
            owner: true,
            caretaker: true,
            pets: { include: { pet: true } },
            plants: { include: { plant: true } },
            strayAnimals: { include: { strayAnimal: true } },
        },
    });

    const flatJobs = jobs.map(({ pets, plants, strayAnimals, ...job }) => ({
        ...job,
        pets: pets.map((p) => p.pet),
        plants: plants.map((p) => p.plant),
        strayAnimals: strayAnimals.map((s) => s.strayAnimal),
    }));

    res.json(flatJobs);
});

router.put('/:id', validate(updateJobSchema), async (req, res) => {
    const jobId = req.params.id as string;
    const updateData = req.body;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    const isOwner = req.user && req.user.id === job.ownerId;
    if (!isOwner) {
        res.status(403).json({ error: 'You can only update your own jobs' });
        return;
    }

    const updatedJob = await prisma.job.update({
        where: { id: jobId },
        data: updateData,
    });

    res.json({ message: 'Job updated successfully', job: updatedJob });
});

router.delete('/:id', async (req, res) => {
    const jobId = req.params.id as string;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    const isOwner = req.user && req.user.id === job.ownerId;
    if (!isOwner) {
        res.status(403).json({ error: 'You can only delete your own jobs' });
        return;
    }

    await prisma.job.delete({ where: { id: jobId } });

    res.json({ message: 'Job deleted successfully' });
});

export { router as jobRouter };