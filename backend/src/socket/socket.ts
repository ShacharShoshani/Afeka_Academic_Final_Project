import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { parse as parseCookies } from 'cookie';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'livin_token';

// Per-socket message rate limit: max 60 events per minute.
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

let io: SocketIOServer | undefined;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: env.CORS_ORIGIN,
            credentials: true,
        },
        // Reject connections with an origin not matching CORS_ORIGIN in production.
        allowRequest: (req, callback) => {
            const origin = req.headers.origin ?? '';
            const allowed =
                env.NODE_ENV !== 'production' ||
                origin === env.CORS_ORIGIN ||
                origin === '';
            callback(null, allowed);
        },
    });

    // Auth middleware — validates the same JWT cookie used by HTTP routes.
    io.use(async (socket, next) => {
        try {
            const raw = socket.handshake.headers.cookie ?? '';
            const cookies = parseCookies(raw);
            const token = cookies[COOKIE_NAME];
            if (!token) {
                next(new Error('Unauthorized'));
                return;
            }
            const payload = verify(token, env.JWT_SECRET) as { sub: string };
            const user = await prisma.user.findUnique({
                where: { id: payload.sub },
                select: { id: true },
            });
            if (!user) {
                next(new Error('Unauthorized'));
                return;
            }
            socket.data['userId'] = user.id;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data['userId'] as string;

        // Each user joins a room keyed by their own ID.
        // Server only *emits* to rooms — clients do not send socket events for chat.
        // All chat actions go through HTTP routes which perform their own authorization.
        socket.join(userId);

        // Per-connection rate limiter. Tracks client→server events (e.g. future features).
        let eventCount = 0;
        const resetTimer = setInterval(() => { eventCount = 0; }, RATE_WINDOW_MS);

        socket.onAny((_event, ..._args) => {
            eventCount++;
            if (eventCount > RATE_LIMIT) {
                socket.emit('error', { message: 'Rate limit exceeded. Slow down.' });
                socket.disconnect(true);
            }
        });

        socket.on('disconnect', () => {
            clearInterval(resetTimer);
            // Socket.io automatically removes the socket from all rooms on disconnect.
        });
    });

    return io;
}

// Emit an event to a specific user's room. No-ops gracefully if called before init.
export function emitToUser(userId: string, event: string, data: unknown): void {
    io?.to(userId).emit(event, data);
}
