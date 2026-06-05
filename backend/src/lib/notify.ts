import { prisma } from './prisma.js';
import { emitToUser } from '../socket/socket.js';

type NotificationType =
    | 'new_match'
    | 'new_message'
    | 'job_confirmed'
    | 'job_declined'
    | 'review_request'
    | 'admin_update';

export async function createNotification(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
): Promise<void> {
    const notification = await prisma.notification.create({
        data: {
            userId,
            type,
            payloadJson: JSON.stringify(payload),
        },
    });

    // Push real-time event so the frontend can update the badge instantly.
    emitToUser(userId, 'new-notification', {
        id: notification.id,
        type: notification.type,
        payload,
        isRead: false,
        createdAt: notification.createdAt,
    });
}
