import { api } from '@/lib/api-client';
import {
  LoginSchemaType,
  RegisterSchemaType,
} from '@/features/auth/schemas/auth.schema';
import { IUser } from '@/features/auth/types/user.type';

export function loginUserRequest(data: LoginSchemaType): Promise<IUser> {
  return api.post<IUser>('/auth/login', data);
}

export function registerUserRequest(data: RegisterSchemaType): Promise<IUser> {
  return api.post<IUser>('/auth/register', data);
}

export function logoutUserRequest(): Promise<void> {
  return api.post<void>('/auth/logout');
}

export function getUserRequest(): Promise<IUser> {
  return api.get<IUser>('/auth/me', {
    cache: 'no-store',
  });
}

export function getRefreshUserRequest(): Promise<IUser> {
  return api.get<IUser>('/auth/refresh', {
    cache: 'no-store',
  });
}
