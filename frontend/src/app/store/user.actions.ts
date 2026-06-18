import { createAction } from '@ngrx/store';
import { User, CareType, Availability } from '@livin/common';
import { CareItemDraft, HelperPrefs } from './registration.model';

export const setUserData = createAction(
  '[User] Set Data',
  (userData: Partial<Omit<User, 'id'>>) => ({ userData })
);

export const setProfileData = createAction(
  '[User] Set Profile Data',
  (profileData: {
    bio: string;
    dateOfBirth: string;
    careTypes: CareType[];
    availability: Availability[];
  }) => ({ profileData })
);

export const setAccountData = createAction(
  '[User] Set Account Data',
  (accountData: {
    profilePhoto: string;
    password: string;
  }) => ({ accountData })
);

// Owner-only: pet/plant drafts collected in the pet-details step.
export const setCareItems = createAction(
  '[User] Set Care Items',
  (pendingCareItems: CareItemDraft[]) => ({ pendingCareItems })
);

// Caretaker-only: helper details seeded into MatchPreference after registration.
export const setHelperPrefs = createAction(
  '[User] Set Helper Prefs',
  (helperPrefs: HelperPrefs) => ({ helperPrefs })
);

// Clears the funnel after a successful registration.
export const resetRegistration = createAction('[User] Reset Registration');
