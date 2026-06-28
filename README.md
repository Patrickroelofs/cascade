# Cascade

A self-hosted, plugin-based outliner. Every capability — from node editing to deletion — is a feature plugin. The core ships minimal; you extend it.

## Features

- Tree-based outliner with infinitely nestable nodes
- Self-hosted on your own infrastructure with a PostgreSQL database
- Plugin architecture: add, remove, or replace any feature
- Type-safe throughout — RPC, database queries, and routing

## Getting started

**Prerequisites:** Node.js 22+, pnpm, PostgreSQL (or Docker)

```bash
git clone https://github.com/patrickroelofs/cascade
cd cascade
pnpm install
```

Copy `.env.local.example` to `.env.local` and set:

```env
DATABASE_URL=postgres://user:password@localhost:5432/cascade
BETTER_AUTH_SECRET=your-secret
```

Start a local database:

```bash
docker compose up -d
```

Run migrations and seed:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Building for production

```bash
pnpm build
pnpm start
```

## Plugin system

Cascade is built around a feature plugin system. Everything — including the built-in node management, editing, and deletion — is a feature.

A feature is a single object registered in `cascade.config.ts`:

```ts
// cascade.config.ts
export default defineConfig({
  features: [nodesFeature, deleteNodeFeature, editNodeFeature, yourFeature],
});
```

### Anatomy of a feature

```ts
// src/features/my-feature/index.ts
import { defineFeature } from "#/core/feature";

export const myFeature = defineFeature({
  name: "my-feature",
  description: "Does something useful",
  dependencies: ["nodes"], // validated at startup

  // Drizzle table definitions
  schema: { myTable },

  // ORPC procedures exposed as RPC endpoints
  procedures: { myProcedure },

  // React components injected into named layout slots
  slots: {
    afterNodeActions: [MyActionComponent],
  },

  // Runs once at server startup
  hooks: {
    onInit: async (config) => {
      console.log("my-feature initialized");
    },
  },
});
```

### UI slots

Features inject React components into named slots rendered by the layout:

| Slot | Description |
|------|-------------|
| `topRightMenu` | Top-right toolbar area |
| `topLeftMenu` | Top-left toolbar area |
| `bottomRightMenu` | Bottom-right toolbar area |
| `bottomLeftMenu` | Bottom-left toolbar area |
| `afterNodeActions` | Actions appended to each node's context menu |
| `nodeText` | Replaces the node's text renderer |

### RPC procedures

Procedures contributed by features are merged into a single type-safe ORPC router and called from the client via TanStack Query:

```ts
import { orpc } from "#/orpc/client";
import { useQuery } from "@tanstack/react-query";

const { data } = useQuery(orpc.myProcedure.queryOptions({ ... }));
```

## Development

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm check        # Lint + format

pnpm db:generate  # Generate migration from schema changes
pnpm db:migrate   # Apply migrations
pnpm db:studio    # Open Drizzle Studio
```

## AI usage

This project is developed with AI assistance as a convenience. The rule is simple: use AI when you already know the solution and want to move faster; use your own brain when you don't. AI is a execution accelerator, not a thinking replacement. Reaching for it to figure out what to build, or to paper over a gap in understanding, produces code nobody truly understands and nobody can confidently maintain. Know the problem, know the solution, then let AI write the boilerplate.

## License

MIT
