# Next.js front starter

Starter Next.js (App Router) avec authentification par cookies, en français uniquement.

## Stack

| Domaine     | Outil                                         |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 16, React 19, TypeScript strict       |
| Style / UI  | Tailwind v4, shadcn/ui (Radix), `next-themes` |
| Données     | TanStack Query, client `fetch` maison         |
| Formulaires | react-hook-form + Zod                         |
| Qualité     | ESLint, Prettier, Vitest, Husky, lint-staged  |

## Démarrage

Prérequis : Node ≥ 22, pnpm ≥ 10.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## Variables d'environnement

Validées par Zod au chargement dans `config/env.ts`.

| Variable                   | Rôle                                            | Défaut  |
| -------------------------- | ----------------------------------------------- | ------- |
| `NEXT_PUBLIC_BACKEND_URL`  | URL du backend (obligatoire)                    | -       |
| `NEXT_PUBLIC_CSRF_ENABLED` | Envoie `X-CSRF-Token` sur les requêtes mutantes | `false` |

Toute nouvelle variable `NEXT_PUBLIC_*` s'ajoute au schéma **et** à l'objet passé à `parse`, avec un accès littéral (`process.env.NEXT_PUBLIC_X`), sans quoi Next ne l'inline pas côté client.

## Scripts

`pnpm dev`, `build`, `lint`, `typecheck`, `test`, `test:run`, `format`.

## Structure

```
app/                 routes (public) et (protected), error, global-error
components/ui/       composants shadcn
components/providers/ react-query, garde utilisateur
features/<domaine>/  components, schemas, requests, types, hooks du domaine
lib/                 api-client, csrf, safe-redirect, utils
middleware/          garde d'auth et CSP, appelés depuis proxy.ts
config/              env, site, cookies d'auth
```

## Authentification

- `proxy.ts` redirige vers `/login?returnTo=<chemin>` les routes `/dashboard/*` sans cookie de session.
- `UserClientProvider` (layout `(protected)`) appelle `useUser()` : redirection sur 401, message sur erreur transitoire.
- Après login, `safeRedirectTarget` valide `returnTo` (pas d'URL absolue, `//`, `javascript:`).

Le backend doit exposer `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/refresh`, avec des cookies httpOnly (`credentials: 'include'`, CORS et `SameSite` à configurer).

## Sécurité

En-têtes (`next.config.ts`), CSP en `Report-Only` avec nonce (`middleware/csp.ts`), CSRF optionnel, anti-énumération de comptes et gestion du 429 dans les hooks d'auth.

## Nouvelle feature

La commande `/feature <nom>` (`.claude/commands/feature.md`) génère `features/<nom>/`.
