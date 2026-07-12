# Task 17: Harden `budget_entries` RLS Write Policy

## Objective
Replace the permissive `FOR ALL TO authenticated USING (true) WITH CHECK (true)` policy on `budget_entries` with granular ownership-based policies. The current policy allows ANY authenticated user to INSERT/UPDATE/DELETE ANY row — flagged by Supabase Security Advisor rule `0024 Permissive RLS Policy`. This task splits the single permissive policy into three granular policies (INSERT/UPDATE/DELETE) with `entered_by = auth.uid()` ownership predicates.

## Audit Reference
- **Findings:** N3 (HIGH), §7.2 Finding S8
- **Severity:** HIGH (Supabase Security Advisor rule `0024`)
- **Current grade impact:** +3 points toward the target grade.
- **Source:** [Supabase Database Advisors](https://supabase.com/docs/guides/database/database-advisors) — rule `0024 Permissive RLS Policy`.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts)

## Step-by-Step Instructions

### 1. Replace the permissive write policy — `supabase/migration.sql`

Find the current permissive policy (lines 89–90):

```sql
-- Current (REMOVE):
CREATE POLICY "Allow authenticated write on budget_entries" ON public.budget_entries
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

Replace with three granular ownership-based policies:

```sql
-- Option A: ownership predicate (recommended)
CREATE POLICY "Allow authenticated insert on budget_entries" ON public.budget_entries
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated update on budget_entries" ON public.budget_entries
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = entered_by)
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated delete on budget_entries" ON public.budget_entries
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = entered_by);
```

**Key design decisions:**
- Uses `(select auth.uid())` instead of bare `auth.uid()` — wrapping in a subselect is a Supabase-recommended optimization that prevents the function from being re-evaluated per row.
- The INSERT policy uses `WITH CHECK` only (no `USING` — `USING` is not applicable to INSERT).
- The UPDATE policy has both `USING` (filters which rows can be selected for update) and `WITH CHECK` (validates the new row values).
- The DELETE policy has `USING` only (filters which rows can be deleted).
- This is compatible with the existing server actions: `entries.ts:51` already sets `entered_by: userId` where `userId` comes from `getOfficer().id`, which is `auth.uid()`.

### 2. Apply to the live Supabase project (if applicable)

If the migration should be applied to the live project, run the replacement SQL directly:

```sql
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Allow authenticated write on budget_entries" ON public.budget_entries;

-- Create the three granular policies
CREATE POLICY "Allow authenticated insert on budget_entries" ON public.budget_entries
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated update on budget_entries" ON public.budget_entries
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = entered_by)
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated delete on budget_entries" ON public.budget_entries
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = entered_by);
```

### 3. Update the PGlite database tests — `supabase/database.test.ts`

The existing test `should allow authenticated users to perform writes on budget_entries` sets `request.jwt.claim.sub` to `d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001` — the same UUID used as `entered_by` in the test insert. This test should still pass because the ownership predicate matches.

Add a **new test** to verify the ownership enforcement:

```ts
it('should block authenticated users from modifying other users\' entries', async () => {
  // Set auth context to a DIFFERENT user
  await db.exec(`
    SELECT set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
    SELECT set_config('request.jwt.claim.role', 'authenticated', true);
    SELECT set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}', true);
    SET ROLE authenticated;
  `);

  // Try to update an entry owned by d0d0d0d0-...d001
  const updateResult = await db.exec(`
    UPDATE public.budget_entries
    SET description = 'Hacked'
    WHERE entered_by = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
  `);

  // The update should affect 0 rows (RLS blocks it)
  expect(updateResult[0]?.rowCount ?? 0).toBe(0);

  // Try to delete an entry owned by d0d0d0d0-...d001
  const deleteResult = await db.exec(`
    DELETE FROM public.budget_entries
    WHERE entered_by = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
  `);

  expect(deleteResult[0]?.rowCount ?? 0).toBe(0);

  // Try to insert with someone else's entered_by
  try {
    await db.exec(`
      INSERT INTO public.budget_entries (description, amount, type, category, date, semester, academic_year, entered_by)
      VALUES ('Hacked Entry', 10000, 'income', 'Fees', '2025-01-15', '1st Semester AY 2024-2025', '2024-2025', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001')
    `);
    expect(true).toBe(false); // Should not reach here
  } catch (e: unknown) {
    // RLS should block the insert (entered_by doesn't match auth.uid())
    expect((e as Error).message).toContain('violates row-level security policy');
  }
});
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Security best practice:** Per Supabase's own Security Advisor, `USING (true) WITH CHECK (true)` is a permissive anti-pattern. Ownership predicates are the recommended approach.
- **Performance note:** Using `(select auth.uid())` wraps the function call in a subselect, preventing per-row re-evaluation — a Supabase-documented optimization.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# PGlite database tests should all pass (including the new ownership test):
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
npx playwright test
```

### RLS Verification
```bash
# Run in Supabase dashboard → Database → Advisors → Security
# Rule 0024 "Permissive RLS Policy" should NOT fire for budget_entries.
```

### Manual Verification
- In the Supabase dashboard, verify that 3 policies exist for `budget_entries` (INSERT, UPDATE, DELETE) instead of the single `FOR ALL` policy.
- Verify that the admin CRUD flow still works end-to-end (create, edit, delete an entry via the UI).

## Acceptance Criteria
- [x] The permissive `FOR ALL TO authenticated USING (true) WITH CHECK (true)` policy is removed from `migration.sql`.
- [x] Three granular policies (INSERT/UPDATE/DELETE) with `entered_by = auth.uid()` predicates are added.
- [x] The PGlite test `should allow authenticated users to perform writes on budget_entries` still passes.
- [x] A new test verifies that authenticated users cannot modify other users' entries.
- [x] Supabase Security Advisor rule `0024` no longer fires for `budget_entries`.
- [x] `npx vitest run` passes.
- [x] `npx playwright test` passes.
- [x] Admin CRUD flow works end-to-end.
