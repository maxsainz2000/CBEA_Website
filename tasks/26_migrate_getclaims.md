# Task 26: Migrate from `getUser()` to `getClaims()`

## Objective
Replace `supabase.auth.getUser()` with `supabase.auth.getClaims()` for page protection and middleware auth checks. The current Supabase Next.js SSR documentation recommends `getClaims()` as the default for protecting pages: "Always use `supabase.auth.getClaims()` to protect pages and user data." `getClaims()` validates JWT signatures locally via WebCrypto against the project's published JWKS — no network round-trip to Supabase Auth per request. The project uses `getUser()` which is correct and safe but slower (makes a network round-trip on every authenticated request).

## Audit Reference
- **Findings:** N12 (MEDIUM)
- **Severity:** MEDIUM (correct/safe but slower than the recommended pattern)
- **Current grade impact:** +1 point toward the target grade.
- **Sources:**
  - [Supabase Next.js SSR guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — current `getClaims()` guidance.
  - AUDIT-v3 §6 Finding S12, §7 N12 — full write-up.

## Files Created / Modified
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [lib/supabase/supabase.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/supabase.test.ts) (update mocks from `getUser` to `getClaims`)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) (update mocks if `getOfficerAndClient` changes shape)

## Step-by-Step Instructions

### 0. Pre-flight: Verify JWT signing key type

Before migrating, verify the Supabase project uses **asymmetric signing keys (RS256)**:

1. Supabase dashboard → project `ikoogqwigvfylwjatids` → Settings → API → JWT Settings.
2. If the signing algorithm is **RS256** (asymmetric), `getClaims()` validates locally via WebCrypto — full benefit.
3. If the signing algorithm is **HS256** (symmetric), `getClaims()` falls back to a `getUser()` network call — no latency benefit but still aligns with current guidance.

### 1. Update `lib/supabase/middleware.ts`

Find the current `getUser()` call in `updateSession()`:

```ts
// Current (REPLACE):
const { data } = await supabase.auth.getUser()
```

Replace with `getClaims()`:

```ts
// New:
let user: { id: string; email?: string } | null = null
try {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) {
    user = null
  } else {
    user = { id: data.sub, email: data.email }
  }
} catch {
  user = null
}
```

Update the downstream logic that uses `data.user` to use the new `user` object instead. The middleware redirect logic (`if (!user && req.nextUrl.pathname.startsWith('/admin'))`) should work the same way.

### 2. Update `lib/auth/session.ts` — `getOfficer()`

Find the current implementation:

```ts
// Current (REPLACE):
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email ?? '' }
}
```

Replace with:

```ts
// New:
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
```

### 3. Update `lib/auth/session.ts` — `getOfficerAndClient()`

Find the current implementation:

```ts
// Current (REPLACE):
export async function getOfficerAndClient(): Promise<{
  officer: Officer | null;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return { officer: null, supabase }
  return {
    officer: { id: data.user.id, email: data.user.email ?? '' },
    supabase,
  }
}
```

Replace with:

```ts
// New:
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

**Key differences from `getUser()`:**
- `getClaims()` returns `data.sub` (the user's UUID) instead of `data.user.id`.
- `getClaims()` returns `data.email` instead of `data.user.email`.
- The response shape is flat claims (JWT payload), not a nested `{ user: { id, email, ... } }` object.

### 4. Verify admin page profile queries still work

The admin pages fetch the officer's profile via a Supabase query:

```ts
// app/admin/page.tsx:27-32 — this does NOT need to change
const supabase = await createClient();
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, role')
  .eq('id', officer.id)
  .maybeSingle();
```

This is fine — `officer.id` now comes from `getClaims().sub` (which is the same UUID as `getUser().user.id`). No change needed here.

### 5. Update test mocks

#### `lib/supabase/supabase.test.ts`

Update any mocks that reference `supabase.auth.getUser()` to instead mock `supabase.auth.getClaims()`:

```ts
// Old mock shape:
auth: {
  getUser: vi.fn().mockResolvedValue({
    data: { user: { id: 'user-uuid', email: 'u@e.ph' } },
    error: null,
  }),
}

// New mock shape:
auth: {
  getClaims: vi.fn().mockResolvedValue({
    data: { sub: 'user-uuid', email: 'u@e.ph' },
    error: null,
  }),
}
```

#### `app/actions/entries.test.ts`

This file mocks `lib/auth/session.getOfficerAndClient`. The mock return shape (`{ officer: { id, email }, supabase }`) does **not** change — only the internal implementation of `getOfficerAndClient` changed. The test should still pass as-is if it mocks at the `session` module level. Verify and update if needed.

### 6. Run the full test suite

```bash
npx tsc --noEmit           # 0 errors
npx vitest run             # all tests pass (with updated mocks)
npx playwright test        # all tests pass (real auth flow)
npm run build              # succeeds
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Auth best practice:** `getClaims()` is the current Supabase-recommended default for page protection. `getUser()` is still valid for fetching a fresh, server-confirmed user record (e.g., after a recent profile change) but is no longer the recommended first choice.
- **Performance:** Eliminates a network round-trip to Supabase Auth on every authenticated request. For a low-traffic council portal, the latency difference is negligible — but it reduces consumption of Supabase Auth rate limits on the free tier.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Type check (verify getClaims API types resolve):
npx tsc --noEmit

# Unit tests (with updated mocks):
npx vitest run

# E2E tests (real auth flow — verifies getClaims works end-to-end):
npx playwright test

# Build:
npm run build
```

### Manual Verification
- Start the dev server (`npm run dev`) and verify:
  - Login as `jane.doe@csu.edu.ph` — admin page loads with the officer's name and role.
  - CRUD operations work (create, edit, delete an entry).
  - Unauthenticated `/admin` → redirect to `/login`.
  - `curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin` → 307 → `/login`.
- Verify the Supabase project uses asymmetric signing keys (dashboard → Settings → API → JWT Settings).

## Acceptance Criteria
- [x] `lib/auth/session.ts` uses `getClaims()` instead of `getUser()` in both `getOfficer()` and `getOfficerAndClient()`.
- [x] `lib/supabase/middleware.ts` uses `getClaims()` instead of `getUser()` in `updateSession()`.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx vitest run` passes (all mocks updated).
- [x] `npx playwright test` passes (real auth flow).
- [x] Login flow works end-to-end (manual verification).
- [x] Admin CRUD works end-to-end (manual verification).
- [x] Verified the Supabase project uses symmetric signing keys (HS256).
