import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/notifications — unread first, max 50.
router.get('/', async (req, res) => {
    const userId = req.user!.id;

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
            take: 50,
        }),
        prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
        notifications: notifications.map((n) => ({
            ...n,
            payload: JSON.parse(n.payloadJson),
        })),
        unreadCount,
    });
});

// PATCH /api/notifications/:id/read — mark one as read.
router.patch('/:id/read', async (req, res) => {
    const userId = req.user!.id;
    const id = req.params['id'] as string;

    await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
    });

    res.json({ ok: true });
});

// PATCH /api/notifications/read-all — mark all as read.
router.patch('/read-all', async (req, res) => {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });
    res.json({ ok: true });
});

export { router as notificationRouter };
