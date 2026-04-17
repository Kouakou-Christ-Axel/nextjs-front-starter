# Architecture

Ce document décrit comment le starter est organisé, pourquoi les choix ont été faits, et quelles règles suivre quand on ajoute du code.

Pour le démarrage rapide et la liste des features, voir le [README](../README.md).

## Sommaire

1. [Principes directeurs](#1-principes-directeurs)
2. [Vue d'ensemble](#2-vue-densemble)
3. [Les couches et leurs responsabilités](#3-les-couches-et-leurs-responsabilités)
4. [Flux d'une requête (exemple : login)](#4-flux-dune-requête-exemple--login)
5. [Routing : i18n + public/protected](#5-routing--i18n--publicprotected)
6. [Auth — strategy pattern](#6-auth--strategy-pattern)
7. [Transport HTTP — api-client](#7-transport-http--api-client)
8. [Gestion des erreurs](#8-gestion-des-erreurs)
9. [Cache React Query](#9-cache-react-query)
10. [Providers](#10-providers)
11. [Validation d'environnement](#11-validation-denvironnement)
12. [Exigences backend liées à la sécurité](#12-exigences-backend-liées-à-la-sécurité)
13. [Design system](#13-design-system)
14. [Conventions](#14-conventions)
15. [Ajouter une nouvelle feature](#15-ajouter-une-nouvelle-feature)

---

## 1. Principes directeurs

Trois principes guident toute l'organisation :

### 1.1 Séparation logique / UI

On a **deux dossiers portant le nom d'un domaine** :

- `features/<domaine>/` — la **logique** (types, schémas, requêtes, stratégies, hooks).
- `components/features/<domaine>/` — les **composants visuels** qui consomment cette logique.

Le premier est **importable depuis n'importe où** (y compris serveur).
Le second est **purement UI** et ne fait que brancher des hooks sur du JSX.

> Exemple : `features/auth/` contient le strategy pattern et les hooks. `components/features/auth/` contient `login-form.tsx` et `register-form.tsx`.

### 1.2 Découplage via interfaces

Quand plusieurs implémentations sont possibles (auth par JWT vs OAuth, mock pour les tests…), on passe par une **interface** et on injecte l'implémentation via une factory. Les composants ne connaissent que l'interface, jamais l'implémentation concrète.

### 1.3 Backend-agnostique

Ce repo est **100 % front**. Pas de Route Handler (`app/api/…`), pas d'ORM, pas de Server Action qui parle à une DB. Le front parle HTTP à un backend externe via `NEXT_PUBLIC_BACKEND_URL`.

> Conséquence : si tu as besoin d'un endpoint, tu l'ajoutes côté backend et tu crées une fonction dans `features/<domaine>/requests/`.

---

## 2. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRÉSENTATION                             │
│  app/[locale]/**  +  components/{ui, features, animate-ui}      │
└────────────────────────────┬────────────────────────────────────┘
                             │ consomme
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOOKS DE DOMAINE                             │
│  features/<domaine>/lib/  (useUser, useLogin, …)                │
│  Produits par des FACTORIES (ex: createAuth)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ délègue à
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STRATÉGIES                                   │
│  features/<domaine>/strategies/  (jwtStrategy, …)               │
│  Implémentent une INTERFACE (AuthStrategy)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ utilise
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REQUÊTES                                     │
│  features/<domaine>/requests/  (fonctions pures)                │
└────────────────────────────┬────────────────────────────────────┘
                             │ appelle
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSPORT                                    │
│  lib/api-client.ts  (fetch wrapper, ApiResponse, ApiError)      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
                             ▼
                   BACKEND EXTERNE
```

**Règle d'or** : une couche ne connaît que celle juste en dessous. Un composant n'appelle **jamais** `api.post` directement — il passe par un hook de feature.

---

## 3. Les couches et leurs responsabilités

| Couche                 | Emplacement                                  | Rôle                                                   |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------ |
| **Pages / Layouts**    | `app/[locale]/**`                            | Routing, composition, Server/Client split              |
| **Composants UI**      | `components/ui/`                             | Briques génériques (Button, Input, Form…)              |
| **Composants feature** | `components/features/<domaine>/`             | Composants liés à un domaine (LoginForm…)              |
| **Providers**          | `components/providers/`                      | Contextes (ReactQuery, Theme, User…)                   |
| **Queries serveur**    | `features/<domaine>/queries/`                | Hooks `useQuery` (state serveur, lecture)              |
| **Mutations serveur**  | `features/<domaine>/mutations/`              | Hooks `useMutation` (state serveur, écriture)          |
| **Hooks UI**           | `features/<domaine>/hooks/`                  | Hooks état client/UI (filtres, formulaires…)           |
| **Stratégie**          | `features/<domaine>/strategies/`             | Implémentations de l'interface métier (auth only)      |
| **Requêtes**           | `features/<domaine>/api/`                    | Fonctions qui appellent `api`                          |
| **Schémas**            | `features/<domaine>/schemas/`                | Zod pour les formulaires                               |
| **Types**              | `features/<domaine>/types/`                  | Interfaces TypeScript du domaine                       |
| **Transport**          | `lib/api-client.ts`, `lib/api-error.ts`      | fetch + erreurs, **neutre au domaine**                 |
| **Utils**              | `lib/utils.ts`, `lib/get-strict-context.tsx` | Helpers génériques                                     |
| **Hooks génériques**   | `hooks/`                                     | Pas liés à un domaine (use-mobile, use-is-in-view)     |
| **Config**             | `config/`                                    | `env.ts`, `site-config.ts`, `navbar-config.ts`         |
| **i18n**               | `i18n/`                                      | Routing, loader, messages JSON                         |
| **Types globaux**      | `types/`                                     | `ApiResponse`, etc.                                    |
| **Middleware**         | `proxy.ts`                                   | next-intl (peut être étendu, cf. roadmap auth serveur) |

---

## 4. Flux d'une requête (exemple : login)

Scénario : l'utilisateur clique sur "Se connecter" dans `LoginForm`.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LoginForm (components/features/auth/login-form.tsx)      │
│    useForm({ resolver: zodResolver(loginSchema) })          │
│    onSubmit(data) → loginMutation.mutate(data)              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. useLogin() (importé depuis lib/auth.ts)                  │
│    Produit par createAuth(...) dans features/auth/lib/      │
│    useMutation({                                            │
│      mutationFn: strategy.login,                            │
│      onSuccess: (user) => queryClient.setQueryData(...)     │
│    })                                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. jwtStrategy.login (features/auth/strategies/)            │
│    return (await loginUserRequest(credentials)).data        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. loginUserRequest (features/auth/requests/)               │
│    return api.post<IUser>('/auth/login', data)              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. api.post (lib/api-client.ts)                             │
│    fetch(`${BACKEND_URL}/auth/login`, {                     │
│      method: 'POST', credentials: 'include', body: …        │
│    })                                                       │
│    si !ok → throw new ApiError(status, message, body)       │
│    sinon → return ApiResponse<IUser>                        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                     BACKEND (HTTP + cookie httpOnly)
```

**Au retour** :

- Si succès → `onSuccess` stocke l'`IUser` dans le cache sous la clé `['authenticated-user']`. Tous les composants qui utilisent `useUser()` re-rendent.
- Si erreur → `onError` est déclenché avec un `ApiError`. Le composant peut afficher l'erreur (toast, message inline, etc.).

---

## 5. Routing : i18n + public/protected

### 5.1 Middleware i18n

`proxy.ts` utilise `createMiddleware(routing)` de next-intl :

```ts
// i18n/routing.ts
defineRouting({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
});
```

Le matcher exclut `/api`, `/trpc`, `/_next`, `/_vercel` et les fichiers à extension. Pour toutes les autres routes, le middleware injecte un segment `[locale]` : `/login` → `/fr/login`.

### 5.2 Chargement des messages

`i18n/request.ts` lit dynamiquement **tous les JSON** de `i18n/messages/<locale>/` au render serveur. Chaque fichier devient un namespace :

```
i18n/messages/fr/auth.json      → useTranslations('auth')
i18n/messages/fr/home.json      → useTranslations('home')
i18n/messages/fr/validation.json→ useTranslations('validation')
```

> **Note** : ajouter un fichier JSON suffit, pas besoin de toucher au loader.

### 5.3 Route groups

Sous `app/[locale]/`, on a deux groupes (parenthèses = n'apparaissent pas dans l'URL) :

| Groupe         | Layout                          | Protection        |
| -------------- | ------------------------------- | ----------------- |
| `(public)/`    | `<Suspense fallback={Loading}>` | aucune            |
| `(protected)/` | `<UserClientProvider>`          | redirect si !user |

**`UserClientProvider`** :

```tsx
const { data: user, isLoading } = useUser();
if (!user && !isLoading) redirect('/login');
if (isLoading) return <Loading />;
return children;
```

⚠️ **Limitation actuelle** : la protection est **100 % côté client**. Un utilisateur qui désactive JS accède au HTML initial. À durcir avec un middleware serveur (voir Roadmap du README).

---

## 6. Auth — strategy pattern

### 6.1 Pourquoi

On veut pouvoir ajouter Google OAuth, Magic Link, ou un mock pour les tests **sans toucher aux composants ni aux hooks**. La factory `createAuth` abstrait la source de vérité.

### 6.2 L'interface

```ts
// features/auth/types/auth.type.ts
export interface AuthStrategy {
  getUser: () => Promise<IUser | null>;
  login: (credentials: LoginSchemaType) => Promise<IUser>;
  register?: (credentials: RegisterSchemaType) => Promise<IUser>;
  logout: () => Promise<void>;
  refresh?: () => Promise<IUser | null>;
}
```

`register` et `refresh` sont optionnels — tous les providers ne les supportent pas (Google OAuth n'a pas de register séparé).

### 6.3 Les implémentations

```ts
// features/auth/strategies/jwt.strategy.ts
export const jwtStrategy: AuthStrategy = {
  getUser: async () => (await getUserRequest()).data,
  login: async (c) => (await loginUserRequest(c)).data,
  register: async (c) => (await registerUserRequest(c)).data,
  logout: async () => {
    await logoutUserRequest();
  },
  refresh: async () => (await getRefreshUserRequest()).data,
};
```

Chaque méthode est un adaptateur mince : elle appelle la `request` et extrait `.data` de l'`ApiResponse`.

### 6.4 La factory

```ts
// features/auth/lib/create-auth.ts
export function createAuth(
  strategies: Record<string, AuthStrategy>,
  defaultStrategy: string = 'jwt'
) {
  const strategy = strategies[defaultStrategy];
  // ... retourne useUser, useLogin, useLogout, useRegister, useRefresh
}
```

**Ce que chaque hook fait :**

- **`useUser()`** — query React Query, clé `['authenticated-user']`, `staleTime: 60s`. **Intercepte les 401** : si `getUser()` throw un `ApiError(401)` et que la stratégie supporte `refresh`, elle appelle `refresh()` et met le nouveau user en cache. Transparent pour les composants.
- **`useLogin()`** — mutation. `onSuccess` → écrit le user en cache.
- **`useRegister()`** — mutation. Throw si la stratégie ne supporte pas `register`.
- **`useLogout()`** — mutation. `onSuccess` → met le cache à `null`.
- **`useRefresh()`** — mutation manuelle si besoin d'un rafraîchissement explicite.

### 6.5 Le point d'entrée unique

```ts
// lib/auth.ts
const { useUser, useLogin, useLogout, useRegister, useRefresh } = createAuth({
  jwt: jwtStrategy,
});

export { useUser, useLogin, useLogout, useRegister, useRefresh };
```

**Les composants importent toujours depuis `@/lib/auth`**, jamais depuis `features/auth/lib/create-auth` ni depuis une stratégie.

### 6.6 Ajouter un provider

```ts
// 1. Créer la stratégie
// features/auth/strategies/google.strategy.ts
export const googleStrategy: AuthStrategy = {
  getUser: async () => {
    /* … */
  },
  login: async () => {
    /* redirect vers Google, handle callback */
  },
  logout: async () => {
    /* … */
  },
};

// 2. L'enregistrer dans la factory
// lib/auth.ts
const { useUser, useLogin, useLogout } = createAuth(
  { jwt: jwtStrategy, google: googleStrategy },
  'jwt' // stratégie par défaut
);
```

Aucun composant ne change.

---

## 7. Transport HTTP — `api-client`

`lib/api-client.ts` expose un objet `api` avec `get/post/put/patch/delete`. Ce n'est **pas** axios (malgré la dépendance qu'on peut retirer) — c'est un wrapper `fetch` enrichi.

### 7.1 Ce qu'il fait

1. **Préfixe auto** : toutes les URLs sont préfixées par `NEXT_PUBLIC_BACKEND_URL`.
2. **Cookies transparents** :
   - Client : `credentials: 'include'`.
   - Serveur (RSC, Server Actions) : lit `cookies()` de `next/headers` et reforward dans le header `Cookie` (voir `getServerCookies`).
3. **Query params** : `api.get('/users', { params: { page: 1, limit: undefined } })` → `?page=1` (filtre `undefined`/`null`).
4. **Enveloppe typée** : toutes les réponses backend sont parsées en `ApiResponse<T> = { data: T, message?, errors? }`.
5. **Erreurs structurées** : `!response.ok` → `throw new ApiError<T>(status, message, body)`.
6. **Cache Next.js** : expose `cache` (`'no-store' | 'force-cache' | ...`) et `next` (pour `revalidateTag`).

### 7.2 Contrat de réponse backend

Le backend **doit** répondre selon la forme :

```ts
interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>; // validations
}
```

Si le backend ne suit pas ce contrat, il faut soit l'adapter, soit modifier `api-client.ts` pour normaliser.

### 7.3 Contrat cookies JWT côté backend

L'auth repose sur des cookies `httpOnly` posés par le backend. Le front ne peut pas _enforcer_ leur configuration (c'est un `Set-Cookie` émis côté serveur), mais il **dépend** de ces garanties pour être sécurisé. Le backend **doit** respecter :

- **`HttpOnly`** toujours — bloque `document.cookie`, défense de fond contre XSS.
- **`Secure`** en production — pas de cookie envoyé sur HTTP en clair.
- **`SameSite`** :
  - `Lax` si front et backend partagent le même _registrable domain_ (ex. `app.example.com` et `api.example.com`).
  - `Strict` pour le refresh token (jamais envoyé sur navigation cross-origin).
  - `None` **uniquement** si cross-site — et dans ce cas la protection CSRF devient obligatoire (double-submit token, header custom, etc.).
- **`Path`** le plus restrictif possible. Typiquement `/` pour l'access token, `/auth` pour le refresh token (il ne sort pas de ce scope).
- **Préfixe `__Host-`** recommandé (ex. `__Host-access_token`) — impose automatiquement `Secure`, `Path=/`, et interdit `Domain`. Défense supplémentaire contre les attaques de sous-domaine.
- **Pas de `Domain`** sauf nécessité absolue. Un cookie sans `Domain` reste attaché au host exact, ce qui est plus sûr.

Exemple de `Set-Cookie` attendu :

```
Set-Cookie: access_token=...; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=900
Set-Cookie: refresh_token=...; Path=/auth; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
```

> **Vérification CI** : même si le front ne pose pas ces cookies, un script peut _inspecter_ le header `Set-Cookie` renvoyé par `POST /auth/login` en CI et échouer si les flags manquent. C'est le seul point de contrôle front possible.

### 7.4 Cache par défaut et surcharge

L'`api-client` force `cache: 'no-store'` par défaut. C'est le bon choix pour tout ce qui touche à l'auth (on ne cache **jamais** `/auth/me`, sinon un utilisateur A pourrait voir les données d'un utilisateur B).

Pour des endpoints **publics et stables** (config site, catalogue public, référentiels), ce défaut sacrifie de la perf. On peut le surcharger explicitement au cas par cas :

```ts
// force-cache : met en cache indéfiniment (invalidation via revalidateTag)
api.get<ISiteConfig>('/site-config', { cache: 'force-cache' });

// ISR : revalide toutes les heures
api.get<IProduct[]>('/catalog', { next: { revalidate: 3600 } });
```

**Règle** : surcharger uniquement si l'endpoint est **non-authentifié** et que la donnée ne dépend pas de l'utilisateur. Dans le doute, garder `no-store`.

### 7.5 CSRF

Les cookies JWT sont envoyés automatiquement par le navigateur (`credentials: 'include'`), y compris sur des requêtes forgées depuis un site tiers. Sans défense, un attaquant peut déclencher une mutation au nom de la victime (**Cross-Site Request Forgery**).

La parade retenue est le **double-submit cookie** : le backend pose un cookie CSRF signé et renvoie la même valeur dans un header. Le front récupère la valeur, la réinjecte dans le header `X-CSRF-Token` sur chaque requête mutante. Un attaquant cross-origin peut envoyer le cookie (le navigateur le fait) mais ne peut pas lire sa valeur pour forger le header — la mutation est rejetée.

**Flux côté front** (`lib/csrf.ts` + intégration dans `lib/api-client.ts`) :

1. Avant chaque requête `POST/PUT/PATCH/DELETE`, si un token est absent du store en mémoire, appeler `GET /csrf-token`.
2. Injecter `X-CSRF-Token: <token>` dans les headers de la mutation.
3. Sur `403`, vider le store pour forcer un refetch au prochain appel (pas de retry automatique).
4. Le store est un singleton **module-level** — jamais de `localStorage` (vecteur XSS).

**Toggle** — `NEXT_PUBLIC_CSRF_ENABLED` (défaut `false`). Tant que le backend n'expose pas `/csrf-token`, la variable reste à `false` et le dance CSRF est court-circuité (rétrocompatibilité). À basculer à `true` quand le backend est prêt.

**Exigences backend** :

- Exposer `GET /csrf-token` qui **pose un cookie signé** (HttpOnly=false pour le pattern double-submit, SameSite=Lax, Secure en prod) et renvoie `{ csrfToken: "..." }`.
- Valider `X-CSRF-Token` sur toutes les routes mutantes (middleware `csrf-csrf` ou équivalent).
- Rejeter avec `403` si header manquant ou invalide.

**Limitation** : le check `typeof window !== 'undefined'` désactive le dance côté serveur (RSC). Les mutations server-side (Server Actions) nécessiteraient une stratégie dédiée — hors scope de cette version.

---

## 8. Gestion des erreurs

### 8.1 `ApiError<T>`

```ts
class ApiError<T = unknown> extends Error {
  status: number;
  body?: ApiResponse<T>; // contient errors (validation), message…
}
```

Toute erreur HTTP non-2xx traverse le code sous forme d'`ApiError`. Les composants peuvent tester :

```ts
onError: (error) => {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.body?.errors) {
      // erreurs de validation champ par champ
    } else {
      toast.error(error.message);
    }
  }
};
```

### 8.2 Principes

- **Ne jamais swallow** : pas de `catch { return null }` silencieux. Toujours re-throw ou gérer explicitement.
- **Erreur de réseau (fetch qui throw)** → `ApiError(500, ...)` dans le wrapper. On a donc **toujours** une `ApiError` en sortie, jamais un `Error` brut.
- **`useUser` est un cas spécial** : il _attrape_ le 401 pour tenter un refresh, puis re-throw si le refresh échoue.

---

## 9. Cache React Query

### 9.1 Clés

- `['authenticated-user']` — le user courant.
- (À étendre : convention recommandée `[<domaine>, <sous-clé>, ...params]`, ex. `['users', 'detail', userId]`.)

### 9.2 Invalidation

- `useLogin.onSuccess` / `useRegister.onSuccess` → `setQueryData(['authenticated-user'], user)`.
- `useLogout.onSuccess` → `setQueryData(['authenticated-user'], null)`.
- Un 401 capturé par `useUser` → `refresh()` puis `setQueryData(['authenticated-user'], newUser)`.

### 9.3 Config globale

`lib/react-query.ts` expose `queryConfig` utilisé par le provider. `staleTime` par défaut court, à ajuster au besoin par hook.

---

## 10. Providers

Ordre d'empilement dans `app/[locale]/layout.tsx` :

```
<ReactQueryProvider>         ← QueryClient + Devtools
  <ThemeProvider>            ← next-themes, toggle class sur <html>
    <NuqsAdapter>            ← query string typée
      <NextIntlClientProvider>   ← messages i18n côté client
        {children}
        <Toaster />          ← sonner (notifications)
```

**Pourquoi cet ordre** :

- **`ReactQueryProvider` tout en haut** — n'importe quel provider plus bas peut consommer le `QueryClient` s'il en a besoin (ex. : `UserClientProvider` dans `(protected)/`).
- **`ThemeProvider` avant tout rendu UI** — pour éviter un flash de thème incorrect.
- **`NextIntlClientProvider`** gère les traductions côté client ; les messages sont injectés par le `RootLayout` serveur.
- **`<Toaster />` à la racine** — un seul toaster pour toute l'app.

---

## 11. Validation d'environnement

La source de vérité est **`.env.schema`** (format [varlock](https://varlock.dev) / @env-spec). Chaque variable y déclare son type, sa sensibilité et sa valeur par défaut :

```
# @defaultRequired=infer @defaultSensitive=false
# @generateTypes(lang=ts, path=env.d.ts)
# ----------

# @required @type=url
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Le plugin `varlockNextConfigPlugin` (dans `next.config.ts`) charge et valide les variables au démarrage dev/build, et le décorateur `@generateTypes` produit `env.d.ts` (augmentation du module `varlock/env` + `ProcessEnv` globale).

Accès typé dans le code :

```ts
import { env } from '@/config/env'; // ré-export de ENV depuis 'varlock/env'
env.NEXT_PUBLIC_BACKEND_URL; // string, garanti non-vide par @required
```

**Conséquence** : si une variable `@required` manque, le build/dev plante avec un message clair. **Toujours importer `env` depuis `@/config/env`** (ou `ENV` depuis `varlock/env`) — jamais `process.env.X` directement dans le code applicatif.

**Ajouter une variable** :

1. La déclarer dans `.env.schema` avec les bons décorateurs (`@required`, `@type=...`, `@sensitive` si secret).
2. Lancer `bunx varlock typegen` pour rafraîchir `env.d.ts` (le plugin le fait au build, mais explicit c'est plus sûr en dev).
3. Si elle est `@required` sans default, la renseigner dans `.env.local`.

### 11.1 Secrets : server vs client

Quand on ajoutera des secrets serveur (clé webhook backend, DSN Sentry privée, clé d'API tierce, etc.) :

- Les déclarer avec **`@sensitive`** dans `.env.schema` — varlock empêche qu'ils soient inlinés dans le bundle navigateur (la règle Next.js est que seules les variables préfixées `NEXT_PUBLIC_*` le sont, mais `@sensitive` agit comme garde-fou explicite).
- Les variables préfixées **`NEXT_PUBLIC_*`** sont **inlinées dans le bundle navigateur** par Next.js. Elles sont publiques par construction — n'y mettre **aucun secret** (token, clé privée, mot de passe). Le préfixe actuel `NEXT_PUBLIC_BACKEND_URL` est légitime (c'est une URL publique).
- Vérifier que `.gitignore` couvre `.env*.local` à chaque ajout de secret local. `.env.schema` est tracké (décorateurs sans valeurs), `.env.local` ne l'est pas.
- `varlock scan` (CLI) permet de détecter les valeurs sensibles hardcodées dans les fichiers du projet.

---

## 12. Exigences backend liées à la sécurité

Certaines protections ne peuvent pas être implémentées côté front — elles doivent être garanties par le backend. Ce starter en dépend ; les lister ici évite de les oublier au moment de développer l'API.

### 12.1 Cookies JWT correctement configurés

Voir [§ 7.3 Contrat cookies JWT côté backend](#73-contrat-cookies-jwt-côté-backend). C'est la pierre angulaire de la sécurité de l'auth.

### 12.2 `POST /auth/register` en temps constant

Le handler d'inscription doit répondre en **temps constant**, que l'email existe déjà ou non. Concrètement : **toujours exécuter un hash bcrypt** (même valeur jetable si l'email est déjà pris) avant de retourner la réponse.

Sinon, un attaquant mesure la différence de latence entre « email inconnu » (pas de bcrypt) et « email déjà pris » (bcrypt exécuté) pour **énumérer les comptes** du système. bcrypt coûte ~100 ms, la différence est triviale à détecter statistiquement.

Rien à coder côté front : c'est une exigence de spec backend, à inscrire dans les critères d'acceptation de l'endpoint.

---

## 13. Design system

### 13.1 Tokens

Définis en CSS custom properties dans `app/globals.css` via `@theme inline` (Tailwind v4). Les variables sont accessibles comme utilitaires Tailwind : `bg-background`, `text-foreground`, `border-border`, etc.

### 13.2 Thème clair / sombre

- Géré par `next-themes` qui pose une classe `dark` sur `<html>`.
- Toggle : `components/ui/animated-theme-toggler.tsx`.
- Les tokens sont redéfinis sous `.dark { ... }` dans `globals.css`.

### 13.3 Composants

- **`components/ui/`** — briques de base (shadcn-style). `cn()` pour merger les classes, `class-variance-authority` pour les variants.
- **`components/animate-ui/`** — composants animés (registry maison déclaré dans `components.json`).
- **HeroUI** — dispo en complément si besoin de composants plus riches.

### 13.4 Utilitaire `cn`

```ts
import { cn } from '@/lib/utils';
cn('px-4 py-2', condition && 'bg-primary', className);
```

Combine `clsx` + `tailwind-merge` : résout les conflits de classes Tailwind (ex. `px-4` + `px-2` → `px-2`).

---

## 14. Conventions

### 14.1 Fichiers & nommage

- **kebab-case** pour les fichiers : `login-form.tsx`, `use-mobile.ts`.
- **Un composant par fichier**, nommé en PascalCase.
- **Aliases** : `@/*` = racine. Jamais de chemins relatifs profonds (`../../../`).

### 14.2 Imports

- Composants depuis `components/*`.
- Hooks génériques depuis `hooks/*`.
- Queries depuis `features/<domaine>/queries/*`, mutations depuis `features/<domaine>/mutations/*`.
- Hooks UI depuis `features/<domaine>/hooks/*`.
- Hooks auth depuis `lib/auth.ts` (réexport centralisé — exception au pattern général).
- `api` depuis `@/lib/api-client`.
- `env` depuis `@/config/env`.

### 14.3 Formulaires

Toujours :

1. Schéma Zod dans `features/<domaine>/schemas/`.
2. `useForm({ resolver: zodResolver(schema) })`.
3. Composants `Form*` de `components/ui/form.tsx`.
4. Messages d'erreur = **clés i18n** (ex. `'emailInvalid'`), traduites au render.

### 14.4 Réseau

- **Toute requête passe par `api`** (jamais de `fetch` direct dans un composant).
- Les fonctions de requête vivent dans `features/<domaine>/api/`.
- Un composant n'appelle **jamais** une request directement — il passe par un hook de `queries/` ou `mutations/`.

### 14.5 Erreurs

- Tout ce qui peut échouer via réseau remonte une `ApiError`.
- Pas de `catch` silencieux.
- Les mutations React Query gèrent `onError` pour l'UX (toast, form error, etc.).

### 14.6 i18n

- **Aucun texte hardcodé** dans les composants feature.
- Toujours `useTranslations('namespace')`.
- Ajouter la clé dans **les deux locales** (`en/*.json` et `fr/*.json`).

---

## 15. Ajouter une nouvelle feature

Checklist pour ajouter un nouveau domaine (ex. `posts`) :

```
features/posts/
  types/
    post.type.ts                         # interface IPost
  schemas/
    post.schema.ts                       # Zod schemas + types inférés
  api/
    post.request.ts                      # fonctions pures (getPostsRequest, …)
  queries/
    query-keys.ts                        # constantes de clés React Query
    use-posts.query.ts                   # useQuery liste  + use-posts.query.test.ts
    use-post.query.ts                    # useQuery détail + use-post.query.test.ts
  mutations/
    use-create-post.mutation.ts          # useMutation     + use-create-post.mutation.test.ts
    use-update-post.mutation.ts          #                 + use-update-post.mutation.test.ts
    use-delete-post.mutation.ts          #                 + use-delete-post.mutation.test.ts
  hooks/                                 # hooks UI (non générés — dépendent du contexte)
  index.ts                               # barrel export
```

1. **Types** : `features/posts/types/post.type.ts` → `interface IPost { … }`.
2. **Schémas** : `features/posts/schemas/post.schema.ts` → `createPostSchema`, etc.
3. **API** : `features/posts/api/post.request.ts` — fonctions pures qui appellent `api`.
4. **Query keys** : `features/posts/queries/query-keys.ts` — constantes centralisées.
5. **Queries** : un fichier `.query.ts` par hook de lecture (`use-posts.query.ts`, `use-post.query.ts`).
6. **Mutations** : un fichier `.mutation.ts` par hook d'écriture (`use-create-post.mutation.ts`, …).
7. **Composants UI** : `components/features/posts/post-list.tsx`, `post-form.tsx`.
8. **i18n** : `i18n/messages/{en,fr}/posts.json`.
9. **Pages** : `app/[locale]/(protected)/posts/page.tsx`.

> Si la feature nécessite plusieurs providers interchangeables (comme l'auth), ajouter une interface + factory comme `createAuth`. Ce pattern est **réservé à auth**.

---

## Pour aller plus loin

- [README](../README.md) — démarrage, stack, roadmap.
- [next-intl docs](https://next-intl.dev/docs/getting-started)
- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [shadcn/ui](https://ui.shadcn.com/)
