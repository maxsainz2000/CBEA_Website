# Task 34: Add FK Index on `entered_by`

## Objective
Add a B-tree index on `budget_entries.entered_by` to support RLS ownership lookups (`WHERE entered_by = auth.uid()`), the `ON DELETE SET NULL` cascade from `profiles`, and the query-layer ownership filters added in Task 32. The project's own `agent/skills/supabase-postgres-best-practices/references/schema-foreign-key-indexes.md` explicitly states "every FK column should have an index." Without this index, every RLS write check and every profile deletion triggers a sequential scan of `budget_entries`.

## Audit Reference
- **Findings:** X4 (HIGH, -1 pt)
- **Severity:** HIGH (Supabase best-practices violation — missing FK index)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v4 §5 finding X4, §8.4 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add index existence test

## Step-by-Step Instructions

### 1. Add the index to the migration

Add this SQL statement at the end of `supabase/migration.sql`, in the indexes section:

```sql
-- Index for RLS ownership lookups: WHERE entered_by = auth.uid()
-- Also supports ON DELETE SET NULL cascade from profiles
CREATE INDEX IF NOT EXISTS budget_entries_entered_by_idx
  ON public.budget_entries (entered_by);
```

### 2. Add a PGlite test to verify the index exists

```typescript
// supabase/database.test.ts — add test
it('should have an index on entered_by for RLS lookups', async () => {
  const result = await db.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_entered_by_idx'
  `);
  expect(result.rows.length).toBe(1);
});
```

### 3. Production deployment

Run the `CREATE INDEX IF NOT EXISTS` statement against the production Supabase project via the SQL editor (Dashboard → SQL Editor → New Query). It's a non-blocking `CREATE INDEX` on Postgres 15+ (Supabase's version). For larger tables, consider `CREATE INDEX CONCURRENTLY` to avoid locking.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Supabase best practice:** Every FK column should have an index on the referencing column. Without it, `ON DELETE CASCADE` / `ON DELETE SET NULL` operations require sequential scans.
- **Performance impact:** Immediate improvement for all RLS ownership checks on `budget_entries` (every INSERT/UPDATE/DELETE by an authenticated user).

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests:
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- Connect to the Supabase project SQL editor after applying the migration.
- Run: `SELECT indexname FROM pg_indexes WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_entered_by_idx';`
- Should return 1 row.

## Acceptance Criteria
- [ ] `supabase/migration.sql` contains `CREATE INDEX IF NOT EXISTS budget_entries_entered_by_idx ON public.budget_entries (entered_by);`.
- [ ] `npx vitest run supabase/database.test.ts` passes (9 existing + 1 new test).
- [ ] `npx vitest run` passes.
