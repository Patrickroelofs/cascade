# Cascade → pnpm Monorepo: Overview

## Context

Cascade is currently a single-package repo (TanStack Start + Vite 8 + Tailwind v4 + Biome), already using pnpm with a trivial workspace (`pnpm-workspace.yaml` → `packages: ['.']`). A marketing website will be added later and must share the visual identity (Tailwind theme) and UI primitives with the app. This restructures the repo into a pnpm monorepo with the Tailwind theme and shared UI extracted into packages, then adds e2e and performance testing. No turbo/nx, no package build steps — packages ship TS/CSS source, consuming apps compile.

Scope decision: only **generic primitives** move to the UI package. `src/ui/nodes/` and `src/ui/lexical/` import app code (`@/core/nodes/*`, `@/orpc/client`) and stay in the app.

## Plans (execute in order)

Each plan ends with its own verification; the repo is fully working after every plan (safe commit points).

1. [01-workspace-restructure.md](01-workspace-restructure.md) — workspace root + move app to `apps/app/`
2. [02-theme-package.md](02-theme-package.md) — extract `@cascade/theme`
3. [03-ui-package.md](03-ui-package.md) — extract `@cascade/ui` + import rewrites
4. [04-e2e-testing.md](04-e2e-testing.md) — Playwright e2e suite
5. [05-performance-testing.md](05-performance-testing.md) — Lighthouse CI, bundle budget, interaction perf

## Target layout

```
cascade/
├── pnpm-workspace.yaml        # packages: apps/*, packages/*
├── package.json               # root: delegating scripts, biome, packageManager field
├── biome.json                 # stays at root (glob **/src/**/* covers packages)
├── docker-compose.yml         # stays at root
├── apps/
│   ├── app/                   # the Cascade product (current codebase)
│   │   └── e2e/               # Playwright e2e tests (plan 04)
│   └── marketing/             # FUTURE — not created now, layout accommodates it
└── packages/
    ├── theme/                 # @cascade/theme — Tailwind v4 CSS theme
    └── ui/                    # @cascade/ui — button, context-menu, generic-error, cva config
```

## Explicitly skipped (add when needed)

- No turbo/nx — 2 packages with no build steps need no task orchestration; add when the marketing app exists and CI times hurt.
- No package build/dist/tsup — apps compile package source; add only if packages are published externally.
- `apps/marketing` not scaffolded — created when the marketing site starts (it will consume `@cascade/theme` + `@cascade/ui` with the same 3 CSS lines as the app).
- No shared tsconfig-base package — two tsconfigs duplicating ~8 options is fine; extract when a third consumer appears.
- No CI workflows — none exist today; separate decision from this migration.
