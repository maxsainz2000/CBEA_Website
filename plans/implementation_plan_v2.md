# CBEA Budget Transparency Portal — Audit Remediation Plan v2 (Session 3)

Remediate all findings from the [strict code audit v2](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v2.md) dated 2026-07-12. The post-remediation audit scored the project **83/100 (B+)** — the prior remediation (Tasks 09–16 in [implementation_plan.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan.md)) was fully applied and all 8 tasks verified, but 11 new findings (N1–N11) were discovered during the independent re-grade. This plan brings the project to production-readiness (**target: 91/100, A**).

## User Review Required

> [!CAUTION]
> **P0-1 — Rotate the leaked Supabase service role key (MANUAL ACTION).** If the prior zip's `.env.local` contained a real `SUPABASE_SERVICE_ROLE_KEY` for project `ikoogqwigvfylwjatids`, it must be rotated immediately in the Supabase dashboard (Settings → API → Reset `service_role` key). This is a manual step — no code change required.

> [!IMPORTANT]
> **RLS strategy decision required (Task 17).** The `budget_entries` RLS write policy is `FOR ALL TO authenticated USING (true) WITH CHECK (true)` — flagged by Supabase Security Advisor rule `0024`. Two options:
> - **(a) Ownership predicate** — `entered_by = auth.uid()` on INSERT/UPDATE/DELETE. Recommended. Already compatible with the server actions (`entries.ts:51` sets `entered_by: userId`).
> - **(b) Admin-claim predicate** — `auth.jwt() ->> 'is_admin' = 'true'`. Requires setting an `is_admin` flag via the Supabase admin API. More work, but cleaner for a single-admin model.

> [!WARNING]
> **Numbered task continuation.** Session 1 tasks were `01`–`08`. Session 2 tasks were `09`–`16`. This plan continues with `17`–`24` to preserve traceability across sessions.

## Open Questions

1. **RLS strategy** — Ownership predicate (Option A) vs admin-claim predicate (Option B)? (Recommended: Option A.)
2. **Supabase dep upgrade scope** — `@supabase/ssr` 0.12.x has breaking API changes (Proxy pattern, `getClaims()`). Should we adopt the new `proxy.ts` pattern, or just upgrade and keep the existing `middleware.ts` approach?
3. **Sandbox page** — Fix the multiple issues (N5, N7) or delete the page entirely? If kept, should it be excluded from the production build?
4. **`revalidate = 60` replacement** — Remove the export entirely (Option A, recommended), revert to `force-dynamic` (Option B), or adopt PPR + Suspense (Option C, experimental)?

---

## Proposed Changes

### P0 — Critical Security

#### Task 17 — Harden `budget_entries` RLS Write Policy

Replace the permissive `FOR ALL TO authenticated USING (true) WITH CHECK (true)` policy on `budget_entries` with granular ownership-based policies (INSERT/UPDATE/DELETE with `entered_by = auth.uid()`). This addresses Supabase Security Advisor rule `0024`.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts)

**Audit findings addressed:** N3 (HIGH), §7.2 Finding S8

#### Task 18 — Add `WITH CHECK` to Profiles UPDATE Policy

Add explicit `WITH CHECK (auth.uid() = id)` to the `profiles` UPDATE policy for defense-in-depth. Currently omitted — Postgres defaults to the `USING` expression, which is safe, but the Supabase skill's security checklist recommends explicit `WITH CHECK`.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

**Audit findings addressed:** S10 (LOW)

---

### P1 — High Priority

#### Task 19 — Fix the No-Op `revalidate = 60` on Homepage

Remove or replace the misleading `export const revalidate = 60` on `app/page.tsx`. The page reads `searchParams` (a Dynamic API in Next.js 15), which forces dynamic rendering — the `revalidate` export is a no-op. Confirmed by build output marking `/` as `ƒ (Dynamic)`.

**Files:**
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)

**Audit findings addressed:** N1 (HIGH)

#### Task 20 — Migrate E2E Auth to Playwright `storageState`

Replace the `IS_E2E`/`sb-mock-auth` mock-auth pattern with Playwright's recommended `storageState` + setup project. Remove all test-only logic from production code paths (`session.ts`, `middleware.ts`, `AdminHeader.tsx`). Eliminate the `sb-mock-auth` string from the client bundle.

**Files:**
- [NEW] [tests/auth.setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth.setup.ts)
- [MODIFY] [playwright.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/playwright.config.ts)
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)
- [MODIFY] [.gitignore](file:///c:/Users/Admin/Documents/CBEA_Website/.gitignore)

**Audit findings addressed:** N4 (MEDIUM), N8 (LOW)

#### Task 21 — Upgrade Supabase Dependencies

Upgrade `@supabase/ssr` from `^0.5.2` to `^0.12.0` and `@supabase/supabase-js` from `^2.48.1` to `^2.90.0`. This eliminates the Edge Runtime `process.version` warning and picks up security patches.

**Files:**
- [MODIFY] [package.json](file:///c:/Users/Admin/Documents/CBEA_Website/package.json)
- [MODIFY] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts) (if API changed)
- [MODIFY] [lib/supabase/client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts) (if API changed)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts) (if API changed)

**Audit findings addressed:** N2 (MEDIUM), §6.6 dependency health

#### Task 22 — Fix E2E Test Data Coupling and Residue

Make E2E tests work on a fresh database by provisioning the test user deterministically via the Supabase admin API. Add cleanup to remove test residue after the suite completes. Fix the seed/auth UUID mismatch.

**Files:**
- [NEW] [tests/global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts)
- [NEW] [tests/global-teardown.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-teardown.ts)
- [MODIFY] [playwright.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/playwright.config.ts)
- [MODIFY] [supabase/seed.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/seed.sql)

**Audit findings addressed:** N11 (MEDIUM)

---

### P2 — Medium Priority

#### Task 23 — Code Quality and Design-System Cleanup

Fix 7 minor code quality and design-system issues: sandbox page CSS/padding/type-cast (N5, N7), color-discipline drift from `accent-red` to `error` (N6), redundant inline `borderRadius` (N6), `document.cookie` leak (N8), and double `createClient()` in server actions (N10).

**Files:**
- [MODIFY] [app/sandbox/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/sandbox/page.tsx)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/components/SearchFilter.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SearchFilter.tsx)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)

**Audit findings addressed:** N5 (LOW), N6 (LOW), N7 (LOW), N8 (LOW), N10 (LOW)

---

### P3 — Low / Tech Debt

#### Task 24 — Admin UX Improvements and Missing Tests

Add semester filter to the admin table (N9), convert `SummaryStats` to a server component (P3-1), add missing component unit tests (P3-2), add optional pagination (P3-5), and add optional `SELECT DISTINCT` views for semesters/categories (P3-4).

**Files:**
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx)
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [NEW] Component test files (BudgetEntryList, SearchFilter, ClientFilters, Header, EntryForm, EntryTable)
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) (optional views)
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts)

**Audit findings addressed:** N9 (MEDIUM), P3-1, P3-2, P3-3, P3-4, P3-5

---

## Verification Plan

### Automated Tests

After all tasks are complete, run the full quality gate:

```bash
npx tsc --noEmit                          # 0 errors
npx eslint './**/*.{ts,tsx}' --ignore-pattern 'node_modules/**' --ignore-pattern '.next/**' --ignore-pattern 'scratch/**'  # 0 warnings
npx vitest run                            # all tests pass (including new RLS tests)
npx playwright test --reporter=list       # all tests pass (via real auth, no mock)
npm run build                             # succeeds, no Edge Runtime warning
```

### Security Verification

```bash
# After build, confirm no backdoor or test artifacts in client bundle:
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/        # should return nothing
grep -r 'Password123' .next/static/                # should return nothing
grep -r 'sb-mock-auth' .next/static/               # should return nothing (after Task 20)
grep -r 'IS_E2E' .next/static/                     # should return nothing (after Task 20)
```

### RLS Verification

```bash
# Run in Supabase dashboard → Database → Advisors → Security
# Rule 0024 "Permissive RLS Policy" should NOT fire for budget_entries (after Task 17).
```

### Manual Verification

- Confirm the rotated service role key works in `.env.local`
- `curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin` → should return **307 → /login** (mock path fully removed)
- Verify the homepage is dynamically rendered (no misleading ISR) — check build output
- Verify the admin table shows entries with semester filter (after Task 24)
- Fresh database: `seed.sql` + `npx playwright test` → all pass (after Task 22)

---

## Grade Projection

| Fix Group | Points Gained | Running Total |
|---|---|---|
| Baseline (post-Session 2) | — | 83/100 |
| P0-1 (rotate key — manual) | +1 | 84 |
| Task 17 (harden RLS — N3) | +3 | 87 |
| Task 19 (fix revalidate — N1) | +2 | 89 |
| Task 20 (storageState — N4) | +1 | 90 |
| Task 21 (upgrade deps — N2) | +1 | **91/100 (A)** |
| Tasks 18, 22–24 (quality/polish) | +0 (quality) | 91 |

---

## Cross-reference

| Document | Purpose |
|---|---|
| [AUDIT.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT.md) | First audit (56/100 F) |
| [implementation_plan.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan.md) | Session 2 remediation plan (Tasks 09–16) |
| [AUDIT-v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v2.md) | Post-remediation re-audit (83/100 B+) |
| **This document** | Session 3 remediation plan (Tasks 17–24) |
