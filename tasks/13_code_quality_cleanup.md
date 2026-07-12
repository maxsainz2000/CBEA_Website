# Task 13: Code Quality Cleanup

## Objective
Address 6 code quality issues identified in the audit §5.4: remove debug logging, extract duplicated utility functions, fix wasteful client instantiation, and tighten the test configuration.

## Audit Reference
- **Findings:** P2-5 (debug `console.log`), P2-6 (duplicated currency formatter), P2-6 (duplicated date formatter), P2-7 (`createClient()` in component body), P2-8 (`scratch/` not excluded from vitest), §5.4 items 1–7
- **Severity:** Code quality

## Files Created / Modified
- [NEW] [lib/format/currency.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/format/currency.ts)
- [NEW] [lib/format/date.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/format/date.ts)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx)
- [MODIFY] [app/components/BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx)
- [MODIFY] [vitest.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/vitest.config.ts)

## Step-by-Step Instructions

### 1. Remove debug `console.log` from `EntryForm.tsx`

Delete these three lines from `app/admin/components/EntryForm.tsx`:

```ts
console.log('ONSUBMIT CALLED');           // line 58
console.log('RESPONSE:', response);        // line 92
console.log('CALLING ROUTER PUSH /admin'); // line 94
```

These are debugging artifacts that will appear in the browser console in production.

### 2. Extract currency formatter — `lib/format/currency.ts`

Create a centralized currency formatting module. Currently, `formatAmount(centavos)` is duplicated in 3 components: `SummaryStats.tsx:36`, `BudgetEntryList.tsx:31`, `EntryTable.tsx:32`.

```ts
// lib/format/currency.ts

/**
 * Format centavos as a Philippine Peso string.
 * @param centavos - Amount in centavos (integer).
 * @param opts.sign - If true, prefix with + or - sign.
 * @returns Formatted string, e.g. "₱1,234.56" or "-₱100.00"
 */
export function formatCentavos(
  centavos: number,
  opts: { sign?: boolean } = {}
): string {
  const isNegative = centavos < 0;
  const absValue = Math.abs(centavos) / 100;
  const formattedNum = absValue.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const prefix = opts.sign
    ? (isNegative ? '-' : '+')
    : (isNegative ? '-' : '');
  return `${prefix}₱${formattedNum}`;
}
```

Then replace the local `formatAmount` function in each component:

**`app/components/SummaryStats.tsx`:**
```ts
import { formatCentavos } from '@/lib/format/currency'
// Delete the local formatAmount function
// Replace formatAmount(value) calls with formatCentavos(value)
```

**`app/components/BudgetEntryList.tsx`:**
```ts
import { formatCentavos } from '@/lib/format/currency'
// Delete the local formatAmount function
// Replace formatAmount(entry.amount) calls with formatCentavos(entry.amount)
```

**`app/admin/components/EntryTable.tsx`:**
```ts
import { formatCentavos } from '@/lib/format/currency'
// Delete the local formatAmount function
// Replace formatAmount(entry.amount) calls with formatCentavos(entry.amount)
```

Verify that the function signatures are compatible — the existing implementations may differ slightly in how they handle negatives or signs. Make `formatCentavos` a superset that covers all use cases.

### 3. Extract date formatter — `lib/format/date.ts`

Create a centralized date formatting module. Currently, `formatDate(dateStr)` is duplicated in 2 components: `BudgetEntryList.tsx:16` and `EntryTable.tsx:17`.

```ts
// lib/format/date.ts

/**
 * Format an ISO date string as a human-readable date.
 * @param iso - ISO 8601 date string (e.g. "2026-01-15")
 * @returns Formatted string, e.g. "Jan 15, 2026"
 */
export function formatISODate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}
```

Replace the local `formatDate` function in both `BudgetEntryList.tsx` and `EntryTable.tsx` with imports from this module.

### 4. Move `createClient()` out of the component body — `AdminHeader.tsx`

**Problem:** `app/admin/components/AdminHeader.tsx:10` calls `createClient()` in the component body, creating a new Supabase client on every render.

```tsx
// Current:
export default function AdminHeader() {
  const router = useRouter();
  const supabase = createClient(); // <-- new client every render
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // ...
  };
}

// Fix — move into the callback:
export default function AdminHeader() {
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createClient(); // <-- only when needed
    try {
      await supabase.auth.signOut();
    } finally {
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    }
  };
}
```

### 5. Exclude `scratch/` from vitest — `vitest.config.ts`

**Problem:** `vitest.config.ts` excludes `'tests'` (Playwright) but not `'scratch'`. So `scratch/test-crud.test.ts` runs in the production test suite.

```ts
// Current:
exclude: ['node_modules', 'dist', '.next', 'tests'],

// Fix:
exclude: ['node_modules', 'dist', '.next', 'tests', 'scratch'],
```

### 6. Remove empty `if` block — `app/admin/edit/[id]/page.tsx`

If Task 09 hasn't already removed this, clean up the empty branch:

```ts
// Current:
if (isE2e && mockAuth) {
  // E2E Mock Session
} else { ... }

// Fix — invert the condition:
if (!isE2e || !mockAuth) {
  // ... real auth logic
}
```

Note: Task 09 should have already replaced this with `getOfficer()`. Verify and clean up any remnants.

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **DRY principle:** Centralizing formatters prevents drift between the public and admin surfaces.
- **Performance:** Moving `createClient()` into the callback avoids unnecessary Supabase client construction on every render.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All existing tests should still pass:
npx vitest run

# Verify scratch tests no longer run:
npx vitest run --reporter=verbose 2>&1 | grep -i scratch
# Expected: no output (scratch tests excluded)
```

### Manual Verification
- Open the admin page in the browser, open DevTools Console.
- Create or edit an entry.
- Verify no `ONSUBMIT CALLED`, `RESPONSE:`, or `CALLING ROUTER PUSH /admin` appears in the console.
- Verify currency formatting is unchanged on both public and admin pages.

## Acceptance Criteria
- [ ] No `console.log` debug statements in `EntryForm.tsx`.
- [ ] `lib/format/currency.ts` exists; `formatCentavos()` is the single source of truth for currency formatting.
- [ ] `lib/format/date.ts` exists; `formatISODate()` is the single source of truth for date formatting.
- [ ] No local `formatAmount` or `formatDate` functions remain in components.
- [ ] `AdminHeader.tsx` creates the Supabase client inside `handleLogout`, not in the component body.
- [ ] `vitest.config.ts` excludes `'scratch'`.
- [ ] `npx vitest run` passes (all tests green, no scratch test output).
- [ ] No empty `if` blocks remain in admin pages.
