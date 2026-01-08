import { api } from '@/lib/api-client';
import {
  LoginSchemaType,
  RegisterSchemaType,
} from '@/features/auth/schemas/auth.schema';
import { IUser } from '@/features/auth/types/user.type';

export function loginUserRequest(data: LoginSchemaType) {
  return api.post<IUser>('/auth/login', data);
}

export function registerUserRequest(data: RegisterSchemaType) {
  return api.post<IUser>('/auth/register', data);
}

export function logoutUserRequest() {
  return api.post<void>('/auth/logout');
}

export async function getUserRequest() {
  return  await api.get<IUser>('/auth/me', {
    cache: 'no-store',
  });
}

export async function getRefreshUserRequest() {
  return  await api.get<IUser>('/auth/refresh', {
    cache: 'no-store',
  });
}
