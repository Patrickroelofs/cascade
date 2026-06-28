# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Type-check + build
pnpm test         # Run Vitest tests
pnpm lint         # Biome lint
pnpm check        # Biome format + lint

pnpm db:generate  # Generate Drizzle migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (dev)
pnpm db:studio    # Open Drizzle Studio
```

Local PostgreSQL via Docker: `docker compose up -d`. Requires `.env.local` with `DATABASE_URL` and `BETTER_AUTH_SECRET`.

## Stack

- **TanStack Start** (React 19 + SSR) + file-based routing in `src/routes/`
- **ORPC** for type-safe RPC with Zod validation, served at `/api/rpc/*`
- **Drizzle ORM** + PostgreSQL
- **TanStack Query** for client-side caching (hydrated from SSR)
- **Nitro** as the backend server, **Vite** for bundling, **Biome** for linting/formatting

## Architecture: Feature Plugin System

Cascade is built around a feature plugin system. Every capability is a self-contained `CascadeFeature` registered in `cascade.config.ts`.

### Feature anatomy

```
src/features/<name>/
  schema.ts       # Drizzle table definitions
  procedures.ts   # ORPC procedures (RPC handlers)
  components/     # React components
  index.ts        # defineFeature({ name, schema, procedures, slots, dependencies, hooks })
```

A feature can:
- Contribute **DB tables** via `schema`
- Contribute **RPC procedures** via `procedures` (merged into the top-level ORPC router at `src/orpc/router/index.ts`)
- Inject **UI components** into named layout **slots** (defined in `CascadeUISlots` in `src/core/feature.ts`)
- Declare **dependencies** on other features (validated at startup)
- Run **`onInit`** hook at server startup

### Adding a feature

1. Create `src/features/<name>/index.ts` using `defineFeature()`
2. Register it in `cascade.config.ts`

### UI Slots

Named slots in `CascadeUISlots` (`src/core/feature.ts`): `topRightMenu`, `topLeftMenu`, `bottomLeftMenu`, `bottomRightMenu`, `afterNodeActions`, `nodeText`. Features push React components into these slots; `SlotsProvider` in `src/routes/__root.tsx` distributes them via context (`src/core/slots-context.tsx`).

New slots can be added to `CascadeUISlots` when no existing slot fits — define the slot interface there, then render it in the appropriate layout component.

### RPC

ORPC procedures are assembled from all features in `src/orpc/router/index.ts` and exposed via `src/routes/api.rpc.$.ts`. The typed client + TanStack Query hooks live in `src/orpc/client.ts`.

### Path alias

`#/` maps to `src/` (configured in `tsconfig.json` and `vite.config.ts`).
