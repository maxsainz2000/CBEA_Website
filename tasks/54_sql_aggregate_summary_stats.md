# Task 54: Replace getSummaryStats JS Loop with SQL Aggregate

## Objective
Create a Postgres function `get_summary_stats(p_semester text)` that aggregates income/expense totals in SQL. Update `getSummaryStats` in `lib/data/entries.ts` to call `.rpc('get_summary_stats', ...)` instead of fetching all rows and summing in JavaScript. This reduces a 500-row transfer + JS loop to a single-row SQL aggregate with an index-only scan.

## Audit Reference
- **Findings:** Y10 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (JS-side aggregation — transfers all rows to Node on every page load)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y10, §10 P1-4 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) — add `get_summary_stats` function + GRANT
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — replace JS aggregation with `.rpc()` call
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add aggregate function test

## Step-by-Step Instructions

### 1. Add Postgres function to `supabase/migration.sql`

Append to the end of `supabase/migration.sql`:

```sql
-- Aggregate function for getSummaryStats (replaces JS-side summing)
CREATE OR REPLACE FUNCTION public.get_summary_stats(p_semester text)
RETURNS TABLE (total_collected bigint, total_spent bigint, remaining_balance bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::bigint AS total_collected,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::bigint AS total_spent,
    (COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
     - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0))::bigint AS remaining_balance
  FROM public.budget_entries
  WHERE semester = p_semester;
$$;

GRANT EXECUTE ON FUNCTION public.get_summary_stats(text) TO anon, authenticated;
```

### 2. Update `getSummaryStats` in `lib/data/entries.ts`

```typescript
// BEFORE (lib/data/entries.ts:58-105):
export async function getSummaryStats(semester?: string): Promise<DataResult<{
  totalCollected: number;
  totalSpent: number;
  remainingBalance: number;
}>> {
  // ... fetches all rows, loops in JS to sum ...
}

// AFTER:
export async function getSummaryStats(semester?: string): Promise<DataResult<{
  totalCollected: number;
  totalSpent: number;
  remainingBalance: number;
}>> {
  if (!semester) {
    return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_summary_stats', { p_semester: semester });

    if (error) {
      console.error('Database error fetching summary stats:', error.message);
      return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
    }

    if (!data || data.length === 0) {
      return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
    }

    const row = data[0];
    return {
      status: 'ok',
      data: {
        totalCollected: Number(row.total_collected),
        totalSpent: Number(row.total_spent),
        remainingBalance: Number(row.remaining_balance),
      },
    };
  } catch (err) {
    console.error('Unhandled exception fetching summary stats:', err);
    return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
  }
}
```

### 3. Add a test in `supabase/database.test.ts`

```typescript
it('should have a get_summary_stats function that returns correct aggregates', async () => {
  const result = await db.query('SELECT * FROM public.get_summary_stats($1)', ['1st Sem']);
  expect(result.rows.length).toBe(1);
  expect(Number(result.rows[0].total_collected)).toBeGreaterThanOrEqual(0);
  expect(Number(result.rows[0].total_spent)).toBeGreaterThanOrEqual(0);
  expect(Number(result.rows[0].remaining_balance)).toBe(
    Number(result.rows[0].total_collected) - Number(result.rows[0].total_spent)
  );
});
```

### 4. Verify

```bash
npx vitest run supabase/database.test.ts
npx vitest run lib/data/entries.test.ts
npx tsc --noEmit
npm run build
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Postgres best practice:** `SECURITY INVOKER` ensures RLS applies. `SET search_path = ''` prevents search_path injection. `STABLE` allows query planner optimization.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run supabase/database.test.ts
npx vitest run lib/data/entries.test.ts
npx tsc --noEmit
npm run build
```

### Manual Verification
- Visit the homepage — summary stats (Total Collected, Total Spent, Remaining Balance) should display correctly.
- Verify via Supabase Dashboard SQL editor: `SELECT * FROM get_summary_stats('1st Sem');` returns expected aggregates.

## Acceptance Criteria
- [ ] `supabase/migration.sql` contains `CREATE OR REPLACE FUNCTION public.get_summary_stats(...)`.
- [ ] The function uses `SECURITY INVOKER` and `SET search_path = ''`.
- [ ] `GRANT EXECUTE` is issued to `anon` and `authenticated` roles.
- [ ] `lib/data/entries.ts` `getSummaryStats` calls `.rpc('get_summary_stats', ...)` instead of JS-side aggregation.
- [ ] `supabase/database.test.ts` has a test for the aggregate function.
- [ ] `npx vitest run` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds.
