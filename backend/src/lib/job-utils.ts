// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenJob(job: any) {
    return {
        ...job,
        pets: (job.pets ?? []).map((p: any) => p.pet),
        plants: (job.plants ?? []).map((p: any) => p.plant),
        strayAnimals: (job.strayAnimals ?? []).map((s: any) => s.strayAnimal),
    };
}
