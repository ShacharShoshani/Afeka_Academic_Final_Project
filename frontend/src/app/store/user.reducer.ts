import { createReducer, on } from "@ngrx/store";
import {
  setUserData,
  setProfileData,
  setAccountData,
  setCareItems,
  setHelperPrefs,
  resetRegistration,
} from "./user.actions";
import { RegistrationState } from "./registration.model";

const initialState: RegistrationState = {
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
  pendingCareItems: [],
};

export const userReducer = createReducer(
  initialState,
  on(setUserData, (state, { userData }) => ({ ...state, ...userData })),
  on(setProfileData, (state, { profileData }) => ({ ...state, ...profileData })),
  on(setAccountData, (state, { accountData }) => ({ ...state, ...accountData })),
  on(setCareItems, (state, { pendingCareItems }) => ({ ...state, pendingCareItems })),
  on(setHelperPrefs, (state, { helperPrefs }) => ({ ...state, helperPrefs })),
  on(resetRegistration, () => ({ ...initialState })),
);
