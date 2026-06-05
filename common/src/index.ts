type DisplayMode = "social" | "swipe"

type PaymentMethod = "Cash" | "Bank Transfer" | "PayPal" | "Bit" | "PayBox"

type PaymentRateType = "hourly" | "daily" | "weekly"

type UserRole = "owner" | "caretaker" | "admin"

type CareType = "dogs" | "cats" | "birds" | "fish" | "rabbits" | "hamsters" | "reptiles" | "plants" | "stray_animals"

type Availability = "mornings" | "afternoons" | "evenings" | "weekends"

type ServiceType = "feeding" | "walking" | "watering_plants" | "cleaning" | "stray_care" | "other"

type WorkType = "paid" | "volunteer" | "both"

type AnimalSize = "small" | "medium" | "large"

type User = {
    id: string;
    name: string;
    email: string;
    phone: string;
    residence: string;
    lat: number | null;
    lng: number | null;
    city: string | null;
    country: string | null;
    role: UserRole;
    bio: string;
    dateOfBirth: string;
    careTypes: CareType[];
    availability: Availability[]; // caretaker only
    profilePhoto: string;
    displayMode: DisplayMode;
    password: string;
}

// Shape returned by GET /api/users — strips sensitive fields (passwordHash, email, phone).
type PublicUser = {
    id: string;
    name: string;
    residence: string;
    lat: number | null;
    lng: number | null;
    city: string | null;
    country: string | null;
    role: UserRole;
    bio: string;
    dateOfBirth: string;
    careTypes: CareType[];
    availability: Availability[];
    profilePhoto: string;
    displayMode: DisplayMode;
    averageRating: number;
    reviewCount: number;
    createdAt: string;
    updatedAt: string;
}

type Review = {
    id: string;
    jobId: string;
    reviewerId: string;
    targetId: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewer?: Pick<PublicUser, 'id' | 'name' | 'profilePhoto'>;
}

type UserInterest = {
    id: string;
    fromUserId: string;
    toUserId: string;
    liked: boolean;
    createdAt: string;
}

type ConnectionMessage = {
    id: string;
    connectionId: string;
    senderId: string;
    content: string;
    imageData: string | null;
    sentAt: string;
}

// Derived status — not stored as a field; computed from confirmedAt/cancelledAt.
type ConnectionStatus = "active" | "confirmed" | "cancelled"

type NotificationType = "new_match" | "new_message" | "job_confirmed" | "job_declined" | "review_request" | "admin_update"

type AppNotification = {
    id: string;
    userId: string;
    type: NotificationType;
    payload: Record<string, unknown>;
    isRead: boolean;
    createdAt: string;
}

type ReportCategory = "harassment" | "unsafe_behavior" | "no_show" | "inappropriate_content" | "abuse_neglect" | "scam" | "other"
type ReportStatus = "open" | "under_review" | "resolved" | "dismissed"

type Report = {
    id: string;
    reporterId: string;
    reportedId: string;
    category: ReportCategory;
    description: string;
    connectionId: string | null;
    status: ReportStatus;
    createdAt: string;
    updatedAt: string;
    reporter?: Pick<PublicUser, 'id' | 'name'>;
    reported?: Pick<PublicUser, 'id' | 'name'>;
}

// Lightweight job snapshot embedded in connection responses.
type ConnectionJob = {
    id: string;
    ownerId: string;
    caretakerId: string | null;
    connectionId: string | null;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    locationLat: number;
    locationLng: number;
    paymentMethod: string;
    paymentAmount: number;
    paymentCurrency: string;
    paymentRateType: PaymentRateType | null;
    status: JobStatus;
    createdAt: string;
    updatedAt: string;
}

type UserConnection = {
    id: string;
    user1Id: string;
    user2Id: string;
    user1Confirmed: boolean;
    user2Confirmed: boolean;
    confirmedAt: string | null;
    cancelledAt: string | null;
    cancelledById: string | null;
    createdAt: string;
    jobId: string | null;
    job: ConnectionJob | null;
    messages?: ConnectionMessage[];
    otherUser?: PublicUser;
}

// One-to-one search/matching preferences per user. Symmetric for owners & caretakers.
type MatchPreference = {
    id: string;
    userId: string;
    careTypesWanted: CareType[];
    services: ServiceType[];
    availabilityWanted: Availability[];
    canHostAtMine: boolean;
    canTravelToOther: boolean;
    workType: WorkType;
    paymentRateTypes: PaymentRateType[];
    minPayment: number | null;
    maxPayment: number | null;
    maxDistanceKm: number | null;
    residenceFilter: string | null;
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

type JobStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled"
type JobInterestStatus = "pending" | "matched" | "rejected"
type PetFriendliness = "friendly" | "cautious" | "unknown"
type PaymentMethodEnum = "cash" | "bank_transfer" | "bit" | "paybox" | "check" | "paypal"
type Currency = "ILS" | "USD" | "EUR"

type Job = {
    id: string;
    ownerId: string;
    caretakerId: string | null;
    connectionId: string | null;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    // Location
    locationLat: number;
    locationLng: number;
    locationAddress: string | null;
    locationCity: string | null;
    locationCountry: string | null;
    // Payment (Job Post Mode fields)
    paymentMethod: string;
    paymentAmount: number;
    paymentCurrency: string;
    paymentRateType: PaymentRateType | null;
    // Payment (Swipe Job fields)
    paymentMethodList: PaymentMethodEnum[];
    currency: Currency;
    minPayment: number | null;
    maxPayment: number | null;
    // Swipe-job-specific
    isSwipeJob: boolean;
    services: ServiceType[];
    estimatedHours: number | null;
    behaviorNotes: string | null;
    friendliness: PetFriendliness | null;
    status: JobStatus;
    pets: Pet[];
    plants: Plant[];
    strayAnimals: StrayAnimal[];
    createdAt: string;
    updatedAt: string;
    // Optional includes
    owner?: Pick<PublicUser, 'id' | 'name' | 'profilePhoto' | 'residence' | 'role' | 'bio' | 'averageRating' | 'reviewCount'>;
}

type JobInterest = {
    id: string;
    jobId: string;
    caretakerId: string;
    ownerLiked: boolean;
    caretakerLiked: boolean;
    status: JobInterestStatus;
    createdAt: string;
    caretaker?: PublicUser;
    job?: Job;
}

export {
    AnimalSize,
    AppNotification,
    Availability,
    CareType,
    ConnectionJob,
    ConnectionMessage,
    ConnectionStatus,
    Currency,
    JobInterest,
    JobInterestStatus,
    NotificationType,
    PaymentMethodEnum,
    PetFriendliness,
    Report,
    ReportCategory,
    ReportStatus,
    DisplayMode,
    Job,
    JobStatus,
    MatchPreference,
    PaymentMethod,
    PaymentRateType,
    Pet,
    Plant,
    PublicUser,
    Review,
    ServiceType,
    StrayAnimal,
    User,
    UserConnection,
    UserInterest,
    UserRole,
    WorkType,
};
