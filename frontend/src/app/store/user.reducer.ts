import { createReducer, on } from "@ngrx/store";
import { setUserData } from "./user.actions";
import { User } from "@livin/common";

const initialState: Partial<User> = {
  id: '',
  name: '',
  email: '',
  phone: '',
  residence: '',
  role: undefined
};

export const userReducer = createReducer(
  initialState,
  on(setUserData, (state, { userData }) => ({ ...state, ...userData }))
);
