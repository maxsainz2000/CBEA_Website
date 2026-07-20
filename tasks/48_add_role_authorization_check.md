# Task 48: Add Role/Authorization Check to Admin Pages

## Objective
Add a role/authorization check to `getOfficer()` in `lib/auth/session.ts` so it verifies the authenticated user has a `profiles` row with an authorized role (Treasurer, Auditor, President, Vice President, Secretary). Currently, `getOfficer()` returns `{ id, email }` from `supabase.auth.getClaims()` — authentication only, no authorization. Any Supabase-Authenticated user is treated as an "officer". For a transparency portal whose success criterion is "any CBEA student can find and understand budget info without asking an officer directly," allowing unauthorized users to publish fake budget entries defeats the entire purpose.

## Audit Reference
- **Findings:** Y1 (HIGH, -3 pts)
- **Severity:** HIGH (missing authorization — any authenticated user can publish budget entries)
- **Current grade impact:** +3 points.
- **Source:** AUDIT-v5 §6 finding Y1, §9 P0-1 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts) — add `AUTHORIZED_ROLES`, fetch profile, verify role
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — remove redundant profile fetch, use enriched Officer
- [MODIFY] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx) — use enriched Officer type
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx) — use enriched Officer type

## Step-by-Step Instructions

### 1. Update `getOfficer()` in `lib/auth/session.ts`

Replace the existing `getOfficer()` function and `Officer` type:

```typescript
// BEFORE (lib/auth/session.ts:10-20):
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    return { id: data.claims.sub, email: data.claims.email ?? '' }
  } catch {
    return null
  }
}

// AFTER:
export type Officer = { id: string; email: string; role: string; full_name: string | null }

const AUTHORIZED_ROLES = ['Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary'] as const

export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    const id = data.claims.sub
    const email = data.claims.email ?? ''

    // Verify the user has a profiles row with an authorized role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', id)
      .maybeSingle()

    if (profileError || !profile || !AUTHORIZED_ROLES.includes(profile.role as typeof AUTHORIZED_ROLES[number])) {
      return null
    }

    return { id, email, role: profile.role, full_name: profile.full_name }
  } catch {
    return null
  }
}
```

### 2. Update `app/admin/page.tsx` — remove redundant profile fetch

Since `getOfficer()` now returns `{ id, email, role, full_name }`, remove the separate profile fetch:

```typescript
// BEFORE (app/admin/page.tsx:29-34):
const supabase = await createClient();
const { data: profileData } = await supabase
  .from('profiles')
  .select('full_name, role')
  .eq('id', officer.id)
  .maybeSingle();
const profile = profileData;

// AFTER:
const profile = { full_name: officer.full_name, role: officer.role }
```

### 3. Update `app/admin/new/page.tsx` and `app/admin/edit/[id]/page.tsx`

These pages call `getOfficer()` and redirect to `/login` if null. No functional change needed — the enriched `Officer` type is backward-compatible. But update any references to `officer.email` for the header display to prefer `officer.full_name || officer.email`.

### 4. Verify

```bash
# Confirm role check exists:
grep -n 'AUTHORIZED_ROLES' lib/auth/session.ts
# Should return at least 2 hits (declaration + usage)

# Type check:
npx tsc --noEmit

# Tests:
npx vitest run

# Build:
npm run build
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Security best practice:** Defense-in-depth — RLS prevents cross-user writes, but the app layer must also verify the user has an authorized role before granting admin access.
- **Backward-compatible type change:** The `Officer` type gains `role` and `full_name` fields. Existing code that only uses `id` and `email` continues to work.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx tsc --noEmit        # 0 errors
npx vitest run          # all tests pass
npm run build           # succeeds
```

### Manual Verification
- **Test 1:** Unauthenticated user → navigate to `/admin` → redirect to `/login`.
- **Test 2:** Authenticated user with no `profiles` row → navigate to `/admin` → redirect to `/login`.
- **Test 3:** Authenticated user with `profiles.role = 'Treasurer'` → navigate to `/admin` → dashboard loads.
- **Test 4:** Authenticated user with `profiles.role = 'Student'` (or any non-authorized role) → navigate to `/admin` → redirect to `/login`.

## Acceptance Criteria
- [ ] `lib/auth/session.ts` defines `AUTHORIZED_ROLES` array with Treasurer, Auditor, President, Vice President, Secretary.
- [ ] `getOfficer()` fetches the `profiles` row and verifies `role` is in `AUTHORIZED_ROLES`.
- [ ] `getOfficer()` returns `null` if the user has no `profiles` row or an unauthorized role.
- [ ] `Officer` type includes `role: string` and `full_name: string | null`.
- [ ] `app/admin/page.tsx` no longer has a redundant `profiles` fetch — uses `officer.full_name` and `officer.role` directly.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npx vitest run` passes all tests.
- [ ] `npm run build` succeeds.
