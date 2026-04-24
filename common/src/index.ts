type UserRole = "owner" | "caretaker" | "admin"

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    residence: string;
    role: UserRole;
}

export { UserRole, User };