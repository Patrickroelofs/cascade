# Plan 05 — Performance testing

Goal: catch regressions in load performance and bundle size with the cheapest tooling that gives a hard number. All measures run against the production build.

Depends on: plans 01 and 04 (Playwright config for the interaction spec).

## Steps

1. **Lighthouse CI** (`@lhci/cli` as app devDependency) — `apps/app/lighthouserc.json`:
   - `collect`: `startServerCommand: "pnpm start"` against the built output; URLs: `/` and one seeded `/node/$nodeId` route; 3 runs
   - `assert` budgets (starting points, tighten later): performance score ≥ 0.85, LCP ≤ 2.5s, TBT ≤ 300ms, CLS ≤ 0.1
   - Script: app `"perf": "lhci autorun"`, root delegates
2. **Bundle size budget**:
   - `rollup-plugin-visualizer` in `vite.config.ts`, gated behind `ANALYZE=1`, for inspection
   - Hard cap: a ~15-line `apps/app/scripts/check-bundle-size.mjs` that sums gzip sizes of `.output/public/**/*.js` and fails over a threshold (set to current size + 10% once measured). Wire as app `"perf:size"`, run after `build`.
3. **Interaction performance** (the virtual tree is the hot path): one Playwright spec `apps/app/e2e/perf.spec.ts` that loads a node with the seeded large tree, measures scroll + drag via `performance.now()` in-page, and asserts a generous ceiling (e.g. scroll handler < 100ms). Tagged `@perf` so it runs via `pnpm test:e2e --grep @perf`, not in the default suite.

## Skipped

- Server load testing (k6/artillery) — no production traffic yet; add when there's a deployment to protect.
- CI wiring — repo has no CI at all; when CI is added, the pipeline order is `build → test → test:e2e → perf`.

## Verify

- `pnpm build && pnpm perf` produces a Lighthouse report and passes budgets
- `pnpm perf:size` prints total gzip size and passes; temporarily set the threshold to 1 KB to confirm it fails loudly
- `pnpm test:e2e --grep @perf` passes against seeded data
