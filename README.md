# Cascade

A self-hosted outliner.

## Features

- Tree-based outliner with infinitely nestable nodes, virtualized for large trees
- Self-hosted on your own infrastructure with a PostgreSQL database
- Type-safe throughout - RPC, database queries, and routing

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
```

Start a local database:

```bash
docker compose up -d
```

Apply the schema and seed:

```bash
pnpm db:push
pnpm db:seed
```

> Note: the `order` column must use `COLLATE "C"` (byte-order comparison for
> fractional-index keys). `db:push` can't express collation - on a fresh
> database run once:
> `ALTER TABLE nodes ALTER COLUMN "order" TYPE text COLLATE "C";`

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

## MCP

The app exposes an MCP (Model Context Protocol) server at `/api/mcp`
(e.g. `https://app.cascadelist.com/api/mcp`), so AI clients such as Claude
Code, Claude Desktop, or claude.ai connectors can work with your outline —
the full capability surface is available as tools: `get_outline`,
`list_nodes`, `get_node`, `get_ancestors`, `create_node`, `update_node_text`,
`set_node_type`, `move_node`, `set_expanded`, `delete_node`.

Authentication is OAuth 2.1: clients discover the authorization server via
`/.well-known` metadata, register themselves dynamically, and send you
through the regular login page plus a consent screen — no tokens to copy.

Connect from Claude Code:

```bash
claude mcp add --transport http cascade https://app.example.com/api/mcp
```

Self-hosting notes:

- The web app (`apps/web`) is the OAuth authorization server (it hosts the
  login and consent pages); the app (`apps/app`) hosts `/api/mcp`. Make sure
  `VITE_WEB_URL` (in `apps/app`) and `VITE_APP_URL` (in `apps/web`) point at
  each other's origins.
- The OAuth tables ship as a migration; apply schema changes with
  `pnpm db:push` (or `pnpm db:migrate:app`) after updating.
- Clients must request the outline as an OAuth resource; MCP clients that
  follow the current spec (2025-06-18) do this automatically.

## Development

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm check        # Lint + format

pnpm db:push      # Apply schema changes to the database
pnpm db:studio    # Open Drizzle Studio
```

## AI usage

This project is developed with AI assistance as a convenience. The rule is simple: use AI when you already know the solution and want to move faster; use your own brain when you don't. AI is a execution accelerator, not a thinking replacement. Reaching for it to figure out what to build, or to paper over a gap in understanding, produces code nobody truly understands and nobody can confidently maintain. Know the problem, know the solution, then let AI write the boilerplate.
