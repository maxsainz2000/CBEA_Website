# CBEA Budget Transparency Portal — Audit Remediation Plan v4 (Session 5)

Remediate all findings from the [strict code audit v4](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v4.md) dated 2026-07-18. The post-remediation audit scored the project **87/100 (B+)** — all 30 prior tasks (09–30) were correctly applied and verified, but 18 NEW findings (X1–X18) were discovered during the fully independent re-grade that the prior audits had missed. This plan brings the project from 87/100 (B+) to **target: 98/100 (A+)** through Tasks 31–47.

## User Review Required

> [!CAUTION]
> **X1 (HIGH, -3 pts) — Block deploy.** The silent mock-data fallback in `lib/data/entries.ts` silently displays fabricated financial data when the Supabase DB has an outage. For a transparency portal, this undermines the entire purpose of the application. **Fix X1 (Task 31) before any production deploy.** This task changes the return types of 5 data functions from `BudgetEntry[]` / `string[]` to `DataResult<T>`, which is a breaking change for all callers (`app/page.tsx`, `app/admin/page.tsx`, `app/admin/edit/[id]/page.tsx`).

> [!IMPORTANT]
> **X6 precision fix has two options.** Task 35 fixes the `Math.round(amount * 100)` IEEE-754 bug. Two approaches:
> - **(a) `toFixed(2)` approach** — simpler, uses `Math.round(Number(validData.amount.toFixed(2)) * 100)`.
> - **(b) String-parsing approach** — stricter, parses the decimal string manually to avoid any float math.
>
> Option (a) is recommended for simplicity. Both approaches also need a Zod refinement to reject >2 decimal places at the validation layer.

> [!WARNING]
> **Numbered task continuation.** Session 1 tasks were `01`–`08`. Session 2 tasks were `09`–`16`. Session 3 tasks were `17`–`24`. Session 4 tasks were `25`–`30`. This plan continues with `31`–`47` to preserve traceability across sessions.

> [!WARNING]
> **P1-3 (carryover) — Rotate the leaked Supabase service role key (MANUAL ACTION).** If the prior zip's `.env.local` contained a real `SUPABASE_SERVICE_ROLE_KEY` for project `ikoogqwigvfylwjatids`, it must be rotated immediately in the Supabase dashboard (Settings → API → Reset `service_role` key). This has been flagged in every audit since v1 and is still a manual step — no code change required.

## Open Questions

1. **X6 precision fix approach** — `toFixed(2)` (Option A, simpler) vs string-parsing (Option B, stricter)? (Recommended: Option A.)
2. **X9 GEMINI.md** — Sanitize the project_ref to `<YOUR_PROJECT_REF>` or delete `GEMINI.md` entirely? (Recommended: sanitize — the file documents the MCP server config which is useful for new developers.)
3. **X8 rounded-full** — Document the spinner exception in README/DESIGN.md or replace the circular spinner with a Metro-style horizontal progress bar? (Recommended: document the exception — it's faster and the spinner is a universally understood UI pattern.)
4. **X16 constraints** — Use ENUM types (stricter, harder to evolve) or CHECK constraints (more flexible) for `semester`, `academic_year`, `role`? (Recommended: CHECK constraints — they can be altered without dropping/recreating the type.)

---

## Proposed Changes

### P0 — Block Deploy (fix BEFORE next production deploy)

#### Task 31 — Replace Silent Mock-Data Fallback with Explicit Error State

Replace the silent `MOCK_ENTRIES` fallback in all 5 public read functions (`getEntries`, `getEntry`, `getSummaryStats`, `getSemesters`, `getCategories`) with an explicit `DataResult<T>` return type that surfaces errors to the UI via an `ErrorBanner` component. Delete the `MOCK_ENTRIES` constant and mock helper functions from production code entirely. This is the single most important fix — it addresses the HIGH-severity domain-specific design flaw where a DB outage silently displays fabricated financial data to students.

**Files:**
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — refactor 5 functions, delete MOCK_ENTRIES
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — handle DataResult, render ErrorBanner
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — handle DataResult, render ErrorBanner
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx) — handle DataResult from getEntry
- [NEW] [app/components/ErrorBanner.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ErrorBanner.tsx) — visible error banner component
- [NEW] [lib/data/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.test.ts) — tests for error state

**Audit findings addressed:** X1 (HIGH, -3 pts), X17 (LOW, -0.25 pts — subsumed by X1)

---

### P1 — High (fix within 30 days of production launch)

#### Task 32 — Add Query-Layer Ownership Filter to Update/Delete

Add `.eq('entered_by', officer.id)` to both `updateEntry` and `deleteEntry` server actions. This provides defense-in-depth: even if RLS is ever misconfigured or a future service-role client is introduced, cross-user writes are blocked at the query layer. Also replace the raw Postgres error message with a friendly "Entry not found or you do not have permission" message.

**Files:**
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — add cross-user test cases

**Audit findings addressed:** X2 (MEDIUM, -1 pt)

#### Task 33 — Add Ownership Check to Edit Page

Replace the public `getEntry(id)` call in the edit page with a direct Supabase query that filters by both `id` and `entered_by`. This prevents Officer A from viewing Officer B's entry data in the edit form. Returns 404 (not "forbidden") to avoid revealing entry existence.

**Files:**
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)

**Audit findings addressed:** X3 (MEDIUM, -1 pt)

#### Task 34 — Add FK Index on `entered_by`

Add a B-tree index on `budget_entries.entered_by` to support RLS ownership lookups (`WHERE entered_by = auth.uid()`), the `ON DELETE SET NULL` cascade from `profiles`, and the query-layer ownership filters added in Task 32.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add index existence test

**Audit findings addressed:** X4 (HIGH, -1 pt)

#### Task 35 — Fix `Math.round` IEEE-754 Precision Bug

Replace `Math.round(validData.amount * 100)` with `Math.round(Number(validData.amount.toFixed(2)) * 100)` in both `createEntry` and `updateEntry`. Also add a Zod refinement to reject amounts with more than 2 decimal places at the validation layer.

**Files:**
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — add precision edge-case tests

**Audit findings addressed:** X6 (MEDIUM, -0.5 pts)

#### Task 36 — Remove Supabase Project-Ref from GEMINI.md

Sanitize the `GEMINI.md` MCP server URL to replace the hardcoded project_ref `ikoogqwigvfylwjatids` with `<YOUR_PROJECT_REF>`. This prevents information disclosure without removing the useful MCP configuration documentation.

**Files:**
- [MODIFY] [GEMINI.md](file:///c:/Users/Admin/Documents/CBEA_Website/GEMINI.md)

**Audit findings addressed:** X9 (LOW, -0.25 pts)

#### Task 37 — Remove `IS_E2E` from README

Remove the obsolete `IS_E2E` row from the README environment variables table and update the `SUPABASE_SERVICE_ROLE_KEY` description to reflect its current use in Playwright `globalSetup`/`globalTeardown`.

**Files:**
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)

**Audit findings addressed:** X10 (LOW, -0.25 pts)

---

### P2 — Medium (fix in v1.1+)

#### Task 38 — Add Composite and Covering Indexes for Hot Queries

Replace the existing redundant `budget_entries_semester_idx` with an optimized index set: a composite index for `getEntries` (`semester, category, date DESC`), a covering index for `getSummaryStats` (`semester INCLUDE type, amount`), and an extended composite for multi-key ORDER BY (`semester, date DESC, created_at DESC`).

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add index existence tests

**Audit findings addressed:** X5 (MEDIUM, -0.5 pts)

#### Task 39 — Add Postgres Views for Distinct Semesters/Categories

Create Postgres views `distinct_semesters` and `distinct_categories` using `SELECT DISTINCT`. Update `getSemesters` and `getCategories` to query the views instead of fetching all rows and deduping client-side. This was deferred from Task 16 and Task 24 in prior plans.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add view tests

**Audit findings addressed:** X7 (MEDIUM, -0.5 pts)

#### Task 40 — Wrap `createClient` in React `cache()`

Wrap the `createClient` function in `lib/supabase/server.ts` with React's `cache()` helper to memoize the Supabase client per-request. This collapses 5+ Supabase client constructions per admin page render into 1.

**Files:**
- [MODIFY] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts)

**Audit findings addressed:** X11 (LOW, -0.25 pts)

#### Task 41 — Add CHECK/ENUM Constraints on `semester`, `academic_year`, `role`

Add CHECK constraints to `budget_entries.semester`, `budget_entries.academic_year`, and `profiles.role` to enforce domain integrity at the database level. Mirror these constraints in the Zod schema. This prevents malicious or malformed data from bypassing the app-layer `<select>` dropdowns.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add constraint violation tests

**Audit findings addressed:** X16 (LOW, -0.5 pts)

---

### P3 — Low / Tech Debt (fix in v1.2+, polish)

#### Task 42 — Document `rounded-full` Spinner Exception

Document the `rounded-full` exception (circular spinners/loading indicators) in both `README.md` and `cbea-metro-design/cbea-package/DESIGN.md` to resolve the apparent contradiction with the "zero corner radius" Metro rule.

**Files:**
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)
- [MODIFY] [cbea-metro-design/cbea-package/DESIGN.md](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/DESIGN.md)

**Audit findings addressed:** X8 (LOW, -0.25 pts)

#### Task 43 — Fix Broken Assertion in `ClientFilters.test.tsx`

Replace the broken `expect(mockPush).not.toContain('category=')` assertion (which silently passes because `mockPush` is a function, not a string) with the correct `expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('category='))`.

**Files:**
- [MODIFY] [app/components/ClientFilters.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ClientFilters.test.tsx)

**Audit findings addressed:** X12 (LOW, -0.25 pts)

#### Task 44 — Pin `search_path = ''` on Trigger Function

Add `SET search_path = ''` to the `update_modified_column()` trigger function to prevent search_path injection attacks. Defense-in-depth per Supabase security best practices.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

**Audit findings addressed:** X13 (LOW, -0.25 pts)

#### Task 45 — Enable `FORCE ROW LEVEL SECURITY`

Add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to both `profiles` and `budget_entries` tables so the table owner (`postgres` role) is also subject to RLS policies. Defense-in-depth.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

**Audit findings addressed:** X14 (LOW, -0.25 pts)

#### Task 46 — Wrap `profiles` RLS `auth.uid()` in `(select ...)`

Update the `profiles` table's RLS policies to use the cached `(select auth.uid())` form instead of the raw `auth.uid()` form, matching the idiom already used by `budget_entries` policies (Task 17). Consistency + minor perf improvement.

**Files:**
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

**Audit findings addressed:** X15 (LOW, -0.25 pts)

#### Task 47 — Add `.btn-ghost-danger` to Print Styles

Add `.btn-ghost-danger` to the `@media print` `display: none` list in `app/theme.css` so Delete buttons are hidden when printing the admin dashboard. Also back-port to the design package for consistency.

**Files:**
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)
- [MODIFY] [cbea-metro-design/cbea-package/app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/app/theme.css)

**Audit findings addressed:** X18 (LOW, -0.25 pts)

---

### Monitor Only (no code change)

#### N15 — PostCSS Transitive CVE (carryover from AUDIT-v3)

2 moderate CVEs in transitive `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93) bundled inside `next@15.5.20`. Very low practical exploitability — no user-controlled CSS input path. No viable fix without downgrading Next.js to v9.3.3 (not viable). Monitor [vercel/next.js releases](https://github.com/vercel/next.js/releases) for the postcss update.

**Audit findings addressed:** N15 (LOW, monitor only — carryover)

---

## Verification Plan

### Automated Tests

After all tasks are complete, run the full quality gate:

```bash
npx tsc --noEmit                          # 0 errors
npx eslint                                # 0 warnings, 0 errors
npx vitest run                            # all tests pass (67 existing + new tests)
npm run build                             # succeeds, NO Edge Runtime warning
```

### Security Verification

```bash
# After build, confirm no backdoor or test artifacts in client bundle:
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/        # should return nothing
grep -r 'Password123' .next/static/                # should return nothing
grep -r 'sb-mock-auth' .next/static/               # should return nothing
grep -r 'IS_E2E' .next/static/                     # should return nothing
grep -r 'MOCK_ENTRIES' .next/static/               # should return nothing (Task 31)

# Confirm project_ref leak is gone:
grep -r 'ikoogqwigvfylwjatids' . --include='*.md' --include='*.json' --include='*.ts' 2>/dev/null \
  | grep -v node_modules | grep -v documentations/ | grep -v tasks/ | grep -v plans/ | grep -v archive/
# Should return nothing
```

### Functional Verification

```bash
# Task 31 — verify error banner appears on DB failure:
# Set NEXT_PUBLIC_SUPABASE_URL to invalid, start dev server, visit /
# Should see error banner, NOT mock data

# Task 32 — verify cross-user update returns friendly error:
# Login as Officer A, try to update Officer B's entry
# Should see "Entry not found or you do not have permission to modify it."

# Task 33 — verify cross-user edit page returns 404:
# Login as Officer A, navigate to /admin/edit/<officer-B-entry-id>
# Should see 404 page

# Task 35 — verify Math.round precision fix:
node -e "console.log(Math.round(Number((1.005).toFixed(2)) * 100))"   # should print 101 (was 100)
```

### Manual Verification

- Start the dev server (`npm run dev`) and verify:
  - Homepage loads correctly with real data (or error banner if DB is down — NOT mock data)
  - Login flow works end-to-end
  - Admin CRUD works end-to-end
  - Edit page returns 404 for entries owned by other officers
  - Print preview hides all button variants (including `.btn-ghost-danger`)
- Verify `GEMINI.md` no longer contains `ikoogqwigvfylwjatids`
- Verify `README.md` no longer documents `IS_E2E`

---

## Grade Projection

| Fix Group | Points Gained | Running Total |
|---|---|---|
| Baseline (post-Session 4, AUDIT-v4) | — | 87/100 (B+) |
| **Task 31** (X1 — mock-data fallback, P0) | **+3** | **90/100 (A threshold)** |
| Task 32 (X2 — ownership filter) | +1 | 91 |
| Task 33 (X3 — edit page ownership) | +1 | 92 |
| Task 34 (X4 — FK index) | +1 | 93 |
| Task 35 (X6 — Math.round precision) | +0.5 | 93.5 |
| Task 36 (X9 — GEMINI.md project_ref) | +0.25 | 93.75 |
| Task 37 (X10 — README IS_E2E) | +0.25 | 94 |
| **After P0 + P1** | | **94/100 (A)** |
| Task 38 (X5 — composite indexes) | +0.5 | 94.5 |
| Task 39 (X7 — distinct views) | +0.5 | 95 |
| Task 40 (X11 — React cache) | +0.25 | 95.25 |
| Task 41 (X16 — CHECK constraints) | +0.5 | 95.75 |
| **After P0 + P1 + P2** | | **~96/100 (A)** |
| Tasks 42–47 (X8, X12–X15, X18 — polish) | +1.5 | 97.5 |
| **After P0 + P1 + P2 + P3** | | **~98/100 (A+)** |

**Minimum for A:** Task 31 alone (+3 pts → 90/100).

---

## Suggested Implementation Order

**Sprint 1 (this week, before deploy):**
1. Task 31 — Replace silent mock-data fallback (2 hours) — **blocks deploy**

**Sprint 2 (next 30 days):**
2. Task 34 — FK index on `entered_by` (5 min) — 1-line SQL, instant perf win
3. Task 36 — Remove project_ref from GEMINI.md (5 min)
4. Task 37 — Remove IS_E2E from README (5 min)
5. Task 33 — Edit page ownership check (20 min)
6. Task 32 — Query-layer ownership filter (30 min)
7. Task 35 — Math.round precision bug (30 min)

**Sprint 3 (v1.1, ~1 month post-launch):**
8. Task 40 — React cache() for createClient (10 min)
9. Task 38 — Composite/covering indexes (30 min)
10. Task 39 — Postgres views for distinct values (20 min)
11. Task 41 — DB CHECK/ENUM constraints (30 min)

**Sprint 4 (v1.2, ~2 months post-launch):**
12. Tasks 42–47 — polish items (45 min total)

**Total effort for full A+ (98/100):** ~7 hours of implementation + testing.

---

## Cross-reference

| Document | Purpose |
|---|---|
| [AUDIT.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT.md) | First audit (56/100 F) |
| [implementation_plan.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan.md) | Session 2 remediation plan (Tasks 09–16) |
| [AUDIT-v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v2.md) | Post-remediation re-audit (83/100 B+) |
| [implementation_plan_v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan_v2.md) | Session 3 remediation plan (Tasks 17–24) |
| [AUDIT-v3.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v3.md) | Post-Session-3 re-audit (89/100 B+) |
| [implementation_plan_v3.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan_v3.md) | Session 4 remediation plan (Tasks 25–30) |
| [AUDIT-v4.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v4.md) | Post-Session-4 re-audit (87/100 B+, 18 new findings) |
| **This document** | Session 5 remediation plan (Tasks 31–47) |
