# Task 40: Wrap `createClient` in React `cache()`

## Objective
Wrap the `createClient` function in `lib/supabase/server.ts` with React's `cache()` helper to memoize the Supabase client per-request. Currently, every call to `createClient()` constructs a fresh `createServerClient(...)` instance. A single admin page render (`app/admin/page.tsx`) triggers 5+ Supabase client constructions (1 in `getOfficer`, 1 direct, 1 in `getSemesters`, 1 in `getEntries`, 1 in `getSummaryStats`). With `cache()`, all 5 calls collapse to 1. The Supabase Next.js SSR guide explicitly recommends this pattern.

## Audit Reference
- **Findings:** X11 (LOW, -0.25 pts)
- **Severity:** LOW (performance — unnecessary client construction overhead)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X11, §8.11 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts)

## Step-by-Step Instructions

### 1. Wrap `createClient` in `cache()`

Replace the entire `lib/supabase/server.ts` with:

```typescript
// lib/supabase/server.ts
import { cache } from 'react';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = cache(async () => {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method can be called from a Server Component.
          // This can be ignored since Middleware handles the session refresh.
        }
      },
    },
  });
});
```

### 2. Verify existing tests still pass

The `lib/supabase/supabase.test.ts` file mocks `@supabase/ssr` and `next/headers` directly, so wrapping in `cache()` should not affect test behavior. The `cache()` function is a React internal that is a no-op outside of a React Server Component render tree, so tests should pass unchanged.

**If tests fail** due to `cache` not being defined in the test environment, mock it:
```typescript
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: (fn: Function) => fn, // no-op in tests
  };
});
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Supabase Next.js SSR best practice:** "React's `cache()` function memoizes the result of a function call per-request. Wrap your `createClient` function in `cache()` to ensure you only create one Supabase client per request."
- **Performance improvement:** Reduces 5+ Supabase client constructions per admin page render to 1.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run all tests:
npx vitest run

# Type check:
npx tsc --noEmit

# Build:
npm run build
```

### Manual Verification
- Start the dev server (`npm run dev`), navigate to `/admin`.
- The page should load correctly — all data functions should work identically (they receive the same client instance via `cache()`).

## Acceptance Criteria
- [ ] `lib/supabase/server.ts` wraps `createClient` in `cache()` from `react`.
- [ ] `import { cache } from 'react'` is present at the top of the file.
- [ ] `npx vitest run` passes (all tests).
- [ ] `npx tsc --noEmit` reports 0 errors.
- [ ] `npm run build` succeeds.
