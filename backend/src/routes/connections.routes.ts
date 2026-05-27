import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    bio: true,
    profilePhoto: true,
    residence: true,
    role: true,
    careTypes: true,
    availability: true,
    displayMode: true,
    dateOfBirth: true,
    createdAt: true,
    updatedAt: true,
} as const;

// GET /api/connections — list all connections the caller participates in.
router.get('/', async (req, res) => {
    const callerId = req.user!.id;

    const connections = await prisma.userConnection.findMany({
        where: {
            OR: [{ user1Id: callerId }, { user2Id: callerId }],
        },
        include: {
            user1: { select: PUBLIC_USER_SELECT },
            user2: { select: PUBLIC_USER_SELECT },
            messages: {
                orderBy: { sentAt: 'desc' },
                take: 1,
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const result = connections.map((c) => ({
        id: c.id,
        user1Id: c.user1Id,
        user2Id: c.user2Id,
        createdAt: c.createdAt,
        otherUser: c.user1Id === callerId ? c.user2 : c.user1,
        messages: c.messages,
    }));

    res.json(result);
});

// GET /api/connections/:id — single connection with all messages.
router.get('/:id', async (req, res) => {
    const callerId = req.user!.id;
    const id = req.params['id'] as string;

    const connection = await prisma.userConnection.findUnique({
        where: { id },
        include: {
            user1: { select: PUBLIC_USER_SELECT },
            user2: { select: PUBLIC_USER_SELECT },
            messages: { orderBy: { sentAt: 'asc' } },
        },
    });

    if (!connection) {
        res.status(404).json({ error: 'Connection not found' });
        return;
    }

    if (connection.user1Id !== callerId && connection.user2Id !== callerId) {
        res.status(403).json({ error: 'Not a participant in this connection' });
        return;
    }

    res.json({
        id: connection.id,
        user1Id: connection.user1Id,
        user2Id: connection.user2Id,
        createdAt: connection.createdAt,
        otherUser: connection.user1Id === callerId ? connection.user2 : connection.user1,
        messages: connection.messages,
    });
});

const sendMessageSchema = z.object({
    content: z.string().min(1),
});

// POST /api/connections/:id/messages — send a message in a connection.
router.post('/:id/messages', validate(sendMessageSchema), async (req, res) => {
    const callerId = req.user!.id;
    const id = req.params['id'] as string;
    const { content } = req.body as { content: string };

    const connection = await prisma.userConnection.findUnique({ where: { id } });

    if (!connection) {
        res.status(404).json({ error: 'Connection not found' });
        return;
    }

    if (connection.user1Id !== callerId && connection.user2Id !== callerId) {
        res.status(403).json({ error: 'Not a participant in this connection' });
        return;
    }

    const message = await prisma.connectionMessage.create({
        data: { connectionId: id, senderId: callerId, content },
    });

    res.status(201).json(message);
});

export { router as connectionsRouter };
