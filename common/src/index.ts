enum UserRole {
    Owner = "owner",
    Caretaker = "caretaker",
    Admin = "admin"
}

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    residence: string;
    role: UserRole;
}

export { UserRole, User };