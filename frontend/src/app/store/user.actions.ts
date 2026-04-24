import { createAction } from '@ngrx/store';
import { UserRole, User } from '@livin/common';

export const setUserData = createAction(
  '[User] Set Data',
  (userData: Omit<User, 'id'>) => ({ userData })
);
