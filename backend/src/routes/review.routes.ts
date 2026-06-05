import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { createNotification } from '../lib/notify.js';

const router = Router();

const REVIEWER_SELECT = {
    id: true,
    name: true,
    profilePhoto: true,
} as const;

const createReviewSchema = z.object({
    jobId: z.string().uuid(),
    targetId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional().default(''),
});

// POST /api/reviews — leave a review for the other participant of a completed job.
router.post('/', validate(createReviewSchema), async (req, res) => {
    const reviewerId = req.user!.id;
    const { jobId, targetId, rating, comment } = req.body as z.infer<typeof createReviewSchema>;

    if (reviewerId === targetId) {
        res.status(400).json({ error: 'Cannot review yourself' });
        return;
    }

    // Verify job exists, is completed, and caller is a participant.
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { ownerId: true, caretakerId: true, status: true },
    });

    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    if (job.status !== 'completed') {
        res.status(403).json({ error: 'Can only review completed jobs' });
        return;
    }

    const participants = [job.ownerId, job.caretakerId].filter(Boolean) as string[];
    if (!participants.includes(reviewerId) || !participants.includes(targetId)) {
        res.status(403).json({ error: 'Both reviewer and target must be job participants' });
        return;
    }

    // Prevent duplicate review.
    const existing = await prisma.review.findUnique({
        where: { jobId_reviewerId: { jobId, reviewerId } },
    });
    if (existing) {
        res.status(409).json({ error: 'You have already reviewed this job' });
        return;
    }

    const review = await prisma.review.create({
        data: { jobId, reviewerId, targetId, rating, comment },
        include: { reviewer: { select: REVIEWER_SELECT } },
    });

    // Recalculate the target's average rating.
    const agg = await prisma.review.aggregate({
        where: { targetId },
        _avg: { rating: true },
        _count: { rating: true },
    });

    await prisma.user.update({
        where: { id: targetId },
        data: {
            averageRating: agg._avg.rating ?? 0,
            reviewCount: agg._count.rating,
        },
    });

    void createNotification(targetId, 'review_request', {
        reviewerName: req.user!.name,
        rating,
        jobId,
    });

    res.status(201).json(review);
});

// GET /api/reviews/user/:userId — public reviews received by a user.
router.get('/user/:userId', async (req, res) => {
    const { userId } = req.params as { userId: string };

    const reviews = await prisma.review.findMany({
        where: { targetId: userId },
        include: { reviewer: { select: REVIEWER_SELECT } },
        orderBy: { createdAt: 'desc' },
    });

    res.json(reviews);
});

// GET /api/reviews/job/:jobId — reviews for a specific job.
router.get('/job/:jobId', async (req, res) => {
    const callerId = req.user!.id;
    const { jobId } = req.params as { jobId: string };

    const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { ownerId: true, caretakerId: true },
    });

    if (!job) {
        res.status(404).json({ error: 'Job not found' });
        return;
    }

    const reviews = await prisma.review.findMany({
        where: { jobId },
        include: { reviewer: { select: REVIEWER_SELECT } },
        orderBy: { createdAt: 'desc' },
    });

    // Also tell the caller whether they have already reviewed.
    const myReview = reviews.find((r) => r.reviewerId === callerId) ?? null;

    res.json({ reviews, myReview });
});

export { router as reviewRouter };
