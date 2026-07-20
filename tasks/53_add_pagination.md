# Task 53: Add Pagination to getEntries

## Objective
Add `page` and `pageSize` parameters to `getEntries` with Supabase `.range()` and `{ count: 'exact' }`. Update callers (`app/page.tsx`, `app/admin/page.tsx`) and list components (`BudgetEntryList`, `EntryTable`) to support a "Load more" button. Default 50 entries per page, max 100. Without pagination, a semester with 500+ entries produces a 500-row DOM with no virtualization.

## Audit Reference
- **Findings:** Y11 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (no pagination — performance degrades with data growth)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y11, §10 P1-3 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — add `page`, `pageSize` params; return `{ entries, totalCount, hasMore }`
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — handle paginated result, pass `page` from searchParams
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — handle paginated result
- [MODIFY] [app/components/BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx) — render "Load more" button
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) — render "Load more" button
- [MODIFY] [lib/data/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.test.ts) — update tests for new return shape

## Step-by-Step Instructions

### 1. Update `getEntries` in `lib/data/entries.ts`

```typescript
// BEFORE:
export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
}): Promise<DataResult<BudgetEntry[]>> {
  // ... query without pagination ...
}

// AFTER:
export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
  page?: number;       // 1-indexed page number, default 1
  pageSize?: number;   // entries per page, default 50, max 100
}): Promise<DataResult<{ entries: BudgetEntry[]; totalCount: number; hasMore: boolean }>> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 50));

  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('*', { count: 'exact' });

    if (filters?.semester) query = query.eq('semester', filters.semester);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error fetching entries:', error.message);
      return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
    }

    const totalCount = count ?? 0;
    return {
      status: 'ok',
      data: {
        entries: (data || []) as BudgetEntry[],
        totalCount,
        hasMore: page * pageSize < totalCount,
      },
    };
  } catch (err) {
    console.error('Unhandled exception fetching entries:', err);
    return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
  }
}
```

### 2. Update callers (`app/page.tsx`, `app/admin/page.tsx`)

Handle the new return shape `{ entries, totalCount, hasMore }`:

```typescript
// BEFORE:
const entriesResult = await getEntries({ semester: activeSemester });
const entries = entriesResult.status === 'ok' ? entriesResult.data : [];

// AFTER:
const entriesResult = await getEntries({ semester: activeSemester, page: 1 });
const entries = entriesResult.status === 'ok' ? entriesResult.data.entries : [];
const hasMore = entriesResult.status === 'ok' ? entriesResult.data.hasMore : false;
const totalCount = entriesResult.status === 'ok' ? entriesResult.data.totalCount : 0;
```

### 3. Update `BudgetEntryList` and `EntryTable`

Add a "Load more" button when `hasMore` is true. Pass `hasMore` and `currentPage` as new props. The "Load more" button should link to `?page={currentPage + 1}` or use client-side state to fetch the next page.

### 4. Verify

```bash
npx vitest run
npx tsc --noEmit
npm run build

# Manual: visit /?semester=1st+Sem and verify "Load more" appears if >50 entries
```

## Metro Design Compliance & Best Coding Practices
- **"Load more" button styling:** Should use `btn-ghost` class with Metro-compliant styling (no rounded corners, uppercase text).
- **Performance:** `.range()` with `{ count: 'exact' }` uses the `budget_entries_semester_covering_idx` for efficient pagination.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run
npx tsc --noEmit
npm run build
```

### Manual Verification
- Visit the homepage with >50 entries in a semester — "Load more" button should appear.
- Click "Load more" — next page of entries loads.
- Visit with <50 entries — "Load more" should NOT appear.

## Acceptance Criteria
- [x] `getEntries` accepts `page` and `pageSize` parameters.
- [x] `getEntries` returns `{ entries, totalCount, hasMore }`.
- [x] Default page is 1, default pageSize is 50, max pageSize is 100.
- [x] `app/page.tsx` and `app/admin/page.tsx` handle the new return shape.
- [x] `BudgetEntryList` renders a "Load more" button when `hasMore` is true.
- [x] `EntryTable` renders a "Load more" button when `hasMore` is true.
- [x] `npx vitest run` passes all tests.
- [x] `npx tsc --noEmit` passes with 0 errors.
- [x] `npm run build` succeeds.
