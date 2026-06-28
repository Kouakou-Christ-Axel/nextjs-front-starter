// Typed env access. Schema: ../.env.schema — Types: ../env.d.ts
// (auto-generated — run `bunx varlock typegen` or rely on the Next.js plugin).
//
// Why this is not a plain `export { ENV as env } from 'varlock/env'`:
// varlock injects values into the client bundle through a Webpack DefinePlugin.
// Next.js 16 builds with Turbopack by default, where that plugin does NOT run,
// so `ENV.NEXT_PUBLIC_*` is `undefined` in the browser — which silently breaks
// every client-side `fetch` (e.g. requests hit `undefined/auth/me`).
//
// Fix: on the server we read varlock's fully-initialized `ENV`; on the client we
// fall back to `process.env.NEXT_PUBLIC_*`, which Next.js statically replaces at
// build time under both Webpack and Turbopack.
//
// IMPORTANT: each `NEXT_PUBLIC_*` variable must be accessed below as a *literal*
// member expression (`process.env.NEXT_PUBLIC_FOO`). A dynamic lookup such as
// `process.env[prop]` is NOT statically replaced and stays `undefined` on the
// client. When you add a new public variable, add it to `AppEnv` and to the
// client branch of the proxy.
import { ENV as varlockEnv } from 'varlock/env';

type AppEnv = {
  NEXT_PUBLIC_BACKEND_URL: string;
  NEXT_PUBLIC_CSRF_ENABLED: boolean;
};

export const env: AppEnv = new Proxy({} as AppEnv, {
  get(_target, prop: string) {
    // Server-side: varlock's ENV is fully initialized, use it.
    if (typeof window === 'undefined') {
      return (varlockEnv as unknown as Record<string, unknown>)[prop];
    }
    // Client-side: fall back to the statically-inlined process.env values.
    if (prop === 'NEXT_PUBLIC_BACKEND_URL') {
      return process.env.NEXT_PUBLIC_BACKEND_URL;
    }
    if (prop === 'NEXT_PUBLIC_CSRF_ENABLED') {
      return process.env.NEXT_PUBLIC_CSRF_ENABLED === 'true';
    }
    return (varlockEnv as unknown as Record<string, unknown>)[prop];
  },
});
