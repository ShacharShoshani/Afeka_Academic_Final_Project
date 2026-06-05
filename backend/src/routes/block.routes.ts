import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const blockSchema = z.object({ blockedId: z.string().uuid() });

// POST /api/blocks — block a user.
router.post('/', validate(blockSchema), async (req, res) => {
    const blockerId = req.user!.id;
    const { blockedId } = req.body as { blockedId: string };

    if (blockerId === blockedId) {
        res.status(400).json({ error: 'Cannot block yourself' });
        return;
    }

    await prisma.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
    });

    res.status(201).json({ message: 'User blocked' });
});

// DELETE /api/blocks/:blockedId — unblock.
router.delete('/:blockedId', async (req, res) => {
    const blockerId = req.user!.id;
    const blockedId = req.params['blockedId'] as string;

    await prisma.blockedUser.deleteMany({ where: { blockerId, blockedId } });
    res.json({ message: 'User unblocked' });
});

// GET /api/blocks — caller's list of blocked user IDs.
router.get('/', async (req, res) => {
    const blockerId = req.user!.id;
    const blocks = await prisma.blockedUser.findMany({
        where: { blockerId },
        select: { blockedId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(blocks);
});

export { router as blockRouter };
