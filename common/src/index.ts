type UserRole = "owner" | "caretaker" | "admin"

type CareType = "dogs" | "cats" | "birds" | "fish" | "rabbits" | "hamsters" | "reptiles" | "plants" | "stray_animals"

type Availability = "mornings" | "afternoons" | "evenings" | "weekends"

type AnimalSize = "small" | "medium" | "large"

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    residence: string;
    role: UserRole;
    bio: string;
    dateOfBirth: string;
    careTypes: CareType[];
    availability: Availability[]; // caretaker only
    profilePhoto: string;
    password: string;
}

// Shape returned by GET /api/users — strips sensitive fields (passwordHash, email, phone).
type PublicUser = {
    id: string;
    name: string;
    residence: string;
    role: UserRole;
    bio: string;
    dateOfBirth: string;
    careTypes: CareType[];
    availability: Availability[];
    profilePhoto: string;
    createdAt: string;
    updatedAt: string;
}

type Pet = {
    id: string;
    ownerId: string;
    name: string;
    type: Omit<CareType, "plants" | "stray_animals">;
    size: AnimalSize;
    specialNeeds: string;
    image: string;
    estimatedBirthDate: string | null;
    createdAt: string;
    updatedAt: string;
}

type Plant = {
    id: string;
    ownerId: string;
    name: string;
    specialNeeds: string;
    image: string;
    estimatedBirthDate: string | null;
    createdAt: string;
    updatedAt: string;
}

type StrayAnimal = {
    id: string;
    name: string | null;
    size: AnimalSize;
    reporterId: string;
    type: Omit<CareType, "plants" | "stray_animals" | "fish" | "hamsters">;
    location: string;
    description: string;
    image: string;
    estimatedBirthDate: string | null;
    createdAt: string;
    updatedAt: string;
}

type JobStatus = "open" | "in_progress" | "completed" | "cancelled"

type Job = {
    id: string;
    ownerId: string;
    caretakerId: string | null;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    locationLat: number;
    locationLng: number;
    paymentMethod: string;
    paymentAmount: number;
    paymentCurrency: string;
    status: JobStatus;
    pets: Pet[];
    plants: Plant[];
    strayAnimals: StrayAnimal[];
    createdAt: string;
    updatedAt: string;
}

export {
    AnimalSize,
    Availability,
    CareType,
    Job,
    JobStatus,
    Pet,
    Plant,
    PublicUser,
    StrayAnimal,
    User,
    UserRole,
};
