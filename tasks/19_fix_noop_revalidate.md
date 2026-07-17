# Task 19: Fix the No-Op `revalidate = 60` on Homepage

## Objective
Remove the misleading `export const revalidate = 60` from `app/page.tsx`. The homepage reads `searchParams` (a Dynamic API in Next.js 15), which forces dynamic rendering — the `revalidate` export is a complete no-op. The build output confirms this by marking `/` as `ƒ (Dynamic)`. This was a misdiagnosis in the prior remediation (Task 16), which replaced `force-dynamic` with `revalidate = 60` under the incorrect assumption that ISR would work with `searchParams`.

## Audit Reference
- **Findings:** N1 (HIGH)
- **Severity:** HIGH (misleading caching config, regression introduced by remediation Task 16)
- **Current grade impact:** +2 points toward the target grade.
- **Source:** [Next.js 15 route-segment-config docs](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-segment-config) — "`searchParams` is a Dynamic API; reading it forces dynamic rendering."

## Files Created / Modified
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)

## Step-by-Step Instructions

### 1. Remove the misleading `revalidate` export — `app/page.tsx`

Find line 9:

```ts
// Current (REMOVE — this is a no-op):
export const revalidate = 60;
```

**Option A (recommended): Remove the export entirely.**

Delete line 9. The page will be dynamically rendered because it reads `searchParams`. This is honest — no caching, every visit hits Supabase. For a low-traffic council portal, this is fine.

```ts
// (line deleted — no export needed)
```

**Option B: Revert to `force-dynamic`.**

```ts
export const dynamic = 'force-dynamic';
```

Same effect as Option A, but explicit. Slightly more readable — a developer immediately knows the page is dynamic.

**Option C (advanced, future): Adopt Partial Prerendering (PPR).**

```ts
export const experimental_ppr = true;
export const revalidate = 60;
```

Then ensure the `searchParams`-reading code is inside a `<Suspense>` boundary. The static shell (Header, hero, page title) is ISR-cached for 60 seconds; the dynamic part (filter-dependent data) streams at request time.

**Note:** PPR is experimental in Next.js 15. Only pursue when stable. **Use Option A for now.**

### 2. Add a code comment explaining the decision

After removing the export, add a brief comment at the top of the file (after imports) explaining why there is no caching config:

```ts
// This page reads searchParams (a Dynamic API in Next.js 15), which forces
// dynamic rendering. No ISR/revalidate is possible without PPR + Suspense.
// See AUDIT-v2 §7 N1 for details.
```

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Next.js 15 correctness:** `searchParams` is a Dynamic API. Reading it opts the page out of static rendering. The `revalidate` export only applies to statically-rendered pages. Setting `revalidate = 60` on a dynamically-rendered page is misleading — it suggests ISR caching that does not happen.
- **Task 16 correction:** The prior remediation's Task 16 recommended replacing `force-dynamic` with `revalidate = 60`. This was based on an incorrect understanding of how `searchParams` interacts with `revalidate` in Next.js 15. The prior `force-dynamic` was honest; the new `revalidate = 60` is misleading. This task corrects the regression.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All tests should still pass:
npx vitest run
npx playwright test

# Build should succeed:
npm run build
```

### Build Output Verification
After `npm run build`, check the route table:
- Route `/` should be marked `ƒ (Dynamic)` — confirming dynamic rendering.
- There should be **no** `ISR` or `revalidate: 60` annotation on the `/` route.

### Manual Verification
- Start the production build (`npm start`).
- Visit `/` — the page should render with live data from Supabase.
- The response should NOT have an `x-nextjs-cache: HIT` header (dynamic, not cached).

## Acceptance Criteria
- [x] `app/page.tsx` does NOT have `export const revalidate = 60`.
- [x] `app/page.tsx` either has no route-segment config export or has `export const dynamic = 'force-dynamic'`.
- [x] A code comment explains the decision (referencing AUDIT-v2 N1).
- [x] `npm run build` succeeds.
- [x] Build output marks `/` as `ƒ (Dynamic)`.
- [x] `npx vitest run` passes.
- [x] `npx playwright test` passes.
