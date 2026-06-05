import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const REPORT_CATEGORIES = [
    'harassment', 'unsafe_behavior', 'no_show', 'inappropriate_content',
    'abuse_neglect', 'scam', 'other',
] as const;

const REPORT_STATUSES = ['open', 'under_review', 'resolved', 'dismissed'] as const;

const createReportSchema = z.object({
    reportedId: z.string().uuid(),
    category: z.enum(REPORT_CATEGORIES),
    description: z.string().min(5).max(2000),
    connectionId: z.string().uuid().optional(),
});

const updateStatusSchema = z.object({
    status: z.enum(REPORT_STATUSES),
});

// POST /api/reports — file a report.
router.post('/', validate(createReportSchema), async (req, res) => {
    const reporterId = req.user!.id;
    const { reportedId, category, description, connectionId } = req.body as z.infer<typeof createReportSchema>;

    if (reporterId === reportedId) {
        res.status(400).json({ error: 'Cannot report yourself' });
        return;
    }

    const report = await prisma.report.create({
        data: { reporterId, reportedId, category, description, connectionId: connectionId ?? null },
    });

    res.status(201).json(report);
});

// GET /api/reports — admin only: list all reports.
router.get('/', async (req, res) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Admin only' });
        return;
    }

    const reports = await prisma.report.findMany({
        include: {
            reporter: { select: { id: true, name: true, email: true } },
            reported: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
});

// PATCH /api/reports/:id — admin only: update report status.
router.patch('/:id', validate(updateStatusSchema), async (req, res) => {
    if (req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Admin only' });
        return;
    }

    const id = req.params['id'] as string;
    const { status } = req.body as { status: string };

    const report = await prisma.report.update({
        where: { id },
        data: { status: status as any },
    });

    res.json(report);
});

export { router as reportRouter };
