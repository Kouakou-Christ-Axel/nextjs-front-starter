Scaffolde une nouvelle feature métier dans ce starter Next.js.

**Argument :** `$ARGUMENTS` est le nom de la feature en kebab-case (ex: `invoice`, `product`, `user-profile`).

## Dérivations à calculer avant de créer les fichiers

À partir de `$ARGUMENTS` (ex: `invoice`) :

| Variable    | Règle                               | Exemple    |
| ----------- | ----------------------------------- | ---------- |
| `{kebab}`   | `$ARGUMENTS` tel quel               | `invoice`  |
| `{Pascal}`  | PascalCase de `$ARGUMENTS`          | `Invoice`  |
| `{camel}`   | camelCase de `$ARGUMENTS`           | `invoice`  |
| `{kebabs}`  | pluriel de `{kebab}` (ajouter `s`)  | `invoices` |
| `{Pascals}` | pluriel de `{Pascal}` (ajouter `s`) | `Invoices` |

Pour les noms composés (`user-profile`) :

- `{Pascal}` = `UserProfile`
- `{camel}` = `userProfile`
- `{kebabs}` = `user-profiles`
- `{Pascals}` = `UserProfiles`

> **Pluriel irrégulier ?** Si le nom se termine par `s`, `x`, `ch`, `sh` ou nécessite un pluriel irrégulier (ex: `address` → `addresses`, `category` → `categories`), passe directement le pluriel correct dans `{kebabs}` et `{Pascals}` au lieu d'appliquer la règle automatique.

## Fichiers à créer

Crée chaque fichier ci-dessous dans l'ordre. Remplace toutes les variables par leurs valeurs dérivées.

---

### `features/{kebab}/types/{kebab}.type.ts`

```ts
export interface I{Pascal} {
  id: string;
  // TODO: ajouter les champs du domaine
}
```

---

### `features/{kebab}/schemas/{kebab}.schema.ts`

```ts
import { z } from 'zod';

export const create{Pascal}Schema = z.object({
  // TODO
});

export const update{Pascal}Schema = create{Pascal}Schema.partial();

export type Create{Pascal}SchemaType = z.infer<typeof create{Pascal}Schema>;
export type Update{Pascal}SchemaType = z.infer<typeof update{Pascal}Schema>;
```

---

### `features/{kebab}/api/{kebab}.request.ts`

```ts
import { api } from '@/lib/api-client';
import type { I{Pascal} } from '../types/{kebab}.type';
import type { Create{Pascal}SchemaType, Update{Pascal}SchemaType } from '../schemas/{kebab}.schema';

export const get{Pascals}Request = () =>
  api.get<I{Pascal}[]>('/{kebabs}');

export const get{Pascal}Request = (id: string) =>
  api.get<I{Pascal}>(`/{kebabs}/${id}`);

export const create{Pascal}Request = (data: Create{Pascal}SchemaType) =>
  api.post<I{Pascal}>('/{kebabs}', data);

export const update{Pascal}Request = (id: string, data: Update{Pascal}SchemaType) =>
  api.put<I{Pascal}>(`/{kebabs}/${id}`, data);

export const delete{Pascal}Request = (id: string) =>
  api.delete<void>(`/{kebabs}/${id}`);
```

---

### `features/{kebab}/queries/query-keys.ts`

```ts
export const {camel}Keys = {
  all: ['{kebabs}'] as const,
  list: () => [...{camel}Keys.all, 'list'] as const,
  detail: (id: string) => [...{camel}Keys.all, 'detail', id] as const,
};
```

---

### `features/{kebab}/queries/use-{kebab}-list.query.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { get{Pascals}Request } from '../api/{kebab}.request';
import { {camel}Keys } from './query-keys';

export const use{Pascal}ListQuery = () =>
  useQuery({
    queryKey: {camel}Keys.list(),
    queryFn: async () => (await get{Pascals}Request()).data,
  });
```

---

### `features/{kebab}/queries/use-{kebab}-list.query.test.ts`

```ts
import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use{Pascal}ListQuery } from './use-{kebab}-list.query';

vi.mock('../api/{kebab}.request');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use{Pascal}ListQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne la liste des {kebabs}', async () => {
    // TODO: mocker get{Pascals}Request et vérifier le résultat
    // renderHook(() => use{Pascal}ListQuery(), { wrapper: createWrapper() })
  });
});
```

---

### `features/{kebab}/queries/use-{kebab}.query.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { get{Pascal}Request } from '../api/{kebab}.request';
import { {camel}Keys } from './query-keys';

export const use{Pascal}Query = (id: string) =>
  useQuery({
    queryKey: {camel}Keys.detail(id),
    queryFn: async () => (await get{Pascal}Request(id)).data,
    enabled: !!id,
  });
```

---

### `features/{kebab}/queries/use-{kebab}.query.test.ts`

```ts
import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { use{Pascal}Query } from './use-{kebab}.query';

vi.mock('../api/{kebab}.request');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('use{Pascal}Query', () => {
  beforeEach(() => vi.clearAllMocks());

  it('est désactivé si id est vide', () => {
    // TODO: vérifier que enabled=false quand id=''
    // renderHook(() => use{Pascal}Query(''), { wrapper: createWrapper() })
  });

  it('retourne le {kebab} pour un id valide', async () => {
    // TODO: mocker get{Pascal}Request et vérifier le résultat
    // renderHook(() => use{Pascal}Query('some-id'), { wrapper: createWrapper() })
  });
});
```

---

### `features/{kebab}/mutations/use-create-{kebab}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create{Pascal}Request } from '../api/{kebab}.request';
import { {camel}Keys } from '../queries/query-keys';

export const useCreate{Pascal}Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create{Pascal}Request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: {camel}Keys.list() }),
  });
};
```

---

### `features/{kebab}/mutations/use-create-{kebab}.mutation.test.ts`

```ts
import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreate{Pascal}Mutation } from './use-create-{kebab}.mutation';

vi.mock('../api/{kebab}.request');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCreate{Pascal}Mutation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalide la liste après succès', async () => {
    // TODO: vérifier que invalidateQueries est appelé avec {camel}Keys.list()
    // renderHook(() => useCreate{Pascal}Mutation(), { wrapper: createWrapper() })
  });
});
```

---

### `features/{kebab}/mutations/use-update-{kebab}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { update{Pascal}Request } from '../api/{kebab}.request';
import { {camel}Keys } from '../queries/query-keys';
import type { Update{Pascal}SchemaType } from '../schemas/{kebab}.schema';

export const useUpdate{Pascal}Mutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Update{Pascal}SchemaType) => update{Pascal}Request(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {camel}Keys.list() });
      queryClient.invalidateQueries({ queryKey: {camel}Keys.detail(id) });
    },
  });
};
```

---

### `features/{kebab}/mutations/use-update-{kebab}.mutation.test.ts`

```ts
import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdate{Pascal}Mutation } from './use-update-{kebab}.mutation';

vi.mock('../api/{kebab}.request');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUpdate{Pascal}Mutation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalide la liste et le détail après succès', async () => {
    // TODO: vérifier que invalidateQueries est appelé pour list() et detail(id)
    // renderHook(() => useUpdate{Pascal}Mutation('some-id'), { wrapper: createWrapper() })
  });
});
```

---

### `features/{kebab}/mutations/use-delete-{kebab}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { delete{Pascal}Request } from '../api/{kebab}.request';
import { {camel}Keys } from '../queries/query-keys';

export const useDelete{Pascal}Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: delete{Pascal}Request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: {camel}Keys.list() }),
  });
};
```

---

### `features/{kebab}/mutations/use-delete-{kebab}.mutation.test.ts`

```ts
import { describe, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDelete{Pascal}Mutation } from './use-delete-{kebab}.mutation';

vi.mock('../api/{kebab}.request');

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDelete{Pascal}Mutation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalide la liste après suppression', async () => {
    // TODO: vérifier que invalidateQueries est appelé avec {camel}Keys.list()
    // renderHook(() => useDelete{Pascal}Mutation(), { wrapper: createWrapper() })
  });
});
```

---

### `features/{kebab}/hooks/.gitkeep`

Crée un fichier vide (aucun contenu) pour tracker le dossier `hooks/` dans git.

---

### `features/{kebab}/index.ts`

```ts
export * from './queries/use-{kebab}-list.query';
export * from './queries/use-{kebab}.query';
export * from './mutations/use-create-{kebab}.mutation';
export * from './mutations/use-update-{kebab}.mutation';
export * from './mutations/use-delete-{kebab}.mutation';
export * from './types/{kebab}.type';
export * from './schemas/{kebab}.schema';
```

---

## Résumé des fichiers créés

Après `/feature {kebab}`, tu auras :

```
features/{kebab}/
  types/{kebab}.type.ts
  schemas/{kebab}.schema.ts
  api/{kebab}.request.ts
  queries/
    query-keys.ts
    use-{kebab}-list.query.ts
    use-{kebab}-list.query.test.ts
    use-{kebab}.query.ts
    use-{kebab}.query.test.ts
  mutations/
    use-create-{kebab}.mutation.ts
    use-create-{kebab}.mutation.test.ts
    use-update-{kebab}.mutation.ts
    use-update-{kebab}.mutation.test.ts
    use-delete-{kebab}.mutation.ts
    use-delete-{kebab}.mutation.test.ts
  hooks/.gitkeep
  index.ts
```

## Prochaines étapes manuelles

1. Remplir `I{Pascal}` avec les vrais champs du domaine
2. Remplir `create{Pascal}Schema` avec les validations Zod
3. Créer les composants dans `components/features/{kebab}/` si besoin
4. Ajouter les traductions dans `i18n/messages/{en,fr}/{kebab}.json`
5. Créer les pages dans `app/[locale]/...`
