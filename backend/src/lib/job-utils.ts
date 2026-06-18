import { prisma } from './prisma.js';

export async function getBlockedIds(userId: string): Promise<string[]> {
    const rows = await prisma.blockedUser.findMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
        select: { blockerId: true, blockedId: true },
    });
    return rows.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId));
}

export async function getOrCreateConnection(userAId: string, userBId: string) {
    const [user1Id, user2Id] = [userAId, userBId].sort();
    return prisma.userConnection.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        create: { user1Id, user2Id },
        update: {},
    });
}

// Strip the private `careDetails` blob (medical/vet/emergency/feeding/behavior)
// from a pet/plant embedded in a job. Jobs are shown to the other party before a
// confirmed job, so sensitive care info must not leak through them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripCareDetails<T extends { careDetails?: unknown } | null | undefined>(item: T): T {
    if (!item) return item;
    const { careDetails: _careDetails, ...rest } = item as Record<string, unknown>;
    return rest as T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenJob(job: any) {
    return {
        ...job,
        pets: (job.pets ?? []).map((p: any) => stripCareDetails(p.pet)),
        plants: (job.plants ?? []).map((p: any) => stripCareDetails(p.plant)),
        strayAnimals: (job.strayAnimals ?? []).map((s: any) => s.strayAnimal),
    };
}
