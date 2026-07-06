# Plan 01 — Workspace restructure

Goal: proper workspace root, app lives in `apps/app/`, everything still runs. No package extraction yet.

## Steps

1. `pnpm-workspace.yaml`: change `packages` to `['apps/*', 'packages/*']`; keep the existing `allowBuilds` (better-sqlite3, esbuild).
2. New root `package.json`: `name: cascade-monorepo`, `private: true`, add `"packageManager": "pnpm@<current version>"` (missing today). Scripts delegate: `"dev": "pnpm --filter app dev"`, same for `build`, `test`, `start`, `preview`, `generate-routes`, `db:*`. Keep `format`/`format:write`/`lint`/`check` (Biome) at root with `@biomejs/biome` as the only root devDependency.
3. `git mv` into `apps/app/`: `src/`, `public/`, `vite.config.ts`, `tsconfig.json`, `tsr.config.json`, `drizzle.config.ts`, `vitest.shims.d.ts`, the current `package.json` (rename to `"name": "app"`, drop `@biomejs/biome`), `.env*` files. Root keeps: `pnpm-lock.yaml`, `biome.json`, `docker-compose.yml`, `.gitignore`, `README.md`, `LICENSE`, `.idea/`.
4. Path aliases (`#/*` and `@/*` → `./src/*`) keep working unchanged — tsconfig moves with the app. `drizzle.config.ts` paths are relative to the app dir, also unchanged.
5. `pnpm install` at root to regenerate the lockfile for the new layout.

## Verify

- `pnpm install` clean
- `pnpm build` (vite build && tsc --noEmit)
- `pnpm test`
- `pnpm dev` loads the app
- `pnpm check` (Biome) still covers `apps/app/src`
