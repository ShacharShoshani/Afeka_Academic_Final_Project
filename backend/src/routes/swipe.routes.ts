import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const PUBLIC_SWIPE_SELECT = {
    id: true,
    name: true,
    bio: true,
    profilePhoto: true,
    careTypes: true,
    availability: true,
    residence: true,
    role: true,
    displayMode: true,
    dateOfBirth: true,
    createdAt: true,
    updatedAt: true,
} as const;

// GET /api/swipe/deck — return up to 10 unseen profiles with the complementary role.
router.get('/deck', async (req, res) => {
    const caller = req.user!;
    const complementaryRole = caller.role === 'owner' ? 'caretaker' : 'owner';

    const alreadySwiped = await prisma.userInterest.findMany({
        where: { fromUserId: caller.id },
        select: { toUserId: true },
    });
    const swipedIds = alreadySwiped.map((r) => r.toUserId);

    const deck = await prisma.user.findMany({
        where: {
            role: complementaryRole,
            id: { notIn: [caller.id, ...swipedIds] },
        },
        select: PUBLIC_SWIPE_SELECT,
        take: 10,
        orderBy: { createdAt: 'desc' },
    });

    res.json(deck);
});

const swipeBodySchema = z.object({
    toUserId: z.string().uuid(),
    liked: z.boolean(),
});

// POST /api/swipe — record an interest; detect mutual like and create a connection.
router.post('/', validate(swipeBodySchema), async (req, res) => {
    const callerId = req.user!.id;
    const { toUserId, liked } = req.body as { toUserId: string; liked: boolean };

    if (callerId === toUserId) {
        res.status(400).json({ error: 'Cannot swipe on yourself' });
        return;
    }

    await prisma.userInterest.upsert({
        where: { fromUserId_toUserId: { fromUserId: callerId, toUserId } },
        create: { fromUserId: callerId, toUserId, liked },
        update: { liked },
    });

    if (!liked) {
        res.json({ matched: false });
        return;
    }

    const reciprocal = await prisma.userInterest.findUnique({
        where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: callerId } },
    });

    if (!reciprocal?.liked) {
        res.json({ matched: false });
        return;
    }

    // Mutual like — ensure user1Id < user2Id to satisfy the @@unique constraint.
    const [user1Id, user2Id] = [callerId, toUserId].sort();

    const connection = await prisma.userConnection.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: {},
    });

    res.json({ matched: true, connectionId: connection.id });
});

export { router as swipeRouter };
