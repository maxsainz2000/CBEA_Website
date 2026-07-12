# CBEA Budget Transparency Portal — Strict Code Audit & Fix Plans

> Audit date: 2026-07-12
> Audited artifact: `cbea_website_sources.zip` (extracted to `/home/z/my-project/workspace/cbea_website_sources`)
> Rubric: **Brutally strict (production-readiness bar)**
> Scope: Task compliance · Design system · Security · Test suite · Code quality · Performance
> Methodology: full source read + `npm install` + `next build` + `eslint` + `tsc --noEmit` + `vitest run` + `playwright test` + runtime HTML probing with `curl` against the live dev server (which is wired to a real Supabase project whose credentials ship inside the zip).

---

## 0. TL;DR — What you are building

You are building the **CBEA Student Council Budget Transparency Portal**, a public-facing Next.js 15 / React 19 / Tailwind v4 / Supabase web app for the College of Business, Economics, and Accountancy Student Council at Cagayan State University – Aparri. Two surfaces:

1. **Public side (`/`)** — anyone can browse income/expense entries, see Collected / Spent / Remaining totals, filter by semester (pivot tabs) and category (chips), and free-text search. Mobile-first, print-friendly.
2. **Admin side (`/admin`, `/admin/new`, `/admin/edit/[id]`)** — Supabase-Auth-protected CRUD for council officers, with a Metro-compliant inline delete confirmation.

Visual language is a strict Metro (Windows Phone 7) derivative: pure white background, black text, single Lime accent (`#8CBF26`) with black-on-Lime text for WCAG AAA, two semantic colors (income green `#2D7A2D`, expense red `#E51400`), zero shadows, zero gradients, zero corner radius, `Segoe UI` font stack with cross-platform fallbacks, tabular numerals on every currency figure, and a fierce "content before chrome" reduction rule.

Data model: `budget_entries` (centavos as `bigint`, `entered_by` → `profiles.id` → `auth.users.id`) and `profiles`, both RLS-enabled (public SELECT, authenticated write). Currency is stored in centavos to dodge floating-point drift; the client uses decimals and the server converts with `Math.round(amount * 100)`.

Stack is intentionally free-tier-only (Vercel Hobby + Supabase Free) so the council can run it for ₱0/month.

---

## 1. Executive verdict

| Aspect | Result |
|---|---|
| **Build** | ✅ `next build` succeeds (Next.js 15.5.20, 6 routes, 90.8 kB middleware) |
| **Type check** | ⚠️ `tsc --noEmit` reports 1 error in `tests/admin-crud.spec.ts:39` |
| **Lint** | ⚠️ `eslint` reports 1 warning (unused `valErrors`) |
| **Unit tests (vitest)** | ❌ **28 / 37 pass — 9 fail**, all in `app/actions/entries.test.ts` |
| **DB tests (PGlite)** | ✅ 8 / 8 pass |
| **E2E tests (Playwright)** | ❌ **8 / 9 pass — 1 fail** (`auth-flow.spec.ts > Valid Login`) |
| **Runtime smoke** | ✅ `/`, `/login`, `/admin` (with mock cookie) all render correctly against real Supabase data (₱92,000.00 / ₱54,800.00 / ₱37,200.00) |
| **Security** | ❌❌❌ **CRITICAL backdoor**: `NEXT_PUBLIC_IS_E2E=true` ships in `.env.local`, which bakes a hard-coded `jane.doe@csu.edu.ph` / `Password123!` mock-auth bypass into the production bundle. The same `.env.local` also leaks a real `SUPABASE_SERVICE_ROLE_KEY`. |

**Final grade (brutally strict): F — 56 / 100.**

The MVP would be a comfortable **B (78 / 100)** if the E2E backdoor were confined to a test-only env file and the server-action test failures were fixed. As shipped, the project is **not safe to deploy** because the moment you run `next build` with this `.env.local`, the static client bundle contains a public, inspectable authentication bypass — and the server actions escalate to the service role key when that bypass is used.

---

## 2. Methodology (so the findings are reprocible)

I did not rely on memory. I unpacked the zip, installed the exact dependency tree, ran every quality gate, and probed the running app.

```bash
cd cbea_website_sources
npm install --no-audit --no-fund         # 475 packages, 11s
npx tsc --noEmit                          # 1 error in tests/admin-crud.spec.ts:39
npx eslint './**/*.{ts,tsx}' \
  --ignore-pattern 'node_modules/**' \
  --ignore-pattern '.next/**' \
  --ignore-pattern 'scratch/**'           # 1 warning
npm run build                             # succeeds, Edge Runtime warning for supabase-js in middleware
npx vitest run                            # 28 pass, 9 fail
npx vitest run supabase/database.test.ts  # 8/8 pass (PGlite in-memory Postgres)
npx playwright install chromium           # browser binary
npm run dev &                             # Next.js 15.5.20 on :3000
curl -sS http://localhost:3000/           # 200, real Supabase data renders
curl -sS http://localhost:3000/login      # 200, login form renders
curl -sS http://localhost:3000/admin      # 307 → /login (correct)
curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin   # 200 — BACKDOOR CONFIRMED
npx playwright test --reporter=list       # 8 pass, 1 fail
```

Every claim in this report is backed by either a file path + line number or a command output. Where I assert a vulnerability, I have executed it against the live app.

---

## 3. Test results — the receipts

### 3.1 Vitest — `28 / 37 pass`

```
Test Files  1 failed | 6 passed (7)
     Tests  9 failed | 28 passed (37)
  Duration  19.87s
```

**Passing files:**

| File | Tests | Notes |
|---|---|---|
| `supabase/database.test.ts` | 8/8 | Schema, CHECK constraint, `updated_at` triggers, RLS for anon + authenticated. Excellent coverage. |
| `lib/supabase/supabase.test.ts` | 9/9 | Client/server/middleware auth guards. Well-mocked. |
| `app/components/PivotTabs.test.tsx` | 3/3 | 5-tab render, 8-tab dropdown fallback, `.pivot-tab-active` styling. |
| `app/components/SummaryStats.test.tsx` | 3/3 | Centavos→decimal conversion, positive vs negative balance coloring. |
| `app/layout.test.tsx` | 1/1 | Trivial "renders children" check. |
| `scratch/test-crud.test.ts` | 1/1 | Sandbox smoke test. Should not be in the production test suite. |

**Failing file: `app/actions/entries.test.ts` — 9/9 of its action tests fail.**

Root cause: the server action in `app/actions/entries.ts` calls `await import('next/headers')` dynamically inside each mutation (lines 16, 98, 176) to read the `sb-mock-auth` cookie. The test file mocks `../../lib/supabase/server` and `next/cache` but **does not mock `next/headers`**. So when the action runs under vitest, the dynamic import resolves to the real `next/headers` module, which calls `cookies()` outside a Next.js request scope and throws:

```
`cookies` was called outside a request scope.
Read more: https://nextjs.org/docs/messages/next-dynamic-api-wrong-context
```

The action catches that throw and returns `{ success: false, error: '<that message>' }`, so every test that expected `'Unauthorized'` or `'Validation failed'` or `success: true` fails. See §6.4 for the fix.

### 3.2 Playwright — `8 / 9 pass`

```
✓ tests/admin-crud.spec.ts — Full CRUD lifecycle (15.8s)
✓ tests/auth-flow.spec.ts — Route Protection: /admin → /login (1.2s)
✓ tests/auth-flow.spec.ts — Invalid Login shows inline error (2.1s)
✘ tests/auth-flow.spec.ts — Valid Login → /admin (FAILED at line 52)
✓ tests/public-homepage.spec.ts — Page load + currency format (1.3s)
✓ tests/public-homepage.spec.ts — Semester pivot filter + URL (1.4s)
✓ tests/public-homepage.spec.ts — Category chip filter + URL (1.4s)
✓ tests/public-homepage.spec.ts — Search query "party" + URL (1.9s)
✓ tests/public-homepage.spec.ts — Print layout hides chrome (1.1s)
```

**The one failure:**

```ts
// tests/auth-flow.spec.ts:50-53
const welcomeHeader = page.locator('h2');
await expect(welcomeHeader).toContainText(/Welcome/i);
await expect(welcomeHeader).toContainText(/Jane Doe/i);
```

The admin page (`app/admin/page.tsx`) has **two** `<h2>` elements — `"Overall Financial Aggregates"` and `"Manage Budget Records"` — neither of which contains "Welcome" or "Jane Doe". The officer's name is rendered in a `<span>` next to an `<h1>` ("Officer Dashboard"). Playwright's strict mode refuses to evaluate the locator against multiple elements, so the test errors out.

Meanwhile `tests/admin-crud.spec.ts:18-20` correctly uses `h1` for "Officer Dashboard" and a separate `text=Jane Doe` lookup — and passes. So the auth-flow test was simply never updated when the admin page header was redesigned.

### 3.3 Build

`next build` succeeds with one warning worth noting:

```
./node_modules/@supabase/supabase-js/dist/index.mjs
A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.
Import trace for requested module:
./node_modules/@supabase/supabase-js/dist/index.mjs
./node_modules/@supabase/ssr/dist/module/createBrowserClient.js
./node_modules/@supabase/ssr/dist/module/index.js
./lib/supabase/middleware.ts
```

Root cause: `lib/supabase/middleware.ts` imports `createServerClient` from `@supabase/ssr`, which re-exports `createBrowserClient` from `@supabase/supabase-js`. The latter calls `process.version` at module load — forbidden in the Edge Runtime that Next.js middleware runs in. It works today because `@supabase/ssr` 0.5.x lazy-loads the offending code path, but it is a ticking bomb: a future minor version of `supabase-js` could move that call to the top level and your middleware will crash in production. See §6.5.

### 3.4 TypeScript and ESLint

```
$ npx tsc --noEmit
tests/admin-crud.spec.ts(39,48): error TS2345: Argument of type 'HTMLElement | null' is not
  assignable to parameter of type 'Element'.

$ npx eslint './**/*.{ts,tsx}' [ignores]
/home/z/.../tests/admin-crud.spec.ts
  61:11  warning  'valErrors' is assigned a value but its value is never read
            @typescript-eslint/no-unused-vars
✖ 1 problem (0 errors, 1 warning)
```

Both are in the same test file (`admin-crud.spec.ts`) — a `page.evaluate(...)` returning `HTMLElement | null` is passed to a function expecting `Element` (line 39), and `valErrors` is collected but never asserted on (line 61). The build still succeeds because Next.js does not run `tsc` on the `tests/` directory, but CI that runs `tsc --noEmit` will fail.

---

## 4. Per-task evaluation (brutally strict)

Each task is graded against the acceptance criteria written in `tasks/0X_*.md`. A task fails if any acceptance criterion is unmet or if the implementation has a defect that prevents the criterion from being satisfied in production.

### Task 1 — Project Scaffolding & Tailwind v4 — **PASS (A−)**

| Criterion | Status | Evidence |
|---|---|---|
| Next.js 15 runs locally with no console errors | ✅ | `next dev` boots in 1.6s, no console errors |
| Tailwind v4 `@theme` loads; tokens match design system | ✅ | `app/theme.css` is byte-identical to `cbea-metro-design/cbea-package/app/theme.css` (verified with `diff`) |
| CSS resets applied to body | ✅ | `bg-background text-on-background font-body-sm min-h-screen selection:bg-primary selection:text-on-primary` on `<body>` |
| `npx vitest run` passes | ❌ | 9 tests fail in `app/actions/entries.test.ts` (see §3.1) |

**Deductions:**
- The vitest acceptance criterion fails. The failing tests belong to Task 4 but Task 1's criterion says "Running `npx vitest run` passes successfully with unit test execution" — strictly speaking, Task 1 fails this bar.
- `next/font` Geist is mentioned in `README.md` but the layout does not use `next/font`. The README is the default create-next-app template and was never updated. Minor.
- `vitest.config.ts` excludes `'tests'` (the Playwright dir) — correct — but does not set up `@testing-library/jest-dom` matchers globally. The component tests work because they happen not to use jest-dom matchers, but this is fragile.

**Grade: A−** — scaffolding is correct and idiomatic; the vitest failure is a downstream issue.

### Task 2 — Database Schema & Migration — **PASS (A)**

| Criterion | Status | Evidence |
|---|---|---|
| Both tables exist with triggers | ✅ | `supabase/database.test.ts > should successfully load seed data` passes |
| `amount >= 0` CHECK enforced | ✅ | `should enforce Check Constraint amount >= 0` passes — negative amount rejected with `violates check constraint` |
| RLS prevents anon writes | ✅ | `should block anonymous inserts, updates, and deletes` passes |
| Seed loads without FK errors | ✅ | 10 budget entries + 2 profiles load cleanly |

**Deductions (none blocking):**
- `migration.sql` creates a stub `auth.users` table and a stub `auth.uid()` function. This is **necessary for the PGlite tests** but **wrong for a real Supabase project**: Supabase already provides `auth.users` and `auth.uid()`. Running this migration in the Supabase SQL editor will fail with "schema auth already exists" or pollute `auth.users` with non-functional rows. The migration should be split into a `supabase/migration.sql` (tables, triggers, RLS only — drop the `CREATE SCHEMA auth` block) and a `supabase/seed.local.sql` (the auth stubs, only for local PGlite).
- No index on `semester` even though every public query filters by it. The plan only indexes `date` and `category`. With ≥1k entries this will table-scan.
- The `profiles` table has no `created_at` column. Provenance is weakened — you cannot tell when an officer was added.

**Grade: A** — schema is correct, RLS is correct, tests are excellent. The migration/seed split is a deployability issue, not a correctness issue.

### Task 3 — Supabase Client & Auth Middleware — **FAIL (D+)**

| Criterion | Status | Evidence |
|---|---|---|
| Browser + server clients use env vars | ✅ | Both throw on missing env vars (`lib/supabase/{client,server}.ts`) |
| `await cookies()` correctly integrated | ✅ | `lib/supabase/server.ts:5` awaits `cookies()` |
| Middleware blocks unauth `/admin` → `/login` | ✅ | `curl /admin` returns 307 → `/login` |
| Authenticated `/login` → `/admin` redirect | ✅ | Mocked test passes |
| Session refreshes on every request | ✅ | `supabase.auth.getUser()` called in `updateSession` |
| **Never use `getSession()` for authorization** | ❌ | `lib/supabase/middleware.ts:42-54` short-circuits `getUser()` when `NEXT_PUBLIC_IS_E2E=true` and the `sb-mock-auth` cookie is set — i.e., **trusts a client-set cookie as authorization** |

**Critical issue (also see §6.2):**

`lib/supabase/middleware.ts:39-54`:

```ts
const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true';
const mockAuth = request.cookies.get('sb-mock-auth')?.value === 'true';

if (isE2e && mockAuth) {
  user = {
    id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    email: 'jane.doe@csu.edu.ph',
  };
} else {
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
}
```

This is the backdoor. `NEXT_PUBLIC_IS_E2E` is a `NEXT_PUBLIC_*` var, so Next.js **inlines its value into the client bundle at build time**. The `.env.local` shipped in the zip sets it to `true`. Therefore:

1. Any production build made from this `.env.local` ships the backdoor — the string `"NEXT_PUBLIC_IS_E2E"` and the literal `"true"` comparison are baked into the JS chunk that the browser downloads.
2. An attacker reads the bundle, learns the cookie name (`sb-mock-auth`) and the expected email/password (`jane.doe@csu.edu.ph` / `Password123!`, see `app/login/page.tsx:32`), and signs in with zero Supabase Auth.
3. The cookie is `document.cookie = 'sb-mock-auth=true; path=/'` — not HttpOnly, not Secure, not SameSite. Trivially plantable.

The task spec explicitly says: *"Security Strictness: Never use `supabase.auth.getSession()` for authorization decisions. Always await and use `supabase.auth.getUser()`, as it fetches the user details securely from the Supabase server."* The implementation violates this rule whenever the E2E flag is on.

**Grade: D+** — the happy-path Supabase integration is correct, but the E2E mock layer introduces a production-grade authentication bypass.

### Task 4 — Server Actions & CRUD Validation — **FAIL (D)**

| Criterion | Status | Evidence |
|---|---|---|
| Zod rejects invalid inputs with descriptive errors | ✅ (code) / ❌ (test) | Schema is correct (`lib/types.ts:19-31`), but the test that proves it fails |
| `supabase.auth.getUser()` enforces auth | ❌ | Same E2E backdoor as Task 3 — bypassed when `NEXT_PUBLIC_IS_E2E=true` |
| Decimal → integer centavos conversion | ✅ | `Math.round(validData.amount * 100)` at `entries.ts:56, 134` |
| `revalidatePath('/')` and `revalidatePath('/admin')` | ✅ | All three actions call both |
| Vitest covers happy paths, validation errors, auth failures | ❌ | **9 / 9 action tests fail** because the action dynamically imports `next/headers` |

**Critical implementation smell:** `app/actions/entries.ts:16-19, 98-101, 176-179` uses `await import('next/headers')` inside each action to read the `sb-mock-auth` cookie. This is:

1. **Untestable without mocking `next/headers`** — which the test file does not do.
2. **Repetitive** — the same 30-line block is copy-pasted across `createEntry`, `updateEntry`, `deleteEntry`.
3. **A service-role escalation** — when the backdoor fires, the action re-creates the Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, bypassing RLS entirely. So a user who exploited the backdoor has full admin write access.

**Grade: D** — the happy path works (proven by the passing Playwright CRUD test), but the unit tests fail and the security posture is broken.

### Task 5 — Shared UI Components — **PASS (B+)**

| Criterion | Status | Evidence |
|---|---|---|
| Sharp 0px corners, flat backgrounds, thin outlines | ✅ | All components use `theme.css` utility classes |
| Keyboard focus outlines high-visibility | ✅ | `.pivot-tab:focus-visible { outline: 2px solid var(--color-primary) }`, `SummaryStats` cards have `focus-visible:outline-2 focus-visible:outline-primary` + `role="button"` + `tabIndex={0}` + Enter/Space handler |
| Pivot dropdown fallback when > 7 tabs | ✅ | `PivotTabs.tsx:27` `shouldRenderDropdown = normalizedTabs.length > 7` |
| Negative balance in red with minus sign | ✅ | `SummaryStats.test.tsx` case 3 passes: `-₱100.00` rendered with `stat-value-negative` |
| Currency uses tabular numerals | ✅ | `.tabular-nums` on every amount; `font-variant-numeric: tabular-nums` enforced in `.stat-value`, `.budget-entry-amount`, `.data-table .amount-col` |

**Deductions:**
- `app/components/Header.tsx:12` has `px-margin md:px-margin-mobile` — this is **backwards**. The Tailwind class `px-margin` (24px) applies at all breakpoints, then `md:px-margin-mobile` (16px) overrides it at desktop. So mobile gets 24px (should be 16px) and desktop gets 16px (should be 24px). The DESIGN.md says "24px margin on desktop / 16px on mobile". This is a real Metro compliance bug — confirmed in the rendered HTML.
- `app/components/PivotTabs.tsx:112` adds `font-bold border-b-2 border-primary` to the active tab. DESIGN.md says: *"No underline indicator — the color change is the indicator, per Content Before Chrome."* The added underline violates the design spec.
- `app/components/SummaryStats.tsx:1` is marked `'use client'` purely to format the date with `useEffect`. This forces the entire stat card grid to hydrate on the client. A simpler fix: format the date on the server in `app/page.tsx` and pass `asOfDate` as a prop. The component already accepts `asOfDate?: string`. This would remove the hydration mismatch concern and the `'use client'` directive.
- `app/components/SearchFilter.tsx:54` uses inline `style={{ borderRadius: '0px' }}` to force zero radius. Tailwind v4 with the `@theme` block already sets `--radius-sm: 0px` etc. The inline style is redundant and breaks the "don't mix inline styles with utility classes" rule.

**Grade: B+** — components are accessible, testable, and visually on-spec. The two design violations (header padding reversal, active-tab underline) are minor but real.

### Task 6 — Public Homepage Assembly — **PASS (A−)**

| Criterion | Status | Evidence |
|---|---|---|
| Server Component fetches data | ✅ | `app/page.tsx:21` `async function HomepageContent` |
| `searchParams: Promise<...>` awaited (Next.js 15) | ✅ | `app/page.tsx:22` `const params = await searchParams` |
| Title uses `.font-headline-display` | ✅ | `app/page.tsx:93` |
| URL-driven filters | ✅ | `ClientFilters.tsx` uses `useRouter` + `useSearchParams` + `startTransition` |
| Print mode hides chrome | ✅ | Playwright print-layout test passes |
| Loading indicators | ✅ | `<Suspense fallback={...}>` with spinner, plus `isPending` pulse in `ClientFilters` |
| 200ms slide-in animation | ✅ | `globals.css` defines `animate-slide-in-fade`, applied to entries section with `key={...}` to re-trigger on filter change |

**Deductions:**
- The spec says "Render the page title `'CBEA Student Council Budget Transparency'` using the `.font-headline-display` styling." The implementation uses `font-headline-display text-headline-display font-weight-headline-display`. This works, but `font-weight-headline-display` is not a standard Tailwind utility — it only works because `theme.css` defines `--font-weight-headline-display: 300` as a CSS variable. Tailwind v4 does not auto-generate a `font-weight-*` utility from arbitrary `--font-weight-*` variables; the class is a no-op. The headline renders at the browser default weight (400) instead of Light (300). This is a subtle but real drift from the Metro signature look. (Confirmed: the rendered HTML has the class but the computed `font-weight` is 400, not 300.)
- The homepage hides the `display-xl` total-collected figure that the implementation plan called for. The hero only has the headline + a small "Public Transparency Portal" label; the totals are pushed down into the stat-card row. This is a defensible design choice but a deviation from the plan.
- The page sets `export const dynamic = 'force-dynamic'` to read `searchParams`. Correct, but it disables static optimization for the homepage. A `generateStaticParams`-style approach with `searchParams` revalidation would be more Vercel-friendly.

**Grade: A−** — homepage is functional, attractive, and passes all 5 Playwright assertions. The font-weight drift is the only real design-system issue.

### Task 7 — Officer Authentication — **FAIL (D)**

| Criterion | Status | Evidence |
|---|---|---|
| Login screen with email/password/submit | ✅ | `app/login/page.tsx` |
| `.input-underline` + `.btn-primary` Metro styling | ✅ | Verified in rendered HTML |
| Errors display inline in semantic red | ✅ | `text-error` class, `border-l-4 border-error` |
| `signInWithPassword` redirects to `/admin` on success | ✅ | `app/login/page.tsx:42-55` |
| Authenticated users redirected from `/login` to `/admin` | ✅ | Middleware test passes |
| Playwright E2E passes for valid/invalid inputs and redirects | ❌ | `auth-flow.spec.ts > Valid Login` fails — see §3.2 |

**Critical issues:**

1. **The backdoor** (see §6.2): `app/login/page.tsx:29-39` hard-codes the test credentials into the client bundle when `NEXT_PUBLIC_IS_E2E=true`. The credentials `jane.doe@csu.edu.ph` / `Password123!` are now public knowledge for any deployment built from this `.env.local`.

2. **Test/implementation mismatch**: the failing test expects an `<h2>` containing "Welcome" and "Jane Doe" — neither exists on the admin page. This means the test was never run against the final implementation, or the implementation was changed without updating the test. Either way, the acceptance criterion "Playwright E2E tests pass for valid/invalid inputs and redirects" is unmet.

3. **`createClient()` is called inside the component body** (`AdminHeader.tsx:10`), not inside the event handler. This means a new Supabase client is instantiated on every render of the admin header, which is wasteful and can cause auth token race conditions.

**Grade: D** — the form looks right, but the security posture and the failing test combine to fail the task.

### Task 8 — Admin Dashboard & CRUD Views — **PASS (B)**

| Criterion | Status | Evidence |
|---|---|---|
| Admin panel protected by middleware | ❌ (in production) / ✅ (in test) | Mock auth bypasses it |
| Add/Edit forms validate + convert to centavos | ✅ | `EntryForm.tsx` runs client Zod, server action re-validates and converts |
| Status badges in semantic colors | ✅ | `.status-badge-paid/-pending/-flagged` applied correctly |
| Inline delete confirmation (no modals) | ✅ | `EntryTable.tsx:113-133` swaps Delete → "Confirm Delete?" + "Cancel" inline |
| E2E tests verify full CRUD lifecycle | ✅ | `admin-crud.spec.ts` passes (15.8s) |

**Deductions:**
- `app/admin/components/EntryTable.tsx:148` uses `text-expense!` (Tailwind important modifier) to override `.btn-ghost`'s Lime color with red. This is fragile — if `.btn-ghost` ever gains a `!important` color rule, the delete button silently reverts to Lime. Better: add a dedicated `.btn-ghost-danger` class in `theme.css`.
- `app/admin/components/EntryForm.tsx:115` wraps the form in `bg-surface p-lg border border-outline` — a bordered card. DESIGN.md says: *"Don't use box-shadows on cards, tables, or any surface... Borders, where they appear, are 1px solid `colors.outline` — used for table row separators and input focus underlines, never for card outlines."* The form's border violates this rule.
- `app/admin/components/EntryForm.tsx:58, 92, 94` has three `console.log` statements (`'ONSUBMIT CALLED'`, `'RESPONSE:'`, `'CALLING ROUTER PUSH /admin'`) left over from debugging. These will appear in the browser console in production.
- `app/admin/edit/[id]/page.tsx:22-29` has an empty `if (isE2e && mockAuth) { /* E2E Mock Session */ }` block. The comment-only branch is a code smell.
- The admin page calls `getEntries()` with no semester filter, so it shows every entry from every semester in one giant table. With 4 semesters × 50 entries, that's 200 rows with no pagination. The public side filters by semester; the admin side should too (or paginate).

**Grade: B** — the CRUD lifecycle works end-to-end (proven by the Playwright test). The design violations and debug logs are real but recoverable.

---

## 5. Cross-cutting evaluation

### 5.1 Design system fidelity — **B**

The `theme.css` file is a faithful, byte-identical port of the design package. The drift is in how components consume it:

| DESIGN.md rule | Violation | Where |
|---|---|---|
| "24px margin on desktop / 16px on mobile" | Header padding reversed (`px-margin md:px-margin-mobile` — mobile gets 24px, desktop gets 16px) | `Header.tsx:12` |
| "No underline indicator — the color change is the indicator" | Active pivot tab adds `border-b-2 border-primary` | `PivotTabs.tsx:112` |
| "Borders... never for card outlines" | EntryForm wrapped in `border border-outline` | `EntryForm.tsx:115` |
| "Use Light weights at large sizes (32px+)" | `font-weight-headline-display` class is a no-op in Tailwind v4; headline renders at 400 not 300 | `app/page.tsx:93`, `app/admin/page.tsx:63`, etc. |
| "Touch targets ≥ 48px" | Inline delete/cancel buttons use `h-10` (40px) | `EntryTable.tsx:118, 127, 138, 148` |
| "Don't mix semantic colors with interactive colors on the same element" | Delete button is `.btn-ghost` (Lime) overridden with `text-expense!` (red) | `EntryTable.tsx:148` |

**What's done right:**
- Print styles in `theme.css` and `globals.css` correctly strip backgrounds, hide buttons, and preserve semantic colors.
- `prefers-reduced-motion` is respected globally.
- All currency figures have `.tabular-nums`.
- Status badges match the spec exactly (paid=green/white, pending=orange/black, flagged=red/white).
- The `Segoe UI → system-ui → -apple-system → Helvetica Neue → Arial → sans-serif` fallback stack is preserved across every font token.

### 5.2 Security audit — **F (CRITICAL)**

This is the section that fails the project.

#### Finding S1 — Hard-coded authentication backdoor, shipped by default — **CRITICAL**

**Files:** `.env.local:3`, `lib/supabase/middleware.ts:39-54`, `app/login/page.tsx:29-39`, `app/actions/entries.ts:18-41, 100-119, 178-197`, `app/admin/page.tsx:15-29`, `app/admin/new/page.tsx:13-22`, `app/admin/edit/[id]/page.tsx:19-29`.

`.env.local` ships `NEXT_PUBLIC_IS_E2E=true`. Because the variable name starts with `NEXT_PUBLIC_`, Next.js **inlines the literal string `"true"` into the client bundle at build time**. Every code path that reads `process.env.NEXT_PUBLIC_IS_E2E` becomes a constant `true` in production.

The login page then offers a backdoor:

```ts
// app/login/page.tsx:29-39
if (isE2e && cleanEmail === 'jane.doe@csu.edu.ph' && password === 'Password123!') {
  document.cookie = 'sb-mock-auth=true; path=/';
  startTransition(() => { router.push('/admin'); router.refresh(); });
  return;
}
```

The credentials `jane.doe@csu.edu.ph` / `Password123!` are baked into the JS bundle. The cookie `sb-mock-auth=true` is set without `Secure`, `HttpOnly`, or `SameSite` — and it is then trusted by:

1. **Middleware** (`lib/supabase/middleware.ts:42-46`): sets `user = { id: 'd0d0...', email: 'jane.doe@csu.edu.ph' }` without calling `supabase.auth.getUser()`. Spec violation: "Never use `supabase.auth.getSession()` for authorization decisions. Always await and use `supabase.auth.getUser()`."
2. **Admin pages** (`app/admin/page.tsx:21-29` etc.): bypass `supabase.auth.getUser()` entirely.
3. **Server actions** (`app/actions/entries.ts:23-34` etc.): bypass auth **AND** re-create the Supabase client with `SUPABASE_SERVICE_ROLE_KEY`, escalating to RLS-bypassing admin writes.

**I confirmed this end-to-end against the live dev server:**

```bash
$ curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin -w '%{http_code}\n' -o /tmp/admin.html
200
$ grep -oE 'Officer Dashboard|Jane Doe|Treasurer|Add New Entry' /tmp/admin.html | sort -u
Add New Entry
Jane Doe
Officer Dashboard
Treasurer
```

Anyone who plants `sb-mock-auth=true` in their browser cookies gets full admin access without ever talking to Supabase Auth. And since the email/password is in the public JS bundle, an attacker doesn't even need to guess — they can just log in normally through the backdoor URL.

**Severity: CRITICAL. CVSS 9.8 (Network, Low complexity, No privileges, No user interaction, Confidentiality/Integrity/Availability all High).**

#### Finding S2 — Real `SUPABASE_SERVICE_ROLE_KEY` committed to the zip — **CRITICAL**

**File:** `.env.local:4`

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlrb29ncXdpZ3ZmeWx3amF0aWRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzY4NzYzNywiZXhwIjoyMDk5MjYzNjM3fQ.tLxXMB9Otkjq4T5mFCvTefbpZ0twNB12BaRXHe_OPh8
```

Decoding the JWT payload (middle segment):

```json
{ "iss": "supabase", "ref": "ikoogqwigvfylwjatids", "role": "service_role",
  "iat": 1783687637, "exp": 2099263637 }
```

This is a **real, live service-role key** for the Supabase project `ikoogqwigvfylwjatids`, valid until 2036. The service role bypasses RLS entirely. Anyone with this key has full read/write/delete on every table, every bucket, and every auth user.

The `.gitignore` has `.env*` (line 34), so this would not be committed to git — but **it is in the zip you distributed**, which means anyone you shared the zip with has the key. You should treat this key as compromised and rotate it immediately in the Supabase dashboard (Settings → API → Reset service_role key).

**Severity: CRITICAL. The key must be rotated regardless of whether you fix the code.**

#### Finding S3 — `NEXT_PUBLIC_IS_E2E` is a public env var used for security decisions — **HIGH**

Even if the value were `false` in production, the **name** `NEXT_PUBLIC_IS_E2E` is wrong for a security-relevant flag. `NEXT_PUBLIC_*` vars are inlined into the client bundle. Security-relevant flags should be server-only (no `NEXT_PUBLIC_` prefix) so they never leave the server.

The current code uses `NEXT_PUBLIC_IS_E2E` on the **client** (`app/login/page.tsx:29`) — so it has to be public — but the entire pattern of "client decides whether to use mock auth" is broken. Mock auth should be a server-side decision, never client-side.

#### Finding S4 — Service role key used in server actions when backdoor fires — **HIGH**

`app/actions/entries.ts:25-34` — when the backdoor fires, the action creates a new Supabase client with `SUPABASE_SERVICE_ROLE_KEY`. This means:

- RLS is bypassed (service role ignores RLS).
- The `entered_by` field is hard-coded to `d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001` (Jane Doe's UUID), so the audit trail is forged.
- An attacker who exploited S1 gets S4 automatically — full admin writes with a forged officer identity.

#### Finding S5 — Profiles table has public SELECT — **MEDIUM**

`supabase/migration.sql:84-85`:

```sql
CREATE POLICY "Allow public read access on profiles" ON public.profiles
    FOR SELECT USING (true);
```

This exposes every officer's `full_name` and `role` to the public. For a student council portal, this is probably fine (transparency of who the officers are is a feature). But it means an attacker who exploited S1 can enumerate all officer identities before forging audit trails.

#### Finding S6 — No CSRF protection on server actions — **LOW**

Next.js Server Actions have built-in CSRF protection via the `Origin` header check, so this is largely mitigated. But the `sb-mock-auth` cookie has no `SameSite` attribute, which weakens the CSRF story. Combined with S1, an attacker could craft a malicious page that sets the cookie and submits a delete action.

#### Finding S7 — `document.cookie` used to set/clear the mock cookie — **MEDIUM**

`app/login/page.tsx:33` and `app/admin/components/AdminHeader.tsx:15` manipulate `document.cookie` directly. This is client-side cookie manipulation — fine for a non-sensitive flag, but the flag is security-relevant (see S1). The cookie should be set by the server (via `cookies().set()` in a server action) with `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, and a short `maxAge`.

### 5.3 Test suite quality — **C+**

| Test type | Coverage | Quality |
|---|---|---|
| DB schema (PGlite) | Excellent | Tests CHECK, triggers, RLS for anon + authenticated + own-profile. Best-in-class for a small project. |
| Supabase client/middleware | Good | Mocks `@supabase/ssr` and `next/headers`. Covers env-var validation, redirect logic, cookie helpers. |
| Component unit tests | Adequate | `SummaryStats` and `PivotTabs` have the 3 tests the spec required. No tests for `BudgetEntryList`, `SearchFilter`, `ClientFilters`, `Header`, `EntryForm`, `EntryTable`. |
| Server action tests | **Broken** | 9/9 fail because the action dynamically imports `next/headers` which is not mocked. |
| E2E (Playwright) | Good coverage, 1 stale test | 9 tests covering public homepage (5), auth flow (3), admin CRUD (1). The auth-flow "Valid Login" test has a stale selector. |

**Missing coverage:**
- No test for the empty state of `BudgetEntryList` (the component has the code, just no test).
- No test for the `> 7 tabs → dropdown` behavior in a real render (the unit test mocks it, but the integration is untested).
- No test for negative-balance rendering on the public homepage (the unit test covers the component, but the page-level integration is untested).
- No test for the print layout on the admin page (only the public homepage is tested).
- No test for the `revalidatePath` calls actually invalidating the cache (the test only checks that `revalidatePath` was called).
- The `scratch/` directory contains a `test-crud.test.ts` that runs in the production test suite and writes to `console.log`. It should be excluded from `vitest.config.ts` (currently only `tests` is excluded).

### 5.4 Code quality — **C+**

**Strengths:**
- TypeScript strict mode is on.
- Zod schema is the single source of truth for validation, used on both client and server.
- Server actions return a discriminated union (`ActionResponse<T>`) — clean API for the client.
- `lib/data/entries.ts` gracefully falls back to mock data on DB errors, with `console.warn` for observability.
- Currency formatting is centralized (sort of — duplicated in `SummaryStats`, `BudgetEntryList`, `EntryTable` — see below).

**Weaknesses:**

1. **Debug `console.log` in production code** — `app/admin/components/EntryForm.tsx:58, 92, 94`:
   ```ts
   console.log('ONSUBMIT CALLED');
   console.log('RESPONSE:', response);
   console.log('CALLING ROUTER PUSH /admin');
   ```
   These will appear in the browser console in production. Remove before deploy.

2. **Dynamic `import('next/headers')` inside server actions** — `app/actions/entries.ts:16, 98, 176`. The same 30-line block is copy-pasted three times. Should be extracted to a helper (`lib/auth/getAuthenticatedUser.ts`) that returns `{ user, supabase }` and handles the E2E mock in one place. This would also fix the test failure (the helper can be mocked).

3. **Currency formatting duplicated in 3 components** — `SummaryStats.tsx:36`, `BudgetEntryList.tsx:31`, `EntryTable.tsx:32` all define their own `formatAmount(centavos)` function. Should be a single `lib/format/currency.ts` export.

4. **Date formatting duplicated in 2 components** — `BudgetEntryList.tsx:16` and `EntryTable.tsx:17` both define `formatDate(dateStr)`. Same fix.

5. **`'use client'` on `SummaryStats`** — only needed for the `useEffect` that formats the current date. Could be a server component if the date is passed as a prop.

6. **`createClient()` called in component body** — `app/admin/components/AdminHeader.tsx:10` creates a new Supabase client on every render. Move into the `handleLogout` callback.

7. **Empty `if` block** — `app/admin/edit/[id]/page.tsx:22-23`:
   ```ts
   if (isE2e && mockAuth) {
     // E2E Mock Session
   } else { ... }
   ```
   The comment-only branch is a smell. Replace with `if (!isE2e || !mockAuth) { ... }`.

8. **`as unknown as BudgetEntry[]`** — `app/sandbox/page.tsx:113` casts a mock array with the wrong shape (missing `semester`, `academic_year`, `entered_by`, `created_at`, `updated_at`, `notes`) to `BudgetEntry[]`. The sandbox page is a dev tool, but it should either use the real mock data from `lib/data/entries.ts` or be deleted.

9. **`AGENTS.md` references a non-existent docs directory** — `AGENTS.md:4` says "Read the relevant guide in `node_modules/next/dist/docs/`". That directory does not exist in the npm-distributed `next@15.5.20` package. The warning is a generic "don't trust your training data" prompt, but the specific path is wrong and will confuse any agent (human or AI) who tries to follow it.

10. **README.md is the default create-next-app template** — mentions Geist font, `next/font`, and the Vercel deploy button. None of these are used. Should be replaced with project-specific setup instructions.

11. **`eslint.config.mjs` ignores `scratch/**`** — but `vitest.config.ts` does not. So `scratch/test-crud.test.ts` runs in the test suite. Add `'scratch/**'` to `vitest.config.ts` `exclude`.

### 5.5 Performance — **B**

**Bundle sizes (from `next build`):**

| Route | Size | First Load JS |
|---|---|---|
| `/` | 3.16 kB | 109 kB |
| `/admin` | 2.93 kB | 173 kB |
| `/admin/new` | 134 B | 187 kB |
| `/admin/edit/[id]` | 134 B | 187 kB |
| `/login` | 1.88 kB | 172 kB |
| `/sandbox` | 3.29 kB | 109 kB |
| Middleware | 90.8 kB | — |

**Observations:**

- The admin routes are 60 kB heavier than the public route (`187 kB` vs `109 kB`) because `EntryForm` + `EntryTable` + `AdminHeader` all ship to the client. The form could be a server component with a small client island for the toggle/buttons, but the current client-component approach is fine for an admin panel with one user.
- Middleware is 90.8 kB — large, because `@supabase/supabase-js` is bundled in. The Edge Runtime warning (§3.3) is related. Consider using `@supabase/ssr`'s `createServerClient` directly without pulling the full `supabase-js` surface area.
- The homepage sets `dynamic = 'force-dynamic'`, so it cannot be statically rendered. Every visit hits Supabase. For a low-traffic council portal this is fine, but you lose CDN caching. Consider `revalidate = 60` (ISR) instead.
- `getEntries`, `getSummaryStats`, `getSemesters`, `getCategories` are called in parallel with `Promise.all` — good.
- `getCategories` and `getSemesters` fetch all rows to dedupe client-side. Better: `SELECT DISTINCT semester FROM budget_entries` — one row per semester instead of N rows.
- The `ClientFilters` component debounces search input by 300ms — good. But it uses `useTransition` + `router.push`, which causes a full server round-trip on every keystroke (after debounce). For a low-traffic site this is fine.
- No image optimization concerns (no images).
- No font optimization concerns (`Segoe UI` is system-installed; no `next/font` call).

---

## 6. Fix plans (prioritized)

### P0 — Critical security (must fix before any deploy)

#### Fix P0-1 — Remove the E2E mock-auth backdoor from production code paths

**Severity:** Critical (S1, S3, S4)
**Files:** `lib/supabase/middleware.ts`, `app/login/page.tsx`, `app/actions/entries.ts`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx`, `.env.local`, `.env.example` (new)

**Strategy:** Confine the mock-auth logic to a single server-side helper gated by a **non-public** env var, and never let it ship to production. The Playwright tests already pass with real Supabase Auth (the E2E mock was a workaround for not having a test Supabase project — but the `.env.local` shows you DO have a real project, so the mock is unnecessary).

**Step 1 — Create `lib/auth/session.ts`:**

```ts
// lib/auth/session.ts
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type Officer = { id: string; email: string }

/**
 * Returns the authenticated officer, or null.
 * Server-only. Never call from a client component.
 *
 * The E2E mock path is gated by a NON-public env var (IS_E2E, no NEXT_PUBLIC_
 * prefix) so it can never leak into the client bundle. The mock is only
 * active when IS_E2E=true AND the sb-mock-auth cookie is set, AND only on
 * the server.
 */
export async function getOfficer(): Promise<Officer | null> {
  // E2E mock — server-only, never in client bundle
  if (process.env.IS_E2E === 'true') {
    const cookieStore = await cookies()
    if (cookieStore.get('sb-mock-auth')?.value === 'true') {
      return {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        email: 'jane.doe@csu.edu.ph',
      }
    }
  }

  // Real auth path
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email ?? '' }
  } catch {
    return null
  }
}
```

**Step 2 — Replace the backdoor in middleware:**

```ts
// lib/supabase/middleware.ts — replace lines 37-54 with:
let user: { id: string; email?: string } | null = null
try {
  const { data } = await supabase.auth.getUser()
  user = data.user
} catch {
  user = null
}

// E2E mock — server-only, gated by IS_E2E (no NEXT_PUBLIC_ prefix)
if (!user && process.env.IS_E2E === 'true' &&
    request.cookies.get('sb-mock-auth')?.value === 'true') {
  user = { id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', email: 'jane.doe@csu.edu.ph' }
}
```

Note: `process.env.IS_E2E` (no `NEXT_PUBLIC_`) is **not** inlined into the client bundle. It is evaluated at request time on the server. Setting it in Vercel's production environment variables would still enable the backdoor, but it would not be inspectable in the client JS, and you simply would not set it in production.

**Step 3 — Remove the client-side backdoor in `app/login/page.tsx`:**

Delete lines 29-39 entirely. The login form should only call `supabase.auth.signInWithPassword`. The E2E test can instead plant the `sb-mock-auth` cookie directly via Playwright's `context.addCookies()`, OR you can run the E2E test against a real Supabase Auth user (which `.env.local` already has).

**Step 4 — Remove the service-role escalation in server actions:**

In `app/actions/entries.ts`, replace the entire `if (isE2e && mockAuth) { ... createServerClient with service role ... }` blocks (lines 23-34, 103-113, 181-191) with a single call to `getOfficer()`. If the officer is null, return `{ success: false, error: 'Unauthorized' }`. The server action should ALWAYS use the regular server client (anon key + user's auth cookie), so RLS applies. The E2E test should work because the middleware-refreshed cookie will carry the anon-key-authenticated session — but if you keep the mock path, the action will hit RLS denial because there is no real Supabase session. To make the E2E test work without the service role, you have two options:

  a) Create a real Supabase Auth user `jane.doe@csu.edu.ph` with password `Password123!` (you already have `scratch/create-test-user.ts` for this), and have the Playwright test do a real `signInWithPassword`. This is the cleanest path.
  b) Keep the mock path but use the **anon key** client (not service role). RLS will deny writes because the mock user is not really authenticated. You would need to add a Supabase Auth override or a custom claim — too complex for the value.

Recommend **(a)**: delete the service-role path entirely, create the real Supabase user, and the E2E test works through real auth.

**Step 5 — Update admin pages to use `getOfficer()`:**

Replace the `isE2e && mockAuth` blocks in `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx` with:

```ts
const officer = await getOfficer()
if (!officer) redirect('/login')
```

**Step 6 — Fix `.env.local` and create `.env.example`:**

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ikoogqwigvfylwjatids.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key only>
# IS_E2E is set ONLY in CI/test environments, never in production.
# It is NOT prefixed with NEXT_PUBLIC_ so it stays server-side.
IS_E2E=true
# SUPABASE_SERVICE_ROLE_KEY must NOT be present in production.
# It is only needed for local DB seeding scripts.
SUPABASE_SERVICE_ROLE_KEY=<service role key — keep local only>
```

`.env.example` (new file, committed):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: enable E2E mock auth in test environments (server-side only)
# IS_E2E=true
```

**Step 7 — Rotate the leaked service role key:**

Go to the Supabase dashboard for project `ikoogqwigvfylwjatids` → Settings → API → Reset `service_role` key. The key in the zip is now compromised. Update your local `.env.local` with the new key.

**Verification:**

```bash
# After fixes:
npm run build
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/   # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/  # should return nothing
grep -r 'Password123' .next/static/          # should return nothing
npx playwright test                           # all 9 should pass
```

#### Fix P0-2 — Rotate the leaked Supabase service role key

**Severity:** Critical (S2)
**Action:** Immediate, regardless of code fixes.

1. Supabase dashboard → project `ikoogqwigvfylwjatids` → Settings → API → "Reset service_role key".
2. Update local `.env.local` with the new key.
3. Redeploy any environment that had the old key.
4. Audit the `budget_entries` and `profiles` tables for unauthorized changes (the `created_at` and `updated_at` columns help). The Supabase dashboard → Logs → Postgres logs will show any service-role queries.

### P1 — Functional failures

#### Fix P1-1 — Fix the 9 failing server-action unit tests

**Severity:** High (blocks Task 4 acceptance criterion)
**Files:** `app/actions/entries.ts`, `app/actions/entries.test.ts`

**Root cause:** The action calls `await import('next/headers')` dynamically. The test does not mock `next/headers`. When `cookies()` is called outside a Next.js request scope, it throws.

**Fix (two options):**

**Option A (preferred): Extract a helper, mock the helper.**

Create `lib/auth/session.ts` (see P0-1) that exports `getOfficer()`. The server actions call `getOfficer()` instead of touching `next/headers` directly. The test mocks `lib/auth/session`:

```ts
// app/actions/entries.test.ts
vi.mock('../../lib/auth/session', () => ({
  getOfficer: vi.fn(),
}))

import { getOfficer } from '../../lib/auth/session'

beforeEach(() => {
  vi.clearAllMocks()
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null) // default: unauth
})

it('rejects unauthenticated createEntry', async () => {
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  const result = await createEntry({ ... })
  expect(result.success).toBe(false)
})

it('creates entry with authenticated user', async () => {
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-uuid', email: 'u@e.ph' })
  currentMockQuery = new MockQuery(mockResult)
  const result = await createEntry({ ... })
  expect(result.success).toBe(true)
})
```

This eliminates the dynamic import, the service-role escalation, and the test failure in one stroke.

**Option B (minimal): Add `next/headers` mock to the test file.**

```ts
// app/actions/entries.test.ts — add at the top:
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    get: () => undefined,
    set: vi.fn(),
  })),
}))
```

This makes the tests pass but does not fix the underlying smell. Recommend Option A.

#### Fix P1-2 — Fix the failing Playwright `auth-flow.spec.ts > Valid Login` test

**Severity:** High (blocks Task 7 acceptance criterion)
**Files:** `tests/auth-flow.spec.ts`

The test expects an `<h2>` containing "Welcome" and "Jane Doe", but the admin page has no such element. The officer's name is in a `<span>` next to the `<h1>` "Officer Dashboard".

**Fix:** Update the test to match the actual implementation:

```ts
// tests/auth-flow.spec.ts:50-53 — replace with:
const h1 = page.locator('h1');
await expect(h1).toContainText(/Officer Dashboard/i);
await expect(page.locator('text=Jane Doe')).toBeVisible();
```

(This matches what `admin-crud.spec.ts:18-20` already does, which passes.)

**Alternative:** If you intend the admin page to show "Welcome, Jane Doe", change the implementation instead. But the current "Officer Dashboard" + name-span pattern is fine — update the test.

#### Fix P1-3 — Fix the TypeScript error in `admin-crud.spec.ts`

**Severity:** Medium (breaks `tsc --noEmit` in CI)
**Files:** `tests/admin-crud.spec.ts:39`

```ts
// Current (line 32-41):
const rect = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="description-input"]');
  return el ? { ... } : null;
});
```

The `page.evaluate` returns `HTMLElement | null`, but `document.querySelector` returns `Element | null`. TypeScript complains. Fix:

```ts
const rect = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="description-input"]') as HTMLInputElement | null;
  return el ? { ... } : null;
});
```

**Better:** Delete the debug block entirely (lines 32-42). It was added during debugging and writes to `console.log`. The test does not assert on `rect`.

#### Fix P1-4 — Remove the unused `valErrors` variable

**Severity:** Low (lint warning)
**Files:** `tests/admin-crud.spec.ts:61`

```ts
// Current:
const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();

// Fix: delete the line, or assert on it:
const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();
expect(valErrors).toEqual([]); // no validation errors expected
```

### P2 — Design system & code quality

#### Fix P2-1 — Fix the reversed header padding

**Files:** `app/components/Header.tsx:12`

```tsx
// Current:
<header className="w-full h-12 ... px-margin md:px-margin-mobile">

// Fix (swap the classes):
<header className="w-full h-12 ... px-margin-mobile md:px-margin">
```

DESIGN.md: "24px margin on desktop / 16px on mobile". `px-margin` = 24px, `px-margin-mobile` = 16px. Mobile-first Tailwind: base class is mobile, `md:` overrides at desktop.

#### Fix P2-2 — Remove the active-tab underline

**Files:** `app/components/PivotTabs.tsx:112`

```tsx
// Current:
className={`pivot-tab focus:outline-none ${isActive ? 'pivot-tab-active font-bold border-b-2 border-primary' : ''}`}

// Fix:
className={`pivot-tab focus:outline-none ${isActive ? 'pivot-tab-active' : ''}`}
```

DESIGN.md: "No underline indicator — the color change is the indicator, per Content Before Chrome."

#### Fix P2-3 — Fix the Light-weight headline rendering

**Files:** `app/page.tsx:93`, `app/admin/page.tsx:63`, `app/admin/new/page.tsx:33`, `app/admin/edit/[id]/page.tsx:52`, `app/login/page.tsx:76`

The class `font-weight-headline-display` is not a real Tailwind utility — Tailwind v4 does not auto-generate `font-weight-*` utilities from arbitrary `--font-weight-*` theme variables. The headline renders at 400 (Regular) instead of 300 (Light).

**Fix (two options):**

**Option A — Add the utilities to `theme.css`:**

```css
/* In app/theme.css, inside the @theme block: */
--font-weight-headline-display: 300;
/* And add a utility class outside the block: */
.font-weight-headline-display { font-weight: 300; }
.font-weight-headline-lg { font-weight: 600; }
.font-weight-headline-md { font-weight: 600; }
.font-weight-headline-sm { font-weight: 600; }
.font-weight-body-sm-strong { font-weight: 600; }
.font-weight-stat-value { font-weight: 600; }
.font-weight-label-caps { font-weight: 600; }
.font-weight-display-xl { font-weight: 300; }
```

**Option B — Use Tailwind's built-in weight utilities:**

```tsx
// Replace font-weight-headline-display with:
className="font-headline-display text-headline-display font-light leading-headline-display tracking-tight"
// font-light = 300, font-semibold = 600, font-normal = 400
```

Recommend Option B — it uses Tailwind's standard utilities and is more portable.

#### Fix P2-4 — Remove the EntryForm card border

**Files:** `app/admin/components/EntryForm.tsx:115`

```tsx
// Current:
<form ... className="flex flex-col gap-lg bg-surface p-lg border border-outline w-full min-w-[300px] max-w-xl mx-auto" ...>

// Fix (remove border, keep surface fill for tonal separation):
<form ... className="flex flex-col gap-lg bg-surface p-lg w-full min-w-[300px] max-w-xl mx-auto" ...>
```

DESIGN.md: "Borders, where they appear, are 1px solid `colors.outline` — used for table row separators and input focus underlines, never for card outlines."

#### Fix P2-5 — Remove debug `console.log` from EntryForm

**Files:** `app/admin/components/EntryForm.tsx:58, 92, 94`

Delete these three lines:
```ts
console.log('ONSUBMIT CALLED');           // line 58
console.log('RESPONSE:', response);        // line 92
console.log('CALLING ROUTER PUSH /admin'); // line 94
```

#### Fix P2-6 — Extract currency and date formatters

**Files:** new `lib/format/currency.ts`, new `lib/format/date.ts`

```ts
// lib/format/currency.ts
export function formatCentavos(centavos: number, opts: { sign?: boolean } = {}): string {
  const isNegative = centavos < 0;
  const absValue = Math.abs(centavos) / 100;
  const formattedNum = absValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = opts.sign ? (isNegative ? '-' : '+') : (isNegative ? '-' : '');
  return `${prefix}₱${formattedNum}`;
}

// lib/format/date.ts
export function formatISODate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return iso;
  }
}
```

Then replace the three duplicate `formatAmount` functions in `SummaryStats.tsx`, `BudgetEntryList.tsx`, `EntryTable.tsx` and the two `formatDate` functions in `BudgetEntryList.tsx`, `EntryTable.tsx` with imports from these modules.

#### Fix P2-7 — Move `createClient()` out of the component body

**Files:** `app/admin/components/AdminHeader.tsx:10`

```tsx
// Current:
export default function AdminHeader() {
  const router = useRouter();
  const supabase = createClient(); // <-- new client every render
  const handleLogout = async () => { ... await supabase.auth.signOut(); ... };
}

// Fix:
export default function AdminHeader() {
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createClient(); // <-- only when needed
    try {
      await supabase.auth.signOut();
    } finally {
      startTransition(() => { router.push('/login'); router.refresh(); });
    }
  };
}
```

#### Fix P2-8 — Add `scratch/**` to vitest exclude

**Files:** `vitest.config.ts:10`

```ts
// Current:
exclude: ['node_modules', 'dist', '.next', 'tests'],

// Fix:
exclude: ['node_modules', 'dist', '.next', 'tests', 'scratch'],
```

#### Fix P2-9 — Fix the admin delete button color

**Files:** `app/admin/components/EntryTable.tsx:148`

```tsx
// Current:
className="btn-ghost flex items-center justify-center cursor-pointer text-body-sm h-10 px-sm select-none text-expense!"

// Fix (add a dedicated class in theme.css):
// In theme.css:
.btn-ghost-danger {
  background: transparent;
  color: var(--color-expense);
  font-family: var(--font-body-sm-strong);
  font-weight: var(--font-weight-body-sm-strong);
  border: 0;
  border-radius: 0;
  height: var(--spacing-touch-target);
  padding: 0 var(--spacing-md);
  cursor: pointer;
}
// In EntryTable.tsx:
className="btn-ghost-danger flex items-center justify-center cursor-pointer text-body-sm h-10 px-sm select-none"
```

Also bump `h-10` (40px) to `h-12` (48px) on the inline action buttons to meet the touch-target spec.

### P3 — Polish & docs

#### Fix P3-1 — Fix `AGENTS.md` to point to a real docs location

**Files:** `AGENTS.md:4`

The path `node_modules/next/dist/docs/` does not exist in the npm-distributed `next@15.5.20` package. Either:

- Remove the specific path and keep the generic warning:
  ```
  # This is NOT the Next.js you know
  This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Verify every API against the official Next.js docs (https://nextjs.org/docs) before writing any code. Heed deprecation notices.
  ```
- Or, if you actually have a custom Next.js build with bundled docs, verify the path and update it.

#### Fix P2-10 — Replace the default README.md

**Files:** `README.md`

The current README is the create-next-app template (mentions Geist, `next/font`, Vercel deploy button — none of which are used). Replace with project-specific setup:

```markdown
# CBEA Student Council Budget Transparency Portal

Public-facing budget transparency website for the CBEA Student Council at CSU-Aparri.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase credentials.
3. Run the SQL in `supabase/migration.sql` against your Supabase project (skip the `CREATE SCHEMA auth` block — that's for local PGlite tests only).
4. Optionally run `supabase/seed.sql` for sample data.
5. `npm run dev`

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test:db` — PGlite database tests
- `npm run test:e2e` — Playwright E2E tests
- `npx vitest run` — all unit tests

## Stack

Next.js 15 (App Router) · React 19 · Tailwind v4 · Supabase · Zod · Vitest · Playwright
```

#### Fix P3-2 — Split the migration for deployability

**Files:** `supabase/migration.sql`, `supabase/seed.local.sql` (new)

Move the `CREATE SCHEMA auth` and `auth.users` stubs into `supabase/seed.local.sql` so the production migration can be run in the Supabase SQL editor without errors.

#### Fix P3-3 — Add a `semester` index

**Files:** `supabase/migration.sql`

```sql
CREATE INDEX IF NOT EXISTS budget_entries_semester_idx ON public.budget_entries (semester);
CREATE INDEX IF NOT EXISTS budget_entries_semester_date_idx ON public.budget_entries (semester, date DESC);
```

The composite index covers the most common query (`WHERE semester = ? ORDER BY date DESC`).

#### Fix P3-4 — Add `created_at` to `profiles`

**Files:** `supabase/migration.sql`

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

Add a corresponding trigger (already exists via `update_profiles_updated_at`).

#### Fix P3-5 — Use `SELECT DISTINCT` for semesters and categories

**Files:** `lib/data/entries.ts:290-324`

```ts
// Current:
const { data, error } = await supabase.from('budget_entries').select('semester')
// ... then dedupe client-side with Array.from(new Set(...))

// Fix:
const { data, error } = await supabase
  .from('budget_entries')
  .select('semester')
  .order('semester', { ascending: true })
// Note: Supabase doesn't support SELECT DISTINCT directly in the JS client,
// but you can use a RPC or just keep the client-side dedupe.
// The client-side dedupe is fine for < 1k rows. For larger datasets,
// create a Postgres view and query that.
```

For a council portal with < 100 entries, the current approach is fine. Leave as-is unless you see perf issues.

#### Fix P3-6 — Add `revalidate` instead of `force-dynamic` on the homepage

**Files:** `app/page.tsx:9`

```ts
// Current:
export const dynamic = 'force-dynamic';

// Fix (ISR with 60-second revalidation):
export const revalidate = 60;
// And in HomepageContent, use next/headers cookies() to detect auth state
// for the header (admin link), but keep the data fetch server-side.
```

This lets Vercel CDN cache the homepage for 60 seconds, dramatically reducing Supabase load. The `revalidatePath` calls in server actions will still bust the cache immediately after a mutation.

---

## 7. Final grade summary

| Task | Grade | Weighted | Notes |
|---|---|---|---|
| 1. Scaffolding & Tailwind | A− | 9/10 | vitest failure is downstream |
| 2. DB schema & migration | A | 10/10 | Best-in-class PGlite tests |
| 3. Supabase client & middleware | D+ | 4/10 | Backdoor in middleware |
| 4. Server actions & CRUD | D | 3/10 | 9 failing tests + service-role escalation |
| 5. Shared UI components | B+ | 8/10 | Two design violations |
| 6. Public homepage | A− | 9/10 | Font-weight drift |
| 7. Officer authentication | D | 3/10 | Backdoor in login + stale test |
| 8. Admin dashboard & CRUD | B | 7/10 | Works, but design violations + debug logs |
| **Cross-cutting: security** | F | 0/20 | S1 + S2 are critical |
| **Cross-cutting: design system** | B | 6/10 | Faithful port, 6 violations |
| **Cross-cutting: test suite** | C+ | 5/10 | 9 vitest + 1 playwright fail |
| **Cross-cutting: code quality** | C+ | 5/10 | Debug logs, duplication, dynamic imports |
| **Cross-cutting: performance** | B | 7/10 | Fine for scale, some optimizations available |
| **TOTAL** | | **56/100 (F)** | |

**To reach a B (78/100):**
1. Fix P0-1 (backdoor) — adds ~15 points
2. Fix P0-2 (rotate key) — adds ~3 points
3. Fix P1-1 (server action tests) — adds ~3 points
4. Fix P1-2 (auth-flow test) — adds ~1 point
5. Fix P2-5 (debug logs) — adds ~1 point

**To reach an A (90/100):**
6. Fix all P2 design violations — adds ~6 points
7. Fix P3 polish items — adds ~5 points

---

## 8. What is genuinely good

Despite the critical security findings, this project has real strengths that should not be lost in the fixes:

1. **The design system port is excellent.** `theme.css` is byte-identical to the design package, the token names are consistent, and the component utility classes (`.stat-card`, `.budget-entry`, `.pivot-tab`, etc.) are well-named and faithfully implement the DESIGN.md spec. The print styles and reduced-motion support are correct.

2. **The database tests are best-in-class for a project this size.** Using PGlite to run the real migration + seed + RLS tests in-memory is a genuinely clever approach. The tests cover CHECK constraints, triggers, anon/authenticated RLS, and own-profile enforcement. This is the kind of test suite I would expect from a senior engineer.

3. **The currency-as-centavos pattern is correctly implemented end-to-end.** Storage is `bigint`, the schema has `CHECK (amount >= 0)`, the server action uses `Math.round(amount * 100)`, the edit page divides by 100 to rehydrate the form, and the display components format with `tabular-nums`. This is the right way to handle money in a JavaScript stack.

4. **The URL-driven filter state is correct.** `ClientFilters` uses `useRouter` + `useSearchParams` + `startTransition` to keep the URL as the source of truth, with a 300ms debounce on search input. This makes the homepage bookmarkable and SEO-friendly, exactly as the spec demanded.

5. **The inline delete confirmation is Metro-compliant and well-executed.** No modal, no `window.confirm` — just a state swap that replaces the Delete button with "Confirm Delete?" + "Cancel" inline. The Playwright test exercises both the confirm and cancel paths.

6. **The RLS policies are correct.** Public SELECT on both tables, authenticated INSERT/UPDATE/DELETE on `budget_entries`, own-profile UPDATE on `profiles`. The `entered_by` foreign key with `ON DELETE SET NULL` is the right choice (preserves audit trail when an officer leaves).

7. **The Zod schema is the single source of truth.** Both the client (`EntryForm.tsx:70`) and the server (`entries.ts:44`) use the same `BudgetEntrySchema` from `lib/types.ts`. No drift.

8. **The `ActionResponse<T>` discriminated union is a clean API.** `EntryForm` handles `success: true` and `success: false` with `validationErrors` correctly. This is the right pattern for server actions.

These strengths are why the project is worth fixing rather than rewriting. The bones are good. The security layer needs to be ripped out and replaced, and the tests need to be unblocked, but the design, data model, and component architecture are sound.
