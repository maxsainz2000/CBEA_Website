# Task 46: Wrap `profiles` RLS `auth.uid()` in `(select ...)`

## Objective
Update the `profiles` table's RLS policies to use the cached `(select auth.uid())` form instead of the raw `auth.uid()` form. The `budget_entries` policies (added in Task 17) correctly use the cached form, but the `profiles` policies (which predate Task 17) use the raw form. This is an inconsistency. `(select auth.uid())` forces Postgres to evaluate `auth.uid()` once and cache the result per-statement, while the raw form may be called multiple times.

## Audit Reference
- **Findings:** X15 (LOW, -0.25 pts)
- **Severity:** LOW (code-quality inconsistency — different RLS idiom for same pattern)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X15, §8.15 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

## Step-by-Step Instructions

### 1. Replace the profiles RLS policies

Find the profiles policies (approximately lines 75–83) and replace:

```sql
-- BEFORE:
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- AFTER:
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);
```

**Note:** If the migration is run fresh (CREATE TABLE + policies), the `DROP POLICY IF EXISTS` is not needed. But if applying to an existing production database, you must drop the old policy before creating the new one.

For a clean migration file, simply update the existing `CREATE POLICY` statements in-place:

```sql
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Supabase best practice:** `(select auth.uid())` caches the result per-statement. The raw `auth.uid()` form is STABLE but may be evaluated multiple times.
- **Consistency:** All RLS policies in the migration now use the same `(select auth.uid())` idiom.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests (verify RLS still works):
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- After applying to production, verify profile update/insert still works correctly.

## Acceptance Criteria
- [x] All `profiles` RLS policies use `(select auth.uid())` instead of `auth.uid()`.
- [x] All RLS policies in `supabase/migration.sql` consistently use the `(select auth.uid())` form.
- [x] `npx vitest run supabase/database.test.ts` passes.
- [x] `npx vitest run` passes.
