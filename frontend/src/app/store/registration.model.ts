import {
  User,
  PetCareDetails,
  PetFriendliness,
  Availability,
  ServiceType,
  WorkType,
} from '@livin/common';

// A pet/plant the owner drafts during onboarding. Submitted to /api/pets or
// /api/plants AFTER the user account is created (pets need an ownerId).
export interface CareItemDraft {
  kind: 'pet' | 'plant';
  type?: string; // PetType — pets only
  name?: string;
  estimatedBirthDate?: string | null;
  image?: string; // base64; may be added in the final photo step
  friendliness?: PetFriendliness | null;
  allergies?: string;
  description?: string;
  specialNeeds?: string;
  careDetails?: PetCareDetails;
}

// Caretaker helper details — seeded into MatchPreference via PUT /api/preferences
// after registration.
export interface HelperPrefs {
  workType: WorkType;
  services: ServiceType[];
  availabilityWanted: Availability[];
  canHostAtMine: boolean;
  canTravelToOther: boolean;
  maxDistanceKm: number | null;
}

// The registration funnel store slice. Carries partial User data across steps
// plus role-specific drafts that are submitted after the account is created.
export interface RegistrationState extends Partial<User> {
  pendingCareItems?: CareItemDraft[];
  helperPrefs?: HelperPrefs;
}
