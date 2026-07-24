# Proposal: a dedicated `apps/api` app for mobile + external integrations

Status: proposed (not yet implemented)
Related: #444

## Summary

To support a future mobile app and external integrations (including an MCP
client/server), add a third TanStack Start app, `apps/api`, that exposes a
stable, separately deployable API surface. It reuses the existing oRPC
router and procedures rather than rewriting them in a different framework
(e.g. NestJS) — the business logic and its type safety carry over unchanged;
what's missing today is non-cookie auth and a curated, versioned external
surface, not a different backend framework.

## Context

`apps/web-app` currently serves the outliner SSR pages and the oRPC API
(26 procedures across `nodes`, `premium`, `settings`, `tree-history`) from a
single Nitro process, mounted as TanStack Start routes
(`src/routes/api.rpc.$.ts`, `api.$.ts`, `api.auth.$.ts`). Every procedure is
built on one `authed` builder that validates a browser session cookie via
better-auth — there is no token-based auth and no procedure surface intended
for non-browser clients today.

`#444` asked whether the API should be pulled out into its own service (the
original suggestion was NestJS). Splitting it out wasn't justified on its
own — no observed scaling asymmetry, no second client, and no deploy
automation exists yet even for the two apps in the repo. Planned mobile +
external/MCP integrations change that: those clients need a stable, token
authenticated surface that isn't entangled with the SSR app's release cycle.
NestJS specifically would still cost more than it buys: it would mean
re-implementing 26 procedures' validation/DTOs by hand and losing oRPC's
end-to-end type inference with the existing web client, for framework
features (DI, decorators) that don't address anything mobile/MCP actually
need. Reusing the existing stack in a new TanStack Start app avoids that
cost entirely.

## Proposal

### Phase 0 — Extract shared packages (pure refactor, no behavior change)

- **`packages/db`** (new, `@cascade/db`): move `apps/web-app/src/db/schema.ts`
  and the drizzle client factory (currently `apps/web-app/src/db/index.ts`)
  here, along with `DATABASE_URL` env validation. Export `schema` and a
  `createDb(databaseUrl)` factory — not a singleton — so each app process
  builds its own connection. Update `drizzle.config.ts` and `apps/web-app`'s
  db scripts accordingly; rename `@/db` imports in `apps/web-app` to
  `@cascade/db`.
- **`packages/api-core`** (new): move the actual business logic —
  `apps/web-app/src/orpc/router.ts`, `context.ts`, and the `server/` folders
  of `nodes`, `premium`, `settings`, `tree-history` (~10k LOC). These files
  already depend only on `db` and `authed`, with no TanStack Start imports,
  so the move is mechanical. Client-side feature code (React
  components/hooks) stays in `apps/web-app`.
- Export a **factory**, not instances: `createRouter({ db, auth })`.
  better-auth instances shouldn't be shared across process boundaries —
  each app constructs its own `createAuth(db)` (from `@cascade/auth`,
  already framework-agnostic) bound to its own connection; the processes
  only need to agree on `BETTER_AUTH_SECRET` and schema for sessions to
  validate identically.
- `apps/web-app`'s existing routes keep working unchanged, importing the
  router from the new package instead of `src/orpc`.
- **Verification**: `pnpm build:app && pnpm test:app` unchanged, plus a
  manual smoke test of the outliner UI. This phase ships independently of
  the rest and is worth doing regardless of whether `apps/api` happens.

### Phase 1 — Scaffold `apps/api`

- New TanStack Start app shaped like `apps/website` (no Lexical/outliner
  deps), package name `api`, dev port `3002`.
- Constructs its own `db` (`@cascade/db`) and `auth`, calls
  `createRouter({ db, auth })` from `packages/api-core`.
- Routes:
  - `src/routes/openapi.$.ts` — `OpenAPIHandler`, same shape as today's
    `apps/web-app/src/routes/api.$.ts`. This is the mobile app's primary
    integration surface.
  - `src/routes/mcp.$.ts` — an MCP server wrapping a curated subset of
    procedures as MCP tools (MCP TypeScript SDK, streamable-HTTP
    transport).
  - `src/routes/oauth/*` — OAuth 2.1 authorization endpoints plus a couple
    of actually-rendered pages (consent screen, error states) for the MCP
    auth flow. This is the concrete reason this is a TanStack Start app
    rather than a bare HTTP server — a couple of real pages are needed
    here regardless.

### Phase 2 — Non-cookie auth

- Add an API-key/token plugin to the shared `createAuth` config in
  `packages/auth` (mobile gets a long-lived token after login; MCP/third
  party integrations get OAuth-issued scoped tokens).
- Add a parallel procedure builder in `packages/api-core`, e.g.
  `apiKeyAuthed`, alongside the existing `authed` — validates a bearer
  token instead of a session cookie.
- Define scopes per token (`nodes:read`, `nodes:write`, etc.) so an MCP
  integration can be granted less access than the mobile app's own token.

### Phase 3 — Surface curation

- In `apps/api`, define an explicit allowlisted router
  (`src/orpc/external-router.ts`) re-exporting only the procedures meant
  for external use, wrapped in `apiKeyAuthed` and scope checks. Internal
  only procedures (e.g. tree-history maintenance) stay unexposed.
- Version it from day one (`/v1/...`) since external clients can't be
  forced to upgrade in lockstep with internal deploys.

### Phase 4 — Cross-cutting

- CORS on `apps/api` needs to allow the mobile app's origin/bundle id and
  MCP client origins. `apps/web-app`'s CSP likely doesn't need to change,
  since the outliner UI keeps calling its own in-process RPC route as it
  does today.
- Extend CI (`typecheck.yml`, `test.yml`, `biome.yml`) filters and add
  `dev:api` / `build:api` / `test:api` scripts mirroring the existing
  `:app` / `:web` convention.
- There's no deploy automation for either existing app today — this is a
  natural point to set up deploy infra for all three processes together
  rather than adding a third unautomated deploy target.

## Alternatives considered

- **NestJS, as a separate service**: rejected — would require
  re-implementing all 26 procedures' validation/DTOs and lose oRPC's
  shared type inference with the web client, for framework features (DI,
  module decorators) that don't map to anything the stated goals
  (mobile app, external integrations, MCP) actually need.
- **No split, extend `apps/web-app` in place**: viable for the auth work
  (Phase 2) alone, but doesn't give mobile/external clients a surface that
  can be versioned, scaled, or deployed independently of the SSR app's
  release cycle — which is the actual gap once real external consumers
  are planned.

## Sequencing

Phase 0 is worth doing regardless of the rest — it's a good boundary on
its own and is fully reversible. Suggested order: **Phase 0 → Phase 2
(auth primitives, testable against the existing `apps/web-app` route
before `apps/api` exists) → Phase 1 (scaffold, mount curated router) →
Phase 3 → Phase 4.**

## Open questions

- Exact package name for the extracted business logic (`packages/api-core`
  used above as a placeholder).
- Whether `apps/api` needs cookie-based session support at all (e.g. for a
  future API-key management dashboard) or is strictly token-authed.
- Production deploy topology for three processes, given none exists yet
  for the current two.

## Verification (once implemented)

- Phase 0: `pnpm build:app && pnpm test:app` pass unchanged; manual UI
  smoke test.
- Phase 1: `pnpm dev:api` boots; `/openapi/...` responds and round-trips
  against the same Postgres instance as `apps/web-app`.
- Phase 2: automated test that a request with a valid API key succeeds and
  one without a valid key/token gets `401`.
- Phase 3: confirm an unlisted internal procedure is unreachable via the
  external router.
