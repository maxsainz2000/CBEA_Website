# Task 33: Add Ownership Check to Edit Page

## Objective
Replace the public `getEntry(id)` call in `app/admin/edit/[id]/page.tsx` with a direct Supabase query that filters by both `id` and `entered_by`. Currently, any authenticated officer can navigate to `/admin/edit/<any-entry-id>` and see the full edit form pre-populated with ANY entry's data — including entries created by other officers. The RLS SELECT policy is `USING (true)` (public read), so the query succeeds. While RLS UPDATE would block the actual save, the data (including the `notes` field which may contain sensitive internal context) is already disclosed. Defense-in-depth says: return 404 for entries you don't own.

## Audit Reference
- **Findings:** X3 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (defense-in-depth — view-only cross-user data disclosure)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v4 §5 finding X3, §8.3 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)

## Step-by-Step Instructions

### 1. Replace `getEntry(id)` with ownership-filtered query

Replace the current edit page implementation with one that queries directly with an ownership filter:

```typescript
// app/admin/edit/[id]/page.tsx — full replacement
import { redirect, notFound } from 'next/navigation';
import { getOfficer } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '../../components/AdminHeader';
import EntryForm from '../../components/EntryForm';
import { BudgetEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEntryPage({ params }: PageProps) {
  const { id } = await params;

  const officer = await getOfficer();
  if (!officer) {
    redirect('/login');
  }

  // Fetch target budget entry — filter by entered_by for ownership
  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('id', id)
    .eq('entered_by', officer.id)   // ← ownership filter: only show entries you own
    .maybeSingle();

  if (error || !entry) {
    notFound();   // 404 — don't reveal whether the entry exists
  }

  // Rehydrate initialData: Convert amount from centavos (integer) back to decimal (pesos)
  const initialData = {
    ...(entry as BudgetEntry),
    amount: (entry as BudgetEntry).amount / 100,
  };

  return (
    // ... rest of the JSX remains unchanged — AdminHeader + EntryForm with initialData ...
  );
}
```

### 2. Verify the import changes

The key import change is removing the `getEntry` import from `@/lib/data/entries` and adding `createClient` from `@/lib/supabase/server` and `BudgetEntry` from `@/lib/types` (if not already imported).

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Security:** Returns 404 (not 403) to avoid revealing whether the entry exists — this is a standard information-disclosure prevention technique.
- **Consistent with Task 32:** The ownership filter at the query layer mirrors the RLS predicate and the update/delete ownership filters added in Task 32.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Type check:
npx tsc --noEmit

# Full test suite:
npx vitest run

# Build:
npm run build

# E2E test (with real Supabase creds):
# npx playwright test
```

### Manual Verification
- Login as Officer A, create an entry, note its ID.
- Login as Officer B, navigate to `/admin/edit/<officer-A-entry-id>`.
- Should see 404 page (NOT the edit form pre-populated with Officer A's entry data).
- Login as Officer A, navigate to `/admin/edit/<officer-A-entry-id>`.
- Should see the edit form with the correct data (own entry).

## Acceptance Criteria
- [x] `app/admin/edit/[id]/page.tsx` queries with `.eq('entered_by', officer.id)`.
- [x] `app/admin/edit/[id]/page.tsx` does NOT import or use `getEntry` from `lib/data/entries`.
- [x] Navigating to `/admin/edit/<other-user-entry-id>` shows 404.
- [x] Navigating to `/admin/edit/<own-entry-id>` shows the edit form with correct data.
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npm run build` succeeds.
