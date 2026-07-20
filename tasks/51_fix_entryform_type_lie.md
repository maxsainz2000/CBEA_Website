# Task 51: Fix EntryForm Type-Safety Lie

## Objective
Split the `EntryFormProps.initialData` type from `BudgetEntry` (which documents `amount` as integer centavos) to a new `EntryFormInitialData` type where `amount` is decimal pesos. The current code lies about the unit: the edit page passes `amount / 100` (pesos) but the type says centavos. Any future refactor that trusts the type and passes a raw `BudgetEntry` would silently multiply the amount by 100 — a ₱150 entry becomes ₱15,000.

## Audit Reference
- **Findings:** Y2 (HIGH, -1 pt)
- **Severity:** HIGH (type-safety lie — future refactor risk for data corruption)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y2, §10 P1-1 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — new `EntryFormInitialData` type
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx) — use `EntryFormInitialData`
- [MODIFY] [app/admin/components/EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — fix mock data unit

## Step-by-Step Instructions

### 1. Define `EntryFormInitialData` in `EntryForm.tsx`

```typescript
// BEFORE (app/admin/components/EntryForm.tsx:5-10):
import { BudgetEntry, BudgetEntrySchema } from '@/lib/types';

interface EntryFormProps {
  initialData?: BudgetEntry;
}

// AFTER:
import { BudgetEntry, BudgetEntrySchema } from '@/lib/types';

// Form initial data: amount is in decimal pesos (user-facing), NOT centavos.
// This is distinct from BudgetEntry (which stores amount as integer centavos).
export type EntryFormInitialData = Omit<BudgetEntry, 'amount'> & {
  amount: number; // decimal pesos
};

interface EntryFormProps {
  initialData?: EntryFormInitialData;
}
```

### 2. Update `app/admin/edit/[id]/page.tsx`

```typescript
// BEFORE (app/admin/edit/[id]/page.tsx:36-39):
const initialData = {
  ...(entry as BudgetEntry),
  amount: (entry as BudgetEntry).amount / 100,
};

// AFTER:
import { EntryFormInitialData } from '../components/EntryForm';

const initialData: EntryFormInitialData = {
  ...(entry as BudgetEntry),
  amount: (entry as BudgetEntry).amount / 100, // centavos → pesos for form display
};
```

### 3. Update `EntryForm.test.tsx`

```typescript
// BEFORE (app/admin/components/EntryForm.test.tsx:22-36):
const mockInitialData: BudgetEntry = {
  // ...
  amount: 150000, // stored in centavos -> ₱1,500.00
  // ...
};
// expect(...).toBe('150000');
// expect(updateEntry).toHaveBeenCalledWith('b1', { ..., amount: 150000 });

// AFTER:
import { EntryFormInitialData } from './EntryForm';

const mockInitialData: EntryFormInitialData = {
  // ...
  amount: 1500, // decimal pesos -> ₱1,500.00 (form receives pesos, not centavos)
  // ...
};
// expect(...).toBe('1500');
// expect(updateEntry).toHaveBeenCalledWith('b1', { ..., amount: 1500 });
```

### 4. Verify

```bash
npx vitest run app/admin/components/EntryForm.test.tsx
npx tsc --noEmit
npx eslint
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Type safety:** The new `EntryFormInitialData` type correctly documents the unit of measurement, preventing silent data corruption in future refactors.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/admin/components/EntryForm.test.tsx
npx tsc --noEmit
npx eslint
```

### Manual Verification
- Navigate to `/admin/edit/{id}` and verify the amount field displays the correct peso value (not centavos).
- Submit an edit and verify the saved amount is correct.

## Acceptance Criteria
- [ ] `EntryFormInitialData` type exists in `EntryForm.tsx` with `amount: number // decimal pesos`.
- [ ] `EntryFormProps.initialData` uses `EntryFormInitialData`, not `BudgetEntry`.
- [ ] `app/admin/edit/[id]/page.tsx` uses `EntryFormInitialData` for the `initialData` variable.
- [ ] `EntryForm.test.tsx` uses `EntryFormInitialData` type and passes amounts in pesos (not centavos).
- [ ] `npx vitest run app/admin/components/EntryForm.test.tsx` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
