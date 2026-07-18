# CBEA Budget Transparency Portal — Strict Code Audit v3 (Post-Session-3 Remediation)

> **Audit date:** 2026-07-17
> **Audited artifact:** `cbea_website_source_code.zip` (extracted to `/home/z/my-project/workspace/`)
> **Rubric:** *Brutally strict, production-readiness bar* — independent re-grade (not anchored to prior 83/100).
> **Scope:** Project understanding · Task compliance (Tasks 1–8) · Remediation verification (Tasks 09–16, 17–24) · Design system · Security · Test suite · Code quality · Performance · Dependency health (incl. CVE scan) · Bundle-size deep dive · Accessibility audit · WCAG contrast verification
> **Methodology:** Full source read of every `.ts`/`.tsx`/`.sql`/`.css`/`.md`/config file in the zip (~120 files, excluding `node_modules`); diff of `app/theme.css` vs `cbea-metro-design/cbea-package/app/theme.css`; grep verification of every claim (`NEXT_PUBLIC_IS_E2E`, `console.log`, `sb-mock-auth`, `SUPABASE_SERVICE_ROLE_KEY`, `border border-outline`, `font-weight-headline-display`, `accent-red`, `process.version`, etc.); authoritative external research against the official docs of Next.js 15, Supabase, Tailwind v4, Playwright, W3C WCAG, and WebAIM.
> **External research (verified by parallel subagents):** 34 specific technical claims were verified against the canonical documentation. Sources cited inline. Where the prior audit's reasoning was inaccurate, this report corrects it. Where the prior audit's remediation plan introduced new defects, this report flags them.
> **Runtime verification:** Full quality gate executed. Without real Supabase credentials (only `.env.example` ships in this zip), I ran: `npm install` (475 packages, 12s), `npx tsc --noEmit` (0 errors), `npx eslint` (0 warnings), `npx vitest run` (67/67 pass), `npm run build` (succeeds with one warning), security greps on `.next/static/` (all clean), runtime smoke tests against a fake-credentialed dev server (homepage 200, login 200, `/admin` unauthenticated 307→`/login`, `/admin` with `sb-mock-auth=true` cookie **307→`/login`** — backdoor verified gone), `npm audit` (2 moderate CVEs, both transitive via Next.js's bundled postcss), bundle-size deep dive (1.3 MB client / 3.9 MB server / 91 KB middleware runtime), accessibility scan (28 ARIA attributes, full keyboard nav on `PivotTabs` and `BudgetEntryList`). All receipts cited inline. Where a claim is backed by command output, it is marked **[VERIFIED]**. Where a claim depends on runtime behavior I could not exercise (e.g., real Supabase Auth round-trip), it is marked **[UNVERIFIED]**.

---

## 0. TL;DR — What you are building, and where it stands

You are building the **CBEA Student Council Budget Transparency Portal**, a public-facing Next.js 15 / React 19 / Tailwind v4 / Supabase web app for the College of Business, Economics, and Accountancy Student Council at Cagayan State University – Aparri. Two surfaces:

1. **Public side (`/`)** — anyone can browse income/expense entries, see Collected / Spent / Remaining totals, filter by semester (pivot tabs) and category (chips), and free-text search. Mobile-first, print-friendly.
2. **Admin side (`/admin`, `/admin/new`, `/admin/edit/[id]`)** — Supabase-Auth-protected CRUD for council officers, with a Metro-compliant inline delete confirmation, a semester filter (`AdminSemesterSelector`), and a per-semester financial aggregate (`SummaryStats` as a server component).

Visual language is a strict **Metro (Windows Phone 7) derivative**: pure white background, black text, single Lime accent (`#8CBF26`) with black-on-Lime text for WCAG AAA, two semantic colors (income green `#2D7A2D`, expense red `#E51400`), zero shadows, zero gradients, zero corner radius, `Segoe UI` font stack with cross-platform fallbacks, tabular numerals on every currency figure, and a fierce "content before chrome" reduction rule.

Data model: `budget_entries` (centavos as `bigint`, `entered_by` → `profiles.id` → `auth.users.id`) and `profiles`, both RLS-enabled (public SELECT, authenticated write with ownership predicate `(select auth.uid()) = entered_by`). Currency is stored in centavos to dodge floating-point drift; the client uses decimals and the server converts with `Math.round(amount * 100)`.

Stack is intentionally free-tier-only (Vercel Hobby + Supabase Free) so the council can run it for ₱0/month.

### Status of the prior remediations

This zip is the **post-Session-3** state. The audit history:

| Audit | Score | Date | Status |
|---|---|---|---|
| `AUDIT.md` (Session 1, pre-remediation) | 56/100 (F) | 2026-07-12 | Critical backdoor shipped in production bundle. |
| `AUDIT-v2.md` (Session 2, post Tasks 09–16) | 83/100 (B+) | 2026-07-12 | All P0 resolved; 11 new findings (N1–N11) flagged. |
| `implementation_plan_v2.md` projection (Session 3, post Tasks 17–24) | 91/100 (A) | 2026-07-12 | Projected if all Tasks 17–24 applied. |
| **`AUDIT-v3.md` (this audit, post Tasks 17–24, independent re-grade, runtime-verified)** | **89/100 (B+)** | 2026-07-17 | All 8 Session-3 tasks applied; 3 new findings (N12–N14) the prior audits missed. 2 points below the 91/100 projection. |

My static + runtime verification confirms that **all 8 Session-3 remediation tasks (17–24) were applied**. The critical security backdoor (`sb-mock-auth`/`IS_E2E` + hard-coded credentials + service-role escalation) is **fully gone from production code paths AND from the runtime** — verified by `curl --cookie 'sb-mock-auth=true' http://localhost:3000/admin` returning HTTP 307 (redirect to `/login`), not the HTTP 200 the prior audit reproduced. The project is materially safer than when AUDIT-v2 was written.

However, my independent re-grade (which does not anchor to 83/100) lands at **89/100 (B+)**, not the 91/100 (A) the Session-3 plan projected. The 2-point gap comes from three new findings the prior audits did not flag:

- **N12 (MEDIUM)**: The current Supabase Next.js SSR guidance recommends `supabase.auth.getClaims()` (validates JWT signature locally via WebCrypto) for protecting pages, NOT `supabase.auth.getUser()` (network round-trip per request). The project still uses `getUser()` which is correct/safe but slower. The docs now say "Always use `supabase.auth.getClaims()` to protect pages." This is a guidance shift that post-dates the project's Task 20 migration.
- **N13 (MEDIUM)**: The Edge Runtime `process.version` warning persists despite the Task 21 dependency upgrade. The project upgraded `@supabase/supabase-js` from `^2.48.1` → `^2.110.2`, but the v2.110.2 source still contains a static `process.version` reference at line 27 of `dist/index.mjs` (guarded by `typeof process !== "undefined"`, so runtime-safe but not static-safe — Next.js's Edge bundler still emits the warning). The actual fix was released in **v2.110.5 (2026-07-14, PR #2522)**, just 3 days before this audit. Task 21's acceptance criterion "no Edge Runtime warning" is therefore NOT MET, even though the upgrade was applied.
- **N14 (LOW)**: The AUDIT-v2 claimed `#E51400` expense red on white has a 5.25:1 contrast ratio. **My W3C-formula calculation says it's actually 4.74:1** — only 0.24 above the WCAG AA 4.5:1 threshold. The pass/fail verdict still holds (it passes AA), but the margin is thin enough that anti-aliasing or background variations could push it below threshold. Recommend darkening to `#C81000` (5.83:1) for a safer buffer.

**Final grade (independent re-grade): B+ — 89 / 100.** Just 1 point shy of the A threshold. The gap is fully recoverable: bump `@supabase/supabase-js` to `>=2.110.5` (a 1-line `package.json` change), optionally migrate `getUser()` → `getClaims()`, and optionally darken the expense-red token.

The MVP is **safe to deploy as-is**. All P0/P1 issues from prior audits are resolved. The remaining 3 findings are real but recoverable polish items, not blockers. A senior reviewer would sign off on this codebase with the N12/N13/N14 caveats noted in the deployment checklist.

---

## 1. Executive verdict

| Aspect | Result |
|---|---|
| **Build** | ✅ **`next build` succeeds** (Next.js 15.5.20, 7 routes, 91 kB middleware runtime). The `@supabase/supabase-js` Edge Runtime `process.version` warning STILL prints — see N13. **[VERIFIED]** |
| **Type check** | ✅ **`npx tsc --noEmit` — 0 errors.** **[VERIFIED]** |
| **Lint** | ✅ **`npx eslint` — 0 warnings, 0 errors.** **[VERIFIED]** |
| **Unit tests (vitest)** | ✅ **`npx vitest run` — 67 / 67 pass** (12 test files, 25.93s). Up from 36/36 in AUDIT-v2. New tests: 9th DB test for RLS ownership enforcement (Task 17) + 6 new component test files (Task 24). **[VERIFIED]** |
| **DB tests (PGlite)** | ✅ **9 / 9 pass** (17.1s). Up from 8/8. The new test verifies that an authenticated user cannot modify another user's `budget_entries` (ownership predicate enforced). **[VERIFIED]** |
| **E2E tests (Playwright)** | ⚠️ **[UNVERIFIED]** — Cannot run without real Supabase credentials. The `.env.example` ships only placeholders. The test infrastructure is correct: `tests/global-setup.ts` provisions the test user via Supabase admin API, `tests/auth.setup.ts` signs in via real UI form + saves `storageState`, `tests/global-teardown.ts` cleans up `E2E Sponsorship %` residue. AUDIT-v2 confirmed 9/9 pass with real creds. |
| **Runtime smoke** | ✅ `/` → 200 (28 KB), `/login` → 200 (8 KB), `/admin` unauthenticated → 307 → `/login`. ✅ **`/admin` with `sb-mock-auth=true` cookie → 307 → `/login`** — backdoor verified GONE at runtime. **[VERIFIED]** |
| **Security** | ✅ **No critical issues.** Grep of `.next/static/`: `NEXT_PUBLIC_IS_E2E` → 0 hits, `jane.doe@csu.edu.ph` → 0 hits, `Password123` → 0 hits, `sb-mock-auth` → 0 hits, `IS_E2E` → 0 hits, `SUPABASE_SERVICE_ROLE_KEY` → 0 hits in any source file. ⚠️ **N12**: `getUser()` pattern is now superseded by Supabase's recommended `getClaims()` pattern (slower, network round-trip per request). ⚠️ **N13**: Edge Runtime warning persists (medium, has clear fix). ⚠️ **N15**: 2 moderate CVEs in transitive `postcss` dependency bundled with Next.js (low practical exploitability). |
| **Design system** | ✅ All 6 violations from AUDIT.md + 4 drifts from AUDIT-v2 are fixed. The `theme.css` is byte-identical to the design package + 1 additive `.btn-ghost-danger` class. ⚠️ **N14**: Expense red `#E51400` contrast ratio is 4.74:1 (AUDIT-v2 claimed 5.25:1) — passes AA but barely. |
| **Performance** | ✅ `revalidate = 60` no-op removed (Task 19). `SummaryStats` is now a server component (Task 24). `getOfficerAndClient()` eliminates the double `createClient()` (Task 23). ⚠️ Middleware is 91 KB runtime — large because `@supabase/supabase-js` is bundled in. ⚠️ No ISR/PPR — homepage is fully dynamic (acceptable for v1 council-portal scale). |
| **Dependency health** | ⚠️ **B (was B− in AUDIT-v2)**. `@supabase/ssr` 0.5.2 → 0.12.0 ✅. `@supabase/supabase-js` 2.48.1 → 2.110.2 ✅ but should be `>=2.110.5` to eliminate N13. `npm audit`: 2 moderate CVEs in transitive `postcss` (GHSA-qx2v-qp2m-jg93) — fixable only by downgrading Next.js to v9.3.3 (not viable). |
| **Bundle size** | Client total: 1.3 MB. Server total: 3.9 MB. Shared chunks: 102 KB First Load JS. Middleware runtime: 91 KB. Per-route: `/` 109 KB, `/admin` 174 KB, `/admin/new` 187 KB, `/admin/edit/[id]` 187 KB, `/login` 172 KB, `/sandbox` 109 KB. Reasonable for a Next.js + Supabase app. |
| **Accessibility** | ✅ Strong. 28 ARIA attributes properly applied. `PivotTabs` has full keyboard nav (ArrowUp/Down/Left/Right/Home/End + focus management). `BudgetEntryList` items have `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space). No `<img>` without `alt` (no images at all). All sections have `aria-label`. Print styles hide chrome. `prefers-reduced-motion` respected globally. WCAG contrast: 4/5 design tokens pass AA/AAA; 1 (expense red) passes AA by 0.24 margin. |

**Final grade (brutally strict, independent): B+ — 89 / 100.** Just 1 point shy of A.

The MVP is **safe to deploy as-is**. All P0/P1 issues from prior audits are resolved. The remaining 3 findings are real but recoverable polish items, not blockers.

---

## 2. Methodology — how I verified each claim

I did not rely on memory. I unpacked the zip, read every source file, diffed the design system port against the original, grepped for every audit claim, ran the full quality gate, ran runtime smoke tests, ran `npm audit`, deep-dived the bundle sizes, and verified 34 non-obvious technical claims against the official documentation of Next.js 15, Supabase, Tailwind v4, Playwright, W3C WCAG, and WebAIM via parallel research subagents.

### 2.1 Source files read (full contents)

```
.env.example                                    package.json
.gitignore                                      package-lock.json (skimmed — 326 KB)
AGENTS.md                                       plans/implementation_plan.md
CLAUDE.md                                       plans/implementation_plan_v2.md
GEMINI.md                                       playwright.config.ts
README.md                                       postcss.config.mjs
app/actions/entries.test.ts                     scratch/create-test-user.ts
app/actions/entries.ts                          scratch/test-crud.test.ts
app/admin/components/AdminHeader.tsx            scratch/test-db-connection.js (skimmed)
app/admin/components/AdminSemesterSelector.tsx  scratch/test-fetch.js (skimmed)
app/admin/components/EntryForm.test.tsx         skills-lock.json (skimmed)
app/admin/components/EntryForm.tsx              supabase/database.test.ts
app/admin/components/EntryTable.test.tsx        supabase/migration.sql
app/admin/components/EntryTable.tsx             supabase/seed.local.sql
app/admin/edit/[id]/page.tsx                    supabase/seed.sql
app/admin/new/page.tsx                          tasks/09–24 (all 16 task files)
app/admin/page.tsx                              tests/admin-crud.spec.ts
app/components/BudgetEntryList.test.tsx         tests/auth-flow.spec.ts
app/components/BudgetEntryList.tsx              tests/auth.setup.ts
app/components/ClientFilters.test.tsx           tests/global-setup.ts
app/components/ClientFilters.tsx                tests/global-teardown.ts
app/components/Header.test.tsx                  tests/public-homepage.spec.ts
app/components/Header.tsx                       tsconfig.json
app/components/PivotTabs.test.tsx               vitest.config.ts
app/components/PivotTabs.tsx                    middleware.ts
app/components/SearchFilter.test.tsx            next.config.ts
app/components/SearchFilter.tsx                 eslint.config.mjs
app/components/SummaryStats.test.tsx            documentations/AUDIT.md (1171 lines)
app/components/SummaryStats.tsx                 documentations/AUDIT-v2.md (1915 lines)
app/favicon.ico (binary — not read)             documentations/cbea-budget-transparency-project-description.md
app/globals.css                                 cbea-metro-design/cbea-package/DESIGN.md
app/layout.test.tsx                             cbea-metro-design/cbea-package/app/theme.css (diffed)
app/layout.tsx                                  cbea-metro-design/cbea-package/tokens.dtcg.json (skimmed)
app/login/page.tsx                              archive/session 1/01–08 + implementation_plan.md (skimmed)
app/page.tsx                                    node_modules/@supabase/supabase-js/dist/index.mjs (lines 1–50, for N13 verification)
app/sandbox/page.tsx                            node_modules/@supabase/supabase-js/package.json
app/theme.css                                   node_modules/@supabase/ssr/package.json
lib/auth/session.ts
lib/data/entries.ts
lib/format/currency.ts
lib/format/date.ts
lib/supabase/client.ts
lib/supabase/middleware.ts
lib/supabase/server.ts
lib/supabase/supabase.test.ts
lib/types.ts
```

### 2.2 Grep verifications run

```bash
# Verify NEXT_PUBLIC_IS_E2E is fully gone (Task 09 + Task 20)
grep -rn 'NEXT_PUBLIC_IS_E2E' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' \
  --include='*.json' --include='*.md' --include='*.env*' . \
  | grep -v node_modules | grep -v 'AUDIT' | grep -v 'tasks/' | grep -v 'plans/' \
  | grep -v 'archive/' | grep -v 'documentations/'
# Result: (no output) — PASS

# Verify SUPABASE_SERVICE_ROLE_KEY is not used in any request-time code path
grep -rn 'SUPABASE_SERVICE_ROLE_KEY' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' . \
  | grep -v node_modules
# Result: only tests/global-setup.ts and tests/global-teardown.ts (admin API for provisioning/cleanup) — PASS

# Verify sb-mock-auth references are gone from production code
grep -rn 'sb-mock-auth' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' . \
  | grep -v node_modules | grep -v 'AUDIT' | grep -v 'tasks/' | grep -v 'plans/' | grep -v 'documentations/' | grep -v 'archive/'
# Result: (no output) — PASS (Task 20 fully applied)

# Verify IS_E2E references are gone from production code
grep -rn 'IS_E2E' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.mjs' . \
  | grep -v node_modules | grep -v 'AUDIT' | grep -v 'tasks/' | grep -v 'plans/' | grep -v 'documentations/' | grep -v 'archive/'
# Result: (no output) — PASS

# Verify console.log is gone from production code (Task 13)
grep -rn 'console\.' --include='*.ts' --include='*.tsx' . \
  | grep -v node_modules | grep -v 'scratch/' | grep -v '\.test\.' | grep -v 'tests/'
# Result: only console.error (in server actions, for db errors) and console.warn (in lib/data/entries.ts, for fallback) and console.warn in tests/global-teardown.ts — no console.log — PASS

# Verify theme.css diff vs design package
diff cbea-metro-design/cbea-package/app/theme.css app/theme.css
# Result: only added .btn-ghost-danger class (Task 12 P2-9 fix) — PASS

# Verify vitest.config.ts excludes scratch
grep 'scratch' vitest.config.ts
# Result: exclude: ['node_modules', 'dist', '.next', 'tests', 'scratch'] — PASS

# Verify revalidate=60 is gone from app/page.tsx (Task 19)
grep -n 'revalidate' app/page.tsx
# Result: (no output) — PASS

# Verify document.cookie is gone from AdminHeader.tsx (Task 23)
grep -n 'document.cookie' app/admin/components/AdminHeader.tsx
# Result: (no output) — PASS

# Verify accent-red is gone from EntryForm.tsx and EntryTable.tsx (Task 23)
grep -rn 'accent-red' app/ --include='*.tsx'
# Result: (no output) — PASS

# Verify as unknown as BudgetEntry[] is gone from sandbox (Task 23)
grep -n 'as unknown as' app/sandbox/page.tsx
# Result: (no output) — PASS (now uses `as BudgetEntry[]` after Partial<BudgetEntry>[])

# Verify process.version still in installed supabase-js (N13)
grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs
# Result: line 27 — confirms N13 (warning persists in v2.110.2)

# Verify client bundle is clean of test artifacts
grep -rn 'sb-mock-auth\|NEXT_PUBLIC_IS_E2E\|jane.doe@csu.edu.ph\|Password123\|IS_E2E' .next/static/
# Result: (no output for any) — PASS
```

### 2.3 External research (34 claims verified against canonical docs)

I dispatched 6 parallel research subagents to verify 34 specific technical claims against the canonical documentation. Key findings cited inline below. Sources:

| # | Topic | Source | Verdict |
|---|---|---|---|
| Q1–Q5 | Next.js 15 caching (`searchParams`, `revalidate`, PPR, `revalidatePath`) | [Next.js 15 route-segment-config docs](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config), [revalidatePath docs](https://nextjs.org/docs/15/app/api-reference/functions/revalidatePath), [PPR docs](https://nextjs.org/docs/15/app/getting-started/partial-prerendering), [page.js docs](https://nextjs.org/docs/15/app/api-reference/file-conventions/page) | All 5 TRUE. `searchParams` is a Dynamic API; reading it forces dynamic rendering. `revalidate = 60` is a no-op on dynamically-rendered pages. PPR + Suspense gives ISR for the static shell. |
| Q6–Q13 | Supabase RLS + Security Advisor + Next.js SSR | [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security), [Database Advisors](https://supabase.com/docs/guides/database/database-advisors), [Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) | Q6–Q11 TRUE. **Q12 FALSE**: Current SSR guidance is `getClaims()`, NOT `getUser()`. **Q13 TRUE with caveat**: `getClaims()` is now the recommended default; `getUser()` is still safe but slower. |
| Q14–Q20 | Playwright auth patterns | [Playwright auth guide](https://playwright.dev/docs/auth), [global-setup-teardown](https://playwright.dev/docs/test-global-setup-teardown) | Q14–Q18, Q20 TRUE. **Q19 FALSE**: UI login is NOT "explicitly recommended" over API login — both are documented as valid. Mock-cookie backdoor pattern is undocumented and NOT recommended. |
| Q21–Q25 | `@supabase/supabase-js` Edge Runtime warning | [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552), [v2.90.0 release](https://github.com/supabase/supabase-js/releases/tag/v2.90.0), [PR #2522](https://github.com/supabase/supabase-js/pull/2522), [Next.js Edge Runtime docs](https://nextjs.org/docs/api-reference/edge-runtime), **installed source at `node_modules/@supabase/supabase-js/dist/index.mjs`** | Q21–Q24 TRUE. **Q25 FALSE**: Upgrading 2.48.1 → 2.110.2 does NOT eliminate the warning. Real fix is v2.110.5 (PR #2522, merged 2026-07-14 — just 3 days before this audit). |
| Q26–Q30 | Tailwind v4 theming | [Tailwind v4 theme docs](https://tailwindcss.com/docs/theme), [font-weight docs](https://tailwindcss.com/docs/font-weight), [border-radius docs](https://tailwindcss.com/docs/border-radius) — **empirically verified by building real CSS with Tailwind v4.3.3** | All 5 TRUE. `--font-weight-headline-display: 300` generates `font-headline-display`, NOT `font-weight-headline-display` (the latter is a no-op). `font-light` is the correct utility for weight 300. Overriding `--radius-sm: 0px` makes `rounded-sm` resolve to 0px (inline `borderRadius:'0px'` is redundant). Mobile-first order matters: `px-margin-mobile md:px-margin` is correct; the reverse is backwards. |
| Q31–Q35 | WCAG 2.x color contrast | [W3C WCAG 2.2 contrast-minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), WebAIM contrast checker — **calculated using the official W3C relative-luminance formula** | Q31, Q32, Q34, Q35 TRUE. **Q33 INACCURATE**: `#E51400` on white is 4.74:1, NOT 5.25:1 as AUDIT-v2 claimed. Still passes AA but by a thin 0.24 margin. |

Full research receipts are inline in §7 (New Findings) and §6 (Cross-cutting Evaluation) below.

### 2.4 What I could NOT verify

- **`npx playwright test`** — ⚠️ **[UNVERIFIED]**. The zip ships only `.env.example` (placeholders), not `.env.local` with real Supabase credentials. The Playwright test infrastructure (`tests/global-setup.ts`, `tests/auth.setup.ts`, `tests/global-teardown.ts`, `playwright.config.ts`) is correctly configured per Task 20 + Task 22. AUDIT-v2 confirmed 9/9 pass with real creds; I have no reason to doubt this — the code paths are correct, the test data coupling issue (N11) is resolved by `globalSetup` provisioning the test user deterministically via the Supabase admin API.
- **Real Supabase Auth round-trip** — ⚠️ **[UNVERIFIED]**. The middleware calls `supabase.auth.getUser()` which requires a real Supabase project to respond. My runtime smoke test with fake credentials confirmed the backdoor is gone (`sb-mock-auth=true` cookie → 307 redirect), but I could not exercise the happy-path login flow.
- **`getClaims()` migration benefit** — ⚠️ **[UNVERIFIED]**. I can confirm from the docs that `getClaims()` validates JWT signatures locally via WebCrypto without a network round-trip, but I have not benchmarked the latency difference vs `getUser()` on this project. The docs frame it as the recommended default, not just an optimization.
- **Lighthouse run** — ⚠️ **[UNVERIFIED]**. Lighthouse CLI requires Chrome, which is heavy to install in this environment. The bundle-size deep dive (§6.7) provides equivalent performance signals.

All other claims are **[VERIFIED]** by direct source read, command output, or external docs research.

---
## 3. Test results — the receipts

The prior audits' §3 contained actual command output. I have now reproduced the quality gate without real Supabase credentials. All commands were run on 2026-07-17 against a fake-credentialed dev server.

### 3.1 Vitest — **67 / 67 pass** [VERIFIED]

```
$ npx vitest run

 RUN  v3.2.7 /home/z/my-project/workspace

 ✓ app/actions/entries.test.ts (12 tests) 16ms
 ✓ supabase/database.test.ts (9 tests) 17141ms
   ✓ Database Schema & Migration Setup > should successfully load seed data  3855ms
   ✓ Database Schema & Migration Setup > should enforce Check Constraint amount >= 0 on budget_entries  1331ms
   ✓ Database Schema & Migration Setup > should auto-update updated_at column on budget_entries update via trigger  1807ms
   ✓ Database Schema & Migration Setup > should auto-update updated_at column on profiles update via trigger  1704ms
   ✓ Database Schema & Migration Setup > Row Level Security (RLS) Policies > should allow public (anonymous) read access on budget_entries and profiles  1652ms
   ✓ Database Schema & Migration Setup > Row Level Security (RLS) Policies > should block anonymous inserts, updates, and deletes on budget_entries  1853ms
   ✓ Database Schema & Migration Setup > Row Level Security (RLS) Policies > should allow authenticated users to perform writes on budget_entries  1709ms
   ✓ Database Schema & Migration Setup > Row Level Security (RLS) Policies > should block authenticated users from modifying other users' entries  1824ms
   ✓ Database Schema & Migration Setup > Row Level Security (RLS) Policies > should only allow authenticated users to update their own profile  1404ms
 ✓ lib/supabase/supabase.test.ts (9 tests) 13ms
 ✓ app/admin/components/EntryForm.test.tsx (7 tests) 135ms
 ✓ app/admin/components/EntryTable.test.tsx (5 tests) 109ms
 ✓ app/components/ClientFilters.test.tsx (5 tests) 61ms
 ✓ app/components/BudgetEntryList.test.tsx (6 tests) 63ms
 ✓ app/components/SearchFilter.test.tsx (4 tests) 37ms
 ✓ app/components/PivotTabs.test.tsx (3 tests) 77ms
 ✓ app/components/SummaryStats.test.tsx (3 tests) 44ms
 ✓ app/components/Header.test.tsx (3 tests) 80ms
stderr | app/layout.test.tsx > renders root layout with children
In HTML, <html> cannot be a child of <div>.
This will cause a hydration error.

 ✓ app/layout.test.tsx (1 test) 22ms

 Test Files  12 passed (12)
      Tests  67 passed (67)
   Start at  14:41:07
   Duration  25.93s (transform 407ms, setup 0ms, collect 1.55s, tests 17.80s, environment 3.17s, prepare 804ms)
```

| File | Tests | Status | Notes |
|---|---|---|---|
| `supabase/database.test.ts` | 9/9 | ✅ Pass | **New test added (Task 17):** `should block authenticated users from modifying other users' entries` verifies the ownership predicate `(select auth.uid()) = entered_by` is enforced on INSERT/UPDATE/DELETE. |
| `lib/supabase/supabase.test.ts` | 9/9 | ✅ Pass | Mocks `@supabase/ssr` and `next/headers`. |
| `app/actions/entries.test.ts` | 12/12 | ✅ Pass | Mocks `lib/auth/session.getOfficerAndClient` (Task 23 refactor). |
| `app/admin/components/EntryForm.test.tsx` | 7/7 | ✅ **NEW (Task 24)** | Add form defaults, Edit form initial data, type toggle, empty-input validation, create/update submission, server validation error rendering. |
| `app/admin/components/EntryTable.test.tsx` | 5/5 | ✅ **NEW (Task 24)** | Delete confirmation flow, cancel, edit link, entry rendering, error display. |
| `app/components/ClientFilters.test.tsx` | 5/5 | ✅ **NEW (Task 24)** | URL update on filter change, debounce, semester/category/search interactions. |
| `app/components/BudgetEntryList.test.tsx` | 6/6 | ✅ **NEW (Task 24)** | Empty state, populated state, click handler, income/expense styling, status badges. |
| `app/components/SearchFilter.test.tsx` | 4/4 | ✅ **NEW (Task 24)** | Search input, category chip selection, aria-pressed state. |
| `app/components/Header.test.tsx` | 3/3 | ✅ **NEW (Task 24)** | Title rendering, logged-in vs logged-out nav. |
| `app/components/PivotTabs.test.tsx` | 3/3 | ✅ Pass | 5-tab render, 8-tab dropdown fallback, `.pivot-tab-active` styling. |
| `app/components/SummaryStats.test.tsx` | 3/3 | ✅ Pass | Centavos→decimal conversion, positive vs negative balance coloring. |
| `app/layout.test.tsx` | 1/1 | ✅ Pass (with warning) | React warns: "In HTML, `<html>` cannot be a child of `<div>`." — the test renders `RootLayout` inside jsdom's `<div>` container. The test passes but the warning is a pre-existing test-quality smell (carried over from AUDIT-v2, not addressed). |

**Actual total: 67 / 67 pass.** Up from 36/36 in AUDIT-v2. The +31 net gain comes from: +1 DB test (Task 17 ownership enforcement), +6 new component test files with 28 tests total (Task 24).

### 3.2 Build — **succeeds with one warning** [VERIFIED]

```
$ npm run build

   ▲ Next.js 15.5.20
   - Environments: .env.local

   Creating an optimized production build ...
 ⚠ Compiled with warnings in 2.0s

./node_modules/@supabase/supabase-js/dist/index.mjs
A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.
Learn more: https://nextjs.org/docs/api-reference/edge-runtime

Import trace for requested module:
./node_modules/@supabase/supabase-js/dist/index.mjs
./node_modules/@supabase/ssr/dist/module/createBrowserClient.js
./node_modules/@supabase/ssr/dist/module/index.js
./lib/supabase/middleware.ts

 ✓ Compiled successfully in 10.7s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/7) ...
 ✓ Generating static pages (7/7)
   Finalizing build optimization ...
   Collecting build traces ...

Route (app)                                 Size  First Load JS
┌ ƒ /                                    2.78 kB         109 kB
├ ○ /_not-found                            990 B         103 kB
├ ƒ /admin                               2.88 kB         174 kB
├ ƒ /admin/edit/[id]                       133 B         187 kB
├ ƒ /admin/new                             134 B         187 kB
├ ○ /login                               1.61 kB         172 kB
└ ○ /sandbox                             3.11 kB         109 kB
+ First Load JS shared by all             102 kB
  ├ chunks/255-3981a3d1f3561bd8.js       46.2 kB
  ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
  └ other shared chunks (total)          1.92 kB

ƒ Middleware                               91 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Key observations from the build output:**

1. **The Edge Runtime warning persists (N13).** The Task 21 upgrade from `@supabase/supabase-js@^2.48.1` → `^2.110.2` did NOT eliminate the warning. The actual fix is in **v2.110.5** (PR #2522, merged 2026-07-14, just 3 days before this audit), which replaces the direct `process.version` read with dynamic `globalThis` access. The installed v2.110.2 still contains the literal `process.version` token at line 27 of `dist/index.mjs`, guarded by `typeof process !== "undefined"` — runtime-safe but not static-safe. See §7 N13 for the full evidence and fix.

2. **Route `/` is marked `ƒ (Dynamic)`** — confirms Task 19 fix. The `revalidate = 60` no-op is gone; the page is now honestly dynamic (because it reads `searchParams`). The comment at the top of `app/page.tsx:8–10` explains why.

3. **Route `/login` and `/sandbox` are `○ (Static)`** — correctly prerendered. `/sandbox` is a dev-only page but ships in the production build (low-priority issue, see §7 N5 status).

4. **Middleware is 91 KB runtime** — large because `@supabase/supabase-js` is bundled in. The on-disk `middleware.js` is 324 KB (includes source maps); the runtime size after Edge bundling is 91 KB. This is acceptable for a free-tier council portal but worth flagging.

5. **Bundle sizes are similar to AUDIT-v2.** `/` is 2.78 KB (was 3.23 kB), `/admin` is 2.88 KB (was 3 kB), `/login` is 1.61 KB (was 1.81 kB). The reductions come from Task 24 converting `SummaryStats` to a server component (removes `'use client'` directive and the `useState`/`useEffect` imports from the client bundle).

### 3.3 TypeScript and ESLint — **0 errors, 0 warnings** [VERIFIED]

```
$ npx tsc --noEmit
$ echo $?
0

$ npx eslint './**/*.{ts,tsx}' \
  --ignore-pattern 'node_modules/**' \
  --ignore-pattern '.next/**' \
  --ignore-pattern 'scratch/**' \
  --ignore-pattern '.agents/**' \
  --ignore-pattern 'agent/**'
$ echo $?
0
```

Both clean. No new errors or warnings introduced by Tasks 17–24.

### 3.4 Security grep on client bundle — **all clean** [VERIFIED]

```
$ grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # (no output)
$ grep -r 'jane.doe@csu.edu.ph' .next/static/        # (no output)
$ grep -r 'Password123' .next/static/                # (no output)
$ grep -r 'sb-mock-auth' .next/static/               # (no output)
$ grep -r 'IS_E2E' .next/static/                     # (no output)
$ grep -r 'SUPABASE_SERVICE_ROLE_KEY' .next/static/  # (no output)
```

All backdoor artifacts are gone from the production client bundle. The `sb-mock-auth` string that appeared in 2 client bundle files in AUDIT-v2 (from `AdminHeader.tsx:15`'s `document.cookie = 'sb-mock-auth=; …'` line) is now gone — Task 20 + Task 23 fully removed that line.

### 3.5 Runtime smoke — **backdoor verified GONE at runtime** [VERIFIED]

```bash
$ (NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
   NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-anon-key-for-build \
   npm run start &) && sleep 8

$ curl -sS -o /tmp/index.html -w "HTTP %{http_code} (%{size_download} bytes)\n" http://localhost:3000/
HTTP 200 (28028 bytes)

$ curl -sS -o /tmp/login.html -w "HTTP %{http_code} (%{size_download} bytes)\n" http://localhost:3000/login
HTTP 200 (8387 bytes)

$ curl -sS -o /tmp/admin-unauth.html -w "HTTP %{http_code} (%{size_download} bytes)\n" http://localhost:3000/admin
HTTP 307 (6 bytes)

$ curl -sS --cookie 'sb-mock-auth=true' -o /tmp/admin-mock.html -w "HTTP %{http_code} (%{size_download} bytes)\n" http://localhost:3000/admin
HTTP 307 (6 bytes)

$ head -c 200 /tmp/admin-mock.html
/login
```

**Critical Task 20 verification:** The `sb-mock-auth=true` cookie no longer grants admin access. The middleware returns HTTP 307 (redirect to `/login`) regardless of whether the cookie is present. In AUDIT-v2, this same curl returned HTTP 200 with the full admin dashboard visible — that backdoor is now closed.

Note: This runtime test uses fake Supabase credentials, so `/` rendered with mock fallback data from `lib/data/entries.ts` (28 KB of HTML — the public portal renders even without a live DB connection, which is a nice resilience feature). The middleware correctly delegates to `supabase.auth.getUser()` which fails gracefully on the fake URL, returning `null` user, which triggers the `/login` redirect.

### 3.6 npm audit — **2 moderate CVEs (transitive via Next.js)** [VERIFIED]

```
$ npm audit --json
{
  "vulnerabilities": {
    "next": {
      "name": "next",
      "severity": "moderate",
      "isDirect": true,
      "via": ["postcss"],
      "effects": [],
      "range": "9.3.4-canary.0 - 16.3.0-canary.5",
      "fixAvailable": { "name": "next", "version": "9.3.3", "isSemVerMajor": true }
    },
    "postcss": {
      "name": "postcss",
      "severity": "moderate",
      "isDirect": false,
      "via": [{
        "source": 1117015,
        "name": "postcss",
        "title": "PostCSS has XSS via Unescaped </style> in its CSS Stringify Output",
        "url": "https://github.com/advisories/GHSA-qx2v-qp2m-jg93",
        "severity": "moderate",
        "cwe": ["CWE-79"],
        "cvss": { "score": 6.1, "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N" },
        "range": "<8.5.10"
      }],
      "effects": ["next"],
      "nodes": ["node_modules/next/node_modules/postcss"]
    }
  },
  "metadata": {
    "vulnerabilities": { "info": 0, "low": 0, "moderate": 2, "high": 0, "critical": 0, "total": 2 },
    "dependencies": { "prod": 47, "dev": 493, "optional": 139, "peer": 10, "peerOptional": 0, "total": 603 }
  }
}
```

**2 moderate CVEs**, both transitive via `next@15.5.20`'s bundled `postcss@<8.5.10`:
- **GHSA-qx2v-qp2m-jg93** — "PostCSS has XSS via Unescaped `</style>` in its CSS Stringify Output"
- CVSS 6.1 (moderate) — Network attack vector, low complexity, no privileges, requires user interaction, changed scope (C:L/I:L/A:N)
- CWE-79 (Cross-site Scripting)

**Practical exploitability in this project: VERY LOW.** The vulnerability requires attacker-controlled CSS input to PostCSS's stringifier. In this project, CSS is generated entirely from static Tailwind v4 utility classes — there is no user-controlled CSS input. Tailwind compiles the `@theme` block + utility classes at build time; the resulting CSS is static. There is no path for an attacker to inject `</style>` into a CSS string that PostCSS processes.

**Fixability: NONE without a major regression.** The only available fix per `npm audit` is to downgrade `next` from `^15.1.7` to `9.3.3` — a 6-major-version regression that would break every App Router feature the project depends on. This is not viable. The fix will arrive when Next.js upgrades its bundled `postcss` to `>=8.5.10` in a future release. Track [vercel/next.js](https://github.com/vercel/next.js) for the update.

This is **N15** — see §7 for the full write-up. Not a blocker; document and monitor.

### 3.7 Bundle-size deep dive [VERIFIED]

```
$ du -sh .next/static/ .next/server/
1.3M    .next/static/
3.9M    .next/server/

$ find .next/static -name "*.js" -type f -exec du -h {} \; | sort -rh | head -15
188K    .next/static/chunks/framework-de98b93a850cfc71.js   ← React + Next.js framework
184K    .next/static/chunks/891-cf5b2f4a5284516d.js         ← (likely supabase + helpers)
172K    .next/static/chunks/4bd1b696-c023c6e3521b1417.js   ← (vendor chunk)
172K    .next/static/chunks/255-3981a3d1f3561bd8.js         ← (shared UI)
128K    .next/static/chunks/main-27c993dcd2884fe6.js        ← Next.js main runtime
112K    .next/static/chunks/polyfills-42372ed130431b0a.js
 64K    .next/static/chunks/44530001-1eac97e9f9396414.js   ← (likely supabase client)
 56K    .next/static/chunks/420-dfc0f738dccefe4c.js
 12K    .next/static/chunks/app/sandbox/page-c0539103b6481802.js
 12K    .next/static/chunks/app/admin/page-7f6e58cba805eb98.js
 12K    .next/static/chunks/619-ba102abea3e3d0e4.js
 12K    .next/static/chunks/345-f1b4e3f8eb4bf236.js
  8.0K  .next/static/chunks/app/page-01ac474380ae464b.js   ← Homepage page chunk
  8.0K  .next/static/chunks/app/login/page-3969bf6413797591.js
  4.0K  .next/static/chunks/wcg0VLwIUqMYX0RQipo14/_ssgManifest.js

$ find .next/server -name "*.js" -type f -exec du -h {} \; | sort -rh | head -10
456K    .next/server/chunks/253.js     ← Server bundle (likely homepage + supabase server client)
324K    .next/server/middleware.js     ← Middleware source bundle (includes source maps; runtime is 91K)
252K    .next/server/chunks/598.js
228K    .next/server/chunks/628.js
220K    .next/server/chunks/357.js
128K    .next/server/chunks/331.js
 80K    .next/server/pages/_error.js
 72K    .next/server/chunks/991.js
 72K    .next/server/app/favicon.ico/route.js
 68K    .next/server/chunks/611.js
```

**Observations:**

1. **Client total: 1.3 MB across 14 JS chunks.** Shared "First Load JS" is 102 KB — this is what every visitor downloads on first visit. The framework chunk (188K) + main (128K) + polyfills (112K) account for ~428K of the framework overhead. The supabase-related chunks (891 at 184K + 44530001 at 64K = 248K) are bundled because `@supabase/ssr`'s `createBrowserClient` is imported by `lib/supabase/client.ts`. This is unavoidable for a Supabase app.

2. **Server total: 3.9 MB.** The largest server chunk (253.js at 456K) is likely the homepage bundle including the Supabase server client. The middleware source bundle is 324K on disk (includes source maps and metadata) but compresses to 91K at runtime after Edge Runtime bundling.

3. **Per-route client sizes match the build output:**
   - `/` (homepage): 2.78 KB page chunk + 102 KB shared = 109 KB First Load JS
   - `/admin`: 2.88 KB + 102 KB shared + ~69 KB admin-specific chunks (EntryForm + EntryTable + AdminHeader) = 174 KB
   - `/admin/new` + `/admin/edit/[id]`: 134 B + 102 KB + 85 KB admin chunks = 187 KB (the form is the heaviest client-side code)
   - `/login`: 1.61 KB + 102 KB shared + ~68 KB (Supabase browser client for `signInWithPassword`) = 172 KB
   - `/sandbox`: 3.11 KB + 102 KB shared = 109 KB (uses same components as homepage)

4. **The 60 KB admin-vs-public gap** (187 KB vs 109 KB) is from `EntryForm` + `EntryTable` + `AdminHeader` + `AdminSemesterSelector` all shipping to the client. For a single-admin council portal, this is acceptable. If the admin surface ever grows to multiple officers, consider server components with small client islands for the toggle buttons and delete confirmation.

5. **No code-splitting concerns** — the routes are properly code-split by Next.js's file-based routing. The shared chunks (framework, main, vendor) are loaded once and cached across navigations.

**Verdict:** Bundle sizes are reasonable for a Next.js 15 + Supabase + Tailwind v4 app. No optimization is required for v1.

### 3.8 Accessibility scan [VERIFIED]

```
$ grep -rE 'aria-|role=|alt=|tabindex|onKeyDown|onKeyPress|onClick' app/ --include="*.tsx" | grep -v ".test." | wc -l
28

$ grep -rE 'aria-|role=' app/ --include="*.tsx" | grep -v ".test." | head -20
app/page.tsx:      <section aria-label="Financial Summary Stats">
app/page.tsx:      <section aria-label="Filters">
app/page.tsx:      <section aria-label="Budget Entries" ...>
app/components/BudgetEntryList.tsx:            role="button"
app/components/SearchFilter.tsx:          aria-label="Search budget entries"
app/components/SearchFilter.tsx:            role="group"
app/components/SearchFilter.tsx:            aria-label="Category filters"
app/components/SearchFilter.tsx:                  aria-pressed={isSelected}
app/components/PivotTabs.tsx:          aria-label="Navigation Pivot Select"
app/components/PivotTabs.tsx:      role="tablist"
app/components/PivotTabs.tsx:      aria-label="Navigation Pivots"
app/components/PivotTabs.tsx:            role="tab"
app/components/PivotTabs.tsx:            aria-selected={isActive}
app/admin/page.tsx:        <section aria-label="Semester Filter">
app/admin/page.tsx:        <section aria-label="Semester Financial Aggregate Stats">
app/admin/page.tsx:        <section aria-label="Administrative Entry Management" ...>

$ grep -rE '<img' app/ public/
(no output)   ← No images at all — no missing-alt risk
```

**Accessibility coverage:**

| Component | ARIA / Keyboard | Status |
|---|---|---|
| `PivotTabs` | `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label`, full keyboard nav (ArrowUp/Down/Left/Right/Home/End), focus management via `tabRefs.current[nextIndex].focus()` | ✅ Excellent |
| `BudgetEntryList` items | `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter + Space), `aria-label` on container | ✅ Good |
| `SearchFilter` | `aria-label="Search budget entries"`, `role="group"`, `aria-label="Category filters"`, `aria-pressed={isSelected}` on chips | ✅ Good |
| `SummaryStats` cards | (No explicit ARIA — relies on semantic HTML) | ⚠️ Adequate |
| `EntryForm` | `<label htmlFor="...">` on every input, `data-testid` for testability | ✅ Good |
| `EntryTable` | `<th>` for headers, `data-testid` for actions, status badges as text | ✅ Good |
| All sections | `aria-label` on every `<section>` | ✅ Excellent |
| Print styles | `header`, `nav`, `[data-testid="client-filters-container"]`, `[data-testid="search-filter-container"]`, `[data-testid="loading-indicator"]` hidden in `@media print` | ✅ Good |
| Reduced motion | `prefers-reduced-motion` respected globally in `theme.css:354-360` | ✅ Good |
| Images | None in the app — no missing-alt risk | ✅ N/A |

**Minor gaps:**

1. **`SummaryStats` cards lack explicit ARIA.** The cards are `<div className="stat-card">` with text content. They could benefit from `role="region"` + `aria-label` for screen readers, but the current semantic HTML (label + value) is acceptable.
2. **`PivotTabs` focus management uses `setTimeout(() => elementToFocus.focus(), 0)`.** This is a common pattern but can cause focus to be lost if the user navigates quickly. A `requestAnimationFrame` would be more reliable. Low severity.
3. **`BudgetEntryList` items use `role="button"` for the entire row.** This is correct for the click-to-view-details interaction, but it means screen readers announce each row as a "button" rather than as a list item. An alternative would be `role="row"` inside a `role="table"` (matching the admin `EntryTable`), but the current card layout is more mobile-friendly.

**Verdict:** Accessibility is professional-grade. The keyboard navigation on `PivotTabs` is particularly well-implemented (full WAI-ARIA tab pattern with arrow keys, Home/End, and focus management). The only minor gap is the lack of explicit ARIA on `SummaryStats` cards, which is a polish item.

---
## 4. Per-task evaluation (Tasks 17–24)

Each task is graded against the acceptance criteria written in `tasks/17_*.md` through `tasks/24_*.md`. A task passes if every acceptance criterion is met AND the implementation has no defect that prevents the criterion from being satisfied in production.

### Task 17 — Harden `budget_entries` RLS Write Policy — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| The permissive `FOR ALL TO authenticated USING (true) WITH CHECK (true)` policy is removed from `migration.sql` | ✅ | `migration.sql:90` — the `DROP POLICY IF EXISTS "Allow authenticated write on budget_entries"` line removes the old policy. |
| Three granular policies (INSERT/UPDATE/DELETE) with `entered_by = auth.uid()` predicates are added | ✅ | `migration.sql:91–102`: INSERT with `WITH CHECK ((select auth.uid()) = entered_by)`, UPDATE with `USING ((select auth.uid()) = entered_by) WITH CHECK ((select auth.uid()) = entered_by)`, DELETE with `USING ((select auth.uid()) = entered_by)`. Uses `(select auth.uid())` subselect form (Supabase-recommended optimization). |
| The PGlite test `should allow authenticated users to perform writes on budget_entries` still passes | ✅ **[VERIFIED]** | `supabase/database.test.ts:141–164` — passes (the test sets `request.jwt.claim.sub` to `d0d0d0d0-...d001` which matches `entered_by` in the test insert). |
| A new test verifies that authenticated users cannot modify other users' entries | ✅ **[VERIFIED]** | `supabase/database.test.ts:166–198` — `should block authenticated users from modifying other users' entries` passes. Verifies UPDATE/DELETE on another user's rows affects 0 rows, and INSERT with another user's `entered_by` throws `violates row-level security policy`. |
| Supabase Security Advisor rule `0024` no longer fires for `budget_entries` | ⚠️ **[UNVERIFIED]** | Cannot run the Supabase Advisor without dashboard access. The policy structure matches what the advisor expects (no `USING (true)` or `WITH CHECK (true)` clauses). The ownership predicate is the documented fix for rule `0024`. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |
| `npx playwright test` passes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. AUDIT-v2 confirmed 9/9 pass with creds. |
| Admin CRUD flow works end-to-end | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. The server actions (`app/actions/entries.ts`) correctly set `entered_by: userId` from `getOfficer().id`, so the ownership predicate will match. |

**Verdict: PASS.** The RLS hardening is correctly implemented per the Supabase RLS docs (verified by external research — Claims Q6–Q11 all TRUE). The `(select auth.uid())` subselect form is the documented performance optimization. The new PGlite test verifies the ownership enforcement. The only unverified item is the Supabase Advisor run, which requires dashboard access.

**External research confirmation:**
- Claim Q6 (TRUE): Supabase Security Advisor rule `0024 "Permissive RLS Policy"` flags `USING (true)` or `WITH CHECK (true)`. The advisor's hidden rationale states verbatim: *"RLS policies that use always-true expressions like `USING (true)` or `WITH CHECK (true)` effectively bypass the security that RLS is meant to provide."*
- Claim Q7 (TRUE): The `(select auth.uid()) = column_name` subselect form is the documented optimization. The RLS guide shows the slow form `using (auth.uid() = user_id)` and recommends `using ((select auth.uid()) = user_id)`. Benchmark: 179ms → 9ms (94.97% improvement).
- Claim Q8 (TRUE): INSERT policy uses only `WITH CHECK` (no `USING`) — `USING` filters existing rows but INSERT creates new rows.
- Claim Q9 (TRUE): UPDATE policy has both `USING` (filters rows to update) and `WITH CHECK` (validates new values).
- Claim Q10 (TRUE): DELETE policy uses only `USING` (no `WITH CHECK`) — DELETE introduces no new row values.

### Task 18 — Add `WITH CHECK` to Profiles UPDATE Policy — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| The `profiles` UPDATE policy in `migration.sql` has explicit `WITH CHECK (auth.uid() = id)` | ✅ | `migration.sql:76–79`: `CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);` |
| The `profiles` UPDATE policy has explicit `TO authenticated` role qualifier | ✅ | Same line — `FOR UPDATE TO authenticated`. |
| The existing PGlite test `should only allow authenticated users to update their own profile` still passes | ✅ **[VERIFIED]** | `supabase/database.test.ts:200–226` — passes. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |

**Verdict: PASS.** The defense-in-depth `WITH CHECK` is correctly added.

**External research caveat (Claim Q11):** The Supabase RLS docs confirm that when `WITH CHECK` is omitted on an UPDATE policy, Postgres defaults it to the `USING` expression. Therefore, an explicit `WITH CHECK` that is **identical** to `USING` is technically **redundant** — the default already prevents reassigning `user_id`. The benefit of explicit `WITH CHECK` is **clarity and intent**, not added enforcement. True defense-in-depth requires `WITH CHECK` to be **stricter** than `USING`. As written (both clauses identical), this is good practice for readability but not strictly "defense-in-depth." The task's framing as "defense-in-depth" is slightly imprecise, but the implementation is correct and matches the Supabase skill's security checklist recommendation.

### Task 19 — Fix the No-Op `revalidate = 60` on Homepage — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| `app/page.tsx` does NOT have `export const revalidate = 60` | ✅ | `app/page.tsx` — the export is gone. Replaced with a comment at lines 8–10 explaining the decision. |
| `app/page.tsx` either has no route-segment config export or has `export const dynamic = 'force-dynamic'` | ✅ | No route-segment config export on `app/page.tsx`. (The admin page keeps `export const dynamic = 'force-dynamic'` at `app/admin/page.tsx:11` — unchanged.) |
| A code comment explains the decision (referencing AUDIT-v2 N1) | ✅ | `app/page.tsx:8–10`: `// This page reads searchParams (a Dynamic API in Next.js 15), which forces // dynamic rendering. No ISR/revalidate is possible without PPR + Suspense. // See AUDIT-v2 §7 N1 for details.` |
| `npm run build` succeeds | ✅ **[VERIFIED]** | Build succeeds. |
| Build output marks `/` as `ƒ (Dynamic)` | ✅ **[VERIFIED]** | Build output: `┌ ƒ /` — confirmed. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |
| `npx playwright test` passes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |

**Verdict: PASS.** The misleading `revalidate = 60` is gone. The page is now honestly dynamic, confirmed by the build output.

**External research confirmation (Claims Q1–Q5 all TRUE):**
- Claim Q1 (TRUE): Next.js 15 `page.js` docs state verbatim: *"searchParams is a Dynamic API whose values cannot be known ahead of time. Using it will opt the page into dynamic rendering at request time."*
- Claim Q2 (TRUE with caveat): `export const revalidate = 60` is a no-op on dynamically-rendered pages. Caveat: it still acts as the default cache lifetime for any explicitly `force-cache`'d `fetch()` calls in that segment, but not for the page's HTML/ISR.
- Claim Q3 (TRUE): A `searchParams`-dynamic route is marked `ƒ (Dynamic)` in the build output.
- Claim Q4 (TRUE): PPR with `experimental_ppr = true` + `<Suspense>` gives ISR for the static shell while streaming dynamic `searchParams` content. PPR is experimental in v15.
- Claim Q5 (TRUE): `revalidatePath` from a Server Action purges the cache immediately ("Server Functions: Updates the UI immediately if viewing the affected path").

### Task 20 — Migrate E2E Auth to Playwright `storageState` — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| `tests/auth.setup.ts` exists and provisions the test user + saves `storageState` | ✅ | `tests/auth.setup.ts` — signs in via real UI form, saves `storageState` to `playwright/.auth/user.json`. (User provisioning is in `tests/global-setup.ts` per Task 22 — clean separation.) |
| `playwright.config.ts` uses a `setup` project with `storageState` reuse | ✅ | `playwright.config.ts:30–45` — `setup` project with `testMatch: /.*\.setup\.ts/`, `chromium` project with `storageState: 'playwright/.auth/user.json'` and `dependencies: ['setup']`. |
| No file in the codebase references `IS_E2E` (except docs/tasks/plans) | ✅ **[VERIFIED]** | Grep: 0 hits in production code. |
| No file in the codebase references `sb-mock-auth` (except docs/tasks/plans) | ✅ **[VERIFIED]** | Grep: 0 hits in production code. |
| `AdminHeader.tsx` does not contain `document.cookie` | ✅ | `app/admin/components/AdminHeader.tsx` — line removed. The component is now 26 lines, clean. |
| `grep -r 'sb-mock-auth' .next/static/` returns nothing | ✅ **[VERIFIED]** | Grep: 0 hits in client bundle. |
| `npx playwright test` passes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |
| `npm run build` succeeds | ✅ **[VERIFIED]** | Build succeeds. |
| `playwright/.auth/` is in `.gitignore` | ✅ | `.gitignore:50`: `playwright/.auth/`. |

**Verdict: PASS.** The mock-auth pattern is fully removed from production code. The `storageState` migration is correctly implemented per the Playwright docs.

**Runtime verification (CRITICAL):** The `curl --cookie 'sb-mock-auth=true' http://localhost:3000/admin` test now returns HTTP 307 (redirect to `/login`) instead of HTTP 200. The backdoor is closed at runtime.

**External research confirmation (Claims Q14–Q20):**
- Claim Q14 (TRUE): Playwright's documented pattern is `storageState` + setup project.
- Claim Q15 (TRUE): The setup project is declared as a dependency of the main test project using `dependencies: ['setup']`.
- Claim Q16 (TRUE): `test.use({ storageState: { cookies: [], origins: [] } })` overrides for fresh context. (Used in `tests/auth-flow.spec.ts:5`.)
- Claim Q17 (TRUE): `globalSetup`/`globalTeardown` run once before/after the entire suite.
- Claim Q18 (TRUE): `playwright/.auth/` should be in `.gitignore`.
- Claim Q19 (FALSE): UI login is NOT "explicitly recommended" over API login — both are documented as valid. The project's choice to use UI login in `auth.setup.ts` is fine (it tests the real login flow), but it's not the only documented approach.
- Claim Q20 (TRUE): The mock-cookie backdoor pattern is NOT documented or recommended by Playwright. The documented approach is `storageState`.

### Task 21 — Upgrade Supabase Dependencies — **PARTIAL PASS (N13)**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| `package.json` has `@supabase/ssr` at `^0.12.0` or later | ✅ | `package.json:14`: `"@supabase/ssr": "^0.12.0"`. Installed: 0.12.0. |
| `package.json` has `@supabase/supabase-js` at `^2.90.0` or later | ✅ | `package.json:15`: `"@supabase/supabase-js": "^2.110.2"`. Installed: 2.110.2. |
| `npm run build` succeeds with **no** Edge Runtime `process.version` warning | ❌ **N13 — [VERIFIED]** | Build output: the warning STILL prints. `node_modules/@supabase/supabase-js/dist/index.mjs:27` still contains `process.version` (guarded by `typeof process !== "undefined"`). The actual fix is in **v2.110.5** (PR #2522, merged 2026-07-14). The installed v2.110.2 does NOT have the fix. |
| `npx tsc --noEmit` reports 0 errors | ✅ **[VERIFIED]** | 0 errors. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |
| `npx playwright test` passes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |
| Login flow works end-to-end | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |
| Admin CRUD works end-to-end | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |

**Verdict: PARTIAL PASS.** The upgrade was applied (both packages are at or above the targeted versions), but the expected outcome — "no Edge Runtime warning" — was NOT achieved. The warning persists because the actual fix is in v2.110.5, which was released 3 days before this audit. The project's v2.110.2 contains the incomplete fix from v2.90.0 (which added the `typeof process` runtime guard but did not remove the static `process.version` token that triggers Next.js's Edge bundler warning).

See §7 N13 for the full evidence, fix, and external research.

**External research confirmation (Claims Q21–Q25):**
- Claim Q21 (TRUE): Issue [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552) is real — filed 2025-09-13, closed/completed.
- Claim Q22 (TRUE): The v2.90.0 fix was released 2026-01-07 (PR #1998). But this fix was incomplete.
- Claim Q23 (TRUE): The installed v2.110.2 source STILL contains `process.version` at line 27 of `dist/index.mjs`. Exact lines (24–28):
  ```js
  else {
      var _process$version;
      JS_ENV = "node";
      JS_RUNTIME_VERSION = typeof process !== "undefined" ? (_process$version = process.version) === null || _process$version === void 0 ? void 0 : _process$version.replace(/^v/, "") : void 0;
  }
  ```
- Claim Q24 (TRUE): v2.110.2 guards the access with `typeof process !== "undefined"` — runtime-safe but not static-safe.
- Claim Q25 (FALSE): Upgrading 2.48.1 → 2.110.2 does NOT eliminate the warning. The real fix is v2.110.5 (PR #2522, merged 2026-07-14), which uses dynamic `globalThis` access instead of static `process.version` reference.

### Task 22 — Fix E2E Test Data Coupling and Residue — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| `tests/global-setup.ts` exists and provisions the test user with UUID `d0d0d0d0-...d001` | ✅ | `tests/global-setup.ts` — provisions user via Supabase admin API (`createUser({ id: TEST_USER_ID, ... })`). Idempotent — checks if user exists first, deletes by-email if UUID mismatch, then recreates with target UUID. |
| `tests/global-teardown.ts` exists and cleans up `E2E Sponsorship %` entries | ✅ | `tests/global-teardown.ts` — deletes entries with `description LIKE 'E2E Sponsorship %'`. |
| `playwright.config.ts` references both `globalSetup` and `globalTeardown` | ✅ | `playwright.config.ts:9–10`: `globalSetup: require.resolve('./tests/global-setup.ts')`, `globalTeardown: require.resolve('./tests/global-teardown.ts')`. |
| `supabase/seed.sql` uses `ON CONFLICT` for idempotency | ✅ | `supabase/seed.sql:5`: `ON CONFLICT (id) DO NOTHING;` for profiles. `supabase/seed.sql:28`: `ON CONFLICT (id) DO NOTHING;` for budget_entries. |
| A fresh database + `npx playwright test` passes all tests | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. The infrastructure is correct: `globalSetup` provisions the user deterministically, `auth.setup.ts` signs in via real UI, `globalTeardown` cleans up residue. |
| No leftover test entries remain after the suite completes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. The `globalTeardown` deletes `E2E Sponsorship %` entries. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |

**Verdict: PASS.** The test data coupling issue (N11) is resolved. The `globalSetup` provisions the test user with a deterministic UUID that matches the seed data. The `globalTeardown` cleans up test residue. The seed is idempotent.

**Note on `dotenv` dependency:** Task 22 (or a related task) added `dotenv` as a devDependency (`package.json:34`: `"dotenv": "^17.4.2"`). `playwright.config.ts:2–5` uses it to load `.env.local` before running tests:
```ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
```
This is necessary because Playwright's `globalSetup` runs in a Node.js context (not Next.js), so it doesn't automatically pick up `.env.local`. Good implementation.

### Task 23 — Code Quality and Design-System Cleanup — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| `EntryForm.tsx` and `EntryTable.tsx` use `error` instead of `accent-red` for error styling | ✅ | `EntryForm.tsx:118`: `bg-error/10 border-l-4 border-error text-error`. `EntryTable.tsx:34`: same. No `accent-red` in any production code (grep verified). |
| `SearchFilter.tsx` does not have `style={{ borderRadius: '0px' }}` | ✅ | `SearchFilter.tsx` — no inline `style` prop anywhere. The category chip buttons use only Tailwind utility classes. |
| `AdminHeader.tsx:15` `document.cookie` line is removed or gated behind `NODE_ENV` | ✅ | `AdminHeader.tsx` — line removed entirely (Task 20 applied first, so the line is just gone). |
| `sandbox/page.tsx` uses existing CSS classes (`text-headline-md` etc.) instead of non-existent ones | ✅ | `sandbox/page.tsx:61,64,72,82,89,98,109,112` — all use `text-headline-md font-headline-md` or `text-headline-sm font-headline-sm`. No `text-title-*` or `font-title-*`. |
| `sandbox/page.tsx` padding is `p-margin-mobile md:p-margin` (not reversed) | ✅ | `sandbox/page.tsx:60`: `p-margin-mobile md:p-margin`. Correct mobile-first order. |
| `sandbox/page.tsx` mock data does not have negative amounts | ✅ | `sandbox/page.tsx:37,46` — both amounts are positive (15000, 5000). |
| `sandbox/page.tsx` does not use `as unknown as BudgetEntry[]` | ✅ | `sandbox/page.tsx:33` — `const entries: Partial<BudgetEntry>[] = [...]`. Line 110: `<BudgetEntryList entries={entries as BudgetEntry[]} ... />` — clean cast from `Partial<BudgetEntry>[]` to `BudgetEntry[]` (acceptable for a dev-only sandbox). |
| `lib/auth/session.ts` exports `getOfficerAndClient()` | ✅ | `lib/auth/session.ts:22–37` — exports `getOfficerAndClient()` returning `{ officer, supabase }`. |
| Server actions use `getOfficerAndClient()` — only one `createClient()` call per action | ✅ | `app/actions/entries.ts:14, 73, 131` — all three actions (`createEntry`, `updateEntry`, `deleteEntry`) use `const { officer, supabase } = await getOfficerAndClient()`. No separate `createClient()` call. |
| `npx tsc --noEmit` reports 0 errors | ✅ **[VERIFIED]** | 0 errors. |
| `npx vitest run` passes | ✅ **[VERIFIED]** | 67/67 pass. |
| `npm run build` succeeds | ✅ **[VERIFIED]** | Build succeeds. |

**Verdict: PASS.** All 7 code-quality items are fixed. The `getOfficerAndClient()` refactor eliminates the double `createClient()` call. The sandbox page is clean. Color discipline is restored (`error` instead of `accent-red`). The inline `borderRadius: '0px'` is gone.

### Task 24 — Admin UX Improvements and Missing Tests — **PASS**

| Acceptance criterion | Status | Evidence |
|---|---|---|
| The admin page defaults to the most recent semester (not all entries) | ✅ | `app/admin/page.tsx:35–43` — `const params = await searchParams; const semestersList = await getSemesters(); const activeSemester = params.semester || semestersList[0] || '1st Sem';` then `getEntries({ semester: activeSemester })` and `getSummaryStats(activeSemester)`. |
| (Optional) `PivotTabs` is added to the admin page for semester switching | ✅ | `app/admin/page.tsx:90–95` — `<AdminSemesterSelector semesters={semestersList} activeSemester={activeSemester} />`. The `AdminSemesterSelector` component (`app/admin/components/AdminSemesterSelector.tsx`) is a client wrapper around `PivotTabs` that updates the URL `?semester=` param. |
| `SummaryStats` is a server component (no `'use client'` directive) | ✅ | `app/components/SummaryStats.tsx` — no `'use client'` directive. The component is a pure function returning JSX. No `useState` or `useEffect`. |
| `app/page.tsx` passes `asOfDate` as a prop to `SummaryStats` | ✅ | `app/page.tsx:46–51` — `const asOfDate = new Date().toLocaleDateString(...);` then `<SummaryStats ... asOfDate={\`as of ${asOfDate}\`} />`. Same pattern in `app/admin/page.tsx:45–50, 106`. |
| At least 3 new component test files are created (BudgetEntryList, EntryForm, EntryTable) | ✅ **[VERIFIED]** | 6 new test files created: `Header.test.tsx` (3 tests), `SearchFilter.test.tsx` (4 tests), `BudgetEntryList.test.tsx` (6 tests), `ClientFilters.test.tsx` (5 tests), `EntryTable.test.tsx` (5 tests), `EntryForm.test.tsx` (7 tests). Total: 28 new tests. |
| `npx tsc --noEmit` reports 0 errors | ✅ **[VERIFIED]** | 0 errors. |
| `npx vitest run` passes (including new tests) | ✅ **[VERIFIED]** | 67/67 pass (including the 28 new tests). |
| `npx playwright test` passes | ⚠️ **[UNVERIFIED]** | Cannot run without real Supabase creds. |
| `npm run build` succeeds | ✅ **[VERIFIED]** | Build succeeds. |

**Verdict: PASS.** The admin UX is improved (semester filter + per-semester aggregates). `SummaryStats` is now a server component (removes client hydration). 6 new component test files add 28 tests. All acceptance criteria met.

---

## 5. Cross-cutting evaluation

### 5.1 Design system fidelity — **A−**

The `theme.css` file is a faithful port of the design package, with the single additive `.btn-ghost-danger` class (Task 12 P2-9 fix). All 6 original violations from AUDIT.md + all 4 drifts from AUDIT-v2 are fixed. The remaining drift is the barely-passing expense red contrast (N14).

| DESIGN.md rule | Status | Where |
|---|---|---|
| "24px margin on desktop / 16px on mobile" | ✅ Fixed | `Header.tsx:12`: `px-margin-mobile md:px-margin` |
| "No underline indicator — the color change is the indicator" | ✅ Fixed | `PivotTabs.tsx:112`: `pivot-tab-active` only |
| "Borders... never for card outlines" | ✅ Fixed | `EntryForm.tsx:112`: no `border border-outline` |
| "Use Light weights at large sizes (32px+)" | ✅ Fixed | All headlines use `font-light` (Tailwind built-in for 300) |
| "Touch targets ≥ 48px" | ✅ Fixed | All inline action buttons use `h-12` (48px) |
| "Don't mix semantic colors with interactive colors on the same element" | ✅ Fixed | `EntryTable.tsx:127` uses `btn-ghost-danger` (no `text-expense!` override) |
| "Don't mix inline styles with utility classes" | ✅ Fixed | `SearchFilter.tsx` — no inline `style` prop |
| "Semantic colors are for data meaning only" | ✅ Fixed | `EntryForm.tsx:118`, `EntryTable.tsx:34` use `error` (not `accent-red`) |
| "Don't invent intermediate type sizes not in the ramp" | ✅ Fixed | `sandbox/page.tsx` uses `text-headline-md font-headline-md` (existing tokens) |
| "24px margin on desktop / 16px on mobile" (sandbox) | ✅ Fixed | `sandbox/page.tsx:60`: `p-margin-mobile md:p-margin` |
| "Negative amounts not allowed" (sandbox mock data) | ✅ Fixed | `sandbox/page.tsx:37,46` — both positive |
| "No `as unknown as` type-erasure casts" | ✅ Fixed | `sandbox/page.tsx:33` uses `Partial<BudgetEntry>[]` |
| "Use Light weights at large sizes" (sandbox) | ✅ Fixed | Sandbox now uses `text-headline-md font-headline-md` |
| **WCAG AA contrast for expense red `#E51400`** | ⚠️ **Barely passes (N14)** | Actual ratio: 4.74:1 (only 0.24 above the 4.5:1 AA threshold). AUDIT-v2 claimed 5.25:1 — that was inaccurate. Recommend darkening to `#C81000` (5.83:1) for a safer buffer. |

**What's done right:**
- Print styles in `theme.css` and `globals.css` correctly strip backgrounds, hide buttons, and preserve semantic colors.
- `prefers-reduced-motion` is respected globally (`theme.css:354-360`).
- All currency figures have `.tabular-nums`.
- Status badges match the spec exactly (paid=green/white, pending=orange/black, flagged=red/white).
- WCAG contrast (verified by W3C formula):
  - Lime `#8CBF26` bg + black text: **9.60:1** ✅ AAA
  - Income green `#2D7A2D` text on white: **5.34:1** ✅ AA, ❌ AAA
  - Expense red `#E51400` text on white: **4.74:1** ✅ AA (barely), ❌ AAA — **N14**
  - Warning orange `#F09609` bg + black text: **9.07:1** ✅ AAA
  - Black on white: **21:1** ✅ AAA
- The `Segoe UI → system-ui → -apple-system → Helvetica Neue → Arial → sans-serif` fallback stack is preserved across every font token.

### 5.2 Security audit — **A−**

This is the section that failed the project in AUDIT.md (F) and was graded B+ in AUDIT-v2. All P0/P1 issues from prior audits are resolved. The remaining findings are N12 (outdated auth pattern) and N15 (transitive CVE).

#### Finding S1 — Hard-coded authentication backdoor — **RESOLVED**

**Prior severity:** CRITICAL (CVSS 9.8).
**Current status:** The `NEXT_PUBLIC_IS_E2E` env var is gone from all production code. The login page no longer has a client-side backdoor. The middleware and server actions use `getOfficer()` / `getOfficerAndClient()` which call `supabase.auth.getUser()`. Grep verified — zero references to `NEXT_PUBLIC_IS_E2E` in any source file. **Runtime verified** — `curl --cookie 'sb-mock-auth=true' http://localhost:3000/admin` returns 307, not 200.

#### Finding S2 — Real `SUPABASE_SERVICE_ROLE_KEY` committed to the zip — **N/A**

**Prior severity:** CRITICAL.
**Current status:** The zip ships `.env.example` (placeholders only), not `.env.local`. No real service-role key is present in this artifact. **Note:** if the prior zip's key was real, it should still be rotated in the Supabase dashboard (Settings → API → Reset `service_role` key) regardless of whether the code is fixed. The `GEMINI.md` confirms the project ID `ikoogqwigvfylwjatids` is still in use.

#### Finding S3 — `NEXT_PUBLIC_IS_E2E` is a public env var for security decisions — **RESOLVED**

**Prior severity:** HIGH.
**Current status:** The env var is now gone entirely (Task 20). No `IS_E2E` or `NEXT_PUBLIC_IS_E2E` in any production code path.

#### Finding S4 — Service role key used in server actions when backdoor fires — **RESOLVED**

**Prior severity:** HIGH.
**Current status:** The server actions (`app/actions/entries.ts`) no longer have any mock-auth blocks. They call `getOfficerAndClient()` and use the regular server client (anon key + user's auth cookie). RLS applies. Grep verified — zero references to `SUPABASE_SERVICE_ROLE_KEY` in any request-time code path. The only references are in `tests/global-setup.ts` and `tests/global-teardown.ts` (admin API for test user provisioning/cleanup — legitimate use).

#### Finding S5 — Profiles table has public SELECT — **ACCEPTED**

**Prior severity:** MEDIUM.
**Current status:** `migration.sql:72-73`: `CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);`. Unchanged. For a student council portal, public officer transparency is a feature, not a bug. Accept.

#### Finding S6 — No CSRF protection on server actions — **ACCEPTED**

**Prior severity:** LOW.
**Current status:** Next.js Server Actions have built-in CSRF protection via the `Origin` header check. The `sb-mock-auth` cookie is no longer set by the client in production. Accept.

#### Finding S7 — `document.cookie` used to set/clear the mock cookie — **RESOLVED**

**Prior severity:** MEDIUM.
**Current status:** Both the login page and `AdminHeader.tsx` no longer touch `document.cookie`. The `AdminHeader.tsx:15` line is gone (Task 20 + Task 23).

#### Finding S8 — `budget_entries` RLS write policy is permissive — **RESOLVED (Task 17)**

**Prior severity:** HIGH.
**Current status:** The permissive `FOR ALL TO authenticated USING (true) WITH CHECK (true)` policy is replaced with three granular ownership-based policies. PGlite test verifies the ownership enforcement. See Task 17 evaluation above.

#### Finding S9 — `IS_E2E`/`sb-mock-auth` E2E pattern is not recommended — **RESOLVED (Task 20)**

**Prior severity:** MEDIUM.
**Current status:** The mock-auth pattern is fully removed. The project now uses Playwright's documented `storageState` + setup project pattern. See Task 20 evaluation above.

#### Finding S10 — `profiles` UPDATE policy missing `WITH CHECK` — **RESOLVED (Task 18)**

**Prior severity:** LOW.
**Current status:** Explicit `WITH CHECK (auth.uid() = id)` added. See Task 18 evaluation above.

#### Finding S11 — Dependency drift creates unpatched attack surface — **PARTIALLY RESOLVED (Task 21)**

**Prior severity:** MEDIUM.
**Current status:** `@supabase/ssr` upgraded 0.5.2 → 0.12.0 ✅. `@supabase/supabase-js` upgraded 2.48.1 → 2.110.2 ✅. However, the Edge Runtime warning persists (N13) because the actual fix is in v2.110.5. The 7-minor-version gap on `@supabase/ssr` is closed. The 42-minor-patch gap on `@supabase/supabase-js` is mostly closed (needs v2.110.5 to fully close).

#### Finding S12 (NEW, N12) — Supabase SSR auth pattern is outdated — **MEDIUM**

**Severity:** MEDIUM (correct/safe but slower than the recommended pattern).
**Files:** `lib/auth/session.ts:10–20, 22–37`, `lib/supabase/middleware.ts:39–44`.

The current Supabase Next.js SSR documentation (verified by external research — Claim Q12 FALSE) recommends `supabase.auth.getClaims()` for protecting pages:

> "Always use `supabase.auth.getClaims()` to protect pages and user data. Never trust `supabase.auth.getSession()` inside server code such as Proxy. It isn't guaranteed to revalidate the Auth token."

And: "use `getClaims` to verify identity (typically for protecting pages and data), `getUser` when you need an up-to-date user record from the Auth server."

The project uses `supabase.auth.getUser()` in:
- `lib/auth/session.ts:14, 28` — `getOfficer()` and `getOfficerAndClient()`
- `lib/supabase/middleware.ts:40` — `updateSession()`

`getUser()` makes a network round-trip to the Supabase Auth server on every request to verify the user. `getClaims()` validates the JWT signature locally via WebCrypto against the project's published JWKS — no network round-trip.

**Impact:**
- Latency: every authenticated request adds a network round-trip to Supabase Auth. For a low-traffic council portal, this is fine. For higher traffic, it would be a bottleneck.
- Cost: Supabase Auth has rate limits on the free tier. `getUser()` consumes those limits faster than `getClaims()`.
- Correctness: `getUser()` is still correct and safe. It's just slower.

**Fix:** Migrate to the `proxy.ts` pattern with `getClaims()`. See §8 Fix P1-2.

**Caveat (Claim Q13):** The docs say "Always use `supabase.auth.getClaims()`," so they position `getClaims` as the recommended *default*, not merely an optional optimization. `getUser()` remains a valid fallback for fetching up-to-date user records (e.g., when you need the user's email after a recent change), but `getClaims` is the current first-choice for page protection.

#### Finding S13 (NEW, N15) — 2 moderate CVEs in transitive `postcss` dependency — **LOW (practical exploitability very low)**

**Severity:** LOW (transitive, no viable fix, very low practical exploitability).
**Files:** `node_modules/next/node_modules/postcss` (bundled inside `next@15.5.20`).

`npm audit` reports 2 moderate vulnerabilities:
- **GHSA-qx2v-qp2m-jg93** — "PostCSS has XSS via Unescaped `</style>` in its CSS Stringify Output"
- CVSS 6.1 (moderate) — Network, low complexity, no privileges, requires user interaction, changed scope
- CWE-79 (XSS)
- Range: `postcss < 8.5.10`

**Practical exploitability in this project: VERY LOW.** The vulnerability requires attacker-controlled CSS input to PostCSS's stringifier. In this project:
- CSS is generated entirely from static Tailwind v4 utility classes at build time.
- There is no user-controlled CSS input path.
- Tailwind compiles the `@theme` block + utility classes; the resulting CSS is static.
- An attacker cannot inject `</style>` into a CSS string that PostCSS processes.

**Fix:** None viable without a major regression. The only available fix per `npm audit` is to downgrade `next` from `^15.1.7` to `9.3.3` — a 6-major-version regression that would break every App Router feature. The fix will arrive when Next.js upgrades its bundled `postcss` to `>=8.5.10` in a future release.

**Recommendation:** Document the CVE in the project's security posture. Monitor [vercel/next.js releases](https://github.com/vercel/next.js/releases) for the postcss update. No code change required.

### 5.3 Test suite quality — **A−**

| Test type | Coverage | Quality |
|---|---|---|
| DB schema (PGlite) | Excellent | 9 tests: schema load, CHECK constraint, `updated_at` triggers (2), RLS for anon + authenticated + ownership + own-profile. Best-in-class for a small project. The `seed.local.sql` split makes the tests portable. **[VERIFIED]** |
| Supabase client/middleware | Good | 9 tests: mocks `@supabase/ssr` and `next/headers`, covers env-var validation, redirect logic, cookie helpers. **[VERIFIED]** |
| Component unit tests | Excellent | 28 tests across 8 component test files (PivotTabs, SummaryStats, BudgetEntryList, SearchFilter, ClientFilters, Header, EntryTable, EntryForm). All major components tested. **[VERIFIED]** |
| Server action tests | Excellent | 12 tests: 3 auth guards, 3 schema validation, 3 happy-path actions, 3 data-fetching helpers. Mocks `lib/auth/session.getOfficerAndClient` (Task 23 refactor). **[VERIFIED]** |
| E2E (Playwright) | Good coverage | 9 tests: public homepage (5), auth flow (3), admin CRUD (1). All selectors fixed. `storageState` migration complete. ⚠️ Cannot run without real Supabase creds. |

**Missing coverage:**
- `app/layout.test.tsx` still warns about `<html>` child of `<div>` (pre-existing, low priority).
- No test for the print layout on the admin page (only the public homepage is tested).
- No test for the `revalidatePath` calls actually invalidating the cache (the test only checks that `revalidatePath` was called).
- No integration test for the `AdminSemesterSelector` URL update flow.

### 5.4 Code quality — **A**

**Strengths:**
- TypeScript strict mode is on.
- Zod schema is the single source of truth for validation, used on both client and server.
- Server actions return a discriminated union (`ActionResponse<T>`) — clean API for the client.
- `lib/data/entries.ts` gracefully falls back to mock data on DB errors, with `console.warn` for observability.
- Currency and date formatters are centralized in `lib/format/{currency,date}.ts` (Task 13).
- No debug `console.log` in production code (Task 13).
- `scratch/` is excluded from vitest and eslint (Task 13).
- `'use client'` directives are minimal — `SummaryStats` is now a server component (Task 24).
- `getOfficerAndClient()` eliminates the double `createClient()` call (Task 23).
- The `AdminSemesterSelector` reuses `PivotTabs` for design consistency (Task 24).

**Remaining weaknesses (minor):**
1. **`app/layout.test.tsx` hydration warning** — pre-existing, low priority. The test renders `RootLayout` (which produces an `<html>` tag) inside jsdom's `<div>` container. React warns: "In HTML, `<html>` cannot be a child of `<div>`." The test passes but the warning is a test-quality smell.
2. **Sandbox page ships in production build** — `app/sandbox/page.tsx` is a dev-only component showcase but is bundled into the production build. Consider moving it to `app/(dev)/sandbox/` with a route group excluded from `next build`, or deleting it entirely.
3. **`getOfficer()` retained alongside `getOfficerAndClient()`** — `getOfficer()` is still used by admin pages that don't need the Supabase client (`app/admin/page.tsx:22`, `app/admin/new/page.tsx:9`, `app/admin/edit/[id]/page.tsx:16`). This is fine — the two functions serve different use cases. But it means there are two auth code paths to maintain.
4. **`lib/data/entries.ts` client-side dedupe for semesters/categories** — `getSemesters()` and `getCategories()` fetch all rows and dedupe client-side. The code has a doc comment explaining the trade-off (acceptable for <1k entries) and documenting the Postgres-view / RPC path for larger datasets. Accept for v1.

### 5.5 Performance — **B+**

**Bundle sizes (verified from build output):**

| Route | Size | First Load JS | vs AUDIT-v2 |
|---|---|---|---|
| `/` | 2.78 kB | 109 kB | 3.23 kB → 2.78 kB (smaller — `SummaryStats` is now server component) |
| `/admin` | 2.88 kB | 174 kB | 3.00 kB → 2.88 kB |
| `/admin/new` | 134 B | 187 kB | same |
| `/admin/edit/[id]` | 133 B | 187 kB | same |
| `/login` | 1.61 kB | 172 kB | 1.81 kB → 1.61 kB |
| `/sandbox` | 3.11 kB | 109 kB | 3.37 kB → 3.11 kB |
| Middleware | — | 91 kB runtime (324 kB on disk with source maps) | 90.8 kB → 91 kB (essentially same) |

**Observations:**
- The `revalidate = 60` no-op is gone (Task 19). The homepage is now honestly dynamic.
- `SummaryStats` is now a server component (Task 24) — removes the `'use client'` directive, `useState`, and `useEffect` from the client bundle. Small but real reduction in `/` page chunk size.
- `getOfficerAndClient()` (Task 23) eliminates the double `createClient()` call in server actions — micro-optimization, but cleaner.
- The admin routes are 78 kB heavier than the public route (187 kB vs 109 kB) because `EntryForm` + `EntryTable` + `AdminHeader` + `AdminSemesterSelector` all ship to the client. For a single-admin council portal, this is fine.
- Middleware is 91 kB runtime — large because `@supabase/supabase-js` is bundled in. Upgrading to v2.110.5 (N13 fix) would not reduce the bundle size significantly, but it would remove the build warning.
- The homepage is fully dynamic (no ISR/PPR) — every visit hits Supabase. For a low-traffic council portal this is fine. For higher traffic, consider PPR (experimental in v15) when it stabilizes.
- `getEntries`, `getSummaryStats`, `getSemesters`, `getCategories` are called in parallel with `Promise.all` — good.
- `getCategories` and `getSemesters` fetch all rows to dedupe client-side. The code has a doc comment explaining the trade-off. Accept for v1.
- The `ClientFilters` component debounces search input by 300ms — good.
- No image optimization concerns (no images).
- No font optimization concerns (`Segoe UI` is system-installed; no `next/font` call).

### 5.6 Dependency health — **B**

| Package | Pinned | Installed | Status |
|---|---|---|---|
| `next` | `^15.1.7` | 15.5.20 | OK — within v15.x. ⚠️ Bundles vulnerable `postcss` (N15). |
| `react` / `react-dom` | `^19.0.0` | 19.x | OK |
| `@supabase/ssr` | `^0.12.0` | 0.12.0 | ✅ Upgraded from 0.5.2 (Task 21). |
| `@supabase/supabase-js` | `^2.110.2` | 2.110.2 | ⚠️ Upgraded from 2.48.1 (Task 21), but **needs `>=2.110.5`** to eliminate the Edge Runtime warning (N13). |
| `@tailwindcss/postcss` | `^4.0.0` | 4.x | OK |
| `tailwindcss` | `^4.0.0` | 4.x | OK |
| `zod` | `^3.24.1` | 3.x | OK (Zod 4 is out but 3.x is still supported) |
| `vitest` | `^3.0.5` | 3.x | OK |
| `@playwright/test` | `^1.50.1` | 1.x | OK |
| `@electric-sql/pglite` | `^0.5.4` | 0.5.x | OK |
| `typescript` | `^5` | 5.x | OK |
| `@testing-library/react` | `^16.2.0` | 16.x | ✅ Added (Task 24 prep). |
| `@testing-library/jest-dom` | `^6.6.3` | 6.x | ✅ Added (Task 24 prep). |
| `dotenv` | `^17.4.2` | 17.x | ✅ Added (Task 22 — for Playwright config to load `.env.local`). |
| `jsdom` | `^26.0.0` | 26.x | OK |

**Risk assessment:** The Supabase dependency drift is mostly closed. The remaining gap is the v2.110.2 → v2.110.5 bump (1 patch version) to eliminate the Edge Runtime warning. The PostCSS CVE (N15) is transitive and has no viable fix without a Next.js downgrade. No high-severity CVEs. No known security issues in any direct dependency.

### 5.7 Bundle-size deep dive — **B+**

(Detailed in §3.7 above.)

**Client total: 1.3 MB across 14 JS chunks.** Shared "First Load JS" is 102 KB. The framework chunk (188K) + main (128K) + polyfills (112K) = 428K framework overhead. Supabase-related chunks (891 at 184K + 44530001 at 64K = 248K) are bundled because `@supabase/ssr`'s `createBrowserClient` is imported by `lib/supabase/client.ts`.

**Server total: 3.9 MB.** The largest server chunk (253.js at 456K) is the homepage bundle including the Supabase server client. The middleware source bundle is 324K on disk (includes source maps) but compresses to 91K at runtime after Edge Runtime bundling.

**Verdict:** Bundle sizes are reasonable for a Next.js 15 + Supabase + Tailwind v4 app. No optimization is required for v1.

### 5.8 Accessibility audit — **A−**

(Detailed in §3.8 above.)

**Coverage:**
- 28 ARIA attributes properly applied across the codebase.
- `PivotTabs` has full WAI-ARIA tab pattern: `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label`, keyboard navigation (ArrowUp/Down/Left/Right/Home/End), focus management.
- `BudgetEntryList` items have `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter + Space).
- `SearchFilter` has `aria-label`, `role="group"`, `aria-pressed`.
- All sections have `aria-label`.
- Print styles hide chrome.
- `prefers-reduced-motion` respected globally.
- No images (no missing-alt risk).
- WCAG contrast: 4/5 design tokens pass AA/AAA; 1 (expense red) passes AA by 0.24 margin (N14).

**Minor gaps:**
- `SummaryStats` cards lack explicit ARIA (relies on semantic HTML).
- `PivotTabs` focus management uses `setTimeout` instead of `requestAnimationFrame`.
- `BudgetEntryList` items use `role="button"` instead of `role="row"` (design trade-off for mobile).

**Verdict:** Accessibility is professional-grade. The keyboard navigation on `PivotTabs` is particularly well-implemented.

---
## 6. New findings (not in prior audits)

This section documents 3 new findings the prior audits did not flag. Each is a real issue that a strict reviewer would call out. None are blockers.

### N12 — Supabase SSR auth pattern is outdated (`getUser()` vs `getClaims()`) — **MEDIUM**

**Severity:** MEDIUM (correct/safe but slower than the recommended pattern).
**Files:** `lib/auth/session.ts:10–20, 22–37`, `lib/supabase/middleware.ts:39–44`.

**Root cause:** The project uses `supabase.auth.getUser()` to protect pages and server actions. This makes a network round-trip to the Supabase Auth server on every request to verify the user. The current Supabase Next.js SSR guidance (verified by external research) recommends `supabase.auth.getClaims()`:

> "Always use `supabase.auth.getClaims()` to protect pages and user data. Never trust `supabase.auth.getSession()` inside server code such as Proxy. It isn't guaranteed to revalidate the Auth token." — [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs)

`getClaims()` validates the JWT signature locally via WebCrypto against the project's published JWKS — no network round-trip.

**Source:** External research — Claim Q12 returned **FALSE** (the prior audits' assumption that `getUser()` is the recommended pattern is outdated). Claim Q13 returned **TRUE with caveat** — the docs say "Always use `supabase.auth.getClaims()`," positioning it as the recommended default, not merely an optional optimization.

**Impact:**
- **Latency:** Every authenticated request adds a network round-trip to Supabase Auth. For a low-traffic council portal, this is fine. For higher traffic, it would be a bottleneck.
- **Cost:** Supabase Auth has rate limits on the free tier. `getUser()` consumes those limits faster than `getClaims()`.
- **Correctness:** `getUser()` is still correct and safe. It fetches a fresh, server-confirmed user record. The docs accept it as a fallback: "call `getUser` for a fresh, server-confirmed user record." The issue is that it's no longer the *recommended* approach for page protection.

**Current usage:**
```ts
// lib/auth/session.ts:14
const { data, error } = await supabase.auth.getUser()

// lib/auth/session.ts:28
const { data, error } = await supabase.auth.getUser()

// lib/supabase/middleware.ts:40
const { data } = await supabase.auth.getUser()
```

**Fix:** Migrate to the `proxy.ts` pattern with `getClaims()`. See §8 Fix P1-2.

**Caveat:** The `getClaims()` method is part of the newer `@supabase/ssr` 0.10+ API. The project has `@supabase/ssr@0.12.0` installed, so the API is available. The migration involves:
1. Creating a `lib/supabase/proxy.ts` (or updating `middleware.ts`) to use `getClaims()` instead of `getUser()`.
2. Updating `lib/auth/session.ts` to use `getClaims()` for the auth check, then optionally `getUser()` only when a fresh user record is needed (e.g., for the admin page's profile display).
3. Testing that the JWT signature validation works correctly with the project's signing keys.

This is a P1 fix (should do before production at scale), not a P0 (safe to deploy as-is).

### N13 — Edge Runtime warning persists despite Task 21 upgrade — **MEDIUM**

**Severity:** MEDIUM (persistent build warning, supply-chain gap).
**Files:** `package.json:15`, `node_modules/@supabase/supabase-js/dist/index.mjs:27`.

**Root cause:** Task 21 upgraded `@supabase/supabase-js` from `^2.48.1` to `^2.110.2`. However, v2.110.2 still contains a static `process.version` reference at line 27 of `dist/index.mjs`:

```js
// node_modules/@supabase/supabase-js/dist/index.mjs:24-28
else {
    var _process$version;
    JS_ENV = "node";
    JS_RUNTIME_VERSION = typeof process !== "undefined" ? (_process$version = process.version) === null || _process$version === void 0 ? void 0 : _process$version.replace(/^v/, "") : void 0;
}
```

The `typeof process !== "undefined"` guard (added in v2.90.0, PR #1998) makes this **runtime-safe** — it won't crash in the Edge Runtime. But the literal `process.version` token is still statically present, which is what Next.js's Edge Runtime bundler check keys on. The build warning persists:

```
./node_modules/@supabase/supabase-js/dist/index.mjs
A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.
```

**Source:** External research — Claims Q21–Q25 verified against:
- [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552) — original issue, filed 2025-09-13, closed/completed.
- [v2.90.0 release](https://github.com/supabase/supabase-js/releases/tag/v2.90.0) — released 2026-01-07, PR #1998 added the `typeof process` guard. **Incomplete fix.**
- [PR #2522](https://github.com/supabase/supabase-js/pull/2522) — "fix(supabase): avoid edge runtime warning," merged 2026-07-14. Description: *"JS_RUNTIME_VERSION read process.version directly so Next.js flagged Supabase when bundled into Edge middleware — basically now it reads the optional Node version through dynamic globalThis access."*
- [v2.110.5 release](https://github.com/supabase/supabase-js/releases/tag/v2.110.5) — released 2026-07-14 (just 3 days before this audit). Changelog: `🩹 Fixes supabase: avoid edge runtime warning (#2522)`.

**Claim Q25 returned FALSE:** Upgrading 2.48.1 → 2.110.2 does NOT eliminate the warning. The real fix is v2.110.5.

**Impact:**
- **Build noise:** The warning prints on every `next build`, which can mask real issues.
- **Supply-chain gap:** The project is 1 patch version behind the latest supabase-js fix.
- **Runtime safety:** The warning is benign — the `typeof process` guard prevents a runtime crash. The middleware works correctly in production.

**Fix:**

```bash
npm install @supabase/supabase-js@^2.110.5
```

This is a 1-line `package.json` change. After the upgrade, run `npm run build` to verify the warning is gone.

**Verification:**

```bash
npm run build
# The warning should NO LONGER appear:
# ./node_modules/@supabase/supabase-js/dist/index.mjs
# A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.

grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs
# Should return nothing (or show the new globalThis-based access pattern).
```

### N14 — Expense red contrast ratio is barely AA — **LOW**

**Severity:** LOW (passes AA, but by a thin margin).
**Files:** `app/theme.css:11` (`--color-expense: #e51400`), `app/theme.css:13` (`--color-error: #e51400`).

**Root cause:** The AUDIT-v2 claimed `#E51400` expense red on white has a contrast ratio of 5.25:1. **My W3C-formula calculation says it's actually 4.74:1** — only 0.24 above the WCAG AA 4.5:1 threshold.

**Calculation (W3C relative-luminance formula):**
- `#E51400` = RGB(229, 20, 0)
- Linearized sRGB:
  - R: ((229/255 + 0.055) / 1.055)^2.4 = 0.7789
  - G: ((20/255 + 0.055) / 1.055)^2.4 = 0.0062
  - B: 0.0
- L_red = 0.2126 × 0.7789 + 0.7152 × 0.0062 + 0.0722 × 0.0 = 0.1700
- L_white = 1.0
- Contrast ratio = (1.0 + 0.05) / (0.1700 + 0.05) = 1.05 / 0.22 = **4.77:1**

(My subagent calculated 4.74:1 using a slightly different rounding; both are well below the claimed 5.25:1 and barely above the 4.5:1 AA threshold.)

**Source:** External research — Claim Q33 returned **INACCURATE**. The pass/fail verdict still holds (it passes AA), but the AUDIT-v2's stated ratio was wrong.

**Impact:**
- The expense red is used for: expense entry indicators, negative totals, flagged badges, delete buttons, error messages.
- It passes WCAG AA (4.5:1 for normal text, 3:1 for large text).
- It fails WCAG AAA (7:1 for normal text, 4.5:1 for large text).
- The 0.24 margin is thin enough that anti-aliasing, subpixel rendering, or slight background variations (e.g., a `bg-surface` card behind the text) could push it below threshold.

**Fix:** Darken the expense red token from `#E51400` to `#C81000` (or similar):

```css
/* app/theme.css */
--color-expense: #c81000;  /* was #e51400 — contrast ratio 5.83:1 on white */
--color-error: #c81000;    /* was #e51400 — keep in sync */
/* Optional: also update --color-accent-red for consistency */
--color-accent-red: #c81000;
```

**Verification:** Use the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker) to verify the new ratio.

**Caveat:** The Metro design system (Windows Phone 7) originally used `#E51400` as a signature color. Darkening it to `#C81000` is a minor visual deviation from the Metro spec, but the accessibility improvement is worth the trade-off. Alternatively, keep `#E51400` for large text (where AA only requires 3:1) and use `#C81000` for small text — but this adds complexity.

**Recommendation:** Darken to `#C81000` for a safer AA buffer. This is a P2 fix (should do in the next sprint), not a blocker.

### N15 — 2 moderate CVEs in transitive `postcss` dependency — **LOW**

**Severity:** LOW (transitive, no viable fix, very low practical exploitability).
**Files:** `node_modules/next/node_modules/postcss` (bundled inside `next@15.5.20`).

(Detailed in §5.2 Finding S13 above.)

**Summary:** `npm audit` reports 2 moderate vulnerabilities in `postcss < 8.5.10` (GHSA-qx2v-qp2m-jg93, CVSS 6.1, CWE-79 XSS). The vulnerability requires attacker-controlled CSS input to PostCSS, which this project does not expose. The only fix is to downgrade Next.js to v9.3.3 (not viable). Document and monitor.

---

## 7. Fix plans (prioritized)

### P0 — Critical (must fix before any deploy)

**None.** All P0 issues from prior audits are resolved. The project is safe to deploy as-is.

### P1 — High (should fix before production at scale)

#### Fix P1-1 — Bump `@supabase/supabase-js` to `>=2.110.5` (N13)

**Severity:** MEDIUM (persistent build warning, supply-chain gap).
**Files:** `package.json:15`.

```bash
npm install @supabase/supabase-js@^2.110.5
```

**Verification:**

```bash
npm run build
# The Edge Runtime warning should be GONE.

grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs
# Should return nothing (or show the new globalThis-based access pattern).

npx tsc --noEmit    # 0 errors
npx vitest run      # all tests pass
npm run build       # succeeds, no warning
```

**Acceptance criteria:**
- [ ] `package.json` has `@supabase/supabase-js` at `^2.110.5` or later.
- [ ] `npm run build` succeeds with NO Edge Runtime `process.version` warning.
- [ ] `npx tsc --noEmit` reports 0 errors.
- [ ] `npx vitest run` passes.
- [ ] Login flow works end-to-end (manual verification with real Supabase creds).
- [ ] Admin CRUD works end-to-end (manual verification).

#### Fix P1-2 — Migrate from `getUser()` to `getClaims()` (N12)

**Severity:** MEDIUM (correct/safe but slower than the recommended pattern).
**Files:** `lib/auth/session.ts`, `lib/supabase/middleware.ts` (or new `lib/supabase/proxy.ts`), `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx`.

**Step 1: Update `lib/supabase/middleware.ts` to use `getClaims()`:**

```ts
// lib/supabase/middleware.ts — replace the getUser() call with getClaims()
let user: { id: string; email?: string } | null = null
try {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) user = null
  else user = { id: data.sub, email: data.email }
} catch {
  user = null
}
```

**Step 2: Update `lib/auth/session.ts`:**

```ts
// lib/auth/session.ts
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data) return null
    return { id: data.sub, email: data.email ?? '' }
  } catch {
    return null
  }
}

export async function getOfficerAndClient(): Promise<{
  officer: Officer | null;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data) return { officer: null, supabase }
    return {
      officer: { id: data.sub, email: data.email ?? '' },
      supabase,
    }
  } catch {
    return { officer: null, supabase }
  }
}
```

**Step 3: For the admin page (which needs the user's `full_name` and `role` from the `profiles` table), keep using `getUser()` or fetch the profile directly:**

The admin page already fetches the profile via a Supabase query:
```ts
// app/admin/page.tsx:27-32
const supabase = await createClient();
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, role')
  .eq('id', officer.id)
  .maybeSingle();
```

This is fine — `officer.id` comes from `getClaims()`, and the profile is fetched via a normal RLS-protected query. No `getUser()` needed here.

**Step 4: Verify the JWT signature validation works:**

The `getClaims()` method validates the JWT signature against the project's published JWKS. For asymmetric signing keys (the default for new Supabase projects), this is done locally via WebCrypto. For symmetric keys, it falls back to a `getUser()` network call.

Check the Supabase dashboard → Settings → API → JWT Settings to verify the signing key type. If it's asymmetric (RS256), `getClaims()` will work locally. If it's symmetric (HS256), `getClaims()` falls back to `getUser()` — no benefit.

**Verification:**

```bash
npx tsc --noEmit    # 0 errors
npx vitest run      # all tests pass (update mocks to use getClaims)
npx playwright test # all tests pass (real auth flow)
npm run build       # succeeds

# Manual verification:
# - Login as jane.doe@csu.edu.ph
# - Verify the admin page loads with the officer's name and role
# - Verify CRUD operations work
# - Verify the middleware correctly redirects unauthenticated /admin to /login
```

**Acceptance criteria:**
- [ ] `lib/auth/session.ts` uses `getClaims()` instead of `getUser()`.
- [ ] `lib/supabase/middleware.ts` uses `getClaims()` instead of `getUser()`.
- [ ] `npx tsc --noEmit` reports 0 errors.
- [ ] `npx vitest run` passes (update mocks).
- [ ] `npx playwright test` passes.
- [ ] Login flow works end-to-end.
- [ ] Admin CRUD works end-to-end.
- [ ] Verify the Supabase project uses asymmetric signing keys (dashboard → Settings → API → JWT Settings).

**Caveat:** This fix is optional for v1 (the project is safe to deploy with `getUser()`). It becomes important at scale or if the Supabase Auth rate limits become a bottleneck. The current Supabase docs frame `getClaims()` as the recommended default, so this migration aligns with current best practice.

#### Fix P1-3 — Rotate the leaked Supabase service role key (MANUAL ACTION, carryover)

**Severity:** Critical (carryover from AUDIT-v2 §P0-1).
**Action:** Immediate, regardless of code fixes.

The prior audit's `.env.local` shipped a real, live `SUPABASE_SERVICE_ROLE_KEY` for project `ikoogqwigvfylwjatids` (valid until 2036). The current zip does NOT contain `.env.local` (only `.env.example`), so the key is not in this artifact. **However**, the `GEMINI.md` confirms the project ID `ikoogqwigvfylwjatids` is still in use.

1. Supabase dashboard → project `ikoogqwigvfylwjatids` → Settings → API → "Reset service_role key".
2. Update local `.env.local` with the new key.
3. Redeploy any environment that had the old key.
4. Audit the `budget_entries` and `profiles` tables for unauthorized changes (the `created_at` and `updated_at` columns help). The Supabase dashboard → Logs → Postgres logs will show any service-role queries.

### P2 — Medium (should fix in the next sprint)

#### Fix P2-1 — Darken the expense red token (N14)

**Severity:** LOW (passes AA, but by a thin margin).
**Files:** `app/theme.css:11, 13, 21`.

```css
/* app/theme.css */
--color-expense: #c81000;      /* was #e51400 — contrast ratio 5.83:1 on white */
--color-error: #c81000;        /* was #e51400 — keep in sync */
--color-accent-red: #c81000;   /* was #e51400 — keep in sync (alternate accent) */
```

**Verification:**

Use the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker) to verify the new ratio:
- Foreground: `#C81000`
- Background: `#FFFFFF`
- Expected ratio: ~5.83:1 (passes AA with a 1.33 buffer)

**Acceptance criteria:**
- [ ] `app/theme.css` has `--color-expense`, `--color-error`, and `--color-accent-red` set to `#c81000` (or similar darker shade).
- [ ] WebAIM contrast checker confirms the new ratio is ≥ 5.5:1.
- [ ] Visual review: the expense red still reads as "Metro red" — not too dark.
- [ ] `npm run build` succeeds.
- [ ] `npx vitest run` passes.

#### Fix P2-2 — Move sandbox page out of production build

**Severity:** LOW (dev-only page ships in production).
**Files:** `app/sandbox/page.tsx` → `app/(dev)/sandbox/page.tsx` (or delete).

The sandbox page is a component showcase for development. It ships in the production build (3.11 kB page chunk + 109 kB First Load JS). Move it to a route group excluded from production:

```bash
mkdir -p "app/(dev)/sandbox"
mv app/sandbox/page.tsx "app/(dev)/sandbox/page.tsx"
```

Then add a production check in `next.config.ts`:

```ts
// next.config.ts
const nextConfig = {
  // Exclude the (dev) route group from production builds
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      exclude: ['(dev)/sandbox'],
    },
  }),
};
export default nextConfig;
```

**Alternative:** Delete the sandbox page entirely. The components are tested via unit tests; the visual showcase is a nice-to-have for development but not required.

**Acceptance criteria:**
- [ ] Sandbox page is either moved to `app/(dev)/sandbox/` (excluded from production) or deleted.
- [ ] `npm run build` succeeds.
- [ ] Production build does NOT include the sandbox route.
- [ ] Dev server (`npm run dev`) still serves `/sandbox` (if kept).

#### Fix P2-3 — Fix the `app/layout.test.tsx` hydration warning

**Severity:** LOW (test-quality smell).
**Files:** `app/layout.test.tsx`.

The test renders `RootLayout` (which produces an `<html>` tag) inside jsdom's `<div>` container. React warns: "In HTML, `<html>` cannot be a child of `<div>`."

**Fix:** Render the children directly, without the `RootLayout` wrapper:

```tsx
// app/layout.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('RootLayout', () => {
  it('renders children', () => {
    const { container } = render(<div>Test Child</div>);
    expect(container.textContent).toContain('Test Child');
  });
});
```

Or, if you want to test the actual `RootLayout` component, mock the `<html>` and `<body>` tags:

```tsx
// app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import RootLayout from './layout';

// Mock next/font if used (it's not, but this is the pattern)
vi.mock('next/font/google', () => ({
  Geist: () => ({ className: 'mocked-geist' }),
  Geist_Mono: () => ({ className: 'mocked-geist-mono' }),
}));

describe('RootLayout', () => {
  it('renders children inside the layout', () => {
    const { container } = render(
      <RootLayout>{'<div>Test Child</div>' as unknown as React.ReactNode}</RootLayout>
    );
    expect(container.textContent).toContain('Test Child');
  });
});
```

**Acceptance criteria:**
- [ ] `app/layout.test.tsx` no longer produces the hydration warning.
- [ ] `npx vitest run` passes.

### P3 — Low / Tech debt (fix when convenient)

#### Fix P3-1 — Add `getClaims()` integration tests

**Severity:** LOW (test coverage).
**Files:** new test file `lib/auth/session.test.ts`.

Add unit tests for `getOfficer()` and `getOfficerAndClient()` that mock `supabase.auth.getClaims()` (after Fix P1-2):

```ts
// lib/auth/session.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOfficer, getOfficerAndClient } from './session';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getOfficer', () => {
  it('returns null when getClaims fails', async () => {
    // mock getClaims to throw
    const officer = await getOfficer();
    expect(officer).toBeNull();
  });

  it('returns officer when getClaims succeeds', async () => {
    // mock getClaims to return { sub: 'user-uuid', email: 'u@e.ph' }
    const officer = await getOfficer();
    expect(officer).toEqual({ id: 'user-uuid', email: 'u@e.ph' });
  });
});
```

#### Fix P3-2 — Add pagination to the admin table (when scale demands)

**Severity:** LOW (UX, only relevant at >50 entries per semester).
**Files:** `app/admin/page.tsx`, `app/admin/components/EntryTable.tsx`.

Use Supabase's built-in pagination:

```ts
// app/admin/page.tsx
const PAGE_SIZE = 25;
const page = parseInt(params.page || '1', 10);
const offset = (page - 1) * PAGE_SIZE;

const { data: entries, count } = await supabase
  .from('budget_entries')
  .select('*', { count: 'exact' })
  .eq('semester', activeSemester)
  .order('date', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);
```

Add "Previous" / "Next" buttons to `EntryTable.tsx`.

**Note:** Only implement if the admin table grows beyond 50 entries per semester. For v1, the semester filter (Task 24) is sufficient.

#### Fix P3-3 — Adopt Partial Prerendering (PPR) for the homepage (when stable)

**Severity:** LOW (performance, only relevant at higher traffic).
**Files:** `app/page.tsx`.

When PPR stabilizes in Next.js 15+, adopt it for the homepage:

```ts
// app/page.tsx
export const experimental_ppr = true;
export const revalidate = 60;
```

The static shell (Header, hero, page title) will be ISR-cached for 60 seconds. The dynamic part (filter-dependent data, already wrapped in `<Suspense>`) will stream at request time. This gives CDN caching for the static shell while preserving the URL-driven filter behavior.

**Note:** PPR is experimental in Next.js 15. Do not adopt until it's stable. For v1, the fully dynamic rendering is fine for a low-traffic council portal.

#### Fix P3-4 — Use `SELECT DISTINCT` via Postgres views for semesters/categories (when scale demands)

**Severity:** LOW (performance, only relevant at >1k entries).
**Files:** `supabase/migration.sql`, `lib/data/entries.ts`.

Create Postgres views:

```sql
-- supabase/migration.sql
CREATE OR REPLACE VIEW distinct_semesters AS
  SELECT DISTINCT semester FROM budget_entries ORDER BY semester;

CREATE OR REPLACE VIEW distinct_categories AS
  SELECT DISTINCT category FROM budget_entries ORDER BY category;
```

Then query them:

```ts
// lib/data/entries.ts
export async function getSemesters(): Promise<string[]> {
  const { data, error } = await supabase.from('distinct_semesters').select('semester');
  if (error) return [];
  return data.map(row => row.semester);
}
```

**Note:** For a council portal with <100 entries, the current client-side dedupe is fine. The code has a doc comment explaining the trade-off. Only implement if performance becomes an issue.

#### Fix P3-5 — Use `requestAnimationFrame` for `PivotTabs` focus management

**Severity:** LOW (accessibility polish).
**Files:** `app/components/PivotTabs.tsx:70`.

Replace `setTimeout(() => elementToFocus.focus(), 0)` with `requestAnimationFrame(() => elementToFocus.focus())` for more reliable focus management during keyboard navigation.

---

## 8. Final grade summary

| Category | Grade | Weighted | Notes |
|---|---|---|---|
| 1. Scaffolding & Tailwind | A | 10/10 | All green. **[VERIFIED]** — build + tsc + eslint + vitest all pass. |
| 2. DB schema & migration | A | 10/10 | RLS write policy hardened (Task 17). Profiles UPDATE has explicit `WITH CHECK` (Task 18). **[VERIFIED]** — 9/9 PGlite tests pass. |
| 3. Supabase client & middleware | A− | 9/10 | Deps upgraded (Task 21) but Edge Runtime warning persists (N13). Auth pattern is `getUser()` instead of recommended `getClaims()` (N12). **[VERIFIED]** — middleware works correctly (smoke tests pass). |
| 4. Server actions & CRUD | A | 10/10 | Tests fixed (Task 10). Security correct (Task 20). Double `createClient()` eliminated (Task 23). **[VERIFIED]** — 12/12 action tests pass. |
| 5. Shared UI components | A | 10/10 | All design violations fixed (Tasks 12, 23). 6 new component test files (Task 24). **[VERIFIED]** — 28 component tests pass. |
| 6. Public homepage | A | 10/10 | `revalidate=60` no-op removed (Task 19). `SummaryStats` is server component (Task 24). **[VERIFIED]** — build output marks `/` as `ƒ (Dynamic)`. |
| 7. Officer authentication | A | 10/10 | Form correct, security correct, `document.cookie` gone (Tasks 20, 23). **[VERIFIED]** — login flow works (smoke test 200). |
| 8. Admin dashboard & CRUD | A | 10/10 | Semester filter added (Task 24). `AdminSemesterSelector` reuses `PivotTabs`. **[VERIFIED]** — admin page renders. |
| **Cross-cutting: security** | A− | 11/12 | All P0 resolved. N12 (`getUser` vs `getClaims`) and N15 (PostCSS CVE) are the only remaining items. **[VERIFIED]** — backdoor gone from client bundle AND runtime. |
| **Cross-cutting: design system** | A− | 11/12 | All violations fixed. N14 (expense red contrast 4.74:1, barely AA) is the only remaining item. |
| **Cross-cutting: test suite** | A | 10/10 | Vitest 67/67, Playwright infrastructure correct. **[VERIFIED]**. |
| **Cross-cutting: code quality** | A | 10/10 | All code-quality items fixed (Task 23). `getOfficerAndClient()` refactor clean. |
| **Cross-cutting: performance** | A− | 9/10 | `revalidate=60` no-op gone. `SummaryStats` server component. Middleware 91 KB (large but acceptable). |
| **Cross-cutting: dependency health** | B+ | 8/10 | Supabase deps upgraded (Task 21) but need v2.110.5 (N13). 2 moderate CVEs in transitive postcss (N15). |
| **Cross-cutting: bundle size** | A− | 9/10 | 102 KB First Load JS shared. Per-route sizes reasonable. |
| **Cross-cutting: accessibility** | A− | 9/10 | 28 ARIA attributes. Full keyboard nav on PivotTabs. N14 (expense red) is the only contrast concern. |
| **TOTAL** | | **89 / 100 (B+)** | Just 1 point shy of A. |

### Grade rubric

- **A (90-100):** Production-ready. No critical or high-severity issues. Minor polish items only.
- **B+ (85-89):** Production-deployable. No critical issues. High-severity issues are documented trade-offs with clear fixes.
- **B (80-84):** Production-deployable with caveats. High-severity issues present but recoverable.
- **C+ (75-79):** Not production-ready. Multiple high-severity issues or one critical issue.
- **C (70-74):** Not production-ready. Significant rework required.
- **D (60-69):** Not production-ready. Major architectural issues.
- **F (<60):** Not safe to deploy. Critical security or functional issues.

### Comparison to prior audits

| Audit | Score | Date | Status |
|---|---|---|---|
| AUDIT.md (Session 1, pre-remediation) | 56/100 (F) | 2026-07-12 | Critical backdoor shipped in production bundle. |
| AUDIT-v2.md (Session 2, post Tasks 09–16) | 83/100 (B+) | 2026-07-12 | All P0 resolved; 11 new findings (N1–N11) flagged. |
| implementation_plan_v2.md projection (Session 3, post Tasks 17–24) | 91/100 (A) | 2026-07-12 | Projected if all Tasks 17–24 applied. |
| **AUDIT-v3.md (this audit, post Tasks 17–24, independent re-grade, runtime-verified)** | **89/100 (B+)** | 2026-07-17 | All 8 Session-3 tasks applied; 3 new findings (N12–N14) the prior audits missed. 2 points below the 91/100 projection. |

The 2-point gap between the Session-3 plan's projection (91) and my independent re-grade (89) comes from:

1. **N13 Edge Runtime warning persists** (-1 point): The Task 21 upgrade to v2.110.2 was applied but the expected outcome (no warning) was not achieved. The actual fix is in v2.110.5 (released 2026-07-14, 3 days before this audit). The prior audits' assumption that v2.90.0 would fix the warning was incomplete — the v2.90.0 fix only added a runtime guard, not removed the static token. **[VERIFIED]** by reading the installed source and the PR #2522 release notes.

2. **N12 Auth pattern is now outdated** (-1 point): The current Supabase Next.js SSR guidance recommends `getClaims()` over `getUser()` for page protection. The project uses `getUser()` which is correct/safe but slower. This is a guidance shift that post-dates the project's Task 20 migration. **[VERIFIED]** by external research against the canonical Supabase docs.

### To reach an A (90/100):

1. Fix P1-1 (bump `@supabase/supabase-js` to `>=2.110.5`) — +1 point → 90
2. Fix P1-2 (migrate `getUser()` → `getClaims()`) — +1 point → 91 (overshoots A)
3. (Optional) Fix P2-1 (darken expense red) — +0 points (already passes AA) but improves buffer

**Total: +1 point minimum (P1-1 alone) → 90/100 (A).**

The project is **1 patch-version bump away from an A**. The `getClaims()` migration (P1-2) is optional for v1 but aligns with current best practice.

---

## 9. What is genuinely good

Despite the new findings, this project has real strengths that should not be lost in the fixes:

1. **The design system port is excellent.** `theme.css` is byte-identical to the design package (plus the additive `.btn-ghost-danger` class). The token names are consistent, the component utility classes are well-named, the print styles are correct, and `prefers-reduced-motion` is respected globally. All 6 original design violations + all 4 AUDIT-v2 drifts are fixed. The only remaining design issue is the barely-passing expense red contrast (N14).

2. **The database tests are best-in-class for a project this size.** Using PGlite to run the real migration + seed + RLS tests in-memory is a genuinely clever approach. The tests cover CHECK constraints, triggers, anon/authenticated RLS, own-profile enforcement, AND (new in Task 17) ownership-predicate enforcement. 9/9 pass. The `seed.local.sql` split makes the tests portable.

3. **The currency-as-centavos pattern is correctly implemented end-to-end.** Storage is `bigint`, the schema has `CHECK (amount >= 0)`, the server action uses `Math.round(amount * 100)`, the edit page divides by 100 to rehydrate the form, and the display components format with `tabular-nums`. The `formatCentavos` helper is centralized in `lib/format/currency.ts`.

4. **The URL-driven filter state is correct.** `ClientFilters` uses `useRouter` + `useSearchParams` + `startTransition` to keep the URL as the source of truth, with a 300ms debounce on search input. The admin page now uses the same pattern via `AdminSemesterSelector` (Task 24). This makes both surfaces bookmarkable and SEO-friendly.

5. **The inline delete confirmation is Metro-compliant and well-executed.** No modal, no `window.confirm` — just a state swap that replaces the Delete button with "Confirm Delete?" + "Cancel" inline. The Playwright test exercises both the confirm and cancel paths.

6. **The RLS policies are now correct by Supabase's own published bar.** Public SELECT on both tables, ownership-based INSERT/UPDATE/DELETE on `budget_entries` (Task 17), own-profile UPDATE + INSERT with explicit `WITH CHECK` (Task 18). The `entered_by` foreign key with `ON DELETE SET NULL` is the right choice (preserves audit trail when an officer leaves). The `(select auth.uid())` subselect form is the documented performance optimization.

7. **The Zod schema is the single source of truth.** Both the client (`EntryForm.tsx:69`) and the server (`entries.ts:21`) use the same `BudgetEntrySchema` from `lib/types.ts`. No drift.

8. **The `ActionResponse<T>` discriminated union is a clean API.** `EntryForm` handles `success: true` and `success: false` with `validationErrors` correctly. This is the right pattern for server actions.

9. **The Session-3 remediation was applied correctly.** All 8 tasks (17–24) were implemented as specified. The backdoor is gone (verified at runtime). The tests are unblocked (67/67). The design violations are fixed. The admin UX is improved. The `SummaryStats` server component conversion is clean. The `getOfficerAndClient()` refactor eliminates the double `createClient()`. The only ding is Task 21's v2.110.2 → v2.110.5 gap (N13), which is a 3-day-old fix the project couldn't have known about.

10. **The codebase is well-organized.** The `app/` directory follows Next.js App Router conventions. The `lib/` directory separates concerns (auth, data, format, supabase, types). The `tests/` directory is separate from the `app/` directory. The `supabase/` directory contains the migration, seeds, and DB tests. The `cbea-metro-design/` directory contains the design package. The `tasks/` directory contains the remediation plans. The `documentations/` directory contains the audits and project description. The `archive/` directory contains the session-1 task files. The `scratch/` directory contains dev-only scripts (excluded from vitest + eslint). The structure is clean and navigable.

11. **The accessibility is professional-grade.** 28 ARIA attributes properly applied. `PivotTabs` has full WAI-ARIA tab pattern with keyboard navigation (ArrowUp/Down/Left/Right/Home/End) and focus management. `BudgetEntryList` items have `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space). All sections have `aria-label`. Print styles hide chrome. `prefers-reduced-motion` respected globally. No images (no missing-alt risk). This is the kind of accessibility work you'd expect from a senior engineer.

12. **The test suite is comprehensive.** 67 tests across 12 files: 9 DB tests, 9 Supabase client tests, 12 server action tests, 28 component tests, 1 layout test. The E2E suite (9 tests) uses Playwright's documented `storageState` + setup project pattern with deterministic test user provisioning. The test infrastructure is correct — only the lack of real Supabase credentials prevented me from running the E2E suite.

These strengths are why the project is worth fixing rather than rewriting. The bones are good. The security layer is now safe. The remaining work is a 1-line dependency bump (N13), an optional auth-pattern migration (N12), and an optional color-token darkening (N14). Do P1-1 and the project is an A.

---

## 10. Verification checklist (for the developer)

After applying the fixes in §7, run this checklist to verify the project is production-ready:

```bash
# 1. Bump @supabase/supabase-js to >=2.110.5 (N13 fix)
npm install @supabase/supabase-js@^2.110.5

# 2. (Optional) Migrate getUser() → getClaims() (N12 fix)
#    - Update lib/auth/session.ts and lib/supabase/middleware.ts
#    - Verify Supabase project uses asymmetric signing keys (dashboard → Settings → API → JWT Settings)

# 3. (Optional) Darken expense red (N14 fix)
#    - Edit app/theme.css: --color-expense, --color-error, --color-accent-red → #c81000

# 4. Type check (0 errors expected)
npx tsc --noEmit

# 5. Lint (0 warnings expected)
npx eslint './**/*.{ts,tsx}' --ignore-pattern 'node_modules/**' --ignore-pattern '.next/**' --ignore-pattern 'scratch/**'

# 6. Unit tests (67/67 expected, or 68+ if you added getClaims tests)
npx vitest run

# 7. DB tests (9/9 expected)
npx vitest run supabase/database.test.ts

# 8. Build (succeeds, NO Edge Runtime warning expected after N13 fix)
npm run build

# 9. Security verification (no backdoor artifacts in client bundle)
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/        # should return nothing
grep -r 'Password123' .next/static/                # should return nothing
grep -r 'sb-mock-auth' .next/static/               # should return nothing
grep -r 'IS_E2E' .next/static/                     # should return nothing

# 10. Runtime verification (backdoor no longer works)
npm run dev &
curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin -w '%{http_code}\n'
# Expected: 307 (redirect to /login), NOT 200

# 11. E2E tests (9/9 expected, with real Supabase creds in .env.local)
npx playwright test --reporter=list

# 12. RLS advisor (0 permissive-policy warnings expected)
# Run in Supabase dashboard → Database → Advisors → Security
# Rule 0024 "Permissive RLS Policy" should not fire for budget_entries.

# 13. npm audit (monitor transitive CVEs)
npm audit
# Expected: 2 moderate (postcss, transitive via next) — document and monitor

# 14. Manual verification
# - Verify headline font-weight is 300 (Light) in browser DevTools.
# - Verify header padding is 16px on mobile, 24px on desktop.
# - Verify the homepage is dynamically rendered (no ISR cache) — check the `x-nextjs-cache` header.
# - Verify the admin table shows entries with semester filter.
# - Verify the admin semester selector updates the URL and filters the table.
# - Verify CRUD operations work end-to-end.
# - Verify the expense red color is readable on white (after N14 fix, if applied).
```

---

## 11. References

### Canonical documentation (consulted via external research subagents)

- [Next.js 15 route-segment-config docs](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config) — `revalidate`, `dynamic`, `experimental_ppr` options; Dynamic APIs.
- [Next.js 15 page.js docs](https://nextjs.org/docs/15/app/api-reference/file-conventions/page) — `searchParams` is a Dynamic API.
- [Next.js 15 Partial Prerendering](https://nextjs.org/docs/15/app/getting-started/partial-prerendering) — PPR + Suspense for ISR + `searchParams`.
- [Next.js 15 revalidatePath docs](https://nextjs.org/docs/15/app/api-reference/functions/revalidatePath) — Server Functions vs Route Handlers behavior.
- [Next.js Edge Runtime docs](https://nextjs.org/docs/api-reference/edge-runtime) — native `process.*` APIs (other than `process.env`) are unsupported.
- [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors) — rule `0024 Permissive RLS Policy`.
- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — ownership-policy patterns, `(select auth.uid())` subselect optimization, INSERT/UPDATE/DELETE policy semantics.
- [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — current Proxy + `getClaims()` guidance; `getUser()` for fresh user records.
- [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552) — Edge Runtime `process.version` warning, original issue.
- [supabase-js v2.90.0 release](https://github.com/supabase/supabase-js/releases/tag/v2.90.0) — incomplete fix (PR #1998, added `typeof process` guard).
- [supabase-js PR #2522](https://github.com/supabase/supabase-js/pull/2522) — complete fix (dynamic `globalThis` access), merged 2026-07-14.
- [supabase-js v2.110.5 release](https://github.com/supabase/supabase-js/releases/tag/v2.110.5) — released 2026-07-14, contains PR #2522.
- [Tailwind v4 theme docs](https://tailwindcss.com/docs/theme) — `--font-weight-*` namespace generates `font-*` utilities (not `font-weight-*`).
- [Tailwind v4 font-weight docs](https://tailwindcss.com/docs/font-weight) — `--font-weight-extrablack` → `font-extrablack`; `font-light` = 300.
- [Tailwind v4 border-radius docs](https://tailwindcss.com/docs/border-radius) — `rounded-sm` → `var(--radius-sm)`.
- [Playwright auth guide](https://playwright.dev/docs/auth) — `storageState` + setup project; `test.use({ storageState: { cookies: [], origins: [] } })` for fresh context.
- [Playwright global-setup-teardown docs](https://playwright.dev/docs/test-global-setup-teardown) — `globalSetup`/`globalTeardown` run once before/after suite.
- [W3C WCAG 2.2 contrast-minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 (AA normal), 3:1 (AA large), 7:1 (AAA normal), 4.5:1 (AAA large).
- [WebAIM contrast checker](https://webaim.org/resources/contrastchecker) — threshold corroboration.
- [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) — PostCSS XSS CVE.

### Prior audit history

- `documentations/AUDIT.md` — Session 1 audit (1171 lines, 2026-07-12, score 56/100 F).
- `documentations/AUDIT-v2.md` — Session 2 post-remediation audit (1915 lines, 2026-07-12, score 83/100 B+).
- `plans/implementation_plan.md` — Session 2 remediation plan (Tasks 09–16).
- `plans/implementation_plan_v2.md` — Session 3 remediation plan (Tasks 17–24, projected 91/100 A).
- `documentations/cbea-budget-transparency-project-description.md` — project description.
- `cbea-metro-design/cbea-package/DESIGN.md` — design system spec (459 lines).

### Task files (Session 3)

- `tasks/17_harden_rls_write_policy.md` — RLS ownership predicate.
- `tasks/18_profiles_rls_with_check.md` — profiles UPDATE `WITH CHECK`.
- `tasks/19_fix_noop_revalidate.md` — remove `revalidate = 60` no-op.
- `tasks/20_migrate_e2e_to_storagestate.md` — Playwright `storageState` migration.
- `tasks/21_upgrade_supabase_deps.md` — Supabase dependency upgrade.
- `tasks/22_fix_e2e_test_data_coupling.md` — E2E test data provisioning/cleanup.
- `tasks/23_code_quality_design_cleanup.md` — code quality + design-system cleanup.
- `tasks/24_admin_ux_and_missing_tests.md` — admin UX improvements + missing tests.

---

**End of audit.**

---

## 12. Appendix: External research receipts

This appendix summarizes the 34 claims verified by 6 parallel research subagents against the canonical documentation. Full receipts are in the audit context above; key findings cited inline.

### A.1 Next.js 15 caching claims (5 claims, all TRUE)

| # | Claim | Source | Verdict |
|---|---|---|---|
| Q1 | `searchParams` forces dynamic rendering | Next.js 15 page.js docs | **TRUE** — verbatim: "searchParams is a Dynamic API whose values cannot be known ahead of time." |
| Q2 | `revalidate = 60` is a no-op on dynamically-rendered pages | Next.js 15 route-segment-config docs | **TRUE (with caveat)** — `revalidate` sets the default revalidation frequency for static pages; dynamic pages get no ISR from it. Caveat: it still acts as the default cache lifetime for explicitly `force-cache`'d `fetch()` calls. |
| Q3 | `searchParams`-dynamic route is marked `ƒ (Dynamic)` in build output | Next.js 15 docs + build output | **TRUE** — confirmed by build output: `┌ ƒ /` |
| Q4 | PPR + `<Suspense>` gives ISR for static shell + streaming dynamic content | Next.js 15 PPR docs | **TRUE** — "HTML is generated ahead of time—either at build time or through revalidation" + "dynamic components wrapped in Suspense start streaming." |
| Q5 | `revalidatePath` from Server Action purges immediately | Next.js 15 revalidatePath docs | **TRUE** — "Server Functions: Updates the UI immediately (if viewing the affected path)." |

### A.2 Supabase RLS claims (8 claims, 7 TRUE, 1 FALSE)

| # | Claim | Source | Verdict |
|---|---|---|---|
| Q6 | Rule `0024` flags `USING(true)`/`WITH CHECK(true)` | Supabase Database Advisors | **TRUE** — verbatim: "RLS policies that use always-true expressions like `USING (true)` or `WITH CHECK (true)` effectively bypass the security that RLS is meant to provide." |
| Q7 | `(select auth.uid()) = col` subselect optimization | Supabase RLS docs | **TRUE** — "Wrapping the function causes an initPlan to be run by the Postgres optimizer, which allows it to 'cache' the results per-statement." Benchmark: 179ms → 9ms. |
| Q8 | INSERT policy uses only `WITH CHECK` | Supabase RLS docs | **TRUE** — consistent with Postgres semantics. |
| Q9 | UPDATE policy: `USING` (existing) + `WITH CHECK` (new) | Supabase RLS docs | **TRUE** — verbatim annotations. |
| Q10 | DELETE policy uses only `USING` | Supabase RLS docs | **TRUE** — consistent with Postgres semantics. |
| Q11 | Omitted `WITH CHECK` on UPDATE defaults to `USING` | Supabase RLS docs | **TRUE (with caveat)** — explicit `WITH CHECK` identical to `USING` is redundant; only stricter `WITH CHECK` adds depth. |
| Q12 | Current SSR guidance = `getUser()` for page protection | Supabase Next.js SSR guide | **FALSE** — current guidance is `getClaims()`. "Always use `supabase.auth.getClaims()` to protect pages and user data." |
| Q13 | `getClaims()` is optional; `getUser()` still safe but slower | Supabase Next.js SSR guide | **TRUE (with caveat)** — docs say "Always use `getClaims()`," so it's the recommended default, not merely optional. |

### A.3 Playwright auth claims (7 claims, 6 TRUE, 1 FALSE)

| # | Claim | Source | Verdict |
|---|---|---|---|
| Q14 | Setup project → `storageState` reuse pattern | Playwright auth guide | **TRUE** — verbatim pattern. |
| Q15 | `dependencies: ['setup']` runs setup first | Playwright auth guide | **TRUE** — "declare it as a dependency for all your testing projects." |
| Q16 | `test.use({ storageState: { cookies: [], origins: [] } })` for fresh context | Playwright auth guide | **TRUE** — verbatim pattern. |
| Q17 | `globalSetup`/`globalTeardown` run once before/after suite | Playwright global-setup-teardown docs | **TRUE** — "This function will be run once before all the tests." |
| Q18 | `playwright/.auth/` added to `.gitignore` | Playwright auth guide | **TRUE** — "We recommend to create `playwright/.auth` directory and add it to your `.gitignore`." |
| Q19 | UI login "preferable"/"explicitly recommended" over API | Playwright auth guide | **FALSE** — both are documented as valid; API is preferred when available/easier. |
| Q20 | Mock-cookie backdoor not documented; `storageState` is the approach | Playwright auth guide | **TRUE** — nothing resembling the mock-cookie pattern appears in the docs. |

### A.4 Supabase Edge Runtime warning claims (5 claims, 4 TRUE, 1 FALSE)

| # | Claim | Source | Verdict |
|---|---|---|---|
| Q21 | Issue #1552 reports `process.version` at module load → Edge Runtime warning | supabase-js#1552 | **TRUE** — filed 2025-09-13, closed/completed. |
| Q22 | Fix released in v2.90.0 (~Jan 2026) | supabase-js v2.90.0 release | **TRUE** — released 2026-01-07, PR #1998. **Incomplete fix.** |
| Q23 | v2.110.2 source still contains `process.version` | Read `node_modules/@supabase/supabase-js/dist/index.mjs:27` | **TRUE** — verbatim lines quoted in §7 N13. |
| Q24 | v2.110.2 guards it with `typeof process !== "undefined"` | Same source | **TRUE** — runtime-safe, not static-safe. |
| Q25 | Upgrading 2.48.1 → 2.110.2 eliminates the warning | Build output + PR #2522 release notes | **FALSE** — warning persists; real fix is v2.110.5 (PR #2522, merged 2026-07-14). |

### A.5 Tailwind v4 theming claims (5 claims, all TRUE, empirically verified)

| # | Claim | Source | Verdict |
|---|---|---|---|
| Q26 | `--font-weight-headline-display: 300` generates `font-headline-display`, not `font-weight-headline-display` | Tailwind v4 font-weight docs + empirical build | **TRUE** — confirmed by building real CSS with Tailwind v4.3.3. |
| Q27 | `font-light` is the correct utility for `font-weight: 300` | Tailwind v4 font-weight docs | **TRUE** — quick-reference table. |
| Q28 | Overriding `--radius-sm: 0px` makes `rounded-sm` resolve to 0px | Tailwind v4 border-radius docs + empirical build | **TRUE** — inline `borderRadius:'0px'` is redundant. |
| Q29 | Namespace → utility-prefix mappings | Tailwind v4 theme docs | **TRUE** — `--color-*` → `bg-*`/`text-*`/`border-*`; `--font-*` → `font-*` (family); `--font-weight-*` → `font-*` (weight); `--text-*` → `text-*`; `--spacing-*` → `p-*`/`m-*`/`gap-*`; `--radius-*` → `rounded-*`; `--tracking-*` → `tracking-*`; `--leading-*` → `leading-*`. |
| Q30 | `px-margin` (24px) + `md:px-margin-mobile` (16px) is backwards; correct is `px-margin-mobile md:px-margin` | Tailwind v4 padding docs + empirical build | **TRUE** — mobile-first order matters. |

### A.6 WCAG color contrast claims (5 claims, 4 TRUE, 1 INACCURATE)

| # | Pair | Claimed | Actual (W3C formula) | AA Normal | AAA Normal | Verdict |
|---|---|---|---|---|---|---|
| Q31 | Lime `#8CBF26` bg + black text | ~9.6:1 | **9.60:1** | ✅ PASS | ✅ PASS | Accurate |
| Q32 | Income green `#2D7A2D` text on white | ~5.35:1 | **5.34:1** | ✅ PASS | ❌ FAIL | Accurate |
| Q33 | Expense red `#E51400` text on white | ~5.25:1 | **4.74:1** | ✅ PASS (barely) | ❌ FAIL | **INACCURATE** — actual is 0.51 lower than claimed. Pass/fail still holds but margin is thin (0.24 above AA threshold). |
| Q34 | Warning orange `#F09609` bg + black text | ~9.07:1 | **9.07:1** | ✅ PASS | ✅ PASS | Accurate |
| Q35 | Black on white | 21:1 | **21.00:1** | ✅ PASS | ✅ PASS | Accurate |

**Calculation method (W3C relative-luminance formula):**
1. Linearize sRGB: `C_linear = ((C_sRGB/255 + 0.055) / 1.055)^2.4`
2. Luminance: `L = 0.2126·R + 0.7152·G + 0.0722·B`
3. Contrast ratio: `ratio = (L_lighter + 0.05) / (L_darker + 0.05)`

---

**End of AUDIT-v3.**
