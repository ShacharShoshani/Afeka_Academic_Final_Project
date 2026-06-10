import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { emitToUser } from '../socket/socket.js';
import { createNotification } from '../lib/notify.js';
import { validateImageDataUrl, imageErrorMessage } from '../lib/validateImage.js';
import { PUBLIC_USER_SELECT } from '../lib/selectors.js';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeConnection(c: any, callerId: string) {
    return {
        id: c.id,
        user1Id: c.user1Id,
        user2Id: c.user2Id,
        user1Confirmed: c.user1Confirmed,
        user2Confirmed: c.user2Confirmed,
        confirmedAt: c.confirmedAt,
        cancelledAt: c.cancelledAt,
        cancelledById: c.cancelledById,
        createdAt: c.createdAt,
        otherUser: c.user1Id === callerId ? c.user2 : c.user1,
        messages: c.messages,
        jobId: c.job?.id ?? null,
        job: c.job ?? null,
    };
}

const JOB_SELECT = {
    id: true,
    ownerId: true,
    caretakerId: true,
    connectionId: true,
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    locationLat: true,
    locationLng: true,
    paymentMethod: true,
    paymentAmount: true,
    paymentCurrency: true,
    paymentRateType: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} as const;

// GET /api/connections — list connections the caller participates in.
// ?status=active|confirmed|cancelled  (default: all)
// Legacy: ?confirmed=true|false still accepted for backward compat.
router.get('/', async (req, res) => {
    const callerId = req.user!.id;
    const statusParam = req.query['status'] as string | undefined;
    const confirmedParam = req.query['confirmed'] as string | undefined;

    let whereExtra: Record<string, unknown> = {};
    if (statusParam === 'active') {
        whereExtra = { confirmedAt: null, cancelledAt: null };
    } else if (statusParam === 'confirmed') {
        whereExtra = { confirmedAt: { not: null } };
    } else if (statusParam === 'cancelled') {
        whereExtra = { cancelledAt: { not: null } };
    } else if (confirmedParam === 'true') {
        whereExtra = { confirmedAt: { not: null } };
    } else if (confirmedParam === 'false') {
        whereExtra = { confirmedAt: null, cancelledAt: null };
    }

    const connections = await prisma.userConnection.findMany({
        where: {
            OR: [{ user1Id: callerId }, { user2Id: callerId }],
            ...whereExtra,
        },
        include: {
            user1: { select: PUBLIC_USER_SELECT },
            user2: { select: PUBLIC_USER_SELECT },
            messages: { orderBy: { sentAt: 'desc' }, take: 1 },
            job: { select: JOB_SELECT },
        },
        orderBy: { createdAt: 'desc' },
    });

    res.json(connections.map((c) => serializeConnection(c, callerId)));
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
            job: { select: JOB_SELECT },
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

    res.json(serializeConnection(connection, callerId));
});

const sendMessageSchema = z
    .object({
        content: z.string().optional().default(''),
        imageData: z
            .string()
            .optional()
            .nullable()
            .superRefine((val, ctx) => {
                if (!val) return; // optional — skip if absent
                const err = validateImageDataUrl(val);
                if (err) ctx.addIssue({ code: 'custom', message: imageErrorMessage(err) });
            }),
    })
    .refine(
        (data) => (data.content && data.content.trim().length > 0) || !!data.imageData,
        { message: 'Message must contain text or an image' },
    );

// POST /api/connections/:id/messages — send a message. Blocked on cancelled connections.
router.post('/:id/messages', validate(sendMessageSchema), async (req, res) => {
    const callerId = req.user!.id;
    const id = req.params['id'] as string;
    const { content, imageData } = req.body as { content: string; imageData?: string | null };

    const connection = await prisma.userConnection.findUnique({ where: { id } });

    if (!connection) {
        res.status(404).json({ error: 'Connection not found' });
        return;
    }

    if (connection.user1Id !== callerId && connection.user2Id !== callerId) {
        res.status(403).json({ error: 'Not a participant in this connection' });
        return;
    }

    if (connection.cancelledAt) {
        res.status(403).json({ error: 'This match has been cancelled' });
        return;
    }

    // Block check — reject if either participant has blocked the other.
    const otherParticipant = connection.user1Id === callerId ? connection.user2Id : connection.user1Id;
    const block = await prisma.blockedUser.findFirst({
        where: {
            OR: [
                { blockerId: callerId, blockedId: otherParticipant },
                { blockerId: otherParticipant, blockedId: callerId },
            ],
        },
        select: { id: true },
    });
    if (block) {
        res.status(403).json({ error: 'Cannot send messages to a blocked user' });
        return;
    }

    const message = await prisma.connectionMessage.create({
        data: {
            connectionId: id,
            senderId: callerId,
            content: content.trim(),
            imageData: imageData ?? null,
        },
    });

    const otherUserId = connection.user1Id === callerId ? connection.user2Id : connection.user1Id;
    emitToUser(otherUserId, 'new-message', { connectionId: id, message });
    void createNotification(otherUserId, 'new_message', {
        connectionId: id,
        senderName: req.user!.name,
        preview: content.trim().substring(0, 80),
    });

    res.status(201).json(message);
});

// POST /api/connections/:id/confirm — caller confirms the job.
// When both sides confirm, the connection is stamped as confirmed.
// Emits connection-updated to both participants for real-time UI sync.
router.post('/:id/confirm', async (req, res) => {
    const callerId = req.user!.id;
    const id = req.params['id'] as string;

    const connection = await prisma.userConnection.findUnique({ where: { id } });

    if (!connection) {
        res.status(404).json({ error: 'Connection not found' });
        return;
    }

    if (connection.user1Id !== callerId && connection.user2Id !== callerId) {
        res.status(403).json({ error: 'Not a participant in this connection' });
        return;
    }

    if (connection.cancelledAt) {
        res.status(403).json({ error: 'Cannot confirm a cancelled match' });
        return;
    }

    const isUser1 = connection.user1Id === callerId;
    const user1Confirmed = isUser1 ? true : connection.user1Confirmed;
    const user2Confirmed = isUser1 ? connection.user2Confirmed : true;
    const bothConfirmed = user1Confirmed && user2Confirmed;
    const alreadyHadConfirmedAt = !!connection.confirmedAt;

    const updated = await prisma.userConnection.update({
        where: { id },
        data: {
            user1Confirmed,
            user2Confirmed,
            confirmedAt: bothConfirmed ? (connection.confirmedAt ?? new Date()) : null,
        },
        include: {
            user1: { select: PUBLIC_USER_SELECT },
            user2: { select: PUBLIC_USER_SELECT },
            job: { select: JOB_SELECT },
        },
    });

    // Create a linked Job row the first time both sides confirm.
    if (bothConfirmed && !alreadyHadConfirmedAt && !updated.job) {
        const user1Role = updated.user1.role;
        const ownerId = user1Role === 'owner' ? connection.user1Id : connection.user2Id;
        const caretakerId = user1Role === 'owner' ? connection.user2Id : connection.user1Id;

        const job = await prisma.job.create({
            data: {
                ownerId,
                caretakerId,
                connectionId: id,
                title: 'Care Job',
                description: '',
                startDate: new Date(),
                endDate: new Date(),
                locationLat: 0,
                locationLng: 0,
                paymentMethod: '',
                paymentAmount: 0,
                paymentCurrency: 'ILS',
                status: 'accepted',
            },
            select: JOB_SELECT,
        });
        // Attach the new job to the updated object for serialization.
        (updated as any).job = job;
    }

    const payload = serializeConnection(updated, callerId);
    // Notify both participants so each side's UI updates instantly.
    emitToUser(connection.user1Id, 'connection-updated', serializeConnection(updated, connection.user1Id));
    emitToUser(connection.user2Id, 'connection-updated', serializeConnection(updated, connection.user2Id));

    // Notify the OTHER participant that someone confirmed.
    const otherConfirmId = isUser1 ? connection.user2Id : connection.user1Id;
    void createNotification(otherConfirmId, bothConfirmed ? 'job_confirmed' : 'job_confirmed', {
        connectionId: id,
        confirmerName: req.user!.name,
        bothConfirmed,
    });

    res.json(payload);
});

// POST /api/connections/:id/decline — cancel/decline the match.
// Blocks future messages; emits connection-updated to both participants.
router.post('/:id/decline', async (req, res) => {
    const callerId = req.user!.id;
    const id = req.params['id'] as string;

    const connection = await prisma.userConnection.findUnique({ where: { id } });

    if (!connection) {
        res.status(404).json({ error: 'Connection not found' });
        return;
    }

    if (connection.user1Id !== callerId && connection.user2Id !== callerId) {
        res.status(403).json({ error: 'Not a participant in this connection' });
        return;
    }

    if (connection.cancelledAt) {
        res.status(409).json({ error: 'Match is already cancelled' });
        return;
    }

    if (connection.confirmedAt) {
        res.status(409).json({ error: 'Cannot decline an already confirmed job' });
        return;
    }

    const updated = await prisma.userConnection.update({
        where: { id },
        data: { cancelledAt: new Date(), cancelledById: callerId },
        include: {
            user1: { select: PUBLIC_USER_SELECT },
            user2: { select: PUBLIC_USER_SELECT },
            job: { select: JOB_SELECT },
        },
    });

    emitToUser(connection.user1Id, 'connection-updated', serializeConnection(updated, connection.user1Id));
    emitToUser(connection.user2Id, 'connection-updated', serializeConnection(updated, connection.user2Id));

    const declineOtherUserId = connection.user1Id === callerId ? connection.user2Id : connection.user1Id;
    void createNotification(declineOtherUserId, 'job_declined', {
        connectionId: id,
        declinerName: req.user!.name,
    });

    res.json(serializeConnection(updated, callerId));
});

export { router as connectionsRouter };
