# Plan 04 — E2E testing (Playwright)

Playwright is already a devDependency but has no config or tests. Goal: a small, real e2e suite against the production build.

Depends on: plan 01 (paths); independent of 02–03.

## Steps

1. `apps/app/playwright.config.ts`:
   - `testDir: "./e2e"`, chromium only (add browsers when cross-browser bugs actually appear)
   - `webServer`: `command: "pnpm build && pnpm start"` (Nitro output), reuse existing server locally; `baseURL: http://localhost:3000`
   - trace `on-first-retry`
2. Database: e2e runs against the docker-compose Postgres with a seeded state — reuse the existing `db:push` + `db:seed` scripts. Keep it a documented manual prerequisite (`docker compose up -d && pnpm db:push && pnpm db:seed`); automate when it becomes friction.
3. `apps/app/e2e/` — 3 smoke specs covering the critical paths:
   - `home.spec.ts`: home route loads, node tree renders rows
   - `node.spec.ts`: navigate to a node (`/node/$nodeId`), edit content in the Lexical editor, reload, content persisted (exercises oRPC + Drizzle round-trip)
   - `settings.spec.ts`: toggle dark mode via the user menu, assert the `dark` variant applies and survives reload (exercises settings persistence)
4. Scripts: app `"test:e2e": "playwright test"`; root `"test:e2e": "pnpm --filter app test:e2e"`. Exclude `e2e/` from vitest's include glob so `pnpm test` stays unit-only.
5. `.gitignore`: add `playwright-report/`, `test-results/`.

## Verify

- `docker compose up -d` → `pnpm db:push && pnpm db:seed` → `pnpm test:e2e` passes locally
- Break one selector intentionally to confirm failures are readable, then restore
