# Task 25: Bump `@supabase/supabase-js` to >=2.110.5

## Objective
Upgrade `@supabase/supabase-js` from `^2.110.2` to `^2.110.5` to eliminate the Edge Runtime `process.version` warning that prints during every `next build`. The installed v2.110.2 still contains a static `process.version` reference at line 27 of `dist/index.mjs` — guarded by `typeof process !== "undefined"` (runtime-safe but not static-safe). The actual fix was released in **v2.110.5** (2026-07-14, PR #2522), which replaces the direct `process.version` read with dynamic `globalThis` access.

## Audit Reference
- **Findings:** N13 (MEDIUM)
- **Severity:** MEDIUM (persistent build warning, supply-chain gap)
- **Current grade impact:** +1 point toward the A threshold (89 → 90).
- **Sources:**
  - [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552) — original Edge Runtime `process.version` issue.
  - [supabase-js PR #2522](https://github.com/supabase/supabase-js/pull/2522) — complete fix (dynamic `globalThis` access), merged 2026-07-14.
  - [supabase-js v2.110.5 release](https://github.com/supabase/supabase-js/releases/tag/v2.110.5) — released 2026-07-14.

## Files Created / Modified
- [MODIFY] [package.json](file:///c:/Users/Admin/Documents/CBEA_Website/package.json)

## Step-by-Step Instructions

### 1. Upgrade the package

```bash
npm install @supabase/supabase-js@^2.110.5
```

This updates the `@supabase/supabase-js` version range in `package.json` from `^2.110.2` to `^2.110.5` and installs the latest matching version.

### 2. Verify the fix in the installed source

```bash
grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs
```

**Expected:** No output (the literal `process.version` token is gone), or the new `globalThis`-based access pattern.

**If the old pattern persists:** The installed version is still <2.110.5. Check with:
```bash
node -e "console.log(require('./node_modules/@supabase/supabase-js/package.json').version)"
```

### 3. Verify the build

```bash
npm run build
```

**Expected:** The build succeeds and the following warning does **NOT** appear:
```
./node_modules/@supabase/supabase-js/dist/index.mjs
A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.
```

### 4. Run the full test suite

```bash
npx tsc --noEmit           # 0 errors
npx vitest run             # all tests pass
npm run build              # succeeds, no Edge Runtime warning
```

### 5. Manual smoke test

```bash
npm run dev
# Verify:
# - Homepage (/) loads correctly
# - Login flow works
# - Admin CRUD works
# - /admin without auth → redirect to /login
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Supply-chain best practice:** The project was 1 patch version behind the latest supabase-js fix. This closes that gap.
- **Build hygiene:** Eliminating the Edge Runtime warning removes noise from the build output, making it easier to spot real issues.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Type check:
npx tsc --noEmit

# Unit tests:
npx vitest run

# Build (verify Edge Runtime warning is gone):
npm run build

# E2E tests (with real Supabase creds):
npx playwright test
```

### Build Output Verification
After `npm run build`:
- The `process.version` warning should NOT appear.
- All routes should compile successfully.
- Bundle sizes should be similar to pre-upgrade (within ±5 kB).

### Manual Verification
- Start the dev server (`npm run dev`) and verify:
  - Login flow works end-to-end.
  - Admin CRUD works end-to-end.
  - Public homepage renders correctly.
- Check `package.json` to confirm the new version range.

## Acceptance Criteria
- [x] `package.json` has `@supabase/supabase-js` at `^2.110.5` or later.
- [x] `npm run build` succeeds with **no** Edge Runtime `process.version` warning.
- [x] `grep -n 'process.version' node_modules/@supabase/supabase-js/dist/index.mjs` returns nothing (or shows the new `globalThis` pattern).
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx vitest run` passes.
- [x] Login flow works end-to-end (manual verification with real Supabase creds).
- [x] Admin CRUD works end-to-end (manual verification).
