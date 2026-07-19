# Task 39: Add Postgres Views for Distinct Semesters/Categories

## Objective
Create Postgres views `distinct_semesters` and `distinct_categories` using `SELECT DISTINCT`, and update `getSemesters` and `getCategories` in `lib/data/entries.ts` to query the views instead of fetching ALL rows from `budget_entries` and deduping client-side via `Set`. This optimization was explicitly deferred in Task 16 (Session 2) and Task 24 (Session 3) but never implemented. For 1,000+ entries (a few years of council activity), the current approach transfers ~30 KB of redundant data per page load.

## Audit Reference
- **Findings:** X7 (MEDIUM, -0.5 pts)
- **Severity:** MEDIUM (unnecessary data transfer — fetch all rows + dedupe client-side)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v4 §5 finding X7, §8.7 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) — add views
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — update getSemesters and getCategories
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add view tests

## Step-by-Step Instructions

### 1. Add views to migration

Add these SQL statements at the end of `supabase/migration.sql`:

```sql
-- Postgres views for distinct filter values (replaces client-side dedupe)
CREATE OR REPLACE VIEW public.distinct_semesters AS
  SELECT DISTINCT semester FROM public.budget_entries ORDER BY semester;

CREATE OR REPLACE VIEW public.distinct_categories AS
  SELECT DISTINCT category FROM public.budget_entries ORDER BY category;
```

### 2. Update `getSemesters` to use the view

```typescript
// lib/data/entries.ts — replace getSemesters
// NOTE: If Task 31 (X1 fix) is applied, use DataResult<string[]> return type.
// If Task 31 is NOT yet applied, return string[] with empty array on error (not mock data).

export async function getSemesters(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_semesters').select('semester');

    if (error) {
      console.error('Database error fetching semesters:', error.message);
      return { status: 'error', message: 'We couldn\'t load semester options. Please try again later.' };
    }

    return { status: 'ok', data: (data || []).map(row => row.semester) };
  } catch (err) {
    console.error('Unhandled exception fetching semesters:', err);
    return { status: 'error', message: 'We couldn\'t load semester options. Please try again later.' };
  }
}
```

### 3. Update `getCategories` similarly

```typescript
// lib/data/entries.ts — replace getCategories
export async function getCategories(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_categories').select('category');

    if (error) {
      console.error('Database error fetching categories:', error.message);
      return { status: 'error', message: 'We couldn\'t load category options. Please try again later.' };
    }

    return { status: 'ok', data: (data || []).map(row => row.category) };
  } catch (err) {
    console.error('Unhandled exception fetching categories:', err);
    return { status: 'error', message: 'We couldn\'t load category options. Please try again later.' };
  }
}
```

### 4. Add PGlite tests for the views

```typescript
// supabase/database.test.ts — add tests
it('should have a distinct_semesters view that returns unique semesters', async () => {
  const result = await db.query('SELECT * FROM public.distinct_semesters');
  const semesters = result.rows.map((r: { semester: string }) => r.semester);
  expect(semesters.length).toBeGreaterThan(0);
  // Verify uniqueness
  expect(new Set(semesters).size).toBe(semesters.length);
});

it('should have a distinct_categories view that returns unique categories', async () => {
  const result = await db.query('SELECT * FROM public.distinct_categories');
  const categories = result.rows.map((r: { category: string }) => r.category);
  expect(categories.length).toBeGreaterThan(0);
  expect(new Set(categories).size).toBe(categories.length);
});
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Performance best practice:** `SELECT DISTINCT` is handled by the database engine, which can use index-only scans. Client-side deduplication transfers unnecessary data over the wire and wastes CPU.
- **Implementation note:** Views in Supabase are automatically exposed via the PostgREST API, so `supabase.from('distinct_semesters').select('semester')` works out of the box.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests:
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run

# Type check:
npx tsc --noEmit

# Build:
npm run build
```

### Manual Verification
- Start the dev server and verify semester pivot tabs still work correctly.
- Verify category filter chips still populate correctly.

## Acceptance Criteria
- [x] `supabase/migration.sql` contains `CREATE OR REPLACE VIEW public.distinct_semesters` and `distinct_categories`.
- [x] `getSemesters` queries `distinct_semesters` view (not `budget_entries`).
- [x] `getCategories` queries `distinct_categories` view (not `budget_entries`).
- [x] No client-side `Set` / `Array.from(new Set(...))` deduplication in either function.
- [x] `npx vitest run supabase/database.test.ts` passes (all existing + new view tests).
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
