# CBEA Budget Transparency Portal — Audit Remediation Plan v3 (Session 4)

Remediate all findings from the [strict code audit v3](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v3.md) dated 2026-07-17. The post-remediation audit scored the project **89/100 (B+)** — the prior remediation (Tasks 17–24 in [implementation_plan_v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan_v2.md)) was fully applied and all 8 tasks verified, but 3 new findings (N12–N14) were discovered during the independent re-grade, plus 2 transitive CVEs (N15) and several minor polish items. This plan brings the project to production-readiness (**target: 91/100, A**).

## User Review Required

> [!CAUTION]
> **P1-3 (carryover) — Rotate the leaked Supabase service role key (MANUAL ACTION).** If the prior zip's `.env.local` contained a real `SUPABASE_SERVICE_ROLE_KEY` for project `ikoogqwigvfylwjatids`, it must be rotated immediately in the Supabase dashboard (Settings → API → Reset `service_role` key). This is a manual step — no code change required. This was flagged in AUDIT-v2 and carried over in the v3 audit.

> [!IMPORTANT]
> **`getClaims()` migration scope (Task 26).** The current Supabase Next.js SSR guidance recommends `supabase.auth.getClaims()` for protecting pages instead of `getUser()`. Two options:
> - **(a) Full migration** — Replace all `getUser()` calls in `session.ts` and `middleware.ts` with `getClaims()`. Recommended.
> - **(b) Middleware-only** — Keep `getUser()` in `session.ts` (for fresh user records) but migrate the middleware to `getClaims()`.
>
> Option (a) is recommended. The project has `@supabase/ssr@0.12.0` installed, which supports `getClaims()`. Verify the Supabase project uses asymmetric signing keys (RS256) in the dashboard → Settings → API → JWT Settings before migrating.

> [!WARNING]
> **Numbered task continuation.** Session 1 tasks were `01`–`08`. Session 2 tasks were `09`–`16`. Session 3 tasks were `17`–`24`. This plan continues with `25`–`30` to preserve traceability across sessions.

## Open Questions

1. **`getClaims()` scope** — Full migration (Option A) vs middleware-only (Option B)? (Recommended: Option A.)
2. **Expense red darkening** — Darken `#E51400` to `#C81000` (5.83:1 ratio) or a different shade? The Metro design system originally used `#E51400` as a signature color — darkening it is a minor visual deviation but improves the WCAG AA buffer from 0.24 to 1.33.
3. **Sandbox page** — Move to `app/(dev)/sandbox/` (excluded from production) or delete entirely? (Recommended: delete — components are tested via unit tests.)

---

## Proposed Changes

### P1 — High (should fix before production at scale)

#### Task 25 — Bump `@supabase/supabase-js` to >=2.110.5

Upgrade `@supabase/supabase-js` from `^2.110.2` to `^2.110.5` to eliminate the Edge Runtime `process.version` warning. The fix (PR #2522) replaces the direct `process.version` read with dynamic `globalThis` access. This is a 1-line `package.json` change that closes the N13 finding and gains +1 point toward the A threshold.

**Files:**
- [MODIFY] [package.json](file:///c:/Users/Admin/Documents/CBEA_Website/package.json)

**Audit findings addressed:** N13 (MEDIUM)

#### Task 26 — Migrate from `getUser()` to `getClaims()`

Replace `supabase.auth.getUser()` with `supabase.auth.getClaims()` for page protection and middleware auth checks. `getClaims()` validates JWT signatures locally via WebCrypto — no network round-trip to Supabase Auth per request. This aligns with the current Supabase Next.js SSR guidance.

**Files:**
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [lib/supabase/supabase.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/supabase.test.ts) (update mocks)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) (update mocks)

**Audit findings addressed:** N12 (MEDIUM)

---

### P2 — Medium (should fix in the next sprint)

#### Task 27 — Darken Expense Red for WCAG AA Buffer

Darken the expense red token from `#E51400` (4.74:1 contrast ratio — barely AA) to `#C81000` (5.83:1 — comfortable AA buffer). Update all three color tokens (`--color-expense`, `--color-error`, `--color-accent-red`) to stay in sync.

**Files:**
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)

**Audit findings addressed:** N14 (LOW)

#### Task 28 — Move Sandbox Page Out of Production Build

The sandbox page (`app/sandbox/page.tsx`) is a dev-only component showcase that ships in the production build (3.11 kB page chunk + 109 kB First Load JS). Either move it to a route group excluded from production or delete it entirely.

**Files:**
- [DELETE] [app/sandbox/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/sandbox/page.tsx) (if deleting)
- OR [NEW] `app/(dev)/sandbox/page.tsx` + [MODIFY] [next.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/next.config.ts) (if moving)

**Audit findings addressed:** P2-2 (LOW), code quality §5.4 item 2

#### Task 29 — Fix Layout Test Hydration Warning

Fix `app/layout.test.tsx` to not render `RootLayout` (which produces an `<html>` tag) inside jsdom's `<div>` container. Replace with a test that validates children rendering without the hydration warning.

**Files:**
- [MODIFY] [app/layout.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.test.tsx)

**Audit findings addressed:** P2-3 (LOW), code quality §5.4 item 1

---

### P3 — Low / Tech Debt (fix when convenient)

#### Task 30 — Use `requestAnimationFrame` for PivotTabs Focus

Replace `setTimeout(() => elementToFocus.focus(), 0)` with `requestAnimationFrame(() => elementToFocus.focus())` in `PivotTabs.tsx` for more reliable focus management during keyboard navigation.

**Files:**
- [MODIFY] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx)

**Audit findings addressed:** P3-5 (LOW), accessibility §5.8 item 2

---

### Monitor Only (no code change)

#### N15 — PostCSS Transitive CVE

2 moderate CVEs in transitive `postcss <8.5.10` (GHSA-qx2v-qp2m-jg93) bundled inside `next@15.5.20`. Very low practical exploitability — no user-controlled CSS input path. No viable fix without downgrading Next.js to v9.3.3 (not viable). Monitor [vercel/next.js releases](https://github.com/vercel/next.js/releases) for the postcss update.

**Audit findings addressed:** N15 (LOW)

---

## Verification Plan

### Automated Tests

After all tasks are complete, run the full quality gate:

```bash
npx tsc --noEmit                          # 0 errors
npx eslint './**/*.{ts,tsx}' --ignore-pattern 'node_modules/**' --ignore-pattern '.next/**' --ignore-pattern 'scratch/**' --ignore-pattern '.agents/**' --ignore-pattern 'agent/**'  # 0 warnings
npx vitest run                            # all tests pass (including updated mocks for getClaims)
npx playwright test --reporter=list       # all tests pass (via real auth)
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
```

### Build Warning Verification

```bash
# After Task 25, verify the Edge Runtime warning is gone:
npm run build
# The following warning should NO LONGER appear:
# ./node_modules/@supabase/supabase-js/dist/index.mjs
# A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.

grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs
# Should return nothing (or show the new globalThis-based access pattern).
```

### WCAG Contrast Verification

```bash
# After Task 27, verify the new expense red contrast ratio:
# Use https://webaim.org/resources/contrastchecker
# Foreground: #C81000, Background: #FFFFFF
# Expected ratio: ~5.83:1 (passes AA with 1.33 buffer)
```

### Manual Verification

- Verify the Supabase project uses asymmetric signing keys (dashboard → Settings → API → JWT Settings) before Task 26
- Login flow works end-to-end (after Task 26 getClaims migration)
- Admin CRUD works end-to-end
- `curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin` → should return **307 → /login**
- Verify the expense red color is visually readable and still "Metro red" (after Task 27)
- Verify `/sandbox` is no longer in the production build output (after Task 28)
- Verify `npx vitest run` produces no hydration warnings (after Task 29)

---

## Grade Projection

| Fix Group | Points Gained | Running Total |
|---|---|---|
| Baseline (post-Session 3) | — | 89/100 |
| Task 25 (bump supabase-js — N13) | +1 | **90/100 (A)** |
| Task 26 (getClaims migration — N12) | +1 | 91 |
| Task 27 (darken expense red — N14) | +0 (already passes AA) | 91 |
| Tasks 28–30 (quality/polish) | +0 (quality) | 91 |

**Minimum for A: Task 25 alone (+1 point → 90/100).**

---

## Cross-reference

| Document | Purpose |
|---|---|
| [AUDIT.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT.md) | First audit (56/100 F) |
| [implementation_plan.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan.md) | Session 2 remediation plan (Tasks 09–16) |
| [AUDIT-v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v2.md) | Post-remediation re-audit (83/100 B+) |
| [implementation_plan_v2.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan_v2.md) | Session 3 remediation plan (Tasks 17–24) |
| [AUDIT-v3.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v3.md) | Post-Session-3 re-audit (89/100 B+) |
| **This document** | Session 4 remediation plan (Tasks 25–30) |
