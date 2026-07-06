# Plan 02 — Extract @cascade/theme

Goal: Tailwind theme shared via a package, ready for the marketing site. Tailwind v4 is CSS-first — the "config" is a CSS file, not JS.

Depends on: plan 01.

## Steps

1. `packages/theme/package.json`: `name: "@cascade/theme"`, `"exports": { ".": "./theme.css" }`. No dependencies.
2. `packages/theme/theme.css`: extract from `apps/app/src/styles.css` the `@theme` block (custom colors `--color-ginger`, `--color-redleather`, `--color-graphite`, `--color-peach`, `--color-dark-grey`) and the `@custom-variant dark` line.
3. `apps/app/src/styles.css` becomes:
   ```css
   @import "tailwindcss";
   @import "@cascade/theme";
   @plugin "@tailwindcss/typography";
   /* existing app-specific styles stay */
   ```
   Typography plugin stays app-side (only the app's Lexical content uses prose classes). The future marketing app repeats these imports — that's the point of the package.
4. Add `"@cascade/theme": "workspace:*"` to the app's dependencies; `pnpm install`.

## Verify

- `pnpm dev` — theme colors (e.g. `ginger`) render
- Dark-mode toggle still works (proves `@custom-variant dark` extraction)
- `pnpm build` clean
