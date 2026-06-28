// Typed env access. Schema: ../.env.schema — Types: ../env.d.ts
// (auto-generated — run `pnpm exec varlock typegen` or rely on the plugin).
//
// varlock is wired in the official way: the `@next/env` override in
// pnpm-workspace.yaml + `varlockNextConfigPlugin` in next.config.ts load and
// validate the .env files. That makes the typed `ENV` available **server-side**.
//
// Client-side, however, varlock's resolved values are NOT inlined into the
// Turbopack browser chunks (verified by inspecting `.next/static` after a build:
// `ENV.*` values appear only in server chunks). Relying on `ENV` in the browser
// would yield `undefined` and silently break every client `fetch`
// (requests would hit `undefined/...`).
//
// So this module reads from the source that is reliably available on each side:
//   - server: varlock's `ENV` (typed, validated)
//   - client: `process.env.NEXT_PUBLIC_*`, which Next.js statically replaces at
//     build time under both Webpack and Turbopack.
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
