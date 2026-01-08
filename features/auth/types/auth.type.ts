import { IUser } from '@/features/auth/types/user.type';
import {
  LoginSchemaType,
  RegisterSchemaType,
} from '@/features/auth/schemas/auth.schema';

export interface AuthStrategy {
  getUser: () => Promise<IUser | null>;
  login: (credentials: LoginSchemaType) => Promise<IUser>;
  register?: (credentials: RegisterSchemaType) => Promise<IUser>;
  logout: () => Promise<void>;
  refresh?: () => Promise<IUser | null>;
}