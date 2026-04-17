# Design : commande `/feature`

**Date :** 2026-04-17
**Statut :** approuvé

---

## Objectif

Créer une commande slash `/feature <nom>` qui scaffolde la structure complète d'une nouvelle feature métier dans ce starter Next.js, en respectant les conventions du projet.

---

## Approche retenue

**Commande markdown avec templates embarqués** (`.claude/commands/feature.md`).  
Claude lit le fichier, adapte les templates au nom de la feature passé en argument, et crée les fichiers un par un.

Pas de script externe. Les templates sont visibles et modifiables directement dans la commande.

---

## Structure générée

Pour `/feature invoice` :

```
features/invoice/
  types/
    invoice.type.ts
  schemas/
    invoice.schema.ts
  api/
    invoice.request.ts
  queries/
    query-keys.ts
    use-invoice-list.query.ts
    use-invoice-list.query.test.ts
    use-invoice.query.ts
    use-invoice.query.test.ts
  mutations/
    use-create-invoice.mutation.ts
    use-create-invoice.mutation.test.ts
    use-update-invoice.mutation.ts
    use-update-invoice.mutation.test.ts
    use-delete-invoice.mutation.ts
    use-delete-invoice.mutation.test.ts
  hooks/                              ← créé vide, non peuplé
  index.ts
```

**Règles de nommage :**

- Tous les fichiers en kebab-case
- Hooks de query : `use-{name}.query.ts` → export `use{Name}Query`
- Hooks de liste : `use-{name}-list.query.ts` → export `use{Name}ListQuery`
- Hooks de mutation : `use-{verb}-{name}.mutation.ts` → export `use{Verb}{Name}Mutation`
- Tests co-localisés avec le fichier testé

---

## Contenu des fichiers

### `types/{name}.type.ts`

```ts
export interface I {
  Name;
}
{
  id: string;
  // TODO: ajouter les champs du domaine
}
```

### `schemas/{name}.schema.ts`

```ts
import { z } from 'zod';

export const create{Name}Schema = z.object({
  // TODO
});

export const update{Name}Schema = create{Name}Schema.partial();

export type Create{Name}SchemaType = z.infer<typeof create{Name}Schema>;
export type Update{Name}SchemaType = z.infer<typeof update{Name}Schema>;
```

### `api/{name}.request.ts`

```ts
import { api } from '@/lib/api-client';
import type { I{Name} } from '../types/{name}.type';
import type { Create{Name}SchemaType, Update{Name}SchemaType } from '../schemas/{name}.schema';

export const get{Name}sRequest = () => api.get<I{Name}[]>('/{names}');
export const get{Name}Request = (id: string) => api.get<I{Name}>(`/{names}/${id}`);
export const create{Name}Request = (data: Create{Name}SchemaType) => api.post<I{Name}>('/{names}', data);
export const update{Name}Request = (id: string, data: Update{Name}SchemaType) => api.put<I{Name}>(`/{names}/${id}`, data);
export const delete{Name}Request = (id: string) => api.delete<void>(`/{names}/${id}`);
```

### `queries/query-keys.ts`

```ts
export const {name}Keys = {
  all: ['{names}'] as const,
  list: () => [...{name}Keys.all, 'list'] as const,
  detail: (id: string) => [...{name}Keys.all, 'detail', id] as const,
};
```

### `queries/use-{name}-list.query.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { get{Name}sRequest } from '../api/{name}.request';
import { {name}Keys } from './query-keys';

export const use{Name}ListQuery = () =>
  useQuery({
    queryKey: {name}Keys.list(),
    queryFn: async () => (await get{Name}sRequest()).data,
  });
```

### `queries/use-{name}.query.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { get{Name}Request } from '../api/{name}.request';
import { {name}Keys } from './query-keys';

export const use{Name}Query = (id: string) =>
  useQuery({
    queryKey: {name}Keys.detail(id),
    queryFn: async () => (await get{Name}Request(id)).data,
    enabled: !!id,
  });
```

### `mutations/use-create-{name}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create{Name}Request } from '../api/{name}.request';
import { {name}Keys } from '../queries/query-keys';

export const useCreate{Name}Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create{Name}Request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: {name}Keys.list() }),
  });
};
```

### `mutations/use-update-{name}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { update{Name}Request } from '../api/{name}.request';
import { {name}Keys } from '../queries/query-keys';
import type { Update{Name}SchemaType } from '../schemas/{name}.schema';

export const useUpdate{Name}Mutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Update{Name}SchemaType) => update{Name}Request(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: {name}Keys.list() });
      queryClient.invalidateQueries({ queryKey: {name}Keys.detail(id) });
    },
  });
};
```

### `mutations/use-delete-{name}.mutation.ts`

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { delete{Name}Request } from '../api/{name}.request';
import { {name}Keys } from '../queries/query-keys';

export const useDelete{Name}Mutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: delete{Name}Request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: {name}Keys.list() }),
  });
};
```

### Tests (structure de base, co-localisés)

Exemple `queries/use-{name}-list.query.test.ts` :

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { use{Name}ListQuery } from './use-{name}-list.query';

vi.mock('../api/{name}.request');

describe('use{Name}ListQuery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne la liste des {names}', async () => {
    // TODO: implémenter
  });
});
```

Même structure pour chaque query et mutation.

### `index.ts`

```ts
export * from './queries/use-{name}-list.query';
export * from './queries/use-{name}.query';
export * from './mutations/use-create-{name}.mutation';
export * from './mutations/use-update-{name}.mutation';
export * from './mutations/use-delete-{name}.mutation';
export * from './types/{name}.type';
export * from './schemas/{name}.schema';
```

---

## Ce que la commande NE génère pas

- `hooks/` — peuplé manuellement selon le contexte (filtres, formulaires UI…)
- `components/features/{name}/` — décidé au cas par cas
- Pages `app/[locale]/…`
- Fichiers i18n

---

## Conventions clés rappelées

- Tout en **kebab-case**
- Suffixe `.query.ts` / `.mutation.ts` dans les noms de fichiers ET les noms d'exports
- Les hooks ne font **jamais** de `fetch` direct — ils passent par `api/`
- `invalidateQueries` systématique dans les `onSuccess` des mutations
- Tests co-localisés avec le fichier testé
