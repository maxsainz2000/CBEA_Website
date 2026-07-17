# Task 14: Documentation and README

## Objective
Replace the default create-next-app README with project-specific documentation, fix the incorrect docs path in AGENTS.md, and create a committed `.env.example` so new contributors know which environment variables to set.

## Audit Reference
- **Findings:** P3-1 (AGENTS.md wrong path), P2-10 (default README)
- **Severity:** Polish
- **Context:** The README mentions Geist font, `next/font`, and the Vercel deploy button — none of which are used. `AGENTS.md` references `node_modules/next/dist/docs/` which does not exist in `next@15.5.20`.

## Files Created / Modified
- [MODIFY] [AGENTS.md](file:///c:/Users/Admin/Documents/CBEA_Website/AGENTS.md)
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)
- [NEW] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example) (may already exist from Task 09)

## Step-by-Step Instructions

### 1. Fix `AGENTS.md` — docs path

Replace the reference to the non-existent `node_modules/next/dist/docs/` with the official Next.js docs URL:

```markdown
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Verify every API against the official Next.js docs (https://nextjs.org/docs) before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
```

### 2. Replace `README.md`

Replace the entire file with project-specific setup instructions:

```markdown
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
| `SUPABASE_SERVICE_ROLE_KEY` | Local only | Service role key for DB seeding scripts. **Never deploy to production.** |
| `IS_E2E` | Test only | Set to `true` to enable mock auth for Playwright tests. Server-side only. |

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
- `Segoe UI` font stack with cross-platform fallbacks
- Tabular numerals on all currency figures
- Content before chrome — minimal decorative elements

See `cbea-metro-design/` for the full design package and `app/theme.css` for the Tailwind v4 token definitions.
```

### 3. Create `.env.example` (if not already created in Task 09)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: service role key for local DB seeding scripts only
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Optional: enable E2E mock auth in test environments (server-side only)
# IS_E2E=true
```

Ensure `.env.example` is NOT in `.gitignore` (`.gitignore` has `.env*` on line 34 — add an exception: `!.env.example`).

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Documentation best practice:** README should reflect the actual project, not the scaffold template.

## Automated Testing & Verification Plan

### Verification
```bash
# Ensure .env.example is not gitignored:
git check-ignore .env.example
# Expected: no output (file is tracked)

# Verify AGENTS.md no longer references non-existent path:
grep -c 'node_modules/next/dist/docs' AGENTS.md
# Expected: 0
```

## Acceptance Criteria
- [x] `README.md` describes the CBEA project, not the create-next-app template.
- [x] `README.md` includes Setup, Environment Variables, Scripts, and Stack sections.
- [x] `AGENTS.md` points to `https://nextjs.org/docs`, not `node_modules/next/dist/docs/`.
- [x] `.env.example` exists and contains no real credentials.
- [x] `.env.example` is not gitignored (add `!.env.example` to `.gitignore` if needed).
