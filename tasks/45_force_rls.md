# Task 45: Enable `FORCE ROW LEVEL SECURITY`

## Objective
Add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` to both `profiles` and `budget_entries` tables in `supabase/migration.sql`. Currently, `ENABLE ROW LEVEL SECURITY` enforces RLS for all roles EXCEPT the table owner (`postgres`). `FORCE ROW LEVEL SECURITY` makes the table owner also subject to RLS policies. This is defense-in-depth — if a future developer runs a query as `postgres` thinking RLS will protect them, they won't accidentally bypass it.

## Audit Reference
- **Findings:** X14 (LOW, -0.25 pts)
- **Severity:** LOW (defense-in-depth — table owner bypasses RLS by default)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X14, §8.14 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

## Step-by-Step Instructions

### 1. Add `FORCE ROW LEVEL SECURITY` statements

Find the RLS enable statements (approximately lines 67–68) and add `FORCE` after each:

```sql
-- BEFORE:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;

-- AFTER:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries FORCE ROW LEVEL SECURITY;
```

### 2. Verify tests still pass

The PGlite tests use `SET ROLE anon` / `SET ROLE authenticated` (not the table owner), so `FORCE RLS` doesn't change test behavior. The fix is specifically for production safety — preventing accidental RLS bypass when running queries as the `postgres` role.

**Note:** In Supabase, the `service_role` key bypasses RLS by design (it's the "admin" key). `FORCE` doesn't affect the service role — it only affects the `postgres` role.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Supabase security best practice:** `FORCE ROW LEVEL SECURITY` ensures that even the table owner is subject to RLS policies, preventing accidental data exposure.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests:
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- After applying to production, run a query as the `postgres` role and verify RLS policies are enforced.

## Acceptance Criteria
- [x] `supabase/migration.sql` has `ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;`.
- [x] `supabase/migration.sql` has `ALTER TABLE public.budget_entries FORCE ROW LEVEL SECURITY;`.
- [x] `npx vitest run supabase/database.test.ts` passes.
- [x] `npx vitest run` passes.
