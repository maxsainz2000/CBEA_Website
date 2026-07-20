# Task 69: Use MAX(updated_at) for asOfDate

## Objective
Add a `getLastUpdatedDate(semester?)` function that returns `MAX(updated_at)` from budget entries. Replace `new Date()` (render time) with the data's actual last-update time in both `app/page.tsx` and `app/admin/page.tsx`. A student visiting the site should see "as of Jul 15, 2026" (the last entry update), not "as of Jul 20, 2026" (today's render time).

## Audit Reference
- **Findings:** Y15 (LOW, -0.25 pts)
- **Severity:** LOW (misleading timestamp — shows render time, not data freshness)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y15, §11 P2-11 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — add `getLastUpdatedDate` function
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — use `getLastUpdatedDate` for asOfDate
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — use `getLastUpdatedDate` for asOfDate

## Step-by-Step Instructions

### 1. Add `getLastUpdatedDate` to `lib/data/entries.ts`

```typescript
export async function getLastUpdatedDate(semester?: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('updated_at');
    if (semester) query = query.eq('semester', semester);
    query = query.order('updated_at', { ascending: false }).limit(1);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0].updated_at;
  } catch {
    return null;
  }
}
```

### 2. Update `app/page.tsx` and `app/admin/page.tsx`

```typescript
// BEFORE:
const asOfDate = new Date().toLocaleDateString('en-US', { ... });

// AFTER:
const lastUpdated = await getLastUpdatedDate(activeSemester);
const asOfDate = lastUpdated
  ? new Date(lastUpdated).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
    })
  : 'No data published yet';
```

### 3. Verify

```bash
npx vitest run
npx tsc --noEmit
npm run build
```

## Acceptance Criteria
- [ ] `getLastUpdatedDate` function exists in `lib/data/entries.ts`.
- [ ] `app/page.tsx` uses `getLastUpdatedDate` instead of `new Date()`.
- [ ] `app/admin/page.tsx` uses `getLastUpdatedDate` instead of `new Date()`.
- [ ] Falls back to "No data published yet" when no entries exist.
- [ ] `npx vitest run` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
