import { AuthStrategy } from '@/features/auth/types/auth.type';
import {
  getUserRequest,
  loginUserRequest,
  registerUserRequest,
  logoutUserRequest,
  getRefreshUserRequest,
} from '@/features/auth/requests/auth.request';

export const jwtStrategy: AuthStrategy = {
  getUser: getUserRequest,
  login: loginUserRequest,
  register: registerUserRequest,
  logout: logoutUserRequest,
  refresh: getRefreshUserRequest,
};

export const googleStrategy: AuthStrategy = {
  getUser: async () => {
    return null; // Placeholder
  },
  login: async () => {
    throw new Error('Not implemented'); // Placeholder
  },
  logout: async () => {
    throw new Error('Not implemented'); // Placeholder
  },
};
