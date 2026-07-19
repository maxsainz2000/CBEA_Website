# Task 38: Add Composite and Covering Indexes for Hot Queries

## Objective
Replace the existing redundant `budget_entries_semester_idx` (single-column, fully covered by `budget_entries_semester_date_idx`) with an optimized index set that matches the actual query patterns in `lib/data/entries.ts`. Specifically: a composite index for `getEntries` (`semester, category, date DESC`), a covering index for `getSummaryStats` (`semester INCLUDE type, amount`), and an extended composite for multi-key ORDER BY (`semester, date DESC, created_at DESC`). This eliminates unnecessary write amplification from the redundant index and enables index-only scans for the most common queries.

## Audit Reference
- **Findings:** X5 (MEDIUM, -0.5 pts)
- **Severity:** MEDIUM (missing composite/covering indexes for hot queries)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v4 §5 finding X5, §8.5 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add index existence tests

## Step-by-Step Instructions

### 1. Replace the indexes section in the migration

Find the existing indexes section in `supabase/migration.sql` (approximately lines 113–118) and replace with:

```sql
-- Drop redundant single-col index (covered by composite below)
DROP INDEX IF EXISTS public.budget_entries_semester_idx;

-- Composite index for getEntries: WHERE semester=? AND category=? ORDER BY date DESC
CREATE INDEX IF NOT EXISTS budget_entries_semester_category_date_idx
  ON public.budget_entries (semester, category, date DESC);

-- Covering index for getSummaryStats: SELECT type, amount WHERE semester=?
CREATE INDEX IF NOT EXISTS budget_entries_semester_covering_idx
  ON public.budget_entries (semester) INCLUDE (type, amount);

-- Extended composite for getEntries multi-key ORDER BY
DROP INDEX IF EXISTS public.budget_entries_semester_date_idx;
CREATE INDEX IF NOT EXISTS budget_entries_semester_date_created_idx
  ON public.budget_entries (semester, date DESC, created_at DESC);
```

Keep the existing `budget_entries_date_idx` and `budget_entries_category_idx` (they serve other query patterns).

### 2. Add index existence tests

```typescript
// supabase/database.test.ts — add tests
it('should have composite index for getEntries query pattern', async () => {
  const result = await db.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_category_date_idx'
  `);
  expect(result.rows.length).toBe(1);
});

it('should have covering index for getSummaryStats query pattern', async () => {
  const result = await db.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_covering_idx'
  `);
  expect(result.rows.length).toBe(1);
});

it('should have extended composite for multi-key ORDER BY', async () => {
  const result = await db.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_date_created_idx'
  `);
  expect(result.rows.length).toBe(1);
});

it('should NOT have the redundant budget_entries_semester_idx', async () => {
  const result = await db.query(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'budget_entries' AND indexname = 'budget_entries_semester_idx'
  `);
  expect(result.rows.length).toBe(0);
});
```

### 3. Production deployment

Run the SQL statements against the production Supabase project. Drop the redundant index first, then create the new ones. Consider using `CREATE INDEX CONCURRENTLY` for production to avoid locking.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Performance best practice:** Indexes should match actual query patterns. The existing `budget_entries_semester_idx` (single-col) is fully redundant with any composite index that starts with `semester` as the leftmost column.
- **Write amplification:** Dropping the redundant index reduces the number of indexes that must be updated on every INSERT/UPDATE/DELETE.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests:
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- After applying to production, run `EXPLAIN ANALYZE` on the `getEntries` and `getSummaryStats` query patterns to verify index usage.

## Acceptance Criteria
- [x] `budget_entries_semester_idx` is dropped (redundant).
- [x] `budget_entries_semester_category_date_idx` exists on `(semester, category, date DESC)`.
- [x] `budget_entries_semester_covering_idx` exists on `(semester) INCLUDE (type, amount)`.
- [x] `budget_entries_semester_date_created_idx` exists on `(semester, date DESC, created_at DESC)`.
- [x] `npx vitest run supabase/database.test.ts` passes (all existing + new index tests).
- [x] `npx vitest run` passes.
