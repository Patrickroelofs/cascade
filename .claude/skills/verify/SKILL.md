---
name: verify
description: Build, run, and drive apps/app end-to-end in a headless environment (local Postgres, built server, Playwright).
---

# Verifying apps/app end-to-end

## Database (no docker daemon in remote sessions)

Postgres 16 is installed but can't run as root; run it as `nobody` from a
directory `nobody` can traverse (e.g. `/tmp/pg`, not the session scratchpad):

```bash
mkdir -p /tmp/pg/data /tmp/pg/run && chown -R nobody /tmp/pg
su -s /bin/bash nobody -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pg/data -U postgres --auth=trust"
su -s /bin/bash nobody -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pg/data -o '-p 5432 -k /tmp/pg/run -c listen_addresses=localhost' -l /tmp/pg/log start"
psql -h localhost -U postgres -c "ALTER USER postgres PASSWORD 'postgres'; " && psql -h localhost -U postgres -c "CREATE DATABASE cascade;"
```

## App server

```bash
cd apps/app
sed 's/change-me-to-a-random-string-of-32-plus-chars/<any-32+-char-string>/' .env.local.example > .env.local
pnpm db:migrate      # or db:push
pnpm build && node --env-file=.env.local .output/server/index.mjs   # port 3001
```

Unauthenticated `/` responds **307** to the web app's `/login` — that's the
healthy signal (apps/web isn't needed for apps/app verification). Create and
sign in a user via better-auth REST (same as `e2e/support/auth.ts`):
`POST /api/auth/sign-up/email` then `/api/auth/sign-in/email`, both with an
`origin: http://localhost:3001` header.

## Playwright / e2e suite

- The pinned Playwright may want a browser build that isn't in
  `/opt/pw-browsers`. For scripts use
  `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`; for the
  e2e suite, symlink the expected `chromium_headless_shell-*` dir to
  `/opt/pw-browsers/chromium-*/chrome-linux/chrome` and `touch
  INSTALLATION_COMPLETE` in it.
- The e2e `webServer` (build + tsc) can exceed the 120s timeout in slow
  environments, and its readiness URL `http://localhost:3001` fails because
  the 307 redirects to the dead :3000. Workaround: after `pnpm build`, run
  with a temporary config copy whose `webServer.command` is just
  `node --env-file-if-exists=.env.local .output/server/index.mjs` and whose
  `url` is `http://localhost:3001/favicon.ico` (no redirect). Delete the copy
  before committing.
- Ad-hoc `.mjs` driver scripts must live inside `apps/app` (ESM ignores
  `NODE_PATH`), e.g. `apps/app/.verify-*.mjs`; delete before committing.

## Gotchas

- oRPC wire format: `POST /api/rpc/<dot.path.as/slashes>` with JSON body
  `{"json": <input>}`; errors come back as `{"json":{"code":...}}`.
- TanStack Query focus refetch listens for `visibilitychange` on `window` —
  simulate a tab switch with
  `page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")))`.
