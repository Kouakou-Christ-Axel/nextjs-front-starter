# nextjs-start

Starter Next.js perso, pensé pour démarrer vite un nouveau projet entre potes sans refaire dix fois la même plomberie (auth, i18n, thème, design system, React Query).

> Projet en cours — certaines features sont encore à finir (voir [Roadmap](#roadmap)).

## Sommaire

- [Stack](#stack)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Structure du projet](#structure-du-projet)
- [Architecture](#architecture)
- [Conventions](#conventions)
- [Roadmap](#roadmap)

> Pour la doc détaillée de l'architecture (couches, flux, patterns, conventions), voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

| Domaine        | Choix                                                             |
| -------------- | ----------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + React 19                                |
| Runtime        | Bun                                                               |
| Langage        | TypeScript 5                                                      |
| Styling        | Tailwind CSS 4 + `tw-animate-css`                                 |
| UI             | shadcn/ui (Radix) + HeroUI + registry maison `animate-ui`         |
| Animations     | Framer Motion / Motion                                            |
| Formulaires    | React Hook Form + Zod                                             |
| Data fetching  | TanStack Query v5 + wrapper `fetch` maison (`lib/api-client.ts`)  |
| i18n           | next-intl (FR par défaut, EN dispo)                               |
| Thème          | next-themes (light / dark)                                        |
| Toasts         | Sonner                                                            |
| Query string   | Nuqs                                                              |
| Validation env | [varlock](https://varlock.dev) (`.env.schema` + `@env-spec`)      |
| Lint / Format  | ESLint 9 (flat config) + Prettier + `prettier-plugin-tailwindcss` |
| Git hooks      | Husky + lint-staged                                               |

Pas d'ORM, pas de handler API dans ce repo : c'est un **front pur** qui tape sur un backend HTTP externe.

## Prérequis

- [Bun](https://bun.sh/) ≥ 1.1 (le projet est câblé sur Bun, `bun --bun next dev`)
- Un backend qui expose au minimum les endpoints `/auth/*` listés plus bas

## Démarrage rapide

```bash
bun install
# Crée .env.local en reprenant les valeurs de .env.schema
bun run dev                      # http://localhost:3000
```

Le site redirige automatiquement vers `/fr` (locale par défaut).

## Variables d'environnement

La source de vérité est **`.env.schema`** (format [varlock](https://varlock.dev)). Chaque variable y est déclarée avec ses décorateurs (`@required`, `@type=url`, `@sensitive`, etc.) et sa valeur par défaut :

```
# @required @type=url
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Pour surcharger en local, crée un `.env.local` (gitignoré) avec les mêmes clés. Le fichier `env.d.ts` (auto-généré par `bunx varlock typegen` ou par le plugin Next) donne le typage à l'accès via `ENV` ou `env`.

Accès typé dans le code :

```ts
import { env } from '@/config/env';
env.NEXT_PUBLIC_BACKEND_URL; // string, garanti non-vide
```

Si une variable `@required` manque au build/dev, varlock plante avec un message clair.

## Scripts

```bash
bun run dev       # dev server
bun run build     # build prod
bun run start     # run build prod
bun run lint      # ESLint
bun run format    # Prettier --write
```

Le hook `pre-commit` (Husky) lance `lint-staged` : Prettier + ESLint sur les fichiers modifiés.

## Structure du projet

```
nextjs-start/
├── app/[locale]/              # App Router + i18n
│   ├── (public)/              # Pages accessibles sans auth
│   │   ├── page.tsx           # Home
│   │   └── (auth)/            # /login, /register
│   └── (protected)/           # Pages protégées (UserClientProvider)
│       └── dashboard/
├── components/
│   ├── ui/                    # Composants shadcn-style (button, form, input, …)
│   ├── animate-ui/            # Registry maison (backgrounds, buttons animés)
│   ├── features/auth/         # login-form, register-form
│   └── providers/             # ReactQuery, Theme, UserClient
├── features/                  # Logique métier organisée par domaine
│   └── auth/
│       ├── lib/               # Factory createAuth
│       ├── requests/          # Appels backend
│       ├── schemas/           # Zod
│       ├── strategies/        # jwtStrategy, googleStrategy (stub)
│       └── types/
├── lib/                       # api-client, api-error, utils, auth (réexport hooks)
├── hooks/                     # use-mobile, use-is-in-view
├── config/                    # env, site-config, navbar-config
├── i18n/                      # routing, request loader, messages (en/, fr/)
├── types/                     # Types partagés (ApiResponse, …)
└── proxy.ts                   # Middleware next-intl
```

**Pourquoi deux dossiers `features` ?**

- `components/features/` → les **composants UI** d'une feature (formulaires, cartes, sections).
- `features/` (racine) → la **logique** (hooks, requests, schemas, types, strategies).

Ça permet de co-localiser la logique sans mélanger composants et code non-visuel.

## Architecture

### 1. Routing localisé

Toutes les routes passent par `app/[locale]/`. Le middleware `proxy.ts` (next-intl) détecte la locale et redirige au besoin.

Les locales sont configurées dans `i18n/routing.ts` :

```ts
locales: ['en', 'fr'];
defaultLocale: 'fr';
```

Les traductions vivent dans `i18n/messages/{en,fr}/*.json`. Le loader (`i18n/request.ts`) les charge dynamiquement selon la locale active.

Côté code :

```tsx
// Server Component
const t = await getTranslations('home');

// Client Component
const t = useTranslations('auth');
```

### 2. Routes publiques vs protégées

On utilise les **route groups** d'App Router :

- `app/[locale]/(public)/` : pas d'auth requise. Inclut `/login`, `/register`, la home.
- `app/[locale]/(protected)/` : enveloppé dans `<UserClientProvider>` qui appelle `useUser()`. Si l'utilisateur n'est pas authentifié → `redirect('/login')`.

La protection est **côté client** pour l'instant. Pour durcir, il faudra ajouter un middleware serveur (voir Roadmap).

### 3. Auth — pattern strategy

L'auth est découplée pour pouvoir brancher plusieurs providers sans toucher à l'UI.

```
┌──────────────────────┐
│   LoginForm, etc.    │  components/features/auth/
└──────────┬───────────┘
           │ utilise
           ▼
┌──────────────────────┐
│   useLogin, useUser… │  features/auth/lib/create-auth.ts
│   (hooks React Query)│  (factory)
└──────────┬───────────┘
           │ délègue à
           ▼
┌──────────────────────┐
│   AuthStrategy       │  features/auth/types/auth.type.ts
│   (interface)        │
└──────────┬───────────┘
           │ implémentée par
           ▼
┌──────────────────────┐
│ jwtStrategy          │  features/auth/strategies/jwt.strategy.ts
│ googleStrategy (stub)│
└──────────┬───────────┘
           │ appelle
           ▼
┌──────────────────────┐
│  auth.request.ts     │  features/auth/requests/
│  (fonctions fetch)   │
└──────────┬───────────┘
           │ via
           ▼
┌──────────────────────┐
│  api (api-client.ts) │  lib/
└──────────────────────┘
```

**Comment ajouter un provider (ex : Google OAuth)** :

1. Créer `features/auth/strategies/google.strategy.ts` qui implémente `AuthStrategy`.
2. L'enregistrer dans la factory :
   ```ts
   const { useUser, useLogin, … } = createAuth(
     { jwt: jwtStrategy, google: googleStrategy },
     'jwt' // stratégie par défaut
   );
   ```
3. Exposer les hooks depuis `lib/auth.ts`.

**Refresh automatique** : `useUser()` intercepte les `401` et appelle `strategy.refresh()` avant de refaire la requête. Tout ça est transparent pour les composants.

### 4. Client API

`lib/api-client.ts` expose un objet `api` avec `get/post/put/patch/delete`. Ce n'est **pas** axios (malgré la dépendance dans `package.json`, elle peut être retirée) — c'est un wrapper `fetch` qui :

- préfixe chaque URL avec `NEXT_PUBLIC_BACKEND_URL`,
- attache les cookies (cookies du navigateur côté client, `next/headers` côté serveur),
- parse la réponse en `ApiResponse<T>` et throw `ApiError<T>` sur `!response.ok`,
- supporte `params` (query string), `cache`, et `next` (ISR tags Next.js).

```ts
const { data } = await api.get<IUser>('/auth/me');
```

### 5. Endpoints backend attendus

Le backend (non inclus) doit au minimum exposer :

| Méthode | URL              | Rôle                          |
| ------- | ---------------- | ----------------------------- |
| POST    | `/auth/login`    | login email/password          |
| POST    | `/auth/register` | création compte               |
| POST    | `/auth/logout`   | invalidation session          |
| GET     | `/auth/me`       | user courant                  |
| GET     | `/auth/refresh`  | refresh JWT (cookie httpOnly) |

Les cookies sont envoyés avec `credentials: 'include'` → côté backend il faut configurer CORS + `SameSite` correctement.

### 6. Design system

- Tokens définis en CSS custom properties dans `app/globals.css` via `@theme inline` (Tailwind v4).
- Thème clair/sombre géré par `next-themes` (toggle dans `components/ui/animated-theme-toggler.tsx`).
- Composants de base (`components/ui/`) suivent les conventions shadcn : `cn()` pour merger les classes, variants via `class-variance-authority`.
- Deux registries shadcn configurés dans `components.json` (officiel + `@animate-ui`).

### 7. Providers

`app/[locale]/layout.tsx` empile les providers dans cet ordre :

```
<NextIntlClientProvider>
  <NuqsAdapter>
    <ThemeProvider>
      <ReactQueryProvider>
        {children}
      </ReactQueryProvider>
    </ThemeProvider>
  </NuqsAdapter>
</NextIntlClientProvider>
```

## Conventions

- **Aliases** : `@/*` pointe vers la racine (`tsconfig.json`).
- **Nommage fichiers** : kebab-case (`login-form.tsx`), un composant par fichier.
- **Features** : chaque domaine a sa pyramide `types → schemas → requests → strategies → lib (hooks)`.
- **Formulaires** : toujours `react-hook-form` + `zodResolver` + composants `Form*` de `components/ui/form.tsx`.
- **Erreurs API** : tout passe par `ApiError<T>` ; ne pas retourner de `null` silencieux.
- **i18n** : pas de texte hardcodé dans les composants "feature" — passer par `useTranslations`.

## Roadmap

### À corriger

- [ ] **Bug `useLogin`** : `onError` appelle `toast.success()` au lieu de `toast.error()` (`features/auth/lib/create-auth.ts:52`).
- [ ] Harmoniser les `onError` sur tous les hooks auth (`useRegister`, `useLogout`, `useRefresh` n'en ont pas).
- [ ] Compléter `hooks/use-mobile.ts` (actuellement vide/minimal).
- [ ] Implémenter `utils/handle-api-error.ts` (fichier vide).
- [ ] Remplir `config/navbar-config.ts` (vide).

### À finir

- [ ] **Dashboard** : page placeholder, à construire (layout, nav, widgets).
- [ ] **Bouton logout** : pas d'UI pour se déconnecter.
- [ ] **Page profil / settings** dans `(protected)/`.
- [ ] **Error boundary** : ajouter `app/[locale]/error.tsx` et `global-error.tsx`.
- [ ] **`googleStrategy`** : aujourd'hui c'est un stub `throw new Error('Not implemented')`.

### À durcir

- [ ] **Middleware d'auth serveur** : actuellement la protection est 100 % côté client (`UserClientProvider`). Ajouter un check dans `proxy.ts` (ou un middleware dédié) qui bloque les routes `(protected)` si le cookie de session est absent/invalide.
- [ ] **Refresh token** : logique présente dans `useUser`, mais jamais testée en conditions réelles.
- [ ] **Retirer `axios`** de `package.json` s'il n'est pas utilisé (on a notre wrapper `fetch`).

### Qualité

- [ ] **Tests** : rien n'est en place. Vitest + Testing Library pour l'unitaire, Playwright pour l'e2e.
- [ ] **CI** : GitHub Actions (lint + typecheck + build).
- [ ] **Commitlint** + Conventional Commits (optionnel).
- [ ] **Storybook** ou équivalent pour les composants UI (optionnel).

### Nice-to-have

- [ ] Page 404 plus soignée.
- [ ] Skeleton loaders génériques dans `components/ui/`.
- [ ] Helper `api.withSchema(zodSchema)` pour valider les réponses backend au runtime.
- [ ] Template d'`.env.example` enrichi (au fur et à mesure des features).
