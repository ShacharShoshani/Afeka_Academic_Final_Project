import { createReducer, on } from "@ngrx/store";
import { setUserData, setProfileData } from "./user.actions";
import { User } from "@livin/common";

const initialState: Partial<User> = {
  id: '',
  name: '',
  email: '',
  phone: '',
  residence: '',
  role: undefined,
  bio: '',
  dateOfBirth: '',
  careTypes: [],
  availability: [],
};

export const userReducer = createReducer(
  initialState,
  on(setUserData, (state, { userData }) => ({ ...state, ...userData })),
  on(setProfileData, (state, { profileData }) => ({ ...state, ...profileData }))
);
