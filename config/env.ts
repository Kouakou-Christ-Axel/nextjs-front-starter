import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_BACKEND_URL: z.url(),
  NEXT_PUBLIC_CSRF_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

// Accès littéraux obligatoires : Next n'inline que `process.env.NEXT_PUBLIC_X`,
// pas `process.env[key]`.
export const env = envSchema.parse({
  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  NEXT_PUBLIC_CSRF_ENABLED: process.env.NEXT_PUBLIC_CSRF_ENABLED,
});
