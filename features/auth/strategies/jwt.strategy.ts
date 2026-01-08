import { AuthStrategy } from '@/features/auth/types/auth.type';
import {
  getUserRequest,
  loginUserRequest,
  registerUserRequest,
  logoutUserRequest,
  getRefreshUserRequest,
} from '@/features/auth/requests/auth.request';

export const jwtStrategy: AuthStrategy = {
  getUser: async () => {
    return (await getUserRequest()).data;
  },
  login: async (credentials) => {
    return (await loginUserRequest(credentials)).data;
  },
  register: async (credentials) => {
    return (await registerUserRequest(credentials)).data;
  },
  logout: async () => {
    return (await logoutUserRequest()).data;
  },
  refresh: async () => {
    return (await getRefreshUserRequest()).data;
  },
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
