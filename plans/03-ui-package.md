# Plan 03 — Extract @cascade/ui

Goal: shared primitives in a package, imports rewritten. Ships TS source directly — no build/dist; the consuming Vite app compiles it through the workspace symlink.

Depends on: plans 01–02.

## Steps

1. Move to `packages/ui/src/` (flat — 4 files, no subdirs):
   - `apps/app/src/ui/button.tsx`
   - `apps/app/src/ui/context-menu.tsx`
   - `apps/app/src/ui/error/generic-error.tsx` → `packages/ui/src/generic-error.tsx`
   - `apps/app/src/integrations/cva/cva.config.ts` → `packages/ui/src/cva.config.ts`
   Inside the package, imports are relative (`./cva.config`), no aliases.
2. Stays in the app (domain-coupled): `nodes/`, `lexical/`, `app-context-menu.tsx`, `user-menu.tsx`, `settings-context.tsx`.
3. `packages/ui/package.json`:
   ```json
   {
     "name": "@cascade/ui",
     "type": "module",
     "exports": { "./cva.config": "./src/cva.config.ts", "./*": "./src/*.tsx" },
     "peerDependencies": { "react": "^19" },
     "dependencies": { "@base-ui/react": "<copy version>", "cva": "<copy>", "tailwind-merge": "<copy>" }
   }
   ```
   Add `@phosphor-icons/react` only if the moved files import it. Keep `@base-ui/react`/`cva`/`tailwind-merge` in the app too — `src/ui/nodes` etc. still use them (pnpm dedupes).
4. `packages/ui/tsconfig.json`: mirror the app's compilerOptions (`moduleResolution: bundler`, `jsx: react-jsx`, `strict`, `noEmit`, `allowImportingTsExtensions`, `verbatimModuleSyntax`).
5. Add `"@cascade/ui": "workspace:*"` to the app; add to `apps/app/src/styles.css`:
   ```css
   @source "../../../packages/ui/src";
   ```
   Required — Tailwind v4 does not scan workspace deps for class names by default.
6. Rewrite imports in `apps/app/src` — both alias spellings exist (`@/` and `#/`):
   - `[@#]/ui/button` → `@cascade/ui/button`
   - `[@#]/ui/context-menu` → `@cascade/ui/context-menu`
   - `[@#]/ui/error/generic-error` → `@cascade/ui/generic-error`
   - `[@#]/integrations/cva/cva.config` → `@cascade/ui/cva.config`
   Known sites: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/node/$nodeId.tsx`, plus remaining `src/ui/**` files. Also grep for extension-suffixed imports (`ui/button.tsx`).
7. If Vite pre-bundling misbehaves on the workspace package, add `optimizeDeps.exclude: ["@cascade/ui"]` — expected unnecessary.

## Verify

- `pnpm build` — catches broken imports/types across the package boundary
- `pnpm test`
- `pnpm dev`: a `@cascade/ui` button renders **with styles** (missing styles = `@source` not working)
- `pnpm check` covers `packages/ui/src`
