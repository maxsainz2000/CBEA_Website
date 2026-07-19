# Task 31: Replace Silent Mock-Data Fallback with Explicit Error State

## Objective
Replace the silent `MOCK_ENTRIES` fallback in all 5 public read functions (`getEntries`, `getEntry`, `getSummaryStats`, `getSemesters`, `getCategories`) with an explicit `DataResult<T>` return type that surfaces errors to the UI via an `ErrorBanner` component. Delete the `MOCK_ENTRIES` constant and all mock helper functions from production code. This is the highest-priority fix — for a transparency portal whose entire purpose is to display real financial data, silently displaying fabricated financial data on DB failure defeats the purpose of the application.

## Audit Reference
- **Findings:** X1 (HIGH, -3 pts), X17 (LOW, -0.25 pts — subsumed by X1)
- **Severity:** HIGH (domain-specific design flaw — transparency portal serving fake data)
- **Current grade impact:** +3 points (87 → 90, crosses the A threshold).
- **Source:** AUDIT-v4 §5 finding X1, §7 Fix 8.1, §8.1 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — refactor 5 functions, delete MOCK_ENTRIES
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — handle DataResult, render ErrorBanner
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — handle DataResult, render ErrorBanner
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx) — handle DataResult from getEntry
- [NEW] [app/components/ErrorBanner.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ErrorBanner.tsx) — visible error banner component
- [NEW] [lib/data/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.test.ts) — tests for error state

## Step-by-Step Instructions

### 1. Add the `DataResult<T>` type to `lib/data/entries.ts`

Add this at the top of the file, after the imports:

```typescript
// lib/data/entries.ts — add at top, after imports
export type DataResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }
```

### 2. Delete `MOCK_ENTRIES` and mock helper functions

Remove the entire `MOCK_ENTRIES` constant (lines 4–155), the `getMockEntries` function (lines 157–180), and the `getMockSummaryStats` function (lines 182–191). These are approximately 188 lines of mock data that should never be returned to production users.

### 3. Refactor `getEntries` to return `DataResult<BudgetEntry[]>`

```typescript
// lib/data/entries.ts — replace getEntries
export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
}): Promise<DataResult<BudgetEntry[]>> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('*');

    if (filters?.semester) query = query.eq('semester', filters.semester);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching entries:', error.message);
      return { status: 'error', message: 'We couldn\'t load budget entries. Please try again later.' };
    }

    return { status: 'ok', data: (data || []) as BudgetEntry[] };
  } catch (err) {
    console.error('Unhandled exception fetching entries:', err);
    return { status: 'error', message: 'We couldn\'t load budget entries. Please try again later.' };
  }
}
```

### 4. Refactor `getEntry` to return `DataResult<BudgetEntry | null>`

```typescript
// lib/data/entries.ts — replace getEntry
export async function getEntry(id: string): Promise<DataResult<BudgetEntry | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('budget_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Database error fetching entry ${id}:`, error.message);
      return { status: 'error', message: 'We couldn\'t load this budget entry. Please try again later.' };
    }

    return { status: 'ok', data: data as BudgetEntry | null };
  } catch (err) {
    console.error(`Unhandled exception fetching entry ${id}:`, err);
    return { status: 'error', message: 'We couldn\'t load this budget entry. Please try again later.' };
  }
}
```

### 5. Refactor `getSummaryStats` to return `DataResult<{totalCollected, totalSpent, remainingBalance}>`

Apply the same pattern: on error, return `{ status: 'error', message: '...' }` instead of calling `getMockSummaryStats(semester)`. On success, return `{ status: 'ok', data: { totalCollected, totalSpent, remainingBalance } }`.

### 6. Refactor `getSemesters` and `getCategories` similarly

On error, return `{ status: 'error', message: '...' }` instead of falling back to `MOCK_ENTRIES.map(...)`. On success, return `{ status: 'ok', data: [...] }`.

### 7. Create `app/components/ErrorBanner.tsx`

```tsx
// app/components/ErrorBanner.tsx
interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="p-md bg-surface border-l-4 border-error text-error font-body-md text-body-md select-none"
      role="alert"
      data-testid="error-banner"
    >
      {message}
    </div>
  );
}
```

### 8. Update `app/page.tsx` to handle `DataResult`

```tsx
// app/page.tsx — update HomepageContent body
import ErrorBanner from '@/app/components/ErrorBanner';

async function HomepageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const semester = params.semester || '';
  const category = params.category || '';

  const semestersResult = await getSemesters();
  if (semestersResult.status === 'error') {
    return <ErrorBanner message={semestersResult.message} />;
  }
  const semestersList = semestersResult.data;
  const activeSemester = semester || semestersList[0] || '1st Sem';

  const [entriesResult, statsResult, categoriesResult] = await Promise.all([
    getEntries({
      semester: activeSemester,
      category: category && category !== 'All' ? category : undefined,
      search: search || undefined,
    }),
    getSummaryStats(activeSemester),
    getCategories(),
  ]);

  if (entriesResult.status === 'error' || statsResult.status === 'error' || categoriesResult.status === 'error') {
    return <ErrorBanner message="We couldn't load budget data. Please try again later." />;
  }

  // ... rest of the render using entriesResult.data, statsResult.data, categoriesResult.data ...
}
```

### 9. Update `app/admin/page.tsx` and `app/admin/edit/[id]/page.tsx` similarly

Apply the same `DataResult` handling pattern. For `getEntry` on the edit page, if the result is an error, call `notFound()` to show a 404 page instead of displaying mock data.

### 10. Write tests in `lib/data/entries.test.ts`

```typescript
// lib/data/entries.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock createClient to control Supabase responses
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getEntries', () => {
  it('returns error status when Supabase returns an error', async () => {
    // Mock supabase to return { data: null, error: { message: 'DB down' } }
    // Call getEntries()
    // Assert result is { status: 'error', message: '...' }
  });

  it('returns error status when an unhandled exception is thrown', async () => {
    // Mock supabase to throw an exception
    // Call getEntries()
    // Assert result is { status: 'error', message: '...' }
  });

  it('returns ok status with empty array when Supabase returns no data', async () => {
    // Mock supabase to return { data: [], error: null }
    // Call getEntries()
    // Assert result is { status: 'ok', data: [] }
  });

  it('NEVER returns mock data', async () => {
    // Mock supabase to return an error
    // Call getEntries()
    // Assert result.data does NOT contain any mock entry descriptions
  });
});
```

## Metro Design Compliance & Best Coding Practices
- The `ErrorBanner` component uses Metro design tokens: `p-md`, `bg-surface`, `border-error`, `text-error`, `font-body-md`. It has a left border accent (4px) in the error color — this is the Metro-idiomatic way to highlight an error state.
- **No rounded corners** on the error banner — consistent with Metro's zero-radius rule.
- The component uses `role="alert"` for screen reader accessibility.
- **Domain-specific rationale:** A transparency portal must NEVER silently display fabricated data. An honest error state is always preferable to a dishonest success state.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the new data-layer tests:
npx vitest run lib/data/entries.test.ts

# Run the full test suite (verify no regressions):
npx vitest run

# Type check (DataResult type changes propagate to all callers):
npx tsc --noEmit

# Build:
npm run build
```

### Manual Verification
- Set `NEXT_PUBLIC_SUPABASE_URL` to an invalid URL in `.env.local`.
- Start the dev server (`npm run dev`).
- Visit `/` — you should see a visible error banner (NOT the 10 mock entries).
- Visit `/admin` (while authenticated) — you should see a visible error banner.
- Restore the correct `NEXT_PUBLIC_SUPABASE_URL` and verify the app works normally.

## Acceptance Criteria
- [x] `MOCK_ENTRIES`, `getMockEntries`, and `getMockSummaryStats` are deleted from `lib/data/entries.ts`.
- [x] All 5 data functions (`getEntries`, `getEntry`, `getSummaryStats`, `getSemesters`, `getCategories`) return `DataResult<T>`.
- [x] `app/components/ErrorBanner.tsx` exists and renders a visible error message with `role="alert"`.
- [x] `app/page.tsx` renders `ErrorBanner` (not mock data) when any data function returns an error.
- [x] `app/admin/page.tsx` renders `ErrorBanner` when data functions return errors.
- [x] `app/admin/edit/[id]/page.tsx` calls `notFound()` when `getEntry` returns an error.
- [x] `npx vitest run lib/data/entries.test.ts` passes — verifies error state, never returns mock data.
- [x] `npx vitest run` passes (all existing + new tests).
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npm run build` succeeds.
- [x] `grep -c 'MOCK_ENTRIES' lib/data/entries.ts` returns 0.
