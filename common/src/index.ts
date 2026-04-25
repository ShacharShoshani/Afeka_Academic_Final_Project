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
}

export { UserRole, CareType, Availability, User };
