export const PUBLIC_USER_SELECT = {
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
    // NOTE: street, houseNumber, countryCode, formattedAddress are deliberately
    // omitted — exact address stays private.
} as const;

// Pet/Plant fields safe to expose on other users' profiles and on job cards.
// `careDetails` (medical/vet/emergency/feeding/behavior) is deliberately omitted.
export const PUBLIC_PET_SELECT = {
    id: true,
    ownerId: true,
    name: true,
    type: true,
    size: true,
    specialNeeds: true,
    image: true,
    estimatedBirthDate: true,
    friendliness: true,
    allergies: true,
    description: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const PUBLIC_PLANT_SELECT = {
    id: true,
    ownerId: true,
    name: true,
    specialNeeds: true,
    image: true,
    estimatedBirthDate: true,
    description: true,
    createdAt: true,
    updatedAt: true,
} as const;
