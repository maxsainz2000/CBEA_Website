# CBEA Budget Transparency Portal — Audit Remediation Plan (Session 2)

Remediate all findings from the [strict code audit](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT.md) dated 2026-07-12. The audit scored the project **56/100 (F)** — primarily due to a critical authentication backdoor shipped in production, 10 failing tests, and 6 design-system violations. This plan brings the project to production-readiness (**target: 90+/100, A**).

## User Review Required

> [!CAUTION]
> **P0-2 — Rotate the leaked Supabase service role key (MANUAL ACTION).** The `.env.local` in the distributed zip contains a real, live `SUPABASE_SERVICE_ROLE_KEY` for project `ikoogqwigvfylwjatids` (valid until 2036). This key bypasses RLS entirely. **You must rotate it immediately** in the Supabase dashboard (Settings → API → Reset `service_role` key), regardless of whether code fixes have been applied. Update your local `.env.local` with the new key after rotation.

> [!IMPORTANT]
> **E2E test strategy after backdoor removal.** Task 09 removes the `NEXT_PUBLIC_IS_E2E` client-side backdoor. The Playwright tests currently rely on this backdoor to authenticate. After the fix, E2E tests will use either:
> - **(a) Real Supabase Auth** — create a real `jane.doe@csu.edu.ph` user (you already have `scratch/create-test-user.ts`), or
> - **(b) Server-only mock** — gate mock auth behind `IS_E2E` (no `NEXT_PUBLIC_` prefix) so it never leaks to the client bundle.
>
> Option (a) is recommended. The `.env.local` already has real Supabase credentials.

> [!WARNING]
> **Numbered task continuation.** Session 1 tasks were `01`–`08`. This plan continues with `09`–`16` to preserve traceability across sessions.

## Open Questions

1. **E2E auth path** — Do you want to create a real Supabase Auth test user (`jane.doe@csu.edu.ph` / `Password123!`) for Playwright, or keep the server-only mock path? (Recommended: real user.)
2. **Migration deployment** — Task 15 splits `migration.sql` into a production-safe file and a local-only PGlite stub. Should the new migration be applied to your live Supabase project, or is it local-only for now?
3. **ISR revalidation interval** — Task 16 replaces `force-dynamic` with ISR. Is 60 seconds an acceptable staleness window for the public homepage?

---

## Proposed Changes

### P0 — Critical Security

#### Task 09 — Remove E2E Mock-Auth Backdoor

Centralize all authentication into a single `lib/auth/session.ts` helper. Strip the `NEXT_PUBLIC_IS_E2E` backdoor from middleware, login page, server actions, and all admin pages. Rename the env var to `IS_E2E` (server-only). Remove hard-coded credentials from client bundle. Remove service-role escalation from server actions.

**Files:**
- [NEW] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx)
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx)
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)
- [MODIFY] [.env.local](file:///c:/Users/Admin/Documents/CBEA_Website/.env.local)
- [NEW] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)

**Audit findings addressed:** S1, S3, S4, S6, S7

---

### P1 — Functional Failures

#### Task 10 — Fix Server Action Unit Tests

Refactor server actions to call `getOfficer()` from `lib/auth/session.ts` instead of dynamically importing `next/headers`. Update the test file to mock `lib/auth/session` instead of `next/headers`. All 9 currently-failing vitest cases should pass.

**Files:**
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts)

**Audit findings addressed:** P1-1 (9 failing vitest tests)

#### Task 11 — Fix Failing E2E and Lint Issues

Fix the stale Playwright `auth-flow.spec.ts > Valid Login` test selector (expects `<h2>` with "Welcome" but admin page uses `<h1>` "Officer Dashboard"). Fix the TypeScript error in `admin-crud.spec.ts:39`. Remove the unused `valErrors` variable.

**Files:**
- [MODIFY] [tests/auth-flow.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth-flow.spec.ts)
- [MODIFY] [tests/admin-crud.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/admin-crud.spec.ts)

**Audit findings addressed:** P1-2, P1-3, P1-4

---

### P2 — Design System & Code Quality

#### Task 12 — Design System Violations

Fix 6 design-system violations identified in §5.1:
1. Header padding reversed (`px-margin md:px-margin-mobile` → `px-margin-mobile md:px-margin`)
2. Active pivot tab underline (remove `border-b-2 border-primary`)
3. Headline font-weight no-op (use Tailwind `font-light` instead of non-functional `font-weight-headline-display`)
4. EntryForm card border (remove `border border-outline`)
5. Delete button color override (replace `text-expense!` with dedicated `.btn-ghost-danger` class)
6. Touch target size (bump inline action buttons from `h-10` to `h-12`)

**Files:**
- [MODIFY] [app/components/Header.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/Header.tsx)
- [MODIFY] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx)
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx)
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)

**Audit findings addressed:** P2-1, P2-2, P2-3, P2-4, P2-9, §5.1 table

#### Task 13 — Code Quality Cleanup

1. Remove 3 debug `console.log` statements from `EntryForm.tsx`
2. Extract duplicated `formatAmount` (3 components) into `lib/format/currency.ts`
3. Extract duplicated `formatDate` (2 components) into `lib/format/date.ts`
4. Move `createClient()` from `AdminHeader` component body into the `handleLogout` callback
5. Add `'scratch'` to vitest `exclude` array
6. Remove empty `if (isE2e && mockAuth)` block in `app/admin/edit/[id]/page.tsx`

**Files:**
- [NEW] [lib/format/currency.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/format/currency.ts)
- [NEW] [lib/format/date.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/format/date.ts)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx)
- [MODIFY] [app/components/BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx)
- [MODIFY] [vitest.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/vitest.config.ts)

**Audit findings addressed:** P2-5, P2-6, P2-7, P2-8, §5.4 items 1–7

---

### P3 — Polish & Documentation

#### Task 14 — Documentation and README

1. Fix `AGENTS.md` to point to the official Next.js docs URL instead of a non-existent `node_modules/next/dist/docs/` path
2. Replace the default create-next-app `README.md` with project-specific setup instructions
3. Create `.env.example` (committed to git) with placeholder credentials

**Files:**
- [MODIFY] [AGENTS.md](file:///c:/Users/Admin/Documents/CBEA_Website/AGENTS.md)
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)
- [NEW] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)

**Audit findings addressed:** P3-1, P2-10

#### Task 15 — Database Improvements

1. Split `migration.sql` — move the `CREATE SCHEMA auth` / `auth.users` stubs into a new `seed.local.sql` (for PGlite tests only), keeping production-safe DDL in `migration.sql`
2. Add composite index `(semester, date DESC)` for the primary public query pattern
3. Add `created_at` column to the `profiles` table for officer provenance

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [NEW] [supabase/seed.local.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/seed.local.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) (update to use `seed.local.sql` for PGlite stubs)

**Audit findings addressed:** P3-2, P3-3, P3-4

#### Task 16 — Performance Optimization

1. Replace `export const dynamic = 'force-dynamic'` with `export const revalidate = 60` (ISR) on the homepage — CDN caches for 60s, `revalidatePath` in server actions busts cache on mutations
2. Evaluate `SELECT DISTINCT` for semesters/categories (keep client-side dedupe for now — acceptable at <100 entries, but document the path to a Postgres view)

**Files:**
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) (add code comment documenting the optimization path)

**Audit findings addressed:** P3-5, P3-6

---

## Verification Plan

### Automated Tests

After all tasks are complete, run the full quality gate:

```bash
npx tsc --noEmit                          # 0 errors
npx eslint './**/*.{ts,tsx}' --ignore-pattern 'node_modules/**' --ignore-pattern '.next/**' --ignore-pattern 'scratch/**'  # 0 warnings
npx vitest run                            # 37/37 pass (including the 9 previously-failing action tests)
npx playwright test --reporter=list       # 9/9 pass
npm run build                             # succeeds
```

### Security Verification

```bash
# After build, confirm no backdoor artifacts in client bundle:
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/        # should return nothing
grep -r 'Password123' .next/static/                # should return nothing
grep -r 'sb-mock-auth' .next/static/               # should return nothing (cookie name not in client)
```

### Manual Verification

- Confirm the rotated service role key works in `.env.local`
- `curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin` → should return **307 → /login** (backdoor no longer works)
- Verify headline font-weight is 300 (Light) in browser DevTools
- Verify header padding is 16px on mobile, 24px on desktop

---

## Grade Projection

| Fix Group | Points Gained | Running Total |
|---|---|---|
| Baseline (current) | — | 56/100 |
| Task 09 (backdoor removal) | +15 | 71 |
| P0-2 (rotate key — manual) | +3 | 74 |
| Task 10 (server action tests) | +3 | 77 |
| Task 11 (E2E + lint) | +1 | 78 |
| Task 12 (design violations) | +6 | 84 |
| Task 13 (code quality) | +2 | 86 |
| Tasks 14–16 (polish) | +5 | **91/100 (A)** |
