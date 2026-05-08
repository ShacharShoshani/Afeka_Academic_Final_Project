import { createReducer, on } from "@ngrx/store";
import { setUserData, setProfileData, setAccountData } from "./user.actions";
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
  profilePhoto: '',
  password: '',
};

export const userReducer = createReducer(
  initialState,
  on(setUserData, (state, { userData }) => ({ ...state, ...userData })),
  on(setProfileData, (state, { profileData }) => ({ ...state, ...profileData })),
  on(setAccountData, (state, { accountData }) => ({ ...state, ...accountData }))
);
