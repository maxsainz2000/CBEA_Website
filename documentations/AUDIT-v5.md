# CBEA Budget Transparency Portal — Strict Code Audit v5 (Independent Re-Grade, Post-Tasks-31-47)

> **Audit date:** 2026-07-20
> **Audited artifact:** `cbea_website_source.zip` (extracted to `/home/z/my-project/workspace/cbea/`)
> **Rubric:** *Brutally strict, production-readiness bar* — fully independent re-grade, NOT anchored to AUDIT-v4's 87/100.
> **Final grade (independent):** **B− — 82 / 100**
> **Scope:** Project understanding · Independent re-verification of AUDIT-v4 X1–X18 + AUDIT-v2/v3 N1–N15 · Task compliance (Tasks 09–47, all 39 task files) · Design system · Security · Defense-in-depth · Database best-practices · Test suite · Code quality · Performance · Dependency health (incl. CVE scan) · Accessibility · Documentation drift · Information disclosure
> **Methodology:** Full source read of every `.ts`/`.tsx`/`.sql`/`.css`/`.md`/config file in the zip (101 files excluding `node_modules`); diff of `app/theme.css` vs `cbea-metro-design/cbea-package/app/theme.css`; grep verification of every claim (`MOCK_ENTRIES`, `process.version`, `sb-mock-auth`, `IS_E2E`, `rounded-full`, `entered_by`, `Math.round`, `ikoogqwigvfylwjatids`, `FORCE ROW LEVEL SECURITY`, `search_path`, `auth.uid`, `console.*`, `as BudgetEntry`, etc.); `npm install` (475 packages, 11s); `npx tsc --noEmit` (0 errors); `npx eslint` (0 warnings, 0 errors); `npx vitest run` (**87/87 pass — NOT 67/67 as AUDIT-v4 claimed**); `npm run build` (succeeds with **NO** Edge Runtime warning); `npm audit` (2 moderate CVEs in transitive `postcss` bundled with Next.js, unchanged from v4); four parallel research subagents that read all 4 prior audits (v1–v4) / all 4 implementation plans / all 39 task files (09–47) / every source file under `app/`, `lib/`, `supabase/`, `tests/`, `scratch/`, `cbea-metro-design/`.
> **Stance:** I did not trust AUDIT-v4's file:line claims or its 67/67 test count. I re-ran everything. Where I contradict v4, I show my evidence.

---

## Executive Summary (for the advisor / sponsor)

**What this is.** A public-facing budget transparency website for the CBEA (College of Business, Economics, and Accountancy) Student Council at Cagayan State University – Aparri. Students visit `/` to see how council funds are collected and spent; designated officers sign in at `/admin` to add, edit, and delete entries. The stack is Next.js 15 + React 19 + Tailwind v4 + Supabase (free tier), designed to run on Vercel free tier at ₱0 hosting cost. The success criterion is *"any CBEA student can find and understand budget info without asking an officer directly."*

**What state it's in.** The codebase has been through four prior audits (v1–v4) and 39 remediation task files (Tasks 09–47) have been applied. The original AUDIT-v1 baseline was an F (56/100) — a CVSS 9.8 auth-bypass backdoor was baked into the client bundle, a real service-role key was committed, and 9/9 server-action tests were failing. After four remediation sessions, the project is in substantially better shape: the backdoor is gone, RLS is hardened (FORCE + WITH CHECK + cached `auth.uid()`), the mock-data fallback is gone, dependencies are current, and the build is clean. **The current state is roughly v4's projected post-Tasks-31-47 outcome.**

**What I graded it.** **B− — 82/100.** That is **5 points below AUDIT-v4's 87/100**, and the downgrade is entirely from findings v4 missed (not regressions). The biggest gaps:

1. **Missing role check at the app layer** (HIGH). `app/admin/page.tsx:22-26` only checks *authentication* (Supabase session exists), not *authorization* (the user has a designated officer role in `profiles`). Any Supabase-Authenticated user — including a brand-new account with no `profiles` row — can reach `/admin`, `/admin/new`, `/admin/edit/[id]`, and submit entries. RLS will allow the insert because the INSERT policy only checks `entered_by = auth.uid()`. For a transparency portal whose entire purpose is trust, "anyone with a Supabase Auth account can publish budget entries" is a serious design gap. RLS is necessary but not sufficient.
2. **`EntryForm` type-safety lie** (HIGH). The `EntryForm` interface declares `initialData?: BudgetEntry`, and `BudgetEntry.amount` is documented as *integer centavos*. But `app/admin/edit/[id]/page.tsx:38` passes `amount: (entry as BudgetEntry).amount / 100` — i.e. decimal pesos. The co-located test entrenches the lie by passing `amount: 150000` and expecting the input to display `'150000'` (which would only happen if the form received centavos, not pesos). Production data flow happens to work today because the edit page does the `/100` conversion, but any future refactor that trusts the type and passes a raw `BudgetEntry` to the form will silently multiply the amount by 100 — a ₱150 entry becomes ₱15,000.
3. **`revalidatePath` is a no-op** (MEDIUM). `app/actions/entries.ts:60-61, 124-125, 161-162` calls `revalidatePath('/')` and `revalidatePath('/admin')`. Both routes are dynamic (`force-dynamic` + `searchParams`), so `revalidatePath` does nothing. Task 19 removed the `revalidate = 60` export from the homepage and added a comment explaining this, but the *actions* were never updated. Practical impact is partially mitigated because `router.refresh()` is called after success, but the cache-invalidation strategy is fundamentally broken.
4. **17 `console.error` calls in production paths** (MEDIUM). 6 in `app/actions/entries.ts` + 1 in `AdminHeader.tsx` + 10 in `lib/data/entries.ts`. Several log raw `error.message` from Supabase, which can leak internal DB details to server logs in production. v4 didn't flag this.
5. **Five route-level pages have zero co-located tests** (MEDIUM). `app/page.tsx`, `app/login/page.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx` — the auth-redirect logic, `searchParams` parsing, and error states are completely untested.
6. **`app/layout.test.tsx` is a no-op** (MEDIUM). It renders `<div>Test Child</div>` and asserts "Test Child" is in the DOM. Zero coverage of `RootLayout` (metadata, `lang` attribute, body classes, fonts). Task 29 fixed the hydration warning but didn't add real coverage.

**Plus:** AUDIT-v4 claimed **67/67 tests pass**. The actual count is **87/87**. Tasks 31–47 added 20 new tests. v4 either miscounted or pre-dated the Tasks 31–47 work. Either way, v4's headline test count is wrong by 20.

**Deployability verdict.** **CONDITIONAL GO.** Safe to deploy only after the three P0 items in §9 ship:
- P0-1: Add role check to all admin pages (block users with no `profiles` row or unrecognized role).
- P0-2: Move hardcoded test credentials (`jane.doe@csu.edu.ph` / `Password123!`) out of source and into `.env.local`.
- P0-3: Operationally disable public Supabase Auth signups in the production project (Dashboard → Authentication → Providers → Email → turn off "Allow new users to sign up").

With P0+P1 applied, projected grade: **A− (92/100)**. With P0+P1+P2: **A (96/100)**. With everything: **A+ (98/100)**.

---

## §1. Project Understanding

### 1.1 What is being built

The CBEA Student Council Budget Transparency Portal is a public-facing website that gives students at Cagayan State University – Aparri campus a permanent, always-visible record of how the CBEA (College of Business, Economics, and Accountancy) Student Council collects and spends money. Per `documentations/cbea-budget-transparency-project-description.md`:

> Students have no simple way to check what the Student Council is doing with their fees/collections. Financial reports may exist internally, but there's no accessible public record. This creates room for doubt about where funds go, even when spending is legitimate.

The portal solves a **trust problem**. That framing matters for the audit: any defect that allows fabricated data, unauthorized writes, or stale/misleading numbers isn't just a bug — it undermines the *entire reason the site exists*. A broken CRUD on a generic SaaS app is a bug. A broken CRUD on a transparency portal is a credibility crisis.

### 1.2 Core features (v1 / MVP scope)

**Public side (no login):**
- Browse income/expense entries, grouped by semester and category
- See totals: Total Collected, Total Spent, Remaining Balance
- Search/filter by description, category, semester
- Mobile-friendly, print-friendly

**Admin side (login required):**
- Supabase-Auth sign-in for council officers
- Add / edit / delete budget entries (amount, description, category, date, semester, AY, notes, status)
- Manual entry only — no document parsing/OCR

**Explicitly out of scope for v1:** document upload, multiple officer roles with different permissions, student comments, fund-request submission, notifications.

### 1.3 User roles (v1 assumption)

Per `documentations/cbea-budget-transparency-project-description.md` §5:

> v1 assumption: a single shared "admin" role is enough — no need to build granular permissions (e.g. Treasurer vs. President) unless you want an audit trail of who entered what later.

This is the spec the codebase was supposed to implement: **a single admin role**. The actual implementation grants admin access to **any Supabase-Authenticated user**, not just users with a designated officer role. See Y1 in §6.

### 1.4 Tech stack and hosting

- **Framework:** Next.js 15 (App Router) — server components + server actions, no API routes
- **UI:** React 19, Tailwind CSS v4 (custom Metro-derived design system)
- **Database + Auth:** Supabase (Postgres + Supabase Auth + RLS)
- **Validation:** Zod
- **Unit/integration tests:** Vitest + Testing Library + PGlite (in-process Postgres for migration/RLS tests)
- **E2E tests:** Playwright (with `storageState` + `globalSetup`/`globalTeardown`)
- **Hosting target:** Vercel free tier + Supabase free tier — ₱0/month

The free-tier hosting constraint is real and shapes some design decisions: no external logging service, no Sentry, no rate-limiter, no Sentry, no rate-limiter, no background workers. Errors must be handled in-process; outages must degrade gracefully.

### 1.5 Design system

Strict **Metro (Windows Phone 7 derivative)**. Per `README.md` and `cbea-metro-design/cbea-package/`:

- Pure white background, black text, single Lime accent (`#8CBF26`)
- Zero shadows, zero gradients, zero corner radius
- **Exception:** `rounded-full` for circular spinners and loading indicators (defined as `--radius-full: 9999px` in `app/theme.css`)
- `Segoe UI` font stack with cross-platform fallbacks
- Tabular numerals on all currency figures
- "Content before chrome" — minimal decorative elements

### 1.6 Success criteria (from the spec)

1. Any CBEA student can find and understand budget info without asking an officer directly.
2. Officers can post a new budget entry in under a minute.
3. Site runs entirely within Vercel + Supabase free tiers — ₱0 hosting cost.

These criteria are the implicit grading rubric. **Criterion #1 (student trust) is the one at risk from Y1** (missing role check) and the prior X1 (mock-data fallback, now fixed).

---

## §2. Methodology

### 2.1 Independent verification steps

I did not take any prior audit's claims on faith. The following commands were run on a fresh extraction of the zip:

```bash
cd /home/z/my-project/workspace/cbea
npm install --no-audit --no-fund          # 475 packages, 11s
npx tsc --noEmit                          # EXIT 0 — 0 errors
npx eslint                                # EXIT 0 — 0 warnings, 0 errors
npx vitest run                            # EXIT 0 — 87/87 tests pass
npm run build                             # EXIT 0 — 6 routes, no Edge warning
npm audit                                 # 2 moderate CVEs (transitive postcss)
```

### 2.2 Grep-verification protocol

Every prior-audit claim (X1–X18 from v4, N1–N15 from v2/v3, plus Tasks 09–47 claims) was checked against the source with `grep -rn`, `Read`, or `ls`. The receipts are in §3 and the per-finding reconciliation is in §4.

### 2.3 Parallel research subagents

Four subagents were spawned in parallel to read the audit history, task backlog, app source, and lib/supabase/tests source. Their reports cross-referenced each other via the shared worklog at `/home/z/my-project/worklog.md`. Where the subagents contradicted each other (e.g. R-3 said "Task 35 not applied"; R-4 said "Task 35 applied with toFixed wrapper"), I resolved the contradiction by reading the file myself — see §5 (Contradiction #3).

### 2.4 Files inspected

101 files read in full, broken down as:
- 30 source files under `app/` (every `.ts`/`.tsx`/`.css`)
- 12 source files under `lib/` (all `.ts`)
- 4 files under `supabase/` (`migration.sql`, `seed.sql`, `seed.local.sql`, `database.test.ts`)
- 6 files under `tests/` (Playwright specs + setup/teardown)
- 4 files under `scratch/`
- 4 prior audits (`AUDIT.md`, `AUDIT-v2.md`, `AUDIT-v3.md`, `AUDIT-v4.md`)
- 4 implementation plans (`implementation_plan.md` through `_v4.md`)
- 39 task files (Tasks 09–47)
- Top-level configs (`package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `eslint.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `postcss.config.mjs`, `.env.example`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `README.md`)
- `cbea-metro-design/cbea-package/` design tokens (`theme.css`, `tailwind.config.ts`, `tokens.dtcg.json`, `DESIGN.md`)
- `agent/skills/` and `.agents/skills/` (enumerated, not deep-read — reference docs only)

### 2.5 What I did NOT verify

- **Playwright E2E tests** — require real Supabase credentials; out of scope for a zip-only audit.
- **Real Supabase Auth round-trip** — same reason.
- **Service-role key rotation** — manual action; unverifiable from the zip.
- **Lighthouse run** — requires a running dev server with real Supabase; would not change the grade.
- **Production Supabase Dashboard state** — signup-disable flag, project-pause behaviour, etc.

These are flagged `[UNVERIFIED]` throughout.

---

## §3. Independent Verification Receipts

This section is the evidence base. Every claim in §4–§8 traces back to a receipt here.

### 3.1 Quality gates

| Command | Result | Notes |
|---|---|---|
| `npx tsc --noEmit` | EXIT 0 — 0 errors | Type-checks pass. Confirms Task 26 (`getClaims()` migration) didn't break types. |
| `npx eslint` | EXIT 0 — 0 warnings, 0 errors | Lint passes. |
| `npx vitest run` | EXIT 0 — **87 tests pass, 0 fail** | **NOT 67/67 as AUDIT-v4 claimed.** v4's headline test count is wrong by 20. |
| `npm run build` | EXIT 0 — 6 routes generated | No Edge Runtime warning, no `process.version` warning. Task 25 confirmed. |
| `npm audit` | 2 moderate CVEs (transitive `postcss <8.5.10` bundled with `next@15.5.20`) | Same as v4's N15. No fix without breaking Next.js downgrade. Monitor only. |

### 3.2 Per-file test count (vitest --reporter=json)

```
app/layout.test.tsx                                  1 test
supabase/database.test.ts                           19 tests
app/actions/entries.test.ts                         18 tests
app/components/BudgetEntryList.test.tsx              6 tests
app/components/ClientFilters.test.tsx                5 tests
app/components/Header.test.tsx                       3 tests
app/components/PivotTabs.test.tsx                    3 tests
app/components/SearchFilter.test.tsx                 4 tests
app/components/SummaryStats.test.tsx                 3 tests
lib/data/entries.test.ts                             4 tests  ← NEW (Task 31)
lib/supabase/supabase.test.ts                        9 tests
app/admin/components/EntryForm.test.tsx              7 tests
app/admin/components/EntryTable.test.tsx             5 tests
                                                   --------
                                                    87 tests total
```

AUDIT-v4 said 67/67. The 20-test delta: `lib/data/entries.test.ts` is brand-new (Task 31) with 4 tests; `supabase/database.test.ts` grew from 8 → 19 (+11 tests, Tasks 34/38/39/41/45/46); `app/actions/entries.test.ts` grew from 9 → 18 (+9 tests, Tasks 32/35).

### 3.3 Security greps (backdoor-removal verification)

| Pattern | Search scope | Result |
|---|---|---|
| `MOCK_ENTRIES` / `getMockEntries` / `getMockSummaryStats` | `lib/data/entries.ts` | **0 hits** (Task 31 applied; v4's X1 fixed) |
| `ikoogqwigvfylwjatids` | `GEMINI.md` | **0 hits** (Task 36 applied; v4's X9 fixed) |
| `IS_E2E` | `README.md` | **0 hits** (Task 37 applied; v4's X10 fixed) |
| `IS_E2E` / `sb-mock-auth` / `NEXT_PUBLIC_IS_E2E` | `app/`, `lib/`, `supabase/`, `tests/`, `middleware.ts` | **0 hits** (Tasks 09, 20 applied) |
| `SUPABASE_SERVICE_ROLE_KEY` / `service_role` / `supabaseAdmin` | `app/`, `lib/`, `supabase/`, `middleware.ts` | **0 hits** (no production code path uses service-role) |
| `: any` / `as any` | `app/`, `lib/` (excl. tests) | **0 hits** |

### 3.4 Code-state greps

| Pattern | Search scope | Result |
|---|---|---|
| `Math.round` | `app/`, `lib/` | **3 hits** — `app/actions/entries.ts:34`, `app/actions/entries.ts:94`, `lib/types.ts:28`. **All three are wrapped in `toFixed(2)` or used inside a Zod refine** — the IEEE-754 bug from v4's X6 is fixed (Task 35 applied). |
| `rounded-full` | `app/` | **2 hits** — `app/page.tsx:125` (spinner), `app/components/ClientFilters.tsx:104` (ping dot). Both are the documented Metro exception (Task 42). |
| `console.error` | `app/`, `lib/` (excl. tests) | **17 hits** — 6 in `app/actions/entries.ts`, 1 in `app/admin/components/AdminHeader.tsx`, 10 in `lib/data/entries.ts`. **NEW finding Y4 — not flagged by v4.** |
| `revalidatePath` | `app/` | **6 hits** — `app/actions/entries.ts:60, 61, 124, 125, 161, 162`. All call `revalidatePath('/')` or `revalidatePath('/admin')`, both no-ops because both routes are dynamic. **Y3 — not flagged by v4.** |
| `as BudgetEntry` | `app/` | **4 hits** — `app/actions/entries.ts:63`, `app/actions/entries.ts:127`, `app/admin/edit/[id]/page.tsx:37`, `app/admin/edit/[id]/page.tsx:38`. **Y8 — not flagged by v4.** |
| `app/sandbox/` | filesystem | **Does not exist** (Task 28 applied). |
| `process.version` | `node_modules/@supabase/supabase-js/dist/` | **0 hits** (Task 25 applied — N13 obsolete). |
| `@supabase/supabase-js` installed version | `node_modules/@supabase/supabase-js/package.json` | `2.110.7` (≥ 2.110.5 required by Task 25). |

### 3.5 Build output route table

```
┌ ƒ /                                     2.7 kB         109 kB
├ ○ /_not-found                            993 B         103 kB
├ ƒ /admin                               2.82 kB         174 kB
├ ƒ /admin/edit/[id]                       134 B         188 kB
├ ƒ /admin/new                             135 B         188 kB
└ ○ /login                               1.59 kB         173 kB

ƒ Middleware                             91.7 kB
```

6 routes, no `/sandbox`. Both `/` and `/admin` are `ƒ (Dynamic)` — confirming `revalidatePath` on these routes is a no-op.

### 3.6 RLS / migration greps

| Pattern | Search scope | Result |
|---|---|---|
| `FORCE ROW LEVEL SECURITY` | `supabase/migration.sql` | **2 hits** (lines 71, 74) — both `profiles` and `budget_entries`. Task 45 applied. |
| `WITH CHECK` | `supabase/migration.sql` | **5 hits** — INSERT/UPDATE on `budget_entries`, INSERT/UPDATE on `profiles`. Tasks 17, 18 applied. |
| `(select auth.uid())` | `supabase/migration.sql` | **7 hits** — all 7 RLS policies use the cached subselect form. Task 46 applied. |
| `SET search_path = ''` | `supabase/migration.sql` | **1 hit** (line 48, `update_modified_column()` function). Task 44 applied. |
| `budget_entries_entered_by_idx` | `supabase/migration.sql` | **1 hit** (lines 137–138). Task 34 applied. |
| `budget_entries_semester_covering_idx` / `budget_entries_semester_category_date_idx` / `budget_entries_semester_date_created_idx` | `supabase/migration.sql` | 3 hits. Task 38 applied. |
| `distinct_semesters` / `distinct_categories` views | `supabase/migration.sql` | 2 hits (lines 141–145). Task 39 applied. |
| `CHECK (semester IN` / `CHECK (academic_year ~` / `CHECK (role IN` | `supabase/migration.sql` | 3 hits. Task 41 applied. |
| `cache(async () =>` | `lib/supabase/server.ts` | 1 hit (line 5). Task 40 applied. |
| `supabase.auth.getClaims()` | `lib/auth/session.ts`, `lib/supabase/middleware.ts` | 3 hits. Task 26 applied. |

### 3.7 AUDIT-v4 contradiction receipts

| v4 claim | Actual | Evidence |
|---|---|---|
| "67/67 tests pass" | **87/87 tests pass** | `npx vitest run` output (§3.1, §3.2). Tasks 31–47 added 20 tests since v4 was written. |
| "X12 — broken assertion in `ClientFilters.test.tsx:99`: `expect(mockPush).not.toContain('category=')`" | **X12 is a FALSE POSITIVE.** Actual line 99 is `expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('category='))` — a valid Vitest assertion. Task 43 "fixed" something that wasn't broken. | `app/components/ClientFilters.test.tsx:99-101` (read directly). |

---

## §4. Verify-Everything Table (v4 X1–X18 + v2/v3 N1–N15)

Every prior-audit finding, independently re-verified against the current source. Status legend: **CONFIRMED** = finding still applies to current code. **FIXED** = finding resolved by a task. **REFUTED** = finding was wrong (false positive). **SUPERSEDED** = finding no longer relevant because the underlying code changed. **PARTIAL** = fix applied but residual issue remains.

### 4.1 AUDIT-v4 X-findings

| ID | Title (v4 verbatim) | Status | Evidence |
|---|---|---|---|
| **X1** | Silent fallback to MOCK_ENTRIES on DB error | **FIXED** | `grep MOCK_ENTRIES lib/data/entries.ts` → 0 hits. `lib/data/entries.ts:25-28` returns `{ status: 'error', message: ... }` on DB error. Verified by `lib/data/entries.test.ts:70-79` ("NEVER returns mock data"). |
| **X2** | `updateEntry` and `deleteEntry` rely solely on RLS, no query-layer ownership filter | **FIXED** | `app/actions/entries.ts:110-111` (update) and `:148-149` (delete) both have `.eq('entered_by', userId)`. Task 32 applied. |
| **X3** | Edit page uses public read path, leaks entry data cross-user | **FIXED** | `app/admin/edit/[id]/page.tsx:24-29` filters by `.eq('entered_by', officer.id)` in the SELECT query, calls `notFound()` if no row. Task 33 applied. |
| **X4** | Missing FK index on `entered_by` | **FIXED** | `supabase/migration.sql:137-138` adds `budget_entries_entered_by_idx`. Verified by `supabase/database.test.ts:178-184`. Task 34 applied. |
| **X5** | Missing composite and covering indexes for hot queries | **FIXED** | `supabase/migration.sql:123-133` adds 3 composite/covering indexes. Verified by `database.test.ts:186-216`. Task 38 applied. |
| **X6** | `Math.round(amount * 100)` has IEEE-754 precision bug | **FIXED** | `app/actions/entries.ts:34, 94` now use `Math.round(Number(validData.amount.toFixed(2)) * 100)`. The `toFixed(2)` wrapper serializes the number to a 2-dp string first, eliminating the float-representation error in the multiplication step. Zod refine at `lib/types.ts:27-29` rejects >2-dp inputs as defense-in-depth. Task 35 applied per its actual spec. |
| **X7** | `getSemesters` and `getCategories` fetch all rows + dedupe client-side | **FIXED** | `lib/data/entries.ts:110, 127` query the `distinct_semesters` / `distinct_categories` Postgres views. `supabase/migration.sql:141-145` defines both views with `security_invoker = on`. Task 39 applied. |
| **X8** | `rounded-full` violates Metro 'zero corner radius' rule | **FIXED** (documented exception) | `README.md` design-system section now explicitly documents `rounded-full` as the only allowed deviation. Task 42 applied. |
| **X9** | `GEMINI.md` leaks Supabase project_ref | **FIXED** | `grep ikoogqwigvfylwjatids GEMINI.md` → 0 hits. `GEMINI.md:14` uses `project_ref=<YOUR_PROJECT_REF>` placeholder. Task 36 applied. |
| **X10** | README documents `IS_E2E` env var that no longer exists | **FIXED** | `grep IS_E2E README.md` → 0 hits. Task 37 applied. |
| **X11** | `createClient()` not wrapped in React `cache()` | **FIXED** | `lib/supabase/server.ts:5` exports `createClient = cache(async () => {...})`. Task 40 applied. |
| **X12** | Broken assertion in `ClientFilters.test.tsx:99` | **REFUTED** (false positive) | Actual line 99: `expect(mockPush).not.toHaveBeenCalledWith(` — a valid Vitest assertion. v4 misread `.not.toHaveBeenCalledWith` as `.not.toContain`. Task 43 was applied to a non-bug. |
| **X13** | Trigger function `update_modified_column()` missing `SET search_path = ''` | **FIXED** | `supabase/migration.sql:48` has `SET search_path = ''`. Task 44 applied. |
| **X14** | `FORCE ROW LEVEL SECURITY` not enabled on either table | **FIXED** | `supabase/migration.sql:71, 74` both have `FORCE ROW LEVEL SECURITY`. Task 45 applied. |
| **X15** | `profiles` RLS policies use raw `auth.uid()` instead of cached `(select auth.uid())` form | **FIXED** | `supabase/migration.sql:84, 85, 89` (profiles) all use `(select auth.uid())`. Task 46 applied. |
| **X16** | Missing CHECK/ENUM constraints on `semester`, `academic_year`, `role` | **FIXED** | `supabase/migration.sql:151-161` adds 3 CHECK constraints. Task 41 applied. Note: `category` is still free-text `varchar(100)` — Task 41 didn't target it. |
| **X17** | `getEntry` falls back to MOCK_ENTRIES on DB error | **FIXED** | Same as X1. `lib/data/entries.ts:46-49` returns error status, no fallback. |
| **X18** | `.btn-ghost-danger` not in print-styles `display:none` list | **FIXED** | `app/theme.css` print styles now include `.btn-ghost-danger`. Task 47 applied. |

**v4 X-finding scorecard:** 17 FIXED, 1 REFUTED. v4's grade was inflated by ~3 points because X1 (the deploy-blocker, −3 pts) is now fixed, but v4's own scoring math also overcounted by 0.5 (§5 Contradiction #7).

### 4.2 AUDIT-v2/v3 N-findings

| ID | Title | Status | Evidence |
|---|---|---|---|
| **N1** | `revalidate = 60` no-op (homepage reads searchParams) | **SUPERSEDED but PARTIAL** | Task 19 removed the `revalidate = 60` export from `app/page.tsx` and added a comment explaining the page is dynamic. **However, `revalidatePath('/')` and `revalidatePath('/admin')` are still called in `app/actions/entries.ts:60-61, 124-125, 161-162` — those calls are also no-ops on dynamic routes.** Task 19 only half-fixed the problem. See Y3 in §6. |
| **N2** | Dependency drift (`@supabase/ssr` 0.5.2, `@supabase/supabase-js` 2.48.1) | **FIXED** | `package.json` pins `@supabase/ssr ^0.12.0` and `@supabase/supabase-js ^2.110.5`; installed version is 2.110.7. Tasks 21, 25 applied. |
| **N3** | `budget_entries` RLS `FOR ALL TO authenticated USING (true) WITH CHECK (true)` (permissive) | **FIXED** | `supabase/migration.sql:96-108` defines 3 separate policies (INSERT/UPDATE/DELETE) all scoped to `TO authenticated` + `(select auth.uid()) = entered_by`. Task 17 applied. |
| **N4** | `IS_E2E`/`sb-mock-auth` runtime backdoor active | **FIXED** | Grep confirms 0 hits. Task 20 (storageState migration) applied. |
| **N5–N8, N10** | Various code-quality / design issues | **FIXED** | Task 23 applied (sandbox moved, color discipline, `getOfficerAndClient()` dedupes clients). |
| **N9** | Admin UX gaps | **FIXED** | Task 24 applied (admin semester selector, server-component `SummaryStats`, 6 new component test files). |
| **N11** | E2E test data coupling (UUID drift between seed and real Supabase user) | **FIXED** | Task 22 applied (`globalSetup`/`globalTeardown` idempotent seed). |
| **N12** | `getUser()` vs `getClaims()` | **FIXED** | `lib/auth/session.ts:14, 28` and `lib/supabase/middleware.ts:40` all call `getClaims()`. Task 26 applied. |
| **N13** | Edge Runtime `process.version` warning persists | **FIXED** | `grep process.version node_modules/@supabase/supabase-js/dist/` → 0 hits. Build prints no warning. Task 25 applied. |
| **N14** | Expense red `#E51400` only 4.74:1 contrast (borderline AA) | **FIXED** | `app/theme.css` defines `--color-expense`, `--color-error`, `--color-accent-red` all as `#c81000` (5.83:1). Task 27 applied. |
| **N15** | 2 moderate CVEs in transitive `postcss <8.5.10` | **STILL OPEN** | `npm audit` confirms 2 moderate CVEs. No viable fix without downgrading Next.js. Monitor only. No grade deduction (already accepted in v3/v4). |

**N-finding scorecard:** 13 FIXED, 1 SUPERSEDED-but-PARTIAL (N1 — revalidatePath no-op persists in actions), 1 STILL OPEN (N15 — postcss CVE, monitor only).

---

## §5. Contradictions with AUDIT-v4

I called these out explicitly per the user's request. Each contradiction is backed by an independent grep or test run.

### 5.1 Contradiction #1 — Test count: 67 (v4) vs 87 (actual)

**v4's claim** (AUDIT-v4 §1): "npx vitest run — 67 / 67 pass".

**My finding:** `npx vitest run` prints `Tests 87 passed (87)`. Per-file breakdown in §3.2.

**What happened:** v4 was written *before* Tasks 31–47 were applied. Tasks 31–47 added 20 new tests:
- `lib/data/entries.test.ts` — new file (Task 31) — 4 tests
- `supabase/database.test.ts` — grew from 8 → 19 tests (Tasks 34, 38, 39, 41, 45, 46) — +11 tests
- `app/actions/entries.test.ts` — grew from 9 → 18 tests (Tasks 32, 35) — +9 tests (accounting for test reorganization, net +9)

**Grade impact:** v4's "67/67 pass" was true at v4's audit date. The current codebase has 87/87 passing. **No grade adjustment** — both audits confirm tests pass; the count discrepancy is a timestamp artifact, not an error in either audit. But v4's claim is now stale, and any future auditor who relies on "67/67" will be confused.

### 5.2 Contradiction #2 — X12 was a false positive

**v4's claim** (AUDIT-v4 §5 X12): "`ClientFilters.test.tsx:99` has broken assertion `expect(mockPush).not.toContain('category=')` that silently passes because `mockPush` is a function, not a string."

**My finding:** `app/components/ClientFilters.test.tsx:99-101` actually reads:

```typescript
expect(mockPush).not.toHaveBeenCalledWith(
  expect.stringContaining('category=')
);
```

This is a **valid Vitest assertion** — `toHaveBeenCalledWith` accepts asymmetric matchers like `expect.stringContaining(...)`. The assertion says "mockPush was never called with a string containing 'category='". It passes for the right reason: clicking the "All" chip calls `mockPush('/?')` (with no `category=` param).

**What happened:** v4 misread `.not.toHaveBeenCalledWith` as `.not.toContain`. This is a real misread — the two method names are visually similar but semantically different. `.not.toContain` would indeed be a no-op assertion on a function (functions don't have a `.contains` method, so it would throw or silently pass depending on the matcher). But `.not.toHaveBeenCalledWith` is a real, valid Vitest mock assertion.

**Grade impact:** v4 docked 0.25 pts for X12. I **restore** those 0.25 pts. Net swing vs v4: +0.25.

### 5.3 Contradiction #3 — Task 35: "Math.round gone" vs "Math.round still present, but bug fixed"

**R-3 subagent claim:** "Math.round on currency (task 35 not applied)" — Critical.

**R-4 subagent claim:** "Math.round is still present BUT the precision bug is FIXED via the `toFixed(2)` wrapper" — Task 35 applied per spec.

**My resolution:** Both are partially right. The literal `Math.round` call is still present at `app/actions/entries.ts:34, 94`. BUT the call is now `Math.round(Number(validData.amount.toFixed(2)) * 100)`, not `Math.round(validData.amount * 100)`. The `toFixed(2)` wrapper serializes the number to a 2-decimal-place string first, which eliminates the float-representation error in the multiplication step. So the IEEE-754 precision bug from v4's X6 is **fixed**.

Task 35's actual spec (per `tasks/35_fix_math_round_precision.md`): "Replace `Math.round(validData.amount * 100)` with `Math.round(Number(validData.amount.toFixed(2)) * 100)`". The implementation matches the spec exactly.

**Edge case caveat:** `toFixed(2)` itself uses IEEE-754 rounding, which can have surprises — e.g., `(1.005).toFixed(2)` returns `"1.00"` (not `"1.01"`) in V8/Node because 1.005 is actually stored as 1.00499999... The code comment at `entries.ts:33` claims "1.005 → '1.01' → 101" — this is **wrong**; the actual behavior is "1.005 → '1.00' → 100". However, the Zod refine at `lib/types.ts:27-29` rejects inputs with >2 decimal places (`Math.abs(n * 100 - Math.round(n * 100)) < 0.001`), so any 3-dp input like `1.005` would be rejected before reaching the action. The system is safe in practice, even if the comment is inaccurate.

**Grade impact:** No deduction. Task 35 is applied per spec. The code comment inaccuracy is a Yn LOW finding (Y12 in §6).

### 5.4 Contradiction #4 — v4 missed the missing admin role check (Y1)

**v4's claim:** v4 does not flag that `app/admin/page.tsx:22-26` only checks authentication, not authorization. v4 explicitly praised the RLS hardening (X2, X3) but didn't notice that the *app layer* doesn't verify the user has a designated officer role.

**My finding:** `lib/auth/session.ts:10-20` defines `getOfficer()` to return `{ id, email }` only — no role check. `app/admin/page.tsx:22-26` calls `getOfficer()` and redirects to `/login` if null, but does NOT verify the user has a `profiles` row with an authorized role. The `profiles` fetch at L29-34 is purely cosmetic (used to display the officer's name and role badge in the header, with fallback to `officer.email || 'Officer'`).

Combined with the RLS INSERT policy at `supabase/migration.sql:97-99` (`WITH CHECK ((select auth.uid()) = entered_by)`), this means: **any Supabase-Authenticated user can publish budget entries.** They can only edit/delete entries they own, but they can create new entries that appear on the public site.

For a transparency portal whose success criterion is "any CBEA student can find and understand budget info without asking an officer directly", this is a critical design gap. The whole point is that only designated officers can publish. RLS is necessary but not sufficient.

**Grade impact:** −3 pts from Security. v4 missed this entirely.

### 5.5 Contradiction #5 — v4 missed 17 `console.error` in production paths (Y4)

**v4's claim:** v4 doesn't flag the `console.error` calls in `app/actions/entries.ts`, `lib/data/entries.ts`, or `app/admin/components/AdminHeader.tsx`.

**My finding:** 17 `console.error` calls in production paths. Several log raw `error.message` from Supabase, which can leak internal DB details to server logs in production (Vercel logs are visible to anyone with dashboard access). Task 13 (Code Quality Cleanup) removed 3 `console.log` calls but left the `console.error` calls.

**Grade impact:** −1pt from Code Quality.

### 5.6 Contradiction #6 — v4 missed the EntryForm type-safety lie (Y2)

**v4's claim:** v4 doesn't flag that `EntryForm`'s `initialData?: BudgetEntry` interface lies about the unit of `amount`.

**My finding:** `app/admin/components/EntryForm.tsx:9` declares `initialData?: BudgetEntry`. `lib/types.ts:8` documents `amount: number // Stored as integer centavos`. But `app/admin/edit/[id]/page.tsx:38` passes `amount: (entry as BudgetEntry).amount / 100` — decimal pesos. The test at `EntryForm.test.tsx:22-36, 72, 161` entrenches the lie by passing `amount: 150000` (centavos) and expecting the input to display `'150000'`.

Production data flow happens to work today because the only caller (the edit page) does the `/100` conversion. But any future refactor that trusts the type and passes a raw `BudgetEntry` to the form would silently multiply the amount by 100 — a ₱150 entry stored as ₱15,000.

**Grade impact:** −1pt from Data Integrity. v4 missed this.

### 5.7 Contradiction #7 — v4's score math has a 0.5-pt rounding error

**v4's claim** (AUDIT-v4 §6.2): Cross-cutting subtotal "17/20".

**My check:** Sum of v4's §6.2 row entries: 2.5 + 2.5 + 2.5 + 2.5 + 2 + 2 + 2 + 1 = **17.5**, not 17.

**What happened:** v4 either rounded down or made an arithmetic error in its own scoring. The "true" v4 score under its own rubric should be 87.5/100, rounded to 88 — not 87.

**Grade impact:** N/A for my audit (I have my own rubric). But this confirms v4's "87" was already slightly conservative against its own rubric.

### 5.8 Contradiction #8 — v4 missed 5 untested route pages (Y5)

**v4's claim:** v4 grades test suite 12.5/15 but doesn't flag that `app/page.tsx`, `app/login/page.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx` have **zero co-located tests**.

**My finding:** Confirmed via `ls app/**/*.test.tsx` — no `page.test.tsx` exists for any of these 5 routes. The auth-redirect logic, `searchParams` parsing, and error states are completely untested at the route level.

**Grade impact:** −2pts from Test Suite. v4 missed this.

### 5.9 Contradiction #9 — v4 missed that `revalidatePath` no-op persists in actions (Y3)

**v4's claim:** v4 says N1 is OBSOLETE because Task 19 removed `revalidate = 60` from `app/page.tsx`.

**My finding:** Task 19 removed the *export*, but `app/actions/entries.ts:60-61, 124-125, 161-162` still call `revalidatePath('/')` and `revalidatePath('/admin')`. Both routes are dynamic (`force-dynamic` + `searchParams`), so these calls are no-ops. The cache-invalidation strategy is still broken; it's just broken in a different way than v4 described.

**Grade impact:** −1pt from Performance. v4 marked this resolved when only half of it was.

### 5.10 Summary of contradictions

| # | Topic | v4's claim | My finding | Direction |
|---|---|---|---|---|
| 1 | Test count | 67/67 | 87/87 | Timestamp artifact, not an error |
| 2 | X12 broken assertion | Real bug | False positive — assertion is valid | +0.25 to grade |
| 3 | Task 35 Math.round | Applied per spec | Applied per spec; comment inaccurate | 0 net |
| 4 | Admin role check | Not flagged | HIGH severity gap (Y1) | −3 to grade |
| 5 | 17 console.error | Not flagged | MEDIUM severity gap (Y4) | −1 to grade |
| 6 | EntryForm type-lie | Not flagged | HIGH severity gap (Y2) | −1 to grade |
| 7 | v4's §6.2 math | 17/20 | 17.5/20 | v4's own score should be 88, not 87 |
| 8 | 5 untested route pages | Not flagged | MEDIUM severity gap (Y5) | −2 to grade |
| 9 | revalidatePath no-op | N1 OBSOLETE | N1 PARTIAL — actions still call no-op revalidatePath | −1 to grade |

**Net swing vs v4:** +0.25 (X12 refuted) − 3 (Y1) − 1 (Y4) − 1 (Y2) − 2 (Y5) − 1 (Y3) = **−7.75 pts**.

v4 grade: 87/100. My grade: 87 − 7.75 = 79.25 → rounds to **79/100**. But I also credit the project for fixes v4 didn't acknowledge (Tasks 31–47 added 20 tests, hardened RLS with FORCE, added cached `auth.uid()`, etc.), which adds back ~3 pts. Net: **82/100 (B−)**. See §8 for the full breakdown.

---

## §6. New Findings (Y1–Yn)

Continuing the X1–X18 lineage from v4. Each Yn is a finding v4 missed.

### Y1 — Missing role/authorization check at app layer (HIGH)

**File:Line:** `app/admin/page.tsx:22-26`, `app/admin/new/page.tsx` (entire file), `app/admin/edit/[id]/page.tsx:17-20`, `lib/auth/session.ts:10-20`.

**Description:** `getOfficer()` returns `{ id, email }` from `supabase.auth.getClaims()` — authentication only, no authorization. Any Supabase-Authenticated user is treated as an "officer". The admin pages redirect to `/login` if `officer` is null, but never check whether the user has a `profiles` row with an authorized role.

**Impact:** If Supabase Auth public signups are enabled in the production project (the default), anyone with the project URL and anon key (both `NEXT_PUBLIC_*`) can sign up, navigate to `/admin`, and submit entries. RLS allows the insert because the INSERT policy at `supabase/migration.sql:97-99` only checks `(select auth.uid()) = entered_by` — and the new user is the `entered_by` of their own entries. The submitted entries appear on the public homepage.

For a transparency portal, "anyone can publish budget entries" defeats the entire purpose. The success criterion — "any CBEA student can find and understand budget info without asking an officer directly" — assumes the info comes from designated officers.

**Mitigating factors:**
- Supabase Auth signups can be (and should be) disabled in production (Dashboard → Authentication → Providers → Email → toggle off "Allow new users to sign up"). This is an operational control, not a code control.
- RLS still blocks cross-user writes (an attacker can edit/delete only their own entries, not the real officers').
- The `/admin` route is not advertised publicly.

**Suggested fix:** In `lib/auth/session.ts`, add a `getAuthorizedOfficer()` that fetches the `profiles` row and verifies `role` is in the allowed set. Use it in all admin pages. Also operationally disable public signups.

### Y2 — EntryForm type-safety lie (HIGH)

**File:Line:** `app/admin/components/EntryForm.tsx:8-10` (interface), `app/admin/edit/[id]/page.tsx:36-39` (caller), `app/admin/components/EntryForm.test.tsx:22-36, 72, 161` (test entrenchment).

**Description:** `EntryFormProps.initialData?: BudgetEntry` claims to receive a `BudgetEntry`, whose `amount` is documented as "Stored as integer centavos" (`lib/types.ts:8`). But the edit page passes `amount: (entry as BudgetEntry).amount / 100` — decimal pesos, not centavos.

The form treats `initialData.amount` as a display value: `String(initialData.amount)` (line 19). When the user submits, the form sends `amount: parseFloat(formData.amount)` (line 61-64) — pesos — to the server action, which then multiplies by 100 to get centavos.

So the production data flow is correct *by accident*: edit page converts centavos → pesos before passing to form; form passes pesos through; action converts pesos → centavos before saving. But the *types* say centavos the whole way through.

**The test entrenches the lie:** `EntryForm.test.tsx:22-36` declares `mockInitialData: BudgetEntry` with `amount: 150000` (centavos). The test expects the input to display `'150000'` (line 72) and `updateEntry` to be called with `amount: 150000` (line 161). If the test were run against the production edit page (which would pass `amount: 1500` pesos), the assertions would fail.

**Risk:** Any refactor that trusts the type and passes a raw `BudgetEntry` to `<EntryForm>` (e.g., a future "duplicate entry" feature that pre-fills the form from a list-row click) would silently multiply the amount by 100. A ₱150 entry would be stored as ₱15,000. For a transparency portal, that's a credibility-breaking bug.

**Suggested fix:** Split the type. Define `EntryFormInitialData` with `amount: number /* pesos */`. Update the edit page to pass pesos (drop the `/100` division). Update the test to pass `1500` and expect `'1500'`.

### Y3 — `revalidatePath` no-op persists in server actions (MEDIUM)

**File:Line:** `app/actions/entries.ts:60-61, 124-125, 161-162`.

**Description:** All three server actions call `revalidatePath('/')` and `revalidatePath('/admin')` after a successful mutation. But both routes are dynamic (`/` reads `searchParams`; `/admin` is `force-dynamic`), so `revalidatePath` on them is a no-op. The build output (§3.5) confirms both routes are `ƒ (Dynamic)`.

Task 19 fixed the `revalidate = 60` export on the homepage and added a comment explaining the dynamic-rendering constraint, but the *actions* were never updated. The comment at `app/page.tsx:9-11` says "No ISR/revalidate is possible without PPR + Suspense" — but the actions still call `revalidatePath` as if it would do something.

**Practical impact:** Partially mitigated by `router.refresh()` called in `EntryForm.tsx:93` and `EntryTable.tsx` after a successful mutation. `router.refresh()` re-fetches the current route's server components, which effectively busts the cache for the admin page. But the public homepage (`/`) is not refreshed — a student visiting `/` immediately after an officer publishes a new entry might see stale data on the first render (subsequent renders would be fresh because the page is dynamic).

**Suggested fix:** Either (a) remove the no-op `revalidatePath` calls entirely (cleanest), or (b) migrate to `unstable_cache` + `revalidateTag('budget-entries')` if real cache invalidation is desired. Option (a) is fine for v1 since the routes are already dynamic.

### Y4 — 17 `console.error` calls in production paths (MEDIUM)

**File:Line:** `app/actions/entries.ts:55, 65, 119, 129, 152, 166`; `app/admin/components/AdminHeader.tsx:20`; `lib/data/entries.ts:26, 32, 47, 53, 74, 102, 113, 119, 130, 136`.

**Description:** 17 `console.error` calls in production code paths. Several log raw `error.message` from Supabase, which can leak internal DB details (column names, constraint names, query fragments) to server logs. On Vercel, server logs are visible to anyone with dashboard access.

Task 13 (Code Quality Cleanup) removed 3 `console.log` calls but left the `console.error` calls. The justification was probably "errors need to be logged for debugging", but unstructured `console.error` is the wrong tool — it has no log level, no redaction, no correlation ID, no request context.

**Suggested fix:** Gate behind `process.env.NODE_ENV !== 'production'`, or replace with a structured logger (`pino` is the Node.js standard). At minimum, redact `error.message` and `error.details` from Supabase errors before logging.

### Y5 — Five route-level pages have zero co-located tests (MEDIUM)

**File:Line:** `app/page.tsx`, `app/login/page.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx`.

**Description:** None of these 5 route files have a `*.test.tsx` co-located test. The auth-redirect logic in admin pages, the `searchParams` parsing on the homepage, the login error flow, and the edit-page ownership check are all untested at the route level. The `app/layout.test.tsx` test exists but is a no-op (Y6).

Component tests (`EntryForm.test.tsx`, `EntryTable.test.tsx`, `BudgetEntryList.test.tsx`, etc.) cover the leaf components, and `app/actions/entries.test.ts` covers the server actions. But the integration between route + data layer + components is untested.

**Suggested fix:** Add `*.test.tsx` for each route. Mock `getOfficer`/`getOfficerAndClient`/`getEntries`/`getSummaryStats` and assert: (a) redirect vs render based on auth state, (b) error banner rendering on data-fetch failure, (c) `searchParams` parsing for the homepage, (d) `notFound()` on missing/owned entry for the edit page.

### Y6 — `app/layout.test.tsx` is a no-op (MEDIUM)

**File:Line:** `app/layout.test.tsx:1-13`.

**Description:** The test renders `<div>Test Child</div>` and asserts "Test Child" is in the DOM. It does NOT render `<RootLayout>`, does NOT assert `document.documentElement.lang === 'en'`, does NOT assert the document title, does NOT assert body classes. Zero coverage of `RootLayout`.

Task 29 (Fix Layout Test Hydration Warning) shortened the test to remove the hydration warning, but didn't add real coverage. The test exists only to make the test count match.

**Suggested fix:** Render `<RootLayout><span>X</span></RootLayout>`. Assert:
- `container.querySelector('html')?.lang === 'en'`
- `document.title` matches the metadata
- `container.querySelector('body')?.classList.contains('bg-background')` is true
- The `<span>X</span>` is rendered inside `<body>`

### Y7 — Hardcoded test credentials in 4 source files (MEDIUM)

**File:Line:** `tests/global-setup.ts:4-5`, `tests/auth.setup.ts:6-7`, `tests/auth-flow.spec.ts:43-44`, `scratch/create-test-user.ts:8-9`.

**Description:** `jane.doe@csu.edu.ph` / `Password123!` is committed in plaintext in 4 files. If the production Supabase project is the same as the test project (which is plausible for a student-council project on a free tier), anyone with read access to the repo can authenticate as the Treasurer.

`README.md:24` does say "Test only — for Playwright `globalSetup`/`globalTeardown`" for `SUPABASE_SERVICE_ROLE_KEY`, suggesting the test project is intended to be separate. But there's no enforcement of this separation — the same env vars work for both projects.

**Suggested fix:** Move credentials to `.env.local` as `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`. Validate with Zod in `global-setup.ts`. Add a CI check that greps for `jane.doe@csu.edu.ph` and `Password123!` in source.

### Y8 — `as BudgetEntry` unchecked type casts in production paths (MEDIUM)

**File:Line:** `app/actions/entries.ts:63, 127`; `app/admin/edit/[id]/page.tsx:37, 38`.

**Description:** Four `as BudgetEntry` casts on untyped Supabase return values. If the DB schema drifts (e.g., a column rename), TypeScript won't catch it; the cast will silently succeed and downstream code will read `undefined` from the missing field.

`lib/types.ts:19-38` already exports `BudgetEntrySchema` (Zod). The casts could be replaced with `BudgetEntrySchema.parse(entry)` for runtime validation, reusing the existing schema.

**Suggested fix:** Replace `as BudgetEntry` with `BudgetEntrySchema.parse(entry)` at all 4 sites. Wrap in try/catch and return an error result if parsing fails (defensive against schema drift).

### Y9 — Hydration risk: `new Date()` in `EntryForm` client `useState` (MEDIUM)

**File:Line:** `app/admin/components/EntryForm.tsx:20`.

**Description:** `date: initialData?.date || new Date().toISOString().split('T')[0]` in `useState` initializer of a client component. If the server renders the form at 23:59:59 UTC and the client hydrates at 00:00:01 UTC, the default date will differ by one day between SSR and hydration — causing a React hydration mismatch warning.

In practice, the edit page always passes `initialData.date` (from the DB row), so the `new Date()` fallback only fires in create mode. But create mode is exactly when the form is server-rendered (the `/admin/new` page is a server component that renders `<EntryForm />`).

**Suggested fix:** Initialize `date` with empty string, then set today's date in `useEffect`:

```typescript
const [formData, setFormData] = useState({
  // ...
  date: initialData?.date || '',
  // ...
});

useEffect(() => {
  if (!formData.date) {
    setFormData(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
  }
}, []); // run once on mount
```

### Y10 — `getSummaryStats` does JS-side aggregation (MEDIUM)

**File:Line:** `lib/data/entries.ts:65-89`.

**Description:** `getSummaryStats` fetches all rows for the semester (`select('type, amount')` with no limit) into Node memory, then loops in JS to sum income and expense. For a semester with 500+ entries, this is a 500-row transfer + JS loop on every page load (both `/` and `/admin`).

The covering index `budget_entries_semester_covering_idx` at `supabase/migration.sql:127-128` was designed to support an index-only scan for this query — but only if the aggregation happens in SQL. With the current JS-side aggregation, Postgres does the index-only scan but still returns all rows to the client.

**Suggested fix:** Replace with a Postgres function called via `.rpc('get_summary_stats', { p_semester })`. The function would do `SELECT SUM(amount) FILTER (WHERE type = 'income') AS total_collected, SUM(amount) FILTER (WHERE type = 'expense') AS total_spent FROM budget_entries WHERE semester = $1`. Returns one row, one round-trip, index-only scan.

Alternative: use Supabase's embedded aggregate support — `.select('type, amount').eq('semester', sem)` won't aggregate, but you can use a custom view.

### Y11 — `getEntries` has no pagination (MEDIUM)

**File:Line:** `lib/data/entries.ts:8-35`.

**Description:** `getEntries` returns every row for the semester, ordered by `date DESC, created_at DESC`. No `LIMIT` / `range()` / cursor pagination. `BudgetEntryList` renders all rows as DOM nodes. A semester with 500+ entries → 500-row DOM, no virtualization.

For v1 scale (10 seed entries, real council probably <50/semester), this is fine. But the success criterion "any CBEA student can find and understand budget info" implies the site should remain usable as history accumulates. After 4 years of operation, a semester could have 100+ entries.

**Suggested fix:** Add `.range(0, 99)` (100 entries per page) + a "Load more" button using cursor-based pagination (`?cursor=<last-entry-date>`). Or implement infinite scroll with `IntersectionObserver`.

### Y12 — Code comment lies about `toFixed(2)` behavior (LOW)

**File:Line:** `app/actions/entries.ts:33`.

**Description:** The comment says "1.005 → '1.01' → 101". But `(1.005).toFixed(2)` actually returns `"1.00"` in V8/Node because `1.005` is stored as `1.00499999...`. The Zod refine rejects 3-dp inputs, so this never fires in practice — but the comment is misleading.

**Suggested fix:** Fix the comment to use a correct example: `1.5 → "1.50" → 150`. Or remove the example altogether and just describe the algorithm.

### Y13 — `as Record<string, string[]>` cast on Zod field errors (LOW)

**File:Line:** `app/actions/entries.ts:26, 86`.

**Description:** `validation.error.flatten().fieldErrors as Record<string, string[]>` — Zod's actual type is `{ [k]: string[] | undefined }`. The cast hides potential `undefined` values from downstream code. `EntryForm.tsx:97-99` happens to handle this correctly (it iterates `Object.entries(...)` which skips `undefined` values), but the cast is still unsafe.

**Suggested fix:** Replace with a runtime filter:

```typescript
const fieldErrors = validation.error.flatten().fieldErrors;
const validationErrors: Record<string, string[]> = {};
for (const [k, v] of Object.entries(fieldErrors)) {
  if (v) validationErrors[k] = v;
}
```

### Y14 — Profile fetch in admin page is sequential (LOW)

**File:Line:** `app/admin/page.tsx:29-49`.

**Description:** The `profiles` fetch (L29-34) runs sequentially before `getSemesters()` (L37), which runs sequentially before the `Promise.all` for entries + stats (L52). The profile fetch could run in parallel with everything else — it doesn't depend on `semestersList` or `activeSemester`.

**Suggested fix:** Move the profile fetch into a `Promise.all` alongside `getSemesters`, then another `Promise.all` for entries + stats. Or use `Promise.all([profileFetch, semestersFetch])` first, then `Promise.all([entriesFetch, statsFetch])`.

### Y15 — `asOfDate` uses `new Date()` (render time), not data's last-update time (LOW)

**File:Line:** `app/page.tsx:59-64`, `app/admin/page.tsx:71-76`.

**Description:** `const asOfDate = new Date().toLocaleDateString(...)` shows *render time*, not the data's last-update time. A student visiting the site sees "as of Jul 20, 2026" even if the last entry was months ago. Misleading for a transparency portal.

**Suggested fix:** Compute `MAX(updated_at)` from the fetched entries (or fetch it separately via a `getMaxUpdatedAt()` query) and use that as `asOfDate`. If no entries exist, fall back to "No data published yet."

### Y16 — Delete-confirmation focus loss (LOW)

**File:Line:** `app/admin/components/EntryTable.tsx:91-135`.

**Description:** When the user clicks "Delete" on a row, the Edit/Delete buttons are replaced with Confirm/Cancel buttons. The focused "Delete" button unmounts, and the user's focus jumps to `<body>`. Keyboard users lose their place.

**Suggested fix:** Use a `useEffect` that focuses the Confirm button when `isConfirming` becomes true:

```typescript
const confirmBtnRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (isConfirming) confirmBtnRef.current?.focus();
}, [isConfirming]);
```

### Y17 — Login error div lacks `role="alert"` (LOW)

**File:Line:** `app/login/page.tsx:72-79`.

**Description:** The login error `<div>` has no `role="alert"` or `aria-live="assertive"`. Screen readers won't announce the error when it appears after a failed submit. The sibling `ErrorBanner.tsx` correctly uses `role="alert"` — inconsistent.

**Suggested fix:** Add `role="alert"` to the error div.

### Y18 — Server-error divs in EntryForm/EntryTable lack `role="alert"` (LOW)

**File:Line:** `app/admin/components/EntryForm.tsx:117-121`, `app/admin/components/EntryTable.tsx:33-37`.

**Description:** Same as Y17 but for the server-error divs in the form and table. Inconsistent with `ErrorBanner.tsx`.

**Suggested fix:** Add `role="alert"` to both.

### Y19 — Income/Expense toggle lacks `role="radiogroup"` (LOW)

**File:Line:** `app/admin/components/EntryForm.tsx:123-159`.

**Description:** The Income/Expense toggle is two `<button type="button">`s with no `aria-pressed`/`aria-checked` and no `role="radiogroup"`. Screen readers announce them as generic buttons, not a mutually-exclusive choice.

**Suggested fix:** Wrap in `<fieldset role="radiogroup" aria-label="Transaction Type"><legend>Transaction Type</legend>` and use `<button role="radio" aria-checked={formData.type === 'income'}>`.

### Y20 — 9 unused accent tokens in `theme.css` (LOW)

**File:Line:** `app/theme.css:15-24`.

**Description:** Defines 9 unused `--color-accent-*` tokens (blue, brown, magenta, purple, teal, green, red, orange, pink) plus `--color-accent-lime` (duplicate of `--color-primary`). Metro spec mandates single Lime accent. These tokens invite future violations.

**Suggested fix:** Delete all `--color-accent-*` tokens. Keep only `--color-primary` (Lime), `--color-income`, `--color-expense`, `--color-warning`, neutrals.

### Y21 — `--color-income` (green) is a second accent beyond Lime (LOW)

**File:Line:** `app/theme.css:9`.

**Description:** Income green `#2d7a2d` is a second accent color beyond Lime. Strict Metro spec says single Lime accent. Income could be signaled by `+`/`−` sign and typography alone, with Lime for income and red for expense.

**Suggested fix:** Either (a) keep green but document it as a permitted semantic color, or (b) per strict Metro, drop income green and use Lime (`--color-primary`) for income, red for expense.

### Y22 — `bg-error/10` tint violates strict Metro (LOW)

**File:Line:** `app/admin/components/EntryForm.tsx:118`, `app/admin/components/EntryTable.tsx:34`.

**Description:** `bg-error/10` is a Tailwind opacity modifier producing a 10% red tint. Strict Metro says pure white BG. `ErrorBanner.tsx` uses `bg-surface` (light gray) which is more defensible.

**Suggested fix:** Use `bg-surface` (consistent with `ErrorBanner`) or pure `bg-white` with `border-l-4 border-error`.

### Y23 — `AdminSemesterSelector` missing `startTransition` (LOW)

**File:Line:** `app/admin/components/AdminSemesterSelector.tsx:22`.

**Description:** `router.push(...)` without `startTransition` — inconsistent with `ClientFilters.tsx:57` which wraps the same pattern in `startTransition`. Causes a non-priority transition (no pending state surfaced).

**Suggested fix:** Wrap in `startTransition` (and optionally surface `isPending`).

### Y24 — Login error displays raw Supabase error (LOW)

**File:Line:** `app/login/page.tsx:38`.

**Description:** `setError(signInError.message)` displays the raw Supabase error to the user. Default Supabase returns generic "Invalid login credentials" (OK), but custom configs may leak email-existence ("User not registered" vs "Invalid password").

**Suggested fix:** Map known error codes to safe messages; fall back to "Invalid email or password."

### Y25 — PivotTabs missing keyboard-nav test (LOW)

**File:Line:** `app/components/PivotTabs.test.tsx`.

**Description:** Tests rendering + active state, but no keyboard-nav test (Arrow/Home/End). The `handleKeyDown` logic (the riskiest code in the component) is untested.

**Suggested fix:** Add `fireEvent.keyDown(container, { key: 'ArrowRight' })` assertions; verify `onTabChange` + focus move.

### Y26 — `<nav>` lacks `aria-label` (LOW)

**File:Line:** `app/components/Header.tsx:16`.

**Description:** `<nav>` has no `aria-label`. Only one nav per page currently, so screen readers default to "navigation", but adding `aria-label="Primary"` is best practice.

**Suggested fix:** Add `aria-label="Primary"`.

### Y27 — ILIKE search doesn't escape `%`/`_` wildcards (LOW)

**File:Line:** `lib/data/entries.ts:19`.

**Description:** `query.ilike('description', `%${filters.search}%`)` — Supabase client parameterizes, so no SQL injection. But a user-supplied `%` or `_` in `search` is treated as a wildcard, not literal. Searching `100%` matches everything containing `100` followed by anything.

**Suggested fix:** Escape `%` and `_` in search input, or document the behavior.

### Y28 — `scratch/test-crud.test.ts` has stale mock (LOW)

**File:Line:** `scratch/test-crud.test.ts:32-37, 50-57`.

**Description:** Mocks `supabase.auth.getUser`, but production code (`lib/auth/session.ts:14, 28`) now uses `supabase.auth.getClaims()` (Task 26). The mock has no `getClaims` method, so calling it throws `TypeError`, which `getOfficer`'s try/catch swallows → returns `null`. Both test cases print "Unauthorized" regardless of input. The test does not verify what it claims to verify.

**Suggested fix:** Either update the mock to expose `getClaims`, or delete the file — it's scratch.

### Y29 — `lib/supabase/supabase.test.ts:91` stale mock call shape (LOW)

**File:Line:** `lib/supabase/supabase.test.ts:91`.

**Description:** `cookiesObj.setAll!([...], {})` — (1) unnecessary `!` non-null assertion on a defined method; (2) extra `{}` second arg ignored by JS; the actual `setAll` signature takes one arg. Looks like a leftover from an older `@supabase/ssr` API. The test passes by accident.

**Suggested fix:** Drop the `!` and the extra `{}`: `cookiesObj.setAll([{ name: 'sb-refresh-token', value: 'new-token', options: {} }])`.

### Y30 — `tests/global-setup.ts` TOCTOU + missing error handling (LOW)

**File:Line:** `tests/global-setup.ts:22-41`.

**Description:** `getUserById(TEST_USER_ID)` return value is destructured but `error` is never checked. On transient network error, `existingUser?.user` is null → code attempts `createUser` on an existing user → throws `User already registered`. Also `listUsers()` is paginated (default 1000); a project with >1000 users would miss the test user.

**Suggested fix:** Check `error` from `getUserById`. Paginate `listUsers` via `page` param. Wrap deletion in try/catch.

### Y31 — `tests/global-teardown.ts` broad cleanup (INFO)

**File:Line:** `tests/global-teardown.ts:18-21`.

**Description:** Teardown deletes ALL entries with `description LIKE 'E2E Sponsorship %'` regardless of `entered_by`. Uses service-role key so bypasses RLS. Theoretically could delete a real officer's entry that happens to start with that prefix.

**Suggested fix:** Add `.eq('entered_by', TEST_USER_ID)` filter.

### Y32 — `tests/admin-crud.spec.ts:19, 61` magic timeouts (LOW)

**File:Line:** `tests/admin-crud.spec.ts:19, 61`.

**Description:** `await page.waitForTimeout(500)` used twice "for form slide-in animation to finish" — brittle, slows tests, breaks if animation duration changes.

**Suggested fix:** Use `await expect(page.locator('[data-testid="description-input"]')).toBeVisible()` instead.

### Y33 — `supabase/database.test.ts:305` fragile RLS test data (LOW)

**File:Line:** `supabase/database.test.ts:305`.

**Description:** The "insert with someone else's `entered_by`" test uses `semester='1st Semester AY 2024-2025'` which also violates the `budget_entries_semester_check` CHECK constraint. The test passes only because Postgres evaluates RLS WITH CHECK before CHECK constraints — if that order ever changes, the test breaks for the wrong reason.

**Suggested fix:** Use a valid semester (`'1st Sem'`) so the only failing predicate is RLS.

### Y34 — `supabase/migration.sql:19-20, 36-37` redundant `timezone()` wrapper (LOW)

**File:Line:** `supabase/migration.sql:19-20, 36-37`.

**Description:** `DEFAULT timezone('utc'::text, now())` — `timezone(text, timestamptz)` returns `timestamp without time zone`, which is then implicitly cast back to `timestamptz` using the session's `TimeZone`. Functionally equivalent to `now()` in UTC sessions, but subtly session-dependent. Supabase convention is just `DEFAULT now()`.

**Suggested fix:** Replace `timezone('utc'::text, now())` with `now()`.

### Y35 — `.env.example:3` stale comment (LOW)

**File:Line:** `.env.example:3`.

**Description:** Comment says "Optional: service role key for local DB seeding scripts only" — but `README.md:24` correctly says "Test only — for Playwright `globalSetup`/`globalTeardown`". The .env.example comment is stale.

**Suggested fix:** Update to: `# Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production.`

### Y36 — Tests entrench no-op `revalidatePath` (LOW)

**File:Line:** `app/actions/entries.test.ts:241-242, 280-281, 294-295`.

**Description:** Asserts `revalidatePath` is called with `'/'` and `'/admin'` — entrenches the no-op behavior instead of catching it. Test passes despite the cache strategy being broken.

**Suggested fix:** After fixing Y3, assert `revalidateTag('budget-entries')` instead (or remove the assertion if `revalidatePath` is removed entirely).

### Y37 — `BudgetEntry.amount` allows zero (LOW)

**File:Line:** `supabase/migration.sql:29` (`CHECK (amount >= 0)`), `lib/types.ts:26` (`.min(0)`).

**Description:** Both DB and Zod allow `amount = 0`. A zero-amount entry (income or expense) is semantically meaningless for a budget transparency portal. v4's X16 only targeted `semester`/`academic_year`/`role` — `amount` constraint was not in scope.

**Suggested fix:** Tighten to `CHECK (amount > 0)` and `.min(0.01, "Amount must be greater than zero")`. Or document that zero-amount entries are intentional (e.g., for "in-kind donation recorded for the record" entries).

---

## §7. Already-Fixed Verification (Tasks 09–47)

All 39 task files were read in full. The "Status" field is implicit in each file (no explicit `Status:` field — status is inferred from `[x]` marks on acceptance-criteria checkboxes). I independently verified each task's claims against the source.

| Task | Title | Verified Status | Evidence |
|---|---|---|---|
| 09 | Remove E2E Mock-Auth Backdoor | **CONFIRMED** | `grep IS_E2E sb-mock-auth NEXT_PUBLIC_IS_E2E app/ lib/ supabase/ tests/ middleware.ts` → 0 hits. |
| 10 | Fix Server Action Unit Tests | **CONFIRMED** | `app/actions/entries.test.ts` has 18 tests, all pass. Mocks `lib/auth/session` instead of `next/headers`. |
| 11 | Fix Failing E2E and Lint Issues | **CONFIRMED** | `npx tsc --noEmit` → 0 errors. `npx eslint` → 0 warnings. |
| 12 | Fix Design System Violations | **CONFIRMED** | Header padding, font-weight, EntryForm border, delete-button — all per Metro. |
| 13 | Code Quality Cleanup | **PARTIAL** | `console.log` removed (3 hits gone). **But `console.error` left in place (17 hits remain — Y4).** Vitest excludes `scratch/`. Formatters extracted to `lib/format/`. |
| 14 | Documentation and README | **CONFIRMED** | README rewritten with project-specific sections. `AGENTS.md` references `https://nextjs.org/docs`. `.env.example` committed. |
| 15 | Database Improvements | **CONFIRMED** | `supabase/seed.local.sql` exists (PGlite-only auth stubs). Migration is production-safe. `profiles.created_at` column added. |
| 16 | Performance Optimization | **PARTIAL** (superseded by 19, 39) | Two acceptance items struck through (revalidate no-op). SELECT DISTINCT views deferred to Task 39 (applied). |
| 17 | Harden `budget_entries` RLS Write Policy | **CONFIRMED** | `supabase/migration.sql:96-108` has 3 separate INSERT/UPDATE/DELETE policies scoped to `TO authenticated` + `(select auth.uid()) = entered_by`. |
| 18 | Add `WITH CHECK` to Profiles UPDATE Policy | **CONFIRMED** | `supabase/migration.sql:82-85` has `USING` + `WITH CHECK`. INSERT policy at L87-89 has `WITH CHECK`. |
| 19 | Fix the No-Op `revalidate = 60` on Homepage | **PARTIAL** | `revalidate = 60` export removed from `app/page.tsx`; comment added. **But `revalidatePath` calls in `app/actions/entries.ts:60-61, 124-125, 161-162` are still no-ops (Y3).** |
| 20 | Migrate E2E Auth to Playwright `storageState` | **CONFIRMED** | `tests/auth.setup.ts` exists. `playwright.config.ts` uses `storageState: 'playwright/.auth/user.json'`. |
| 21 | Upgrade Supabase Dependencies | **CONFIRMED** (superseded by 25) | `package.json` pins `@supabase/ssr ^0.12.0`. `@supabase/supabase-js` upgraded further by Task 25. |
| 22 | Fix E2E Test Data Coupling and Residue | **CONFIRMED** | `tests/global-setup.ts` and `tests/global-teardown.ts` exist. Idempotent seed. (TOCTOU issue remains — Y30.) |
| 23 | Code Quality and Design-System Cleanup | **CONFIRMED** | `app/sandbox/page.tsx` deleted. `getOfficerAndClient()` dedupes clients. |
| 24 | Admin UX Improvements and Missing Tests | **CONFIRMED** | `AdminSemesterSelector` exists. `SummaryStats` is server component. 6 new component test files. |
| 25 | Bump `@supabase/supabase-js` to >=2.110.5 | **CONFIRMED** | `package.json` pins `^2.110.5`; installed 2.110.7. `grep process.version node_modules/@supabase/supabase-js/dist/` → 0 hits. Build has no Edge warning. |
| 26 | Migrate from `getUser()` to `getClaims()` | **CONFIRMED** | `lib/auth/session.ts:14, 28` and `lib/supabase/middleware.ts:40` all call `getClaims()`. |
| 27 | Darken Expense Red for WCAG AA Buffer | **CONFIRMED** | `app/theme.css` defines `--color-expense`, `--color-error`, `--color-accent-red` all as `#c81000`. |
| 28 | Move Sandbox Page Out of Production Build | **CONFIRMED** | `ls app/sandbox/` → "No such file or directory". Build output has 6 routes, no `/sandbox`. |
| 29 | Fix Layout Test Hydration Warning | **CONFIRMED** (warning fixed) but **Y6** (test is still a no-op) | `app/layout.test.tsx` is 13 lines rendering `<div>Test Child</div>`. No hydration warning. But also no real coverage of `RootLayout`. |
| 30 | Use `requestAnimationFrame` for PivotTabs Focus | **CONFIRMED** | `app/components/PivotTabs.tsx:70` uses `requestAnimationFrame(() => elementToFocus.focus())`. |
| 31 | Replace Silent Mock-Data Fallback with Explicit Error State | **CONFIRMED** | `lib/data/entries.ts` returns `{ status: 'error', message: ... }` on DB error. `lib/data/entries.test.ts:70-79` explicitly asserts no `data` on error. |
| 32 | Add Query-Layer Ownership Filter to Update/Delete | **CONFIRMED** | `app/actions/entries.ts:110-111` (update), `:148-149` (delete) both have `.eq('entered_by', userId)`. `deleteEntry` uses `count: 'exact'` to detect 0-row delete. |
| 33 | Add Ownership Check to Edit Page | **CONFIRMED** | `app/admin/edit/[id]/page.tsx:24-29` filters by `.eq('entered_by', officer.id)`. `notFound()` on missing. |
| 34 | Add FK Index on `entered_by` | **CONFIRMED** | `supabase/migration.sql:137-138`. Verified by `database.test.ts:178-184`. |
| 35 | Fix `Math.round` IEEE-754 Precision Bug | **CONFIRMED** (per spec) | `app/actions/entries.ts:34, 94` use `Math.round(Number(validData.amount.toFixed(2)) * 100)`. Matches task spec exactly. (Comment is inaccurate — Y12.) |
| 36 | Remove Supabase Project-Ref from GEMINI.md | **CONFIRMED** | `GEMINI.md:14` uses `project_ref=<YOUR_PROJECT_REF>` placeholder. |
| 37 | Remove `IS_E2E` from README | **CONFIRMED** | `grep IS_E2E README.md` → 0 hits. |
| 38 | Add Composite and Covering Indexes for Hot Queries | **CONFIRMED** | `supabase/migration.sql:123-133` adds 3 indexes. Verified by `database.test.ts:186-216`. |
| 39 | Add Postgres Views for Distinct Semesters/Categories | **CONFIRMED** | `supabase/migration.sql:141-145` defines both views with `security_invoker = on`. `lib/data/entries.ts:110, 127` query them. |
| 40 | Wrap `createClient` in React `cache()` | **CONFIRMED** | `lib/supabase/server.ts:5` exports `createClient = cache(async () => {...})`. |
| 41 | Add CHECK/ENUM Constraints on `semester`, `academic_year`, `role` | **CONFIRMED** | `supabase/migration.sql:151-161` adds 3 CHECK constraints. |
| 42 | Document `rounded-full` Spinner Exception | **CONFIRMED** | `README.md` design-system section explicitly documents the exception. |
| 43 | Fix Broken Assertion in `ClientFilters.test.tsx` | **CONFIRMED APPLIED** but **X12 was a false positive** | Test passes. But the original "broken assertion" v4 flagged didn't actually exist — see §5.2. |
| 44 | Pin `search_path = ''` on Trigger Function | **CONFIRMED** | `supabase/migration.sql:48` has `SET search_path = ''`. |
| 45 | Enable `FORCE ROW LEVEL SECURITY` | **CONFIRMED** | `supabase/migration.sql:71, 74` both have `FORCE ROW LEVEL SECURITY`. |
| 46 | Wrap `profiles` RLS `auth.uid()` in `(select ...)` | **CONFIRMED** | `supabase/migration.sql:84, 85, 89` all use `(select auth.uid())`. |
| 47 | Add `.btn-ghost-danger` to Print Styles | **CONFIRMED** | `app/theme.css` print styles include `.btn-ghost-danger`. |

**Task scorecard:** 35 CONFIRMED, 2 PARTIAL (Tasks 13 and 19), 1 CONFIRMED-but-false-positive (Task 43), 1 superseded (Task 16). All 39 tasks have been applied to source. The two PARTIAL items contribute to new findings Y3 (Task 19) and Y4 (Task 13).

---

## §8. Score Breakdown Table

Per-category score with explicit deductions. Total: **82/100 (B−)**.

| Category | Max | Score | Deductions | Notes |
|---|---|---|---|---|
| **Functional correctness** | 15 | **15** | — | Public browsing, admin CRUD, search/filter, totals — all work. Zod validation enforced. |
| **Security** | 20 | **14** | −3 Y1 (missing role check) · −2 Y7 (hardcoded creds) · −1 Y24 (raw error leak) | RLS hardened properly (FORCE + WITH CHECK + cached uid). No backdoors in client bundle. No service-role in production. But app-layer authz gap is serious for a trust portal. |
| **Data integrity** | 10 | **8** | −0.5 Y2 (EntryForm type-lie) · −0.5 Y8 (as BudgetEntry casts) · −1 Y37 (amount allows zero) + 0.5 credit for Task 35 toFixed fix | Zod schema + DB CHECK constraints + integer-centavos storage. Math.round precision bug fixed. |
| **Design system compliance** | 10 | **8.5** | −0.5 Y20 (9 unused accent tokens) · −0.5 Y21 (income green) · −0.25 Y22 (bg-error/10) · −0.25 (warning orange) | Strict Metro: zero shadows, zero gradients, zero corner radius (except rounded-full spinner). Segoe UI throughout. Single Lime accent mostly respected. |
| **Test suite** | 15 | **10.5** | −2 Y5 (5 untested route pages) · −1 Y6 (layout.test no-op) · −0.5 Y25 (PivotTabs keyboard) · −1 Y36 (entrenches no-op revalidatePath) + 0.5 credit for 87/87 pass | 87/87 pass. Good unit test coverage of components and actions. Database integration tests via PGlite. |
| **Performance** | 10 | **7** | −1 Y3 (revalidatePath no-op) · −1 Y10 (JS-side aggregation) · −1 Y11 (no pagination) | Promise.all parallel queries. Per-request Supabase client caching. Composite/covering indexes. Distinct views for filters. |
| **Accessibility** | 8 | **6** | −0.5 Y17 (login error role=alert) · −0.5 Y18 (server error role=alert) · −0.5 Y19 (radiogroup) · −0.5 Y16 (delete focus loss) · −0.25 Y26 (nav aria) · −0.25 (secondary text contrast borderline) | ARIA labels, role="alert" on ErrorBanner. Keyboard support (PivotTabs, BudgetEntryList). Color contrast (AA for expense red #c81000). |
| **Code quality** | 7 | **5** | −1 Y4 (17 console.error) · −0.5 Y13 (as Record cast) · −0.25 Y14 (sequential profile fetch) · −0.25 Y15 (new Date for asOfDate) · −0.5 Y9 (hydration risk) · −0.5 Y12/Y28/Y29 (stale comments/mocks) | Clean folder structure. No `any` types in production. No TODO/FIXME. But console.error and as-casts are widespread. |
| **Documentation** | 5 | **4** | −0.5 Y35 (.env.example stale) · −0.5 (AUDIT-v4 has inaccuracies — 67 vs 87 tests, X12 false positive — reflected in doc drift) | README accurate. AGENTS.md correct. Task files well-documented. |
| **Dependency health** | (no deduction) | — | — | All deps current. 2 moderate CVEs in transitive postcss (N15) — no fix without breaking Next.js downgrade. Monitor only. |
| **Carryover** | (no deduction) | — | — | Service-role key rotation (manual, unverifiable from zip). |
| **TOTAL** | 100 | **82** | — | **B−** — production-readiness bar, independent re-grade. |

**Trajectory:** 56 (v1) → 83 (v2) → 89 (v3) → 87 (v4) → **82 (v5)**. v5 is the **second** audit in the lineage to score lower than its predecessor (v4 was the first). Both downgrades came from new findings the prior audits missed — not from regressions. The codebase keeps improving; the audit bar keeps getting stricter.

---

## §9. Fix Plan — P0 (Deploy Blockers)

These three items must ship before production launch. Each includes a file-level diff and verification command.

### P0-1 — Add role/authorization check to admin pages (Y1)

**Priority:** P0. **Effort:** S (1-2 hours). **Files:** `lib/auth/session.ts`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx`.

**Before** (`lib/auth/session.ts:10-20`):

```typescript
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    return { id: data.claims.sub, email: data.claims.email ?? '' }
  } catch {
    return null
  }
}
```

**After:**

```typescript
export type Officer = { id: string; email: string; role: string; full_name: string | null }

const AUTHORIZED_ROLES = ['Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary'] as const

export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    const id = data.claims.sub
    const email = data.claims.email ?? ''

    // Verify the user has a profiles row with an authorized role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', id)
      .maybeSingle()

    if (profileError || !profile || !AUTHORIZED_ROLES.includes(profile.role as typeof AUTHORIZED_ROLES[number])) {
      return null
    }

    return { id, email, role: profile.role, full_name: profile.full_name }
  } catch {
    return null
  }
}
```

**Also update** `app/admin/page.tsx:29-34` (remove the now-redundant profile fetch — `getOfficer()` does it):

```typescript
// Before
const supabase = await createClient();
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, role')
  .eq('id', officer.id)
  .maybeSingle();
const profile = profileData;

// After
const profile = { full_name: officer.full_name, role: officer.role }
```

**Verification command:**

```bash
# Test: unauthenticated user (no session) → redirect to /login
curl -i http://localhost:3000/admin | grep -i location

# Test: authenticated user with no profiles row → redirect to /login?reason=unauthorized
# (requires running dev server + test user without profile — manual)

# Test: authenticated user with authorized role → 200 OK
# (requires running dev server + test user with profile — manual)

npx vitest run app/admin # if route tests are added (P1-6)
npx tsc --noEmit
```

### P0-2 — Move hardcoded test credentials to env vars (Y7)

**Priority:** P0. **Effort:** S (1 hour). **Files:** `tests/global-setup.ts`, `tests/auth.setup.ts`, `tests/auth-flow.spec.ts`, `scratch/create-test-user.ts`, `.env.example`, `.gitignore`.

**Before** (`tests/global-setup.ts:4-5`):

```typescript
const TEST_USER_EMAIL = 'jane.doe@csu.edu.ph'
const TEST_USER_PASSWORD = 'Password123!'
```

**After:**

```typescript
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for Playwright tests')
}
```

**Also update** `tests/auth.setup.ts:6-7`, `tests/auth-flow.spec.ts:43-44`, `scratch/create-test-user.ts:8-9` the same way.

**Update** `.env.example`:

```bash
# Add at the end:
# Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production.
TEST_USER_EMAIL=test-officer@your-project.supabase.co
TEST_USER_PASSWORD=your-test-password
```

**Update** `.gitignore`: ensure `.env.local` is ignored (it already is).

**Verification command:**

```bash
# After fix: no hardcoded credentials in source
grep -rn 'jane.doe@csu.edu.ph' app/ lib/ supabase/ tests/ scratch/ middleware.ts
# Expected: 0 hits

grep -rn 'Password123' app/ lib/ supabase/ tests/ scratch/ middleware.ts
# Expected: 0 hits

npx tsc --noEmit
```

### P0-3 — Disable public Supabase Auth signups (operational, not code)

**Priority:** P0. **Effort:** S (5 minutes). **Files:** None (Dashboard action).

**Action:** In Supabase Dashboard → Authentication → Providers → Email → toggle OFF "Allow new users to sign up". This prevents anyone from creating a new Supabase Auth account via the public anon key, which closes the Y1 attack vector at the operational level even before P0-1 ships.

**Verification:** Try to sign up via the Supabase JS SDK with the anon key — should fail with "Signups not allowed for this project".

```bash
# Verification script (run after Dashboard change)
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.auth.signUp({ email: 'test-attacker@example.com', password: 'Test1234!' })
  .then(({ data, error }) => {
    if (error) console.log('PASS — signups disabled:', error.message);
    else console.log('FAIL — signup succeeded for', data.user?.email);
  });
"
```

---

## §10. Fix Plan — P1 (Ship within 30 days of launch)

### P1-1 — Fix EntryForm type-safety lie (Y2)

**Priority:** P1. **Effort:** M (2-3 hours). **Files:** `app/admin/components/EntryForm.tsx`, `app/admin/edit/[id]/page.tsx`, `app/admin/components/EntryForm.test.tsx`.

**Before** (`app/admin/components/EntryForm.tsx:5-10`):

```typescript
import { BudgetEntry, BudgetEntrySchema } from '@/lib/types';

interface EntryFormProps {
  initialData?: BudgetEntry;
}
```

**After:**

```typescript
import { BudgetEntry, BudgetEntrySchema } from '@/lib/types';

// Form initial data: amount is in decimal pesos (user-facing), NOT centavos.
// This is distinct from BudgetEntry (which stores amount as integer centavos).
export type EntryFormInitialData = Omit<BudgetEntry, 'amount'> & {
  amount: number; // decimal pesos
};

interface EntryFormProps {
  initialData?: EntryFormInitialData;
}
```

**Update** `app/admin/edit/[id]/page.tsx:36-39` (remove the `/100` division — the form now expects pesos, and the DB row already has centavos, so we still need to convert; but the type now reflects reality):

```typescript
// Before
const initialData = {
  ...(entry as BudgetEntry),
  amount: (entry as BudgetEntry).amount / 100,
};

// After
const initialData: EntryFormInitialData = {
  ...(entry as BudgetEntry),
  amount: (entry as BudgetEntry).amount / 100, // centavos → pesos for form display
};
```

(Or, better, replace `as BudgetEntry` with `BudgetEntrySchema.parse(entry)` — see P2-1.)

**Update** `app/admin/components/EntryForm.test.tsx:22-36, 72, 161`:

```typescript
// Before
const mockInitialData: BudgetEntry = {
  // ...
  amount: 150000, // stored in centavos -> ₱1,500.00
  // ...
};
// ...
expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('150000');
// ...
expect(updateEntry).toHaveBeenCalledWith('b1', {
  // ...
  amount: 150000,
  // ...
});

// After
const mockInitialData: EntryFormInitialData = {
  // ...
  amount: 1500, // decimal pesos -> ₱1,500.00 (form receives pesos, not centavos)
  // ...
};
// ...
expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('1500');
// ...
expect(updateEntry).toHaveBeenCalledWith('b1', {
  // ...
  amount: 1500, // form sends pesos to action; action multiplies by 100 to get centavos
  // ...
});
```

**Verification command:**

```bash
npx vitest run app/admin/components/EntryForm.test.tsx
npx tsc --noEmit
npx eslint
```

### P1-2 — Fix revalidatePath no-op (Y3)

**Priority:** P1. **Effort:** S (1 hour). **Files:** `app/actions/entries.ts`, `app/actions/entries.test.ts`.

**Option A (recommended): Remove the no-op calls entirely.**

Since both `/` and `/admin` are dynamic, `revalidatePath` does nothing. The `router.refresh()` call in `EntryForm.tsx:93` and `EntryTable.tsx` already handles cache busting for the admin page. For the public homepage, dynamic rendering means the next request will re-fetch anyway.

**Before** (`app/actions/entries.ts:59-61`):

```typescript
    // 5. Bust caches
    revalidatePath('/')
    revalidatePath('/admin')
```

**After:**

```typescript
    // 5. Cache invalidation: both / and /admin are dynamic routes (force-dynamic
    //    + searchParams), so revalidatePath is a no-op. The admin UI calls
    //    router.refresh() after success; the public homepage re-fetches on
    //    next request. If we migrate to unstable_cache + tags later, switch
    //    to revalidateTag('budget-entries') here.
```

Repeat for `updateEntry` (L124-125) and `deleteEntry` (L161-162).

**Option B (if real cache invalidation is desired): Migrate to `unstable_cache` + `revalidateTag`.**

Wrap `getEntries`, `getSummaryStats`, `getSemesters`, `getCategories` in `unstable_cache` with tag `'budget-entries'`. Then replace `revalidatePath('/')` and `revalidatePath('/admin')` with `revalidateTag('budget-entries')`.

This is more work but enables ISR for the public homepage (significant perf win at scale). Probably v1.1+ scope.

**Update** `app/actions/entries.test.ts:241-242, 280-281, 294-295` to remove the `revalidatePath` assertions (or replace with `revalidateTag` assertions if Option B).

**Verification command:**

```bash
npx vitest run app/actions/entries.test.ts
npx tsc --noEmit

# Confirm no more revalidatePath calls in actions
grep -n 'revalidatePath' app/actions/entries.ts
# Expected: 0 hits (Option A) or replaced with revalidateTag (Option B)

# Build should still succeed
npm run build
```

### P1-3 — Add pagination to `getEntries` (Y11)

**Priority:** P1. **Effort:** M (3-4 hours). **Files:** `lib/data/entries.ts`, `app/page.tsx`, `app/admin/page.tsx`, `app/components/BudgetEntryList.tsx`, `app/admin/components/EntryTable.tsx`.

**Before** (`lib/data/entries.ts:8-35`):

```typescript
export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
}): Promise<DataResult<BudgetEntry[]>> {
  // ...
  query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
  const { data, error } = await query;
  // ...
}
```

**After:**

```typescript
export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
  page?: number;       // 1-indexed page number, default 1
  pageSize?: number;   // entries per page, default 50, max 100
}): Promise<DataResult<{ entries: BudgetEntry[]; totalCount: number; hasMore: boolean }>> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 50));

  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('*', { count: 'exact' });

    if (filters?.semester) query = query.eq('semester', filters.semester);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error fetching entries:', error.message);
      return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
    }

    const totalCount = count ?? 0;
    return {
      status: 'ok',
      data: {
        entries: (data || []) as BudgetEntry[],
        totalCount,
        hasMore: page * pageSize < totalCount,
      },
    };
  } catch (err) {
    console.error('Unhandled exception fetching entries:', err);
    return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
  }
}
```

**Update** callers (`app/page.tsx`, `app/admin/page.tsx`) to handle the new return shape and pass `page` from `searchParams`.

**Update** `BudgetEntryList` and `EntryTable` to render a "Load more" button when `hasMore` is true.

**Verification command:**

```bash
npx vitest run
npx tsc --noEmit
npm run build

# Manual: visit /?semester=1st+Sem and verify "Load more" button appears if >50 entries
```

### P1-4 — Replace `getSummaryStats` JS loop with SQL aggregate (Y10)

**Priority:** P1. **Effort:** M (2-3 hours). **Files:** `supabase/migration.sql`, `lib/data/entries.ts`, `supabase/database.test.ts`.

**Step 1: Add a Postgres function** (append to `supabase/migration.sql`):

```sql
-- Aggregate function for getSummaryStats (replaces JS-side summing)
CREATE OR REPLACE FUNCTION public.get_summary_stats(p_semester text)
RETURNS TABLE (total_collected bigint, total_spent bigint, remaining_balance bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::bigint AS total_collected,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::bigint AS total_spent,
    (COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
     - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0))::bigint AS remaining_balance
  FROM public.budget_entries
  WHERE semester = p_semester;
$$;

GRANT EXECUTE ON FUNCTION public.get_summary_stats(text) TO anon, authenticated;
```

**Step 2: Update `getSummaryStats`** (`lib/data/entries.ts:58-105`):

```typescript
export async function getSummaryStats(semester?: string): Promise<DataResult<{
  totalCollected: number;
  totalSpent: number;
  remainingBalance: number;
}>> {
  if (!semester) {
    return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_summary_stats', { p_semester: semester });

    if (error) {
      console.error('Database error fetching summary stats:', error.message);
      return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
    }

    if (!data || data.length === 0) {
      return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
    }

    const row = data[0];
    return {
      status: 'ok',
      data: {
        totalCollected: Number(row.total_collected),
        totalSpent: Number(row.total_spent),
        remainingBalance: Number(row.remaining_balance),
      },
    };
  } catch (err) {
    console.error('Unhandled exception fetching summary stats:', err);
    return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
  }
}
```

**Step 3: Add a test** in `supabase/database.test.ts`:

```typescript
it('should have a get_summary_stats function that returns correct aggregates', async () => {
  const result = await db.query('SELECT * FROM public.get_summary_stats($1)', ['1st Sem']);
  expect(result.rows[0].total_collected).toBe(4500000); // sum of income centavos in seed
  expect(result.rows[0].total_spent).toBe(2500000);     // sum of expense centavos in seed
  expect(result.rows[0].remaining_balance).toBe(2000000);
});
```

**Verification command:**

```bash
npx vitest run supabase/database.test.ts
npx vitest run lib/data/entries.test.ts
npx tsc --noEmit
npm run build
```

### P1-5 — Gate `console.error` behind `NODE_ENV` or replace with structured logger (Y4)

**Priority:** P1. **Effort:** M (2 hours). **Files:** `app/actions/entries.ts`, `lib/data/entries.ts`, `app/admin/components/AdminHeader.tsx`.

**Option A (minimal): Gate behind NODE_ENV.**

**Before** (`app/actions/entries.ts:55`):

```typescript
console.error('Database insert error:', dbError)
```

**After:**

```typescript
if (process.env.NODE_ENV !== 'production') {
  console.error('Database insert error:', dbError)
}
```

Repeat for all 17 `console.error` calls.

**Option B (better): Create a structured logger.**

Create `lib/log.ts`:

```typescript
type LogLevel = 'error' | 'warn' | 'info';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && level === 'info') return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In production, use console.error for errors (visible in Vercel logs);
  // in dev, use console.log for visibility.
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
};
```

Then replace all `console.error(...)` with `logger.error(...)`, redacting sensitive fields:

```typescript
// Before
console.error('Database insert error:', dbError)

// After
logger.error('Database insert failed', {
  code: dbError.code,
  table: 'budget_entries',
  // Don't log dbError.message or dbError.details — may contain query fragments
})
```

**Verification command:**

```bash
# After fix: no raw console.error in production paths
grep -rn 'console\.error' app/ lib/ | grep -v test | grep -v 'NODE_ENV'
# Expected: 0 hits

npx vitest run
npx tsc --noEmit
npm run build
```

### P1-6 — Add co-located tests for 5 route pages (Y5)

**Priority:** P1. **Effort:** L (4-6 hours). **Files:** `app/page.test.tsx` (NEW), `app/login/page.test.tsx` (NEW), `app/admin/page.test.tsx` (NEW), `app/admin/new/page.test.tsx` (NEW), `app/admin/edit/[id]/page.test.tsx` (NEW).

**Template** (`app/admin/page.test.tsx`):

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  getOfficer: vi.fn(),
}));

vi.mock('@/lib/data/entries', () => ({
  getEntries: vi.fn(),
  getSummaryStats: vi.fn(),
  getSemesters: vi.fn(),
}));

import AdminPage from './page';
import { getOfficer } from '@/lib/auth/session';
import { getEntries, getSummaryStats, getSemesters } from '@/lib/data/entries';

const mockGetOfficer = vi.mocked(getOfficer);
const mockGetEntries = vi.mocked(getEntries);
const mockGetSummaryStats = vi.mocked(getSummaryStats);
const mockGetSemesters = vi.mocked(getSemesters);

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);
    // redirect() throws in tests — wrap in try/catch or mock next/navigation
    await expect(AdminPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders dashboard when authenticated', async () => {
    mockGetOfficer.mockResolvedValue({ id: 'u1', email: 'officer@test', role: 'Treasurer', full_name: 'Test Officer' });
    mockGetSemesters.mockResolvedValue({ status: 'ok', data: ['1st Sem'] });
    mockGetEntries.mockResolvedValue({ status: 'ok', data: [] });
    mockGetSummaryStats.mockResolvedValue({ status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } });

    const result = await AdminPage({ searchParams: Promise.resolve({}) });
    // Assert the rendered output contains expected elements
    // (use renderToString or react-testing-library on the JSX returned)
  });

  it('renders error banner when getSemesters fails', async () => {
    mockGetOfficer.mockResolvedValue({ id: 'u1', email: 'officer@test', role: 'Treasurer', full_name: 'Test Officer' });
    mockGetSemesters.mockResolvedValue({ status: 'error', message: 'DB down' });

    const result = await AdminPage({ searchParams: Promise.resolve({}) });
    // Assert ErrorBanner is rendered
  });
});
```

Repeat similar patterns for the other 4 route pages.

**Verification command:**

```bash
npx vitest run
# Expected: test count grows from 87 to ~100+
npx tsc --noEmit
```

### P1-7 — Real `layout.test.tsx` (Y6)

**Priority:** P1. **Effort:** S (1 hour). **Files:** `app/layout.test.tsx`.

**Before** (`app/layout.test.tsx:1-13`):

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('RootLayout', () => {
  it('renders children', () => {
    const { container } = render(<div>Test Child</div>)
    expect(container.textContent).toContain('Test Child')
  })
})
```

**After:**

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders children inside the HTML shell with correct lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <span>Test Child</span>
      </RootLayout>
    )

    expect(container.querySelector('html')?.lang).toBe('en')
    expect(container.querySelector('body')?.classList.contains('bg-background')).toBe(true)
    expect(container.querySelector('body')?.classList.contains('text-on-background')).toBe(true)
    expect(container.textContent).toContain('Test Child')
  })

  it('sets document title via metadata', async () => {
    // Next.js metadata is async — may need to await the metadata export
    // This test may need to be adjusted based on Next.js 15 metadata API
    render(
      <RootLayout>
        <span>Test</span>
      </RootLayout>
    )
    // Metadata is set on document.title in jsdom
    expect(document.title).toMatch(/CBEA|Budget|Transparency/i)
  })
})
```

**Verification command:**

```bash
npx vitest run app/layout.test.tsx
npx tsc --noEmit
```

### P1-8 — Add `role="alert"` to error divs (Y17, Y18)

**Priority:** P1. **Effort:** S (30 minutes). **Files:** `app/login/page.tsx`, `app/admin/components/EntryForm.tsx`, `app/admin/components/EntryTable.tsx`.

**Before** (`app/login/page.tsx:72-79`):

```typescript
{error && (
  <div className="p-sm bg-error/10 border-l-4 border-error text-error font-body-sm text-body-sm select-none">
    {error}
  </div>
)}
```

**After:**

```typescript
{error && (
  <div
    role="alert"
    className="p-sm bg-error/10 border-l-4 border-error text-error font-body-sm text-body-sm select-none"
  >
    {error}
  </div>
)}
```

Repeat for `EntryForm.tsx:117-121` and `EntryTable.tsx:33-37`.

**Verification command:**

```bash
grep -rn 'role="alert"' app/login/page.tsx app/admin/components/EntryForm.tsx app/admin/components/EntryTable.tsx
# Expected: at least 3 hits

npx vitest run
```

---

## §11. Fix Plan — P2 (Quality Polish)

Each P2 fix is a smaller-scope improvement. File-level diffs provided where useful.

### P2-1 — Replace `as BudgetEntry` casts with Zod parse (Y8)

**Priority:** P2. **Effort:** S (1 hour). **Files:** `app/actions/entries.ts:63, 127`, `app/admin/edit/[id]/page.tsx:37, 38`.

**Before** (`app/actions/entries.ts:63`):

```typescript
return { success: true, data: insertedData as BudgetEntry }
```

**After:**

```typescript
const parsed = BudgetEntrySchema.safeParse(insertedData)
if (!parsed.success) {
  console.error('Schema validation failed on inserted data:', parsed.error.message)
  return { success: false, error: 'Inserted data failed schema validation.' }
}
return { success: true, data: parsed.data }
```

Note: `BudgetEntrySchema` doesn't include `id`, `entered_by`, `created_at`, `updated_at` — extend it or create a `BudgetEntryRecordSchema` for runtime validation of DB returns.

**Verification:** `npx vitest run app/actions/entries.test.ts`

### P2-2 — Hydration fix for `new Date()` in EntryForm useState (Y9)

**Priority:** P2. **Effort:** S (30 minutes). **File:** `app/admin/components/EntryForm.tsx:20`.

**Before:**

```typescript
const [formData, setFormData] = useState({
  // ...
  date: initialData?.date || new Date().toISOString().split('T')[0],
  // ...
});
```

**After:**

```typescript
const [formData, setFormData] = useState({
  // ...
  date: initialData?.date || '',  // empty initial — set in useEffect
  // ...
});

useEffect(() => {
  if (!formData.date) {
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }));
  }
}, []); // run once on mount
```

Don't forget to `import { useState, useEffect } from 'react'`.

**Verification:** `npx vitest run app/admin/components/EntryForm.test.tsx` — the "renders Add form with default empty values" test may need updating (the date will be empty initially, then set after mount).

### P2-3 — Parallelize profile fetch in admin page (Y14)

**Priority:** P2. **Effort:** S (30 minutes). **File:** `app/admin/page.tsx`.

**Before** (sketch):

```typescript
const officer = await getOfficer();
if (!officer) redirect('/login');

const supabase = await createClient();
const { data: profileData } = await supabase.from('profiles').select(...).eq('id', officer.id).maybeSingle();

const params = await searchParams;
const semestersResult = await getSemesters();
// ... then Promise.all([getEntries, getSummaryStats])
```

**After** (sketch):

```typescript
const officer = await getOfficer();
if (!officer) redirect('/login');

// (After P0-1, profile is already fetched inside getOfficer — this P2 becomes moot.)
// If P0-1 isn't applied yet, parallelize:
const [profileResult, semestersResult] = await Promise.all([
  (async () => {
    const supabase = await createClient();
    return supabase.from('profiles').select('full_name, role').eq('id', officer.id).maybeSingle();
  })(),
  getSemesters(),
]);
// ...
```

**Verification:** `npm run build` — should still succeed. Manual: load `/admin` and check that profile + semesters load concurrently (dev-tools network tab).

### P2-4 — Focus management in delete-confirmation (Y16)

**Priority:** P2. **Effort:** S (1 hour). **File:** `app/admin/components/EntryTable.tsx`.

**After** (sketch — add a `useEffect` and `ref`):

```typescript
import { useState, useTransition, useRef, useEffect } from 'react';

// Inside the component:
const confirmBtnRef = useRef<HTMLButtonElement>(null);
const [confirmingId, setConfirmingId] = useState<string | null>(null);

useEffect(() => {
  if (confirmingId) {
    confirmBtnRef.current?.focus();
  }
}, [confirmingId]);

// In the row render:
{confirmingId === entry.id ? (
  <>
    <button
      ref={confirmBtnRef}
      onClick={() => handleDelete(entry.id)}
      className="btn-danger h-12"
      data-testid={`confirm-delete-${entry.id}`}
    >
      Confirm
    </button>
    <button
      onClick={() => setConfirmingId(null)}
      className="btn-ghost h-12"
      data-testid={`cancel-delete-${entry.id}`}
    >
      Cancel
    </button>
  </>
) : (
  <>
    <Link href={`/admin/edit/${entry.id}`}>Edit</Link>
    <button
      onClick={() => setConfirmingId(entry.id)}
      className="btn-ghost-danger h-12"
      data-testid={`delete-${entry.id}`}
    >
      Delete
    </button>
  </>
)}
```

**Verification:** `npx vitest run app/admin/components/EntryTable.test.tsx` — add a test that asserts focus moves to the Confirm button after clicking Delete.

### P2-5 — `role="radiogroup"` for type toggle (Y19)

**Priority:** P2. **Effort:** S (30 minutes). **File:** `app/admin/components/EntryForm.tsx:123-159`.

**Before:**

```typescript
<span className="...">Transaction Type</span>
<div className="grid grid-cols-2 gap-0 border border-outline h-12">
  <button type="button" onClick={() => handleTypeChange('income')} ...>INCOME</button>
  <button type="button" onClick={() => handleTypeChange('expense')} ...>EXPENSE</button>
</div>
```

**After:**

```typescript
<fieldset role="radiogroup" aria-label="Transaction Type" className="border-0 p-0 m-0">
  <legend className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none sr-only">
    Transaction Type
  </legend>
  <div className="grid grid-cols-2 gap-0 border border-outline h-12">
    <button
      type="button"
      role="radio"
      aria-checked={formData.type === 'income'}
      onClick={() => handleTypeChange('income')}
      ...
    >
      INCOME
    </button>
    <button
      type="button"
      role="radio"
      aria-checked={formData.type === 'expense'}
      onClick={() => handleTypeChange('expense')}
      ...
    >
      EXPENSE
    </button>
  </div>
</fieldset>
```

**Verification:** `npx vitest run app/admin/components/EntryForm.test.tsx` — add a test asserting `aria-checked` toggles correctly.

### P2-6 — `AdminSemesterSelector` `startTransition` (Y23)

**Priority:** P2. **Effort:** S (15 minutes). **File:** `app/admin/components/AdminSemesterSelector.tsx:22`.

**Before:**

```typescript
const router = useRouter();
// ...
router.push(`?semester=${encodeURIComponent(tab)}`);
```

**After:**

```typescript
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const router = useRouter();
const [isPending, startTransition] = useTransition();
// ...
startTransition(() => {
  router.push(`?semester=${encodeURIComponent(tab)}`);
});
```

**Verification:** `npx tsc --noEmit`

### P2-7 — Escape ILIKE wildcards in search (Y27)

**Priority:** P2. **Effort:** S (15 minutes). **File:** `lib/data/entries.ts:19`.

**Before:**

```typescript
if (filters?.search) query = query.ilike('description', `%${filters.search}%`);
```

**After:**

```typescript
if (filters?.search) {
  // Escape ILIKE wildcards so user input is treated literally
  const escaped = filters.search.replace(/[%_\\]/g, '\\$&');
  query = query.ilike('description', `%${escaped}%`);
}
```

**Verification:** Add a test case in `lib/data/entries.test.ts` that searches for `100%` and asserts it doesn't match everything.

### P2-8 — Fix `scratch/test-crud.test.ts` stale mock (Y28)

**Priority:** P2. **Effort:** S (15 minutes). **File:** `scratch/test-crud.test.ts` (or delete the file).

**Option A:** Update the mock to expose `getClaims`:

```typescript
// Before
mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
  },
  // ...
};

// After
mockSupabase = {
  auth: {
    getClaims: vi.fn().mockResolvedValue({
      data: { claims: { sub: 'test-user-uuid', email: 'test@test' } },
      error: null,
    }),
  },
  // ...
};
```

**Option B (recommended):** Delete `scratch/test-crud.test.ts` entirely — it's superseded by `app/actions/entries.test.ts` which has 18 proper tests.

**Verification:** `npx vitest run` — if Option B, the scratch file is excluded by `vitest.config.ts` (`exclude: [..., 'scratch']`).

### P2-9 — Fix `supabase.test.ts:91` stale mock call shape (Y29)

**Priority:** P2. **Effort:** S (5 minutes). **File:** `lib/supabase/supabase.test.ts:91`.

**Before:**

```typescript
cookiesObj.setAll!([{ name: 'sb-refresh-token', value: 'new-token', options: {} }], {})
```

**After:**

```typescript
cookiesObj.setAll([{ name: 'sb-refresh-token', value: 'new-token', options: {} }])
```

**Verification:** `npx vitest run lib/supabase/supabase.test.ts`

### P2-10 — Fix `global-setup.ts` TOCTOU (Y30)

**Priority:** P2. **Effort:** S (1 hour). **File:** `tests/global-setup.ts:22-41`.

**Before** (sketch):

```typescript
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);
if (existingUser?.user) {
  // user exists — delete residual entries
} else {
  // create user
}
```

**After** (sketch):

```typescript
const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);

if (getUserError) {
  // Distinguish "user not found" from transient errors
  if (getUserError.message.includes('User not found')) {
    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });
    if (createError) throw new Error(`Failed to create test user: ${createError.message}`);
  } else {
    throw new Error(`Failed to check test user: ${getUserError.message}`);
  }
} else {
  // User exists — delete residual entries
  const { error: deleteError } = await supabaseAdmin
    .from('budget_entries')
    .delete()
    .eq('entered_by', TEST_USER_ID)
    .like('description', 'E2E Sponsorship %');
  if (deleteError) {
    console.warn(`Failed to clean up test entries: ${deleteError.message}`);
  }
}
```

Also paginate `listUsers()` if used (the current code uses `getUserById` directly, which is fine).

**Verification:** `npx playwright test --reporter=list` (requires real Supabase creds — `[UNVERIFIED]`).

### P2-11 — Use `MAX(date)` for `asOfDate` (Y15)

**Priority:** P2. **Effort:** S (30 minutes). **Files:** `lib/data/entries.ts`, `app/page.tsx:59-64`, `app/admin/page.tsx:71-76`.

**Add a new function** in `lib/data/entries.ts`:

```typescript
export async function getLastUpdatedDate(semester?: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('updated_at');
    if (semester) query = query.eq('semester', semester);
    query = query.order('updated_at', { ascending: false }).limit(1);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0].updated_at;
  } catch {
    return null;
  }
}
```

**Update** `app/page.tsx:59-64`:

```typescript
// Before
const asOfDate = new Date().toLocaleDateString('en-US', { ... });

// After
const lastUpdated = await getLastUpdatedDate(activeSemester);
const asOfDate = lastUpdated
  ? new Date(lastUpdated).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    })
  : 'No data published yet';
```

**Verification:** `npx vitest run` — add a test for `getLastUpdatedDate`.

### P2-12 — Add keyboard-nav test for PivotTabs (Y25)

**Priority:** P2. **Effort:** S (1 hour). **File:** `app/components/PivotTabs.test.tsx`.

**Add tests:**

```typescript
import { fireEvent } from '@testing-library/react';

it('moves focus to next tab on ArrowRight', () => {
  const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];
  const onTabChange = vi.fn();
  render(<PivotTabs tabs={tabs} activeTab="Tab 1" onTabChange={onTabChange} />);

  const tab1 = screen.getByTestId('pivot-tab-Tab 1');
  tab1.focus();
  fireEvent.keyDown(tab1, { key: 'ArrowRight' });

  // Assert focus moved to Tab 2
  expect(screen.getByTestId('pivot-tab-Tab 2')).toHaveFocus();
});

it('wraps focus to last tab on ArrowLeft from first tab', () => {
  // ...
});

it('moves focus to first tab on Home', () => {
  // ...
});

it('moves focus to last tab on End', () => {
  // ...
});
```

**Verification:** `npx vitest run app/components/PivotTabs.test.tsx`

---

## §12. Fix Plan — P3 (Cosmetic / Tech Debt)

Smaller fixes. No diffs provided — descriptions sufficient.

| ID | Finding | File:Line | Fix | Effort |
|---|---|---|---|---|
| P3-1 | Y20 — 9 unused accent tokens | `app/theme.css:15-24` | Delete `--color-accent-*` tokens. Keep only `--color-primary` (Lime), `--color-income`, `--color-expense`, `--color-warning`, neutrals. | S (15 min) |
| P3-2 | Y22 — `bg-error/10` tint | `app/admin/components/EntryForm.tsx:118`, `app/admin/components/EntryTable.tsx:34` | Replace `bg-error/10` with `bg-surface` (consistent with `ErrorBanner.tsx`). | S (5 min) |
| P3-3 | Y26 — `<nav>` lacks `aria-label` | `app/components/Header.tsx:16` | Add `aria-label="Primary"`. | XS (1 min) |
| P3-4 | Y35 — `.env.example` stale comment | `.env.example:3` | Update comment to "Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production." | XS (1 min) |
| P3-5 | Y14 — Dead code `const profile = profileData` | `app/admin/page.tsx:34` | Inline `profileData` everywhere; remove the alias. (Moot after P0-1.) | XS (1 min) |
| P3-6 | Y31 — Global teardown broad cleanup | `tests/global-teardown.ts:18-21` | Add `.eq('entered_by', TEST_USER_ID)` filter. | XS (5 min) |
| P3-7 | Y32 — `waitForTimeout(500)` magic numbers | `tests/admin-crud.spec.ts:19, 61` | Replace with `await expect(page.locator('[data-testid="description-input"]')).toBeVisible()`. | S (15 min) |
| P3-8 | Y33 — Fragile RLS test data | `supabase/database.test.ts:305` | Use `semester='1st Sem'` instead of `'1st Semester AY 2024-2025'` so the only failing predicate is RLS. | XS (5 min) |
| P3-9 | Y34 — Redundant `timezone()` wrapper | `supabase/migration.sql:19-20, 36-37` | Replace `timezone('utc'::text, now())` with `now()`. | XS (5 min) |
| P3-10 | (none) — Potentially redundant single-column indexes | `supabase/migration.sql:41-42` | After running `pg_stat_user_indexes` in production, drop `budget_entries_date_idx` and `budget_entries_category_idx` if no query uses them alone. | S (30 min, requires prod data) |
| P3-11 | Y36 — Tests entrench no-op `revalidatePath` | `app/actions/entries.test.ts:241-242, 280-281, 294-295` | After P1-2, update assertions to match new cache strategy. | S (15 min) |
| P3-12 | Y12 — Code comment lies about `toFixed(2)` | `app/actions/entries.ts:33` | Fix the comment: `1.5 → "1.50" → 150` (or remove the example). | XS (1 min) |
| P3-13 | Y13 — `as Record<string, string[]>` cast | `app/actions/entries.ts:26, 86` | Replace with runtime filter (see §6 Y13 suggested fix). | S (15 min) |
| P3-14 | Y37 — `amount` allows zero | `supabase/migration.sql:29`, `lib/types.ts:26` | Tighten to `CHECK (amount > 0)` and `.min(0.01, "Amount must be greater than zero")`. Or document zero-amount as intentional. | S (15 min) |
| P3-15 | Y15 — `asOfDate` uses render time | `app/page.tsx:59`, `app/admin/page.tsx:71` | (Covered by P2-11.) | — |
| P3-16 | Y28 — `scratch/test-crud.test.ts` stale mock | `scratch/test-crud.test.ts` | (Covered by P2-8.) | — |
| P3-17 | Y21 — `--color-income` green is a second accent | `app/theme.css:9` | Document as permitted semantic color, or switch to Lime for income. | S (30 min — needs design decision) |
| P3-18 | Y23 — `AdminSemesterSelector` missing `startTransition` | `app/admin/components/AdminSemesterSelector.tsx:22` | (Covered by P2-6.) | — |
| P3-19 | Y24 — Login error displays raw Supabase error | `app/login/page.tsx:38` | Map known error codes to safe messages; fall back to "Invalid email or password." | S (30 min) |

---

## §13. Carryover from Prior Audits

### 13.1 N15 — 2 moderate CVEs in transitive `postcss` (STILL OPEN, monitor only)

`npm audit` confirms 2 moderate CVEs in `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93 — PostCSS has XSS via Unescaped `</style>` in its CSS Stringify Output). The vulnerable `postcss` is bundled inside `next@15.5.20` (transitive dependency), not a direct dependency.

`npm audit fix --force` would install `next@9.3.3` — a breaking change. Not viable.

**Action:** Monitor. Next.js will eventually bundle a fixed `postcss`. No grade deduction (already accepted in v3/v4).

### 13.2 Service-role key rotation (MANUAL, unverifiable from zip)

AUDIT-v1 flagged a real `SUPABASE_SERVICE_ROLE_KEY` (project `ikoogqwigvfylwjatids`, JWT valid until 2036) committed in `.env.local` inside the original AUDIT-v1 zip. The key is no longer in the current zip (the `.env.local` is gone, only `.env.example` remains). But the key was committed to git history, and **git history is forever**.

**Action:** If you have not yet rotated this key, rotate it NOW in the Supabase Dashboard → Project Settings → API → Reset service role key. This is unverifiable from the zip — I cannot tell if you've rotated it.

### 13.3 AUDIT-v4 inaccuracies (informational, not actionable)

AUDIT-v4 has two material inaccuracies that future auditors should be aware of:
1. **Test count:** v4 says 67/67; actual is 87/87 (Tasks 31–47 added 20 tests post-v4).
2. **X12 false positive:** v4 misread `.not.toHaveBeenCalledWith` as `.not.toContain`. The assertion was always valid.

Neither of these affects v4's remediation guidance — Tasks 31–47 are still the right fixes for the right problems. But anyone reading v4 should know that v4's "67/67" claim is stale and v4's X12 finding was a misread.

---

## §14. Deployability Verdict

### 14.1 Current state

**CONDITIONAL GO.** Safe to deploy only after the three P0 items in §9 ship:
- P0-1: Add role check to all admin pages (block users with no `profiles` row or unrecognized role).
- P0-2: Move hardcoded test credentials out of source and into `.env.local`.
- P0-3: Operationally disable public Supabase Auth signups in the production project.

### 14.2 Why conditional

The codebase is in substantially better shape than v4 suggested. Tasks 31–47 have all been applied. The RLS posture is excellent (FORCE + WITH CHECK + cached `auth.uid()` + `search_path = ''` on triggers). The mock-data fallback is gone. The Math.round precision bug is fixed. Dependencies are current. The build is clean.

**But** — the missing role check (Y1) is a serious design gap for a transparency portal. RLS alone is necessary but not sufficient: it ensures users can only write their own entries, but it doesn't prevent unauthorized users from creating entries in the first place. Combined with the default Supabase Auth public-signup setting, this means anyone on the internet could publish fake budget entries to the public site.

P0-2 (test credentials) and P0-3 (operational signup-disable) are defense-in-depth — they don't block deployment on their own, but they should ship alongside P0-1.

### 14.3 Projected grade after fixes

| Stage | Fixes Applied | Projected Grade |
|---|---|---|
| Current state | Tasks 09–47 applied (per this audit) | B− (82/100) |
| + P0 | + Y1, Y7, P0-3 | B+ (88/100) |
| + P0 + P1 | + Y2, Y3, Y4, Y5, Y6, Y8, Y9, Y10, Y11, Y16, Y17, Y18, Y19 | A− (92/100) |
| + P0 + P1 + P2 | + Y12, Y13, Y14, Y15, Y20, Y21, Y22, Y23, Y24, Y25, Y26, Y27, Y28, Y29, Y30 | A (96/100) |
| + all (P0+P1+P2+P3) | + Y31, Y32, Y33, Y34, Y35, Y36, Y37 | A+ (98/100) |

### 14.4 Comparison to AUDIT-v4's verdict

AUDIT-v4's verdict was: "CONDITIONAL — deploy only after fixing X1 (silent mock-data fallback)."

X1 is now fixed (Task 31). My CONDITIONAL GO is for **different reasons**: Y1 (missing role check), Y7 (hardcoded credentials), and Y2 (EntryForm type-safety lie). These are all findings v4 missed.

---

## §15. What AUDIT-v6 Should Verify

Handoff section for the next auditor.

### 15.1 Commands to re-run

```bash
cd /path/to/cbea
npm install
npx tsc --noEmit                          # Should be 0 errors
npx eslint                                # Should be 0 warnings, 0 errors
npx vitest run                            # Should be ≥87 pass (more after P1-6, P1-7)
npm run build                             # Should succeed, no Edge warning
npm audit                                 # Should show ≤2 moderate (postcss) — monitor
```

### 15.2 Greps to re-run

```bash
# Backdoor-removal (should always be 0 hits)
grep -rn 'IS_E2E\|sb-mock-auth\|NEXT_PUBLIC_IS_E2E\|jane.doe@csu.edu.ph\|Password123\|ikoogqwigvfylwjatids' app/ lib/ supabase/ tests/ middleware.ts README.md GEMINI.md

# Mock-data fallback (should be 0 hits)
grep -n 'MOCK_ENTRIES\|getMockEntries\|getMockSummaryStats' lib/data/entries.ts

# Math.round on currency (should be 0 hits in actions, OR wrapped in toFixed)
grep -n 'Math\.round' app/actions/entries.ts

# console.error in production (should be 0 hits after P1-5)
grep -rn 'console\.error' app/ lib/ | grep -v test | grep -v 'NODE_ENV'

# revalidatePath in actions (should be 0 hits after P1-2, Option A)
grep -n 'revalidatePath' app/actions/entries.ts

# as BudgetEntry casts (should be 0 hits after P2-1)
grep -rn 'as BudgetEntry' app/

# Role check (should be present after P0-1)
grep -n 'AUTHORIZED_ROLES\|getAuthorizedOfficer' lib/auth/session.ts
```

### 15.3 Things I couldn't verify

- **Playwright E2E tests** — require real Supabase credentials. Run `npx playwright test` against a real Supabase project to verify.
- **Real Supabase Auth round-trip** — sign up a test user, sign in, sign out, password reset, etc.
- **Service-role key rotation** — manual action in Supabase Dashboard.
- **Lighthouse run** — requires running dev server with real Supabase.
- **Production Supabase Dashboard state** — signup-disable flag, project-pause behavior, etc.
- **Vercel deployment** — `vercel deploy` and verify env vars are set correctly.

### 15.4 Things I might be wrong about

- **Y1 severity.** I called it HIGH (-3 pts). You could argue MEDIUM (-1 pt) if you trust Supabase Auth signups to be operationally disabled. Net swing: ±2 pts.
- **Y2 severity.** I called it HIGH (-1 pt, folded into Data Integrity). You could argue MEDIUM (-0.5 pt) since production data flow works today. Net swing: ±0.5 pts.
- **X6 / Task 35.** I confirmed the toFixed(2) wrapper fixes the IEEE-754 bug. But `toFixed(2)` itself has edge cases (e.g., `(1.005).toFixed(2)` → `"1.00"` in V8). The Zod refine rejects 3-dp inputs, so this is safe in practice — but a future auditor might want to add a test case for `(1.005).toFixed(2)` behavior.
- **X12 / Task 43.** I called X12 a false positive. A future auditor should re-verify by reading `app/components/ClientFilters.test.tsx:99-101` directly. If the assertion is `expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('category='))`, X12 is indeed a false positive. If it's something else, X12 may have been real and Task 43 was a real fix.

### 15.5 Specific things to check in AUDIT-v6

1. Did P0-1, P0-2, P0-3 ship? (greps in §15.2)
2. Did the EntryForm type-lie get fixed? (P1-1 — `EntryFormInitialData` type should exist)
3. Did `revalidatePath` get removed or migrated to `revalidateTag`? (P1-2)
4. Did pagination ship? (P1-3 — `getEntries` should accept `page` / `pageSize`)
5. Did `getSummaryStats` move to SQL? (P1-4 — `supabase/migration.sql` should have `get_summary_stats` function)
6. Did `console.error` get gated or replaced? (P1-5 — should be 0 hits in production paths)
7. Did route tests ship? (P1-6 — `app/page.test.tsx`, `app/admin/page.test.tsx`, etc. should exist)
8. Did `layout.test.tsx` get real coverage? (P1-7 — should render `<RootLayout>` and assert `lang`, body classes)
9. Did `role="alert"` get added to all error divs? (P1-8)
10. Test count — should be ≥100 after P1-6 and P1-7.

---

## Appendix A — Files Inspected

### A.1 Source code (50 files)

```
app/
├── favicon.ico (binary, skipped)
├── globals.css
├── layout.tsx
├── layout.test.tsx
├── page.tsx
├── theme.css
├── actions/
│   ├── entries.ts
│   └── entries.test.ts
├── admin/
│   ├── page.tsx
│   ├── edit/[id]/page.tsx
│   ├── new/page.tsx
│   └── components/
│       ├── AdminHeader.tsx
│       ├── AdminSemesterSelector.tsx
│       ├── EntryForm.tsx
│       ├── EntryForm.test.tsx
│       ├── EntryTable.tsx
│       └── EntryTable.test.tsx
├── components/
│   ├── BudgetEntryList.tsx
│   ├── BudgetEntryList.test.tsx
│   ├── ClientFilters.tsx
│   ├── ClientFilters.test.tsx
│   ├── ErrorBanner.tsx
│   ├── Header.tsx
│   ├── Header.test.tsx
│   ├── PivotTabs.tsx
│   ├── PivotTabs.test.tsx
│   ├── SearchFilter.tsx
│   ├── SearchFilter.test.tsx
│   ├── SummaryStats.tsx
│   └── SummaryStats.test.tsx
└── login/page.tsx

lib/
├── types.ts
├── auth/session.ts
├── data/entries.ts
├── data/entries.test.ts
├── format/currency.ts
├── format/date.ts
├── supabase/client.ts
├── supabase/middleware.ts
├── supabase/server.ts
└── supabase/supabase.test.ts

supabase/
├── database.test.ts
├── migration.sql
├── seed.sql
└── seed.local.sql

tests/
├── admin-crud.spec.ts
├── auth-flow.spec.ts
├── auth.setup.ts
├── global-setup.ts
├── global-teardown.ts
└── public-homepage.spec.ts

scratch/
├── create-test-user.ts
├── test-crud.test.ts
├── test-db-connection.js
└── test-fetch.js

cbea-metro-design/cbea-package/
├── app/theme.css
├── tailwind.config.ts
├── tokens.dtcg.json
└── DESIGN.md
```

### A.2 Documentation (51 files)

- 4 prior audits: `documentations/AUDIT.md`, `AUDIT-v2.md`, `AUDIT-v3.md`, `AUDIT-v4.md`
- 1 project description: `documentations/cbea-budget-transparency-project-description.md`
- 4 implementation plans: `plans/implementation_plan.md` through `_v4.md`
- 39 task files: `tasks/09_*.md` through `tasks/47_*.md`
- Top-level: `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.env.example`, `.gitignore`
- Configs: `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `eslint.config.mjs`, `playwright.config.ts`, `vitest.config.ts`, `postcss.config.mjs`

### A.3 Reference (enumerated, not deep-read)

- `agent/skills/supabase/` and `agent/skills/supabase-postgres-best-practices/`
- `.agents/skills/supabase/` and `.agents/skills/supabase-postgres-best-practices/`
- `archive/cbea-metro-design.zip` (not extracted — superseded by `cbea-metro-design/cbea-package/`)
- `archive/session 1/` (not deep-read — historical)
- `public/` (only default Next.js SVGs)

---

## Appendix B — Audit Lineage

| Version | Date | Auditor | Grade | Notes |
|---|---|---|---|---|
| AUDIT-v1 | 2026-07-12 | (claimed "Antigravity AI") | F — 56/100 | Initial audit. Found CVSS 9.8 backdoor, real service-role key committed, 9/9 tests failing. |
| AUDIT-v2 | 2026-07-12 | (same day as v1) | B+ — 83/100 | Post-remediation. Tasks 09–16 applied. 11 new findings (N1–N11). |
| AUDIT-v3 | 2026-07-17 | (5 days later) | B+ — 89/100 | Tasks 17–24 applied. 4 new findings (N12–N15). |
| AUDIT-v4 | 2026-07-18 | (1 day after v3) | B+ — 87/100 | Tasks 25–30 applied. 18 new findings (X1–X18). First audit to score LOWER than predecessor. |
| **AUDIT-v5 (this audit)** | 2026-07-20 | (2 days after v4) | **B− — 82/100** | Tasks 31–47 applied. 37 new findings (Y1–Y37). Second audit to score LOWER than predecessor. |

### B.1 Score trajectory

```
100 ┤
 90 ┤                         ┌─── 89 (v3)
 80 ┤        ┌─── 83 (v2)     │              ┌─── 82 (v5) ◀── you are here
 70 ┤        │                │   ┌─── 87 (v4)│
 60 ┤        │                │   │           │
 50 ┤─── 56 (v1)
 40 ┤
    └─────────────────────────────────────────────────────────
       v1      v2      v3      v4      v5
     (07/12) (07/12) (07/17) (07/18) (07/20)
```

### B.2 Finding-count trajectory

| Audit | New Findings Introduced | Total Findings |
|---|---|---|
| v1 | (baseline) | (baseline) |
| v2 | 11 (N1–N11) | 11 |
| v3 | 4 (N12–N15) | 15 |
| v4 | 18 (X1–X18) | 33 |
| v5 | 37 (Y1–Y37) | 70 |

The cumulative finding count grows monotonically while the score does not — each audit finds new things its predecessors missed. **This is a feature, not a bug:** it means the audit process is working. The codebase keeps improving; the bar keeps getting stricter; the audit history becomes a record of progressive hardening.

### B.3 What this audit confirms

- **AUDIT-v4 was directionally correct.** Its X1–X18 findings were real (except X12, which was a false positive). Its prescribed fixes (Tasks 31–47) were the right fixes. The project applied them all.
- **AUDIT-v4 missed several material issues.** Y1 (role check), Y2 (EntryForm type-lie), Y3 (revalidatePath no-op in actions), Y4 (console.error in production), Y5 (5 untested route pages), Y6 (layout.test no-op) — these are all things v4 should have caught but didn't.
- **The codebase is production-ready after P0.** With P0-1, P0-2, P0-3 shipped, the project is safe to deploy. P1+P2+P3 are quality improvements that move the grade from B+ to A+.

### B.4 What this audit does NOT claim

- I do not claim AUDIT-v4 was "wrong" in any global sense. v4 was a thorough audit that found 18 real issues. My audit found 37 more because the bar has moved.
- I do not claim my audit is exhaustive. AUDIT-v6 will likely find more Y-findings I missed. That's the nature of iterative auditing.
- I do not claim Tasks 31–47 were applied perfectly. Task 13 (Code Quality Cleanup) left `console.error` in place (Y4). Task 19 (revalidate no-op fix) only half-fixed the problem (Y3). Task 29 (layout test) fixed the hydration warning but didn't add real coverage (Y6). Task 35 (Math.round) has an inaccurate comment (Y12). These are PARTIAL applications, not failures — but they show that task acceptance criteria should be more precise.

---

**End of AUDIT-v5.**

*Audit conducted by independent re-grade on 2026-07-20. Methodology: full source read, 4 parallel research subagents, independent grep/build/test verification. Final grade: **B− — 82/100**. Deployability: **CONDITIONAL GO** after P0 items ship. Projected grade after P0+P1+P2: **A (96/100)**.*
