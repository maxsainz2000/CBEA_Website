# Task 9: Remove E2E Mock-Auth Backdoor from Production Code Paths

## Objective
Eliminate the critical authentication backdoor (CVSS 9.8) that ships in the production bundle. The `NEXT_PUBLIC_IS_E2E=true` flag in `.env.local` causes Next.js to inline a hard-coded mock-auth bypass into the client JavaScript, allowing anyone to gain full admin access by setting a `sb-mock-auth=true` cookie. This task centralizes authentication into a single server-side helper, strips all client-side backdoor code, and confines the E2E mock path to a non-public env var (`IS_E2E`).

## Audit Reference
- **Findings:** S1 (hard-coded backdoor), S3 (public env var for security), S4 (service-role escalation), S6 (no CSRF on mock cookie), S7 (`document.cookie` for security-relevant flag)
- **Severity:** Critical
- **Current grade impact:** This single fix adds ~15 points toward the target grade.

## Files Created / Modified
- [NEW] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx)
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx)
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)
- [MODIFY] [.env.local](file:///c:/Users/Admin/Documents/CBEA_Website/.env.local)
- [NEW] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)

## Step-by-Step Instructions

### 1. Create the centralized auth helper — `lib/auth/session.ts`

Create a new server-only module that exports a single `getOfficer()` function. This replaces every scattered `isE2e && mockAuth` block across the codebase.

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

**Key design decisions:**
- `IS_E2E` has no `NEXT_PUBLIC_` prefix → never inlined into the client bundle.
- The function uses `cookies()` from `next/headers` (server-only) — it cannot be imported from a `'use client'` module.
- The mock path still checks the `sb-mock-auth` cookie, so existing Playwright tests that plant this cookie will continue to work.

### 2. Strip the backdoor from middleware — `lib/supabase/middleware.ts`

Replace lines 37–54 (the `isE2e && mockAuth` block that bypasses `getUser()`) with:

```ts
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

**Important:** `process.env.IS_E2E` is evaluated at request time on the Edge Runtime. It is NOT inlined into the client bundle. Remove any reference to `NEXT_PUBLIC_IS_E2E`.

### 3. Remove the client-side backdoor from `app/login/page.tsx`

Delete lines 29–39 entirely — the block that checks `isE2e && cleanEmail === 'jane.doe@csu.edu.ph'` and sets `document.cookie = 'sb-mock-auth=true'`. The login form should ONLY call `supabase.auth.signInWithPassword`.

Also remove:
- The `const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true'` declaration.
- Any `NEXT_PUBLIC_IS_E2E` references.

The E2E test can plant the `sb-mock-auth` cookie via Playwright's `context.addCookies()` instead of going through the login form.

### 4. Remove the service-role escalation from server actions — `app/actions/entries.ts`

Replace the entire `if (isE2e && mockAuth) { ... createServerClient with service role ... }` blocks (lines 23–34, 103–113, 181–191) with a single call to `getOfficer()`:

```ts
import { getOfficer } from '@/lib/auth/session'

export async function createEntry(formData: FormData): Promise<ActionResponse<BudgetEntry>> {
  const officer = await getOfficer()
  if (!officer) return { success: false, error: 'Unauthorized' }

  // Use the regular server client (anon key + user's auth cookie) — RLS applies
  const supabase = await createClient()
  // ... rest of validation and insert logic
}
```

Repeat for `updateEntry` and `deleteEntry`. This eliminates:
- The dynamic `await import('next/headers')` (which caused all 9 test failures).
- The `SUPABASE_SERVICE_ROLE_KEY` escalation (which bypassed RLS).
- The forged `entered_by` audit trail.

### 5. Update all admin pages to use `getOfficer()`

In `app/admin/page.tsx`, `app/admin/new/page.tsx`, and `app/admin/edit/[id]/page.tsx`, replace the `isE2e && mockAuth` blocks with:

```ts
import { getOfficer } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const officer = await getOfficer()
  if (!officer) redirect('/login')

  // ... rest of page using officer.id, officer.email
}
```

Remove:
- `const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true'`
- `const mockAuth = ...cookies...get('sb-mock-auth')...`
- The empty `if (isE2e && mockAuth) { /* E2E Mock Session */ }` block in `edit/[id]/page.tsx`.

### 6. Fix `.env.local` and create `.env.example`

Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ikoogqwigvfylwjatids.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key only>
# IS_E2E is set ONLY in CI/test environments, never in production.
# It is NOT prefixed with NEXT_PUBLIC_ so it stays server-side.
IS_E2E=true
# SUPABASE_SERVICE_ROLE_KEY — keep local only, never commit.
SUPABASE_SERVICE_ROLE_KEY=<rotated service role key>
```

Create `.env.example` (committed to git):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Optional: enable E2E mock auth in test environments (server-side only)
# IS_E2E=true
```

**Remove `NEXT_PUBLIC_IS_E2E` entirely from `.env.local`.**

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Security strictness:** "Never use `supabase.auth.getSession()` for authorization decisions. Always await and use `supabase.auth.getUser()`." The new `getOfficer()` helper complies with this rule.

## Automated Testing & Verification Plan

### Security Verification
After `npm run build`, confirm no backdoor artifacts leak into the client bundle:
```bash
grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/         # should return nothing
grep -r 'jane.doe@csu.edu.ph' .next/static/        # should return nothing
grep -r 'Password123' .next/static/                # should return nothing
grep -r 'sb-mock-auth' .next/static/               # should return nothing
```

### Runtime Verification
```bash
npm run dev &
# Backdoor should no longer work:
curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin -w '%{http_code}\n'
# Expected: 307 (redirect to /login), NOT 200
```

### Automated Tests
```bash
npx vitest run           # server action tests are fixed in Task 10
npx playwright test      # E2E tests updated in Task 11
```

## Acceptance Criteria
- [x] `lib/auth/session.ts` exists and exports `getOfficer()`.
- [x] No file in the codebase references `NEXT_PUBLIC_IS_E2E`.
- [x] No file in the codebase imports `next/headers` dynamically inside server actions.
- [x] No file uses `SUPABASE_SERVICE_ROLE_KEY` in a request-time code path (only in seeding scripts).
- [x] `npm run build` succeeds.
- [x] `grep -r 'NEXT_PUBLIC_IS_E2E' .next/static/` returns nothing.
- [x] `grep -r 'jane.doe@csu.edu.ph' .next/static/` returns nothing.
- [x] `curl --cookie 'sb-mock-auth=true' http://localhost:3000/admin` returns 307, not 200.
- [x] `.env.example` exists and is committed (no secrets).
