import { createAction } from '@ngrx/store';
import { UserRole, User, CareType, Availability } from '@livin/common';

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
