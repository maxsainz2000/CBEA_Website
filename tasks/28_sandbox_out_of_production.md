# Task 28: Move Sandbox Page Out of Production Build

## Objective
Remove the sandbox page (`app/sandbox/page.tsx`) from the production build. The sandbox is a dev-only component showcase that ships in the production bundle (3.11 kB page chunk + 109 kB First Load JS), adding unnecessary weight and exposing internal component demos to end users. The recommended approach is to delete the page entirely — the components it showcases are already tested via 28 unit tests (Task 24). Alternatively, move it to a route group excluded from production.

## Audit Reference
- **Findings:** P2-2 (LOW), code quality §5.4 item 2
- **Severity:** LOW (dev-only page ships in production)
- **Current grade impact:** +0 points (quality improvement, not grade-changing).
- **Source:** AUDIT-v3 §7 Fix P2-2.

## Files Created / Modified

**Option A (Recommended — Delete):**
- [DELETE] [app/sandbox/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/sandbox/page.tsx)

**Option B (Move to dev route group):**
- [DELETE] [app/sandbox/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/sandbox/page.tsx)
- [NEW] `app/(dev)/sandbox/page.tsx`
- [MODIFY] [next.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/next.config.ts)

## Step-by-Step Instructions

### Option A — Delete the sandbox page (Recommended)

#### 1. Delete the file

```bash
rm app/sandbox/page.tsx
```

Or delete the entire directory if `app/sandbox/` has no other files:

```bash
rm -rf app/sandbox/
```

#### 2. Verify the build

```bash
npm run build
```

**Expected:** The build succeeds. The `/sandbox` route is no longer listed in the build output. The `○ /sandbox` line should be gone.

#### 3. Verify tests

```bash
npx vitest run
npx tsc --noEmit
```

If any test imports from the sandbox page, remove or update the import.

---

### Option B — Move to dev route group

#### 1. Create the dev route group directory

```bash
mkdir -p "app/(dev)/sandbox"
```

#### 2. Move the file

```bash
mv app/sandbox/page.tsx "app/(dev)/sandbox/page.tsx"
```

#### 3. Update `next.config.ts` to exclude from production

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

**Note:** Check the current Next.js 15 docs to verify the `experimental.exclude` API is available and its exact syntax.

#### 4. Verify the build

```bash
npm run build
```

**Expected:** The `/sandbox` route is NOT in the production build output.

#### 5. Verify dev server

```bash
npm run dev
# Navigate to http://localhost:3000/sandbox — should still render.
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Build hygiene:** Removing dev-only pages from the production build reduces the attack surface and the bundle size (saves ~3 kB page chunk + shared route overhead).
- **Testing note:** The components showcased by the sandbox (`PivotTabs`, `SummaryStats`, `BudgetEntryList`, `SearchFilter`, etc.) are already covered by 28 component unit tests (Task 24). The sandbox is a visual demo, not a test — it is redundant.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Type check (verify no broken imports):
npx tsc --noEmit

# Unit tests:
npx vitest run

# Build (verify /sandbox is gone from production output):
npm run build
```

### Build Output Verification
After `npm run build`, the route table should NOT include `/sandbox`:
```
Route (app)                                 Size  First Load JS
┌ ƒ /                                    2.78 kB         109 kB
├ ○ /_not-found                            990 B         103 kB
├ ƒ /admin                               2.88 kB         174 kB
├ ƒ /admin/edit/[id]                       133 B         187 kB
├ ƒ /admin/new                             134 B         187 kB
└ ○ /login                               1.61 kB         172 kB
                                                  ← no /sandbox
```

### Manual Verification
- (Option A) Navigate to `/sandbox` — should return 404.
- (Option B) Navigate to `/sandbox` in dev mode — should render. In production build — should return 404.

## Acceptance Criteria
- [x] Sandbox page is either deleted from `app/sandbox/` or moved to `app/(dev)/sandbox/` (excluded from production).
- [x] `npm run build` succeeds.
- [x] Production build output does NOT include the `/sandbox` route.
- [ ] (Option B only) Dev server (`npm run dev`) still serves `/sandbox`.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx vitest run` passes.
