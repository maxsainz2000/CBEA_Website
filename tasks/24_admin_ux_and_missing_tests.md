# Task 24: Admin UX Improvements and Missing Tests

## Objective
Add a semester filter to the admin table (so officers don't see every entry from every semester in one giant table), convert `SummaryStats` to a server component (eliminating unnecessary client hydration), add missing component unit tests, and optionally add pagination and `SELECT DISTINCT` views for performance at scale.

## Audit Reference
- **Findings:** N9 (MEDIUM — admin filter), P3-1 (SummaryStats), P3-2 (missing tests), P3-3 (globalTeardown), P3-4 (SELECT DISTINCT), P3-5 (pagination)
- **Severity:** MEDIUM (N9), LOW (P3-1 through P3-5)
- **Current grade impact:** No direct grade impact (these are quality/polish items).

## Files Created / Modified
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx)
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [NEW] Component test files
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) (optional — views)
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) (optional — SELECT DISTINCT)

## Step-by-Step Instructions

### 1. Add semester filter to the admin table (N9) — `app/admin/page.tsx`

The admin page currently calls `getEntries()` with no filters, showing every entry from every semester in one giant table. Add a default semester filter.

**`app/admin/page.tsx:28` — update the data fetching:**

```ts
// Current (no filters):
const [entries, stats] = await Promise.all([
  getEntries(),
  getSummaryStats(),
]);

// Fixed — default to the most recent semester:
const semestersList = await getSemesters();
const activeSemester = semestersList[0] || '1st Semester AY 2024-2025';

const [entries, stats] = await Promise.all([
  getEntries({ semester: activeSemester }),
  getSummaryStats(activeSemester),
]);
```

**Optional enhancement:** Add a `PivotTabs` component to the admin page so officers can switch semesters. This requires either:
- Making the admin page accept `searchParams` (like the public homepage), or
- Adding a client-side state toggle.

The simplest approach is to reuse the URL-driven pattern from the public homepage:

```tsx
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string }>;
}) {
  const params = await searchParams;
  const semestersList = await getSemesters();
  const activeSemester = params.semester || semestersList[0] || '1st Semester AY 2024-2025';

  const [entries, stats] = await Promise.all([
    getEntries({ semester: activeSemester }),
    getSummaryStats(activeSemester),
  ]);

  return (
    <div>
      {/* Add PivotTabs for semester selection */}
      <PivotTabs
        tabs={semestersList}
        activeTab={activeSemester}
        basePath="/admin"
        paramName="semester"
      />
      {/* ... rest of admin page */}
    </div>
  );
}
```

### 2. Convert `SummaryStats` to a server component (P3-1)

The `SummaryStats` component is marked `'use client'` purely to format the current date with `useEffect`. The component already accepts `asOfDate?: string` — pass the date from the server.

**`app/page.tsx` — format the date on the server:**

```tsx
// In HomepageContent (server component):
const asOfDate = new Date().toLocaleDateString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

<SummaryStats
  totalCollected={stats.totalCollected}
  totalSpent={stats.totalSpent}
  remainingBalance={stats.remainingBalance}
  asOfDate={`as of ${asOfDate}`}
/>
```

**`app/components/SummaryStats.tsx` — remove client-side date formatting:**

```tsx
// Remove 'use client' directive
// Remove useState and useEffect imports
// Remove the dateString state and useEffect block
// Use the asOfDate prop directly:

export default function SummaryStats({
  totalCollected,
  totalSpent,
  remainingBalance,
  asOfDate,
}: SummaryStatsProps) {
  return (
    <div>
      {/* ... stat cards ... */}
      {asOfDate && <p className="...">{asOfDate}</p>}
    </div>
  );
}
```

**Benefit:** The entire stat-card grid becomes a server component — no client hydration needed.

### 3. Add missing component unit tests (P3-2)

Add unit tests for the following components (currently untested):

| Component | Test File | Key Test Cases |
|---|---|---|
| `BudgetEntryList` | `app/components/BudgetEntryList.test.tsx` | Empty state, populated state, entry rendering |
| `SearchFilter` | `app/components/SearchFilter.test.tsx` | Search input, category chip selection |
| `ClientFilters` | `app/components/ClientFilters.test.tsx` | URL update on filter change, debounce |
| `Header` | `app/components/Header.test.tsx` | Title rendering, navigation links |
| `EntryForm` | `app/admin/components/EntryForm.test.tsx` | Client-side validation, form submission, error display |
| `EntryTable` | `app/admin/components/EntryTable.test.tsx` | Delete confirmation flow, edit link, entry rendering |

**Example test structure for `BudgetEntryList`:**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BudgetEntryList from './BudgetEntryList';

describe('BudgetEntryList', () => {
  it('renders empty state when no entries', () => {
    render(<BudgetEntryList entries={[]} />);
    expect(screen.getByText(/no entries/i)).toBeInTheDocument();
  });

  it('renders entries with correct formatting', () => {
    const entries = [
      {
        id: '1',
        description: 'Test Entry',
        amount: 150000, // centavos
        type: 'income' as const,
        category: 'Fees',
        date: '2025-01-15',
        semester: '1st Semester AY 2024-2025',
        academic_year: '2024-2025',
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z',
        notes: null,
      },
    ];
    render(<BudgetEntryList entries={entries} />);
    expect(screen.getByText('Test Entry')).toBeInTheDocument();
    expect(screen.getByText(/₱1,500\.00/)).toBeInTheDocument();
  });
});
```

### 4. (Optional) Add `SELECT DISTINCT` views (P3-4) — `supabase/migration.sql`

For performance at >1k entries, create Postgres views:

```sql
CREATE OR REPLACE VIEW distinct_semesters AS
  SELECT DISTINCT semester FROM budget_entries ORDER BY semester;

CREATE OR REPLACE VIEW distinct_categories AS
  SELECT DISTINCT category FROM budget_entries ORDER BY category;
```

Then update `lib/data/entries.ts`:

```ts
export async function getSemesters(): Promise<string[]> {
  const { data, error } = await supabase.from('distinct_semesters').select('semester');
  if (error) return [];
  return data.map(row => row.semester);
}
```

**Note:** For a council portal with <100 entries, the current client-side dedupe is fine. Only implement this if performance becomes an issue.

### 5. (Optional) Add pagination to admin table (P3-5) — `app/admin/page.tsx`

Use Supabase's built-in pagination:

```ts
const PAGE_SIZE = 25;
const page = parseInt(params.page || '1', 10);
const offset = (page - 1) * PAGE_SIZE;

const { data: entries, count } = await supabase
  .from('budget_entries')
  .select('*', { count: 'exact' })
  .eq('semester', activeSemester)
  .order('date', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);
```

Add "Previous" / "Next" buttons to `EntryTable.tsx`.

**Note:** Only implement if the admin table grows beyond 50 entries per semester.

## Metro Design Compliance & Best Coding Practices
- **Semester filter:** Reuses the existing `PivotTabs` component, maintaining Metro design consistency across the public and admin surfaces.
- **Server component optimization:** Converting `SummaryStats` to a server component eliminates unnecessary client JavaScript, improving page load performance.
- **Test coverage:** Adding component unit tests improves confidence in the codebase and catches regressions early.
- **YAGNI principle:** `SELECT DISTINCT` views and pagination are marked optional — only implement when there's a demonstrated need.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All tests (including new component tests) should pass:
npx tsc --noEmit
npx vitest run
npx playwright test

# Build should succeed:
npm run build
```

### Manual Verification
- Open the admin page (`/admin`) and verify:
  - The table shows entries for the current semester (not all semesters).
  - If `PivotTabs` is added, switching semesters filters the table.
- Open the public homepage (`/`) and verify:
  - The "as of" date displays correctly.
  - The stat cards render without hydration flash (if `SummaryStats` is now a server component).

## Acceptance Criteria
- [ ] The admin page defaults to the most recent semester (not all entries).
- [ ] (Optional) `PivotTabs` is added to the admin page for semester switching.
- [ ] `SummaryStats` is a server component (no `'use client'` directive).
- [ ] `app/page.tsx` passes `asOfDate` as a prop to `SummaryStats`.
- [ ] At least 3 new component test files are created (BudgetEntryList, EntryForm, EntryTable).
- [ ] `npx tsc --noEmit` reports 0 errors.
- [ ] `npx vitest run` passes (including new tests).
- [ ] `npx playwright test` passes.
- [ ] `npm run build` succeeds.
