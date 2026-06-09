import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { emitToUser } from '../socket/socket.js';
import { createNotification } from '../lib/notify.js';

const router = Router();

// ── Shared selectors ──────────────────────────────────────────────────────────

const PUBLIC_USER_SELECT = {
    id: true,
    name: true,
    bio: true,
    profilePhoto: true,
    residence: true,
    lat: true,
    lng: true,
    city: true,
    country: true,
    role: true,
    careTypes: true,
    availability: true,
    displayMode: true,
    dateOfBirth: true,
    createdAt: true,
    updatedAt: true,
    averageRating: true,
    reviewCount: true,
} as const;

const SWIPE_JOB_INCLUDE = {
    owner: { select: PUBLIC_USER_SELECT },
    pets: { include: { pet: true } },
    plants: { include: { plant: true } },
    strayAnimals: { include: { strayAnimal: true } },
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenSwipeJob(job: any) {
    return {
        ...job,
        pets: (job.pets ?? []).map((p: any) => p.pet),
        plants: (job.plants ?? []).map((p: any) => p.plant),
        strayAnimals: (job.strayAnimals ?? []).map((s: any) => s.strayAnimal),
    };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── GET /api/swipe/deck ───────────────────────────────────────────────────────
// Caretaker → open swipe jobs filtered by their MatchPreference.
// Owner     → caretaker profiles for a given job (?jobId=uuid).
//             If no jobId: auto-select if exactly 1 open job, else return job chooser.
router.get('/deck', async (req, res) => {
    const caller = req.user!;
    const { jobId } = req.query as { jobId?: string };

    // ── CARETAKER deck (unchanged from previous impl) ─────────────────────────
    if (caller.role === 'caretaker') {
        const [alreadyExpressed, prefs, callerFull, blocksGiven, blocksReceived] = await Promise.all([
            prisma.jobInterest.findMany({
                where: { caretakerId: caller.id },
                select: { jobId: true },
            }),
            prisma.matchPreference.findUnique({ where: { userId: caller.id } }),
            prisma.user.findUnique({ where: { id: caller.id }, select: { lat: true, lng: true } }),
            prisma.blockedUser.findMany({ where: { blockerId: caller.id }, select: { blockedId: true } }),
            prisma.blockedUser.findMany({ where: { blockedId: caller.id }, select: { blockerId: true } }),
        ]);

        const expressedJobIds = alreadyExpressed.map((r) => r.jobId);
        const blockedOwnerIds = [
            ...blocksGiven.map((b) => b.blockedId),
            ...blocksReceived.map((b) => b.blockerId),
        ];

        const where: Record<string, unknown> = {
            isSwipeJob: true,
            status: 'pending',
            id: { notIn: expressedJobIds },
            ownerId: { notIn: blockedOwnerIds },
        };

        if (prefs) {
            if (prefs.services.length) where['services'] = { hasSome: prefs.services };
            if (prefs.residenceFilter) where['locationAddress'] = { contains: prefs.residenceFilter, mode: 'insensitive' };
            if (prefs.workType === 'paid') where['paymentAmount'] = { gt: 0 };
            if (prefs.workType === 'volunteer') where['paymentAmount'] = 0;
        }

        const rawJobs = await prisma.job.findMany({
            where,
            include: SWIPE_JOB_INCLUDE,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const callerLat = callerFull?.lat;
        const callerLng = callerFull?.lng;
        const maxKm = prefs?.maxDistanceKm;
        const wantedCareTypes = prefs?.careTypesWanted ?? [];

        const filtered = rawJobs.filter((j) => {
            // Geo-distance filter (skip if no coords on either side).
            if (maxKm && callerLat != null && callerLng != null) {
                if (j.locationLat || j.locationLng) {
                    if (haversineKm(callerLat, callerLng, j.locationLat, j.locationLng) > maxKm) return false;
                }
            }
            // Care-type overlap filter: at least one wanted care type must match job's care items.
            if (wantedCareTypes.length > 0) {
                const matched = wantedCareTypes.some((ct) => {
                    if (ct === 'plants') return (j as any).plants.length > 0;
                    if (ct === 'stray_animals') return (j as any).strayAnimals.length > 0;
                    return (j as any).pets.some((p: any) => p.pet?.type === ct);
                });
                if (!matched) return false;
            }
            return true;
        });

        return res.json({ type: 'jobs', jobs: filtered.slice(0, 10).map(flattenSwipeJob) });
    }

    // ── OWNER deck: caretakers for a specific job ─────────────────────────────
    // Resolve which job to show caretakers for.
    let resolvedJobId = jobId;

    if (!resolvedJobId) {
        const ownerJobs = await prisma.job.findMany({
            where: { ownerId: caller.id, isSwipeJob: true, status: 'pending' },
            select: { id: true, title: true },
            orderBy: { createdAt: 'desc' },
        });
        if (ownerJobs.length === 0) {
            return res.json({ type: 'no-jobs' });
        }
        if (ownerJobs.length > 1) {
            return res.json({ type: 'choose-job', jobs: ownerJobs });
        }
        resolvedJobId = ownerJobs[0].id;
    }

    // Verify the owner owns this job.
    const job = await prisma.job.findUnique({
        where: { id: resolvedJobId },
        include: SWIPE_JOB_INCLUDE,
    });
    if (!job || job.ownerId !== caller.id) {
        return res.status(403).json({ error: 'Not your job' });
    }

    // Get caretaker IDs already handled (matched or rejected) for this job.
    const handled = await prisma.jobInterest.findMany({
        where: { jobId: resolvedJobId, status: { in: ['matched', 'rejected'] } },
        select: { caretakerId: true },
    });
    const handledIds = handled.map((h) => h.caretakerId);

    // Get blocked user IDs.
    const [blocksGiven, blocksReceived] = await Promise.all([
        prisma.blockedUser.findMany({ where: { blockerId: caller.id }, select: { blockedId: true } }),
        prisma.blockedUser.findMany({ where: { blockedId: caller.id }, select: { blockerId: true } }),
    ]);
    const blockedIds = [
        ...blocksGiven.map((b) => b.blockedId),
        ...blocksReceived.map((b) => b.blockerId),
    ];

    // Fetch caretakers not yet handled and not blocked.
    const [rawCaretakers, ownerPrefs, ownerFull] = await Promise.all([
        prisma.user.findMany({
            where: {
                role: 'caretaker',
                id: { notIn: [...handledIds, ...blockedIds, caller.id] },
            },
            select: PUBLIC_USER_SELECT,
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        prisma.matchPreference.findUnique({ where: { userId: caller.id } }),
        prisma.user.findUnique({ where: { id: caller.id }, select: { lat: true, lng: true } }),
    ]);

    // Prefer caretakers who already swiped right on this job (caretakerLiked=true).
    const interestedIds = new Set(
        (await prisma.jobInterest.findMany({
            where: { jobId: resolvedJobId, caretakerLiked: true },
            select: { caretakerId: true },
        })).map((r) => r.caretakerId),
    );

    // Sort: interested first, then the rest.
    const sorted = [
        ...rawCaretakers.filter((c) => interestedIds.has(c.id)),
        ...rawCaretakers.filter((c) => !interestedIds.has(c.id)),
    ];

    // Care types required by this job, derived from its care items.
    const jobCareTypes = new Set<string>();
    (job as any).pets.forEach((p: any) => { if (p.pet?.type) jobCareTypes.add(p.pet.type); });
    if ((job as any).plants.length) jobCareTypes.add('plants');
    if ((job as any).strayAnimals.length) jobCareTypes.add('stray_animals');

    // Distance + care-type relevance filter. Lenient: keep caretakers without careTypes,
    // and always keep caretakers who already applied to this job.
    const callerLat = ownerFull?.lat;
    const callerLng = ownerFull?.lng;
    const maxKm = ownerPrefs?.maxDistanceKm;

    const filtered = sorted.filter((c) => {
        if (interestedIds.has(c.id)) return true;
        // Care-type overlap.
        if (jobCareTypes.size > 0 && c.careTypes.length > 0) {
            if (!c.careTypes.some((t) => jobCareTypes.has(t))) return false;
        }
        // Distance.
        if (maxKm && callerLat != null && callerLng != null) {
            if (c.lat != null && c.lng != null) {
                if (haversineKm(callerLat, callerLng, c.lat, c.lng) > maxKm) return false;
            }
        }
        return true;
    });

    return res.json({
        type: 'caretakers',
        jobId: resolvedJobId,
        job: flattenSwipeJob(job),
        caretakers: filtered.slice(0, 10).map((c) => ({
            ...c,
            alreadyInterested: interestedIds.has(c.id),
        })),
    });
});

// ── GET /api/swipe/my-jobs ────────────────────────────────────────────────────
// Owner's own swipe jobs with pending/matched counts per job.
router.get('/my-jobs', async (req, res) => {
    const ownerId = req.user!.id;

    const jobs = await prisma.job.findMany({
        where: { ownerId, isSwipeJob: true },
        include: {
            ...SWIPE_JOB_INCLUDE,
            jobInterests: {
                select: { status: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const result = jobs.map((j) => ({
        ...flattenSwipeJob(j),
        pendingCount: j.jobInterests.filter((i) => i.status === 'pending').length,
        matchedCount: j.jobInterests.filter((i) => i.status === 'matched').length,
    }));

    res.json(result);
});

// ── GET /api/swipe/job-applicants/:jobId ──────────────────────────────────────
// Owner sees all interests (pending + matched) for one of their jobs.
router.get('/job-applicants/:jobId', async (req, res) => {
    const callerId = req.user!.id;
    const jobId = req.params['jobId'] as string;

    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { ownerId: true } });
    if (!job || job.ownerId !== callerId) {
        res.status(403).json({ error: 'Not your job' });
        return;
    }

    const interests = await prisma.jobInterest.findMany({
        where: { jobId, status: { in: ['pending', 'matched'] } },
        include: { caretaker: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'asc' },
    });

    res.json(interests);
});

// ── POST /api/swipe/express ───────────────────────────────────────────────────
// Unified two-sided swipe. Both owner and caretaker use this endpoint.
// Caretaker body: { jobId, liked }
// Owner body:     { jobId, caretakerId, liked }
const expressSchema = z.object({
    jobId: z.string().uuid(),
    caretakerId: z.string().uuid().optional(),
    liked: z.boolean(),
});

router.post('/express', validate(expressSchema), async (req, res) => {
    const caller = req.user!;
    const { jobId, liked } = req.body as z.infer<typeof expressSchema>;
    let { caretakerId } = req.body as z.infer<typeof expressSchema>;

    if (caller.role === 'caretaker') {
        caretakerId = caller.id;
    } else {
        // Owner must supply caretakerId.
        if (!caretakerId) {
            res.status(400).json({ error: 'caretakerId is required for owners' });
            return;
        }
    }

    // Verify the job exists and the owner matches.
    const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, ownerId: true, status: true, title: true },
    });
    if (!job) { res.status(404).json({ error: 'Job not found' }); return; }
    if (job.status !== 'pending' && job.status !== 'in_progress') {
        res.status(409).json({ error: 'Job is no longer available' }); return;
    }
    if (caller.role === 'owner' && job.ownerId !== caller.id) {
        res.status(403).json({ error: 'Not your job' }); return;
    }

    // Upsert JobInterest.
    const existing = await prisma.jobInterest.findUnique({
        where: { jobId_caretakerId: { jobId, caretakerId: caretakerId! } },
    });

    const updateData: Record<string, unknown> = {};
    if (caller.role === 'caretaker') {
        updateData['caretakerLiked'] = liked;
    } else {
        updateData['ownerLiked'] = liked;
    }

    let interest;
    if (existing) {
        interest = await prisma.jobInterest.update({
            where: { id: existing.id },
            data: updateData,
        });
    } else {
        interest = await prisma.jobInterest.create({
            data: {
                jobId,
                caretakerId: caretakerId!,
                caretakerLiked: caller.role === 'caretaker' ? liked : false,
                ownerLiked: caller.role === 'owner' ? liked : false,
            },
        });
    }

    // If either side swiped left, mark as rejected.
    if (!liked) {
        await prisma.jobInterest.update({
            where: { id: interest.id },
            data: { status: 'rejected' },
        });
        return res.json({ matched: false });
    }

    // Check for mutual match.
    const fresh = await prisma.jobInterest.findUnique({
        where: { id: interest.id },
    });
    if (!fresh?.ownerLiked || !fresh?.caretakerLiked) {
        return res.json({ matched: false });
    }

    // Both liked → create match.
    await prisma.jobInterest.update({
        where: { id: interest.id },
        data: { status: 'matched' },
    });
    await prisma.job.update({
        where: { id: jobId },
        data: { status: 'accepted', caretakerId: caretakerId! },
    });

    const [user1Id, user2Id] = [job.ownerId, caretakerId!].sort();
    const connection = await prisma.userConnection.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: {},
    });

    // Link the swipe job to this connection so the chat / Jobs Confirmed show the real job.
    // Only link if the connection has no job yet (Job.connectionId is @unique).
    const existingLinked = await prisma.job.findFirst({
        where: { connectionId: connection.id },
        select: { id: true },
    });
    if (!existingLinked) {
        await prisma.job.update({
            where: { id: jobId },
            data: { connectionId: connection.id },
        });
    }

    // Notify both sides.
    const otherUserId = caller.role === 'caretaker' ? job.ownerId : caretakerId!;
    const callersName = caller.name;
    emitToUser(otherUserId, 'new-match', {
        connectionId: connection.id,
        otherUser: { name: callersName, photo: caller.profilePhoto },
    });
    void createNotification(otherUserId, 'new_match', {
        connectionId: connection.id,
        otherUserName: callersName,
    });
    // Also persist a notification for the caller so it appears in their Notification Center.
    // Look up the other user's name for the notification payload.
    const otherUserRecord = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { name: true },
    });
    void createNotification(caller.id, 'new_match', {
        connectionId: connection.id,
        otherUserName: otherUserRecord?.name ?? '',
    });

    return res.json({ matched: true, connectionId: connection.id });
});

// ── Legacy POST /api/swipe — kept for backward compat (old user-to-user flow). ──
const swipeBodySchema = z.object({
    toUserId: z.string().uuid(),
    liked: z.boolean(),
});

router.post('/', validate(swipeBodySchema), async (req, res) => {
    const callerId = req.user!.id;
    const { toUserId, liked } = req.body as { toUserId: string; liked: boolean };

    if (callerId === toUserId) { res.status(400).json({ error: 'Cannot swipe on yourself' }); return; }

    await prisma.userInterest.upsert({
        where: { fromUserId_toUserId: { fromUserId: callerId, toUserId } },
        create: { fromUserId: callerId, toUserId, liked },
        update: { liked },
    });

    if (!liked) { res.json({ matched: false }); return; }

    const reciprocal = await prisma.userInterest.findUnique({
        where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: callerId } },
    });
    if (!reciprocal?.liked) { res.json({ matched: false }); return; }

    const [user1Id, user2Id] = [callerId, toUserId].sort();
    const connection = await prisma.userConnection.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: {},
    });

    emitToUser(toUserId, 'new-match', {
        connectionId: connection.id,
        otherUser: { name: req.user!.name, photo: req.user!.profilePhoto },
    });
    void createNotification(toUserId, 'new_match', {
        connectionId: connection.id,
        otherUserName: req.user!.name,
    });

    res.json({ matched: true, connectionId: connection.id });
});

export { router as swipeRouter };
