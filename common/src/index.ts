type UserRole = "owner" | "caretaker" | "admin"

type CareType = "dogs" | "cats" | "birds" | "fish" | "rabbits" | "hamsters" | "reptiles" | "plants" | "stray_animals"

type Availability = "mornings" | "afternoons" | "evenings" | "weekends"

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
    size: "small" | "medium" | "large";
    specialNeeds: string;
    image: string;
    dateOfBirth: string | null;
    createdAt: string;
    updatedAt: string;
}

type Plant = {
    id: string;
    ownerId: string;
    kind: string;
    specialNeeds: string;
    image: string;
    dateOfBirth: string | null;
    createdAt: string;
    updatedAt: string;
}

type StrayAnimal = {
    id: string;
    name: string | null;
    reporterId: string;
    type: Omit<CareType, "plants" | "stray_animals" | "fish" | "hamsters">;
    location: string;
    description: string;
    image: string;
    dateOfBirth: string | null;
    createdAt: string;
    updatedAt: string;
}

export { UserRole, CareType, Availability, User, PublicUser, Pet, Plant, StrayAnimal };
