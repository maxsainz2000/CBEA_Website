# CBEA Student Council Budget Transparency Portal

Public-facing budget transparency website for the CBEA Student Council at Cagayan State University – Aparri. Built with Next.js 15, React 19, Tailwind CSS v4, and Supabase.

## Features

- **Public side (`/`)** — Browse income/expense entries, see Collected/Spent/Remaining totals, filter by semester and category, free-text search. Mobile-first, print-friendly.
- **Admin side (`/admin`)** — Supabase-Auth-protected CRUD for council officers, with Metro-compliant inline delete confirmation.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials.
3. Run the SQL in `supabase/migration.sql` against your Supabase project.
4. Optionally run `supabase/seed.sql` for sample data.
5. `npm run dev`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Test only | Service role key for Playwright `globalSetup` (provisions test user) and `globalTeardown` (cleans up test residue). **Never deploy to production.** |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx vitest run` | All unit tests |
| `npx vitest run supabase/database.test.ts` | PGlite database tests |
| `npx playwright test` | Playwright E2E tests |

## Stack

Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Supabase · Zod · Vitest · Playwright

## Design System

The portal uses a strict Metro (Windows Phone 7) derivative design system. Key rules:
- Pure white background, black text, single Lime accent (`#8CBF26`)
- Zero shadows, zero gradients, zero corner radius
- **Exceptions:**
  1. Circular spinners and loading indicators use `rounded-full` (defined as `--radius-full: 9999px` in `app/theme.css`) — this is the only allowed deviation from the zero-radius rule.
  2. `--color-income` green (`#2d7a2d`) is used for income entries. Serves a semantic data-communication purpose: income (green) vs expense (red `#c81000`). Using Lime for both the primary accent and income would create ambiguity between interactive elements and data categories.
- `Segoe UI` font stack with cross-platform fallbacks
- Tabular numerals on all currency figures
- Content before chrome — minimal decorative elements

See `cbea-metro-design/` for the full design package and `app/theme.css` for the Tailwind v4 token definitions.
