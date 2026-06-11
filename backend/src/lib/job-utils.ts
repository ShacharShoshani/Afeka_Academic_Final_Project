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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenJob(job: any) {
    return {
        ...job,
        pets: (job.pets ?? []).map((p: any) => p.pet),
        plants: (job.plants ?? []).map((p: any) => p.plant),
        strayAnimals: (job.strayAnimals ?? []).map((s: any) => s.strayAnimal),
    };
}
