import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { StandardSchemaV1 } from '@standard-schema/spec';

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_BACKEND_URL: z.url().default('http://localhost:3000'),
  },
  emptyStringAsUndefined: true,
  runtimeEnv: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
  },
  onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
    console.error('❌ Invalid environment variables:', issues);
    process.exit(1);
  },
});
