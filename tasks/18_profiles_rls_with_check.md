# Task 18: Add `WITH CHECK` to Profiles UPDATE Policy

## Objective
Add an explicit `WITH CHECK (auth.uid() = id)` clause to the `profiles` UPDATE policy. Currently the policy only has a `USING` clause — Postgres defaults the omitted `WITH CHECK` to the `USING` expression, so this is safe in practice. However, the Supabase skill's security checklist explicitly recommends specifying `WITH CHECK` to prevent a user from reassigning their own `id` to another user during an update. This is a defense-in-depth hardening.

## Audit Reference
- **Findings:** S10 (LOW)
- **Severity:** LOW (defense-in-depth)
- **Current grade impact:** No direct grade impact, but addresses a security checklist item.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

## Step-by-Step Instructions

### 1. Update the profiles UPDATE policy — `supabase/migration.sql`

Find the current policy (lines 76–77):

```sql
-- Current:
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
```

Replace with:

```sql
-- Fixed — explicit WITH CHECK for defense-in-depth:
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

**Key design decisions:**
- Added explicit `TO authenticated` role qualifier for clarity (the original omitted it, defaulting to `PUBLIC`).
- Added `WITH CHECK (auth.uid() = id)` — ensures a user cannot update their row to change the `id` column to another user's UUID.
- The `USING` clause filters which rows can be selected for update (own row only).
- The `WITH CHECK` clause validates the new row values after the update (own row only).

### 2. Apply to the live Supabase project (if applicable)

```sql
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.profiles;

CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Security best practice:** Always specify `WITH CHECK` on UPDATE policies to prevent column-value reassignment attacks. Even when Postgres defaults it to the `USING` expression, being explicit is defense-in-depth.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# The existing test "should only allow authenticated users to update their own profile" should still pass:
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- In the Supabase dashboard → Auth → Policies, verify the `profiles` UPDATE policy now shows both `USING` and `WITH CHECK` clauses.

## Acceptance Criteria
- [ ] The `profiles` UPDATE policy in `migration.sql` has explicit `WITH CHECK (auth.uid() = id)`.
- [ ] The `profiles` UPDATE policy has explicit `TO authenticated` role qualifier.
- [ ] The existing PGlite test `should only allow authenticated users to update their own profile` still passes.
- [ ] `npx vitest run` passes.
