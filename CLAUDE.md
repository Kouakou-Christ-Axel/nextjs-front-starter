# Conventions

- Application en français uniquement : textes en dur dans les composants, pas de couche i18n.
- Alias `@/*` vers la racine, partout (y compris `proxy.ts` si possible).
- Une feature = un dossier `features/<nom>/` avec `components/`, `schemas/`, `requests/`, `types/`, `hooks/`. L'UI d'une feature n'est pas dans `components/`, qui ne contient que `ui/` (shadcn) et `providers/`.
- Fichiers en kebab-case avec suffixe de rôle : `*.type.ts`, `*.schema.ts`, `*.request.ts`. Tests colocalisés en `*.test.ts(x)`.
- Pas de barrel `index.ts`.
- Composants UI : on ajoute les composants shadcn à la demande, on ne garde pas de composant inutilisé.
- Variables d'environnement : `config/env.ts` (Zod), accès littéraux `process.env.NEXT_PUBLIC_*`.
- Formulaires : react-hook-form + `zodResolver`, messages d'erreur directement en français dans le schéma Zod.
- Erreurs API : tout passe par `ApiError`.

## Commentaires

- Aucun commentaire qui redit le code, pas de code commenté, pas de bannières.
- Un commentaire n'explique qu'un pourquoi non évident (sécurité, contournement, contrainte externe), en français.

## Vérifications avant commit

`pnpm lint && pnpm typecheck && pnpm test:run && pnpm build` (le build nécessite `NEXT_PUBLIC_BACKEND_URL`).
