# Task 61: Parallelize Profile Fetch in Admin Page

## Objective
Move the sequential `profiles` fetch in `app/admin/page.tsx` into a `Promise.all` alongside `getSemesters()`. Note: This task is **moot after Task 48** — if `getOfficer()` already returns profile data (`full_name`, `role`), the redundant profile fetch should be removed entirely instead.

## Audit Reference
- **Findings:** Y14 (LOW, -0.25 pts)
- **Severity:** LOW (sequential fetch — unnecessary waterfall)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y14, §11 P2-3 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — parallelize or remove redundant profile fetch

## Step-by-Step Instructions

### If Task 48 is already applied:

Simply remove the redundant profile fetch entirely and use `officer.full_name` / `officer.role`:

```typescript
// BEFORE:
const supabase = await createClient();
const { data: profileData } = await supabase.from('profiles').select(...).eq('id', officer.id).maybeSingle();
const profile = profileData;

// AFTER:
const profile = { full_name: officer.full_name, role: officer.role }
```

### If Task 48 is NOT yet applied:

Parallelize with `getSemesters()`:

```typescript
const [profileResult, semestersResult] = await Promise.all([
  (async () => {
    const supabase = await createClient();
    return supabase.from('profiles').select('full_name, role').eq('id', officer.id).maybeSingle();
  })(),
  getSemesters(),
]);
```

### Verify

```bash
npm run build
npx tsc --noEmit
```

## Acceptance Criteria
- [ ] Profile fetch is either removed (post-Task 48) or parallelized with getSemesters.
- [ ] `npm run build` succeeds.
- [ ] `npx tsc --noEmit` passes with 0 errors.
