import { createAuth } from '@/features/auth/lib/create-auth';
import { jwtStrategy } from '@/features/auth/strategies/jwt.strategy';

const { useUser, useLogin, useLogout, useRegister, useRefresh } = createAuth({
  jwt: jwtStrategy,
});

export { useUser, useLogin, useLogout, useRegister, useRefresh };
