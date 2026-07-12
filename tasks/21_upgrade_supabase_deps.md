# Task 21: Upgrade Supabase Dependencies

## Objective
Upgrade `@supabase/ssr` from `^0.5.2` to `^0.12.0` and `@supabase/supabase-js` from `^2.48.1` to `^2.90.0` (or later). This eliminates the Edge Runtime `process.version` warning that prints during every `next build`, picks up security patches, and closes the 7-minor-version gap on `@supabase/ssr`.

## Audit Reference
- **Findings:** N2 (MEDIUM), §6.6 Dependency Health
- **Severity:** MEDIUM (supply-chain risk, persistent build warning)
- **Current grade impact:** +1 point toward the target grade.
- **Sources:**
  - [supabase-js#1552](https://github.com/supabase/supabase-js/issues/1552) — Edge Runtime `process.version` warning, fixed in v2.90.0.
  - [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — current guidance.

## Files Created / Modified
- [MODIFY] [package.json](file:///c:/Users/Admin/Documents/CBEA_Website/package.json)
- [MODIFY] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts) (if API changed)
- [MODIFY] [lib/supabase/client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts) (if API changed)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts) (if API changed)

## Step-by-Step Instructions

### 1. Upgrade the packages

```bash
npm install @supabase/ssr@latest @supabase/supabase-js@latest
```

Or pin to specific versions:

```bash
npm install @supabase/ssr@^0.12.0 @supabase/supabase-js@^2.90.0
```

### 2. Audit breaking changes in `@supabase/ssr` 0.6+

The `@supabase/ssr` package had several minor versions with potential API changes. Check the following:

1. **`createServerClient` API** — Verify that the cookie handling API in `lib/supabase/server.ts` and `lib/supabase/middleware.ts` still works. The cookie getter/setter callback shape may have changed.

2. **`createBrowserClient` API** — Verify that `lib/supabase/client.ts` still works. This is less likely to have changed.

3. **Middleware pattern** — The current Supabase Next.js guidance may recommend a `proxy.ts` pattern with `supabase.auth.getClaims()` instead of the `middleware.ts` + `getUser()` approach. The existing `middleware.ts` approach is still supported and correct — the `proxy.ts` migration is optional.

### 3. Verify the build

```bash
npm run build
```

**Expected:** The Edge Runtime `process.version` warning should be **gone**:
```
# This warning should NO LONGER appear:
# ./node_modules/@supabase/supabase-js/dist/index.mjs
# A Node.js API is used (process.version at line: 27) which is not supported in the Edge Runtime.
```

### 4. Run the full test suite

```bash
npx tsc --noEmit           # 0 errors
npx vitest run             # all tests pass
npx playwright test        # all tests pass
```

### 5. If API changes are needed

If the `createServerClient` cookie API changed, update `lib/supabase/server.ts`:

```ts
// Check the current API shape:
// Old (0.5.x):
createServerClient(url, key, {
  cookies: {
    getAll() { return cookieStore.getAll(); },
    setAll(cookiesToSet) { ... }
  }
});

// New (0.12.x) — verify against the docs:
// The API may now use a different cookie adapter pattern.
// Check: https://supabase.com/docs/guides/auth/server-side/nextjs
```

Similarly for `lib/supabase/middleware.ts` — verify the cookie handling in the middleware client.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Supply-chain best practice:** Keep dependencies within 2-3 minor versions of the latest release. The current 7-minor-version gap on `@supabase/ssr` means the project is not receiving bug fixes or security patches.
- **Build hygiene:** Eliminating the Edge Runtime warning removes noise from the build output, making it easier to spot real issues.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Type check (verify no API changes broke types):
npx tsc --noEmit

# Unit tests:
npx vitest run

# E2E tests:
npx playwright test

# Build (verify Edge Runtime warning is gone):
npm run build
```

### Build Output Verification
After `npm run build`:
- The `process.version` warning should NOT appear.
- All routes should compile successfully.
- Bundle sizes should be similar (within ±5 kB).

### Manual Verification
- Start the dev server (`npm run dev`) and verify:
  - Login flow works end-to-end.
  - Admin CRUD works end-to-end.
  - Public homepage renders correctly.
- Check `package.json` to confirm the new version ranges.

## Acceptance Criteria
- [x] `package.json` has `@supabase/ssr` at `^0.12.0` or later.
- [x] `package.json` has `@supabase/supabase-js` at `^2.90.0` or later.
- [x] `npm run build` succeeds with **no** Edge Runtime `process.version` warning.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx vitest run` passes.
- [x] `npx playwright test` passes.
- [x] Login flow works end-to-end.
- [x] Admin CRUD works end-to-end.
