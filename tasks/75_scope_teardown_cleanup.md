# Task 75: Scope Global Teardown Cleanup by entered_by

## Objective
Add `.eq('entered_by', TEST_USER_ID)` filter to the teardown deletion in `tests/global-teardown.ts:18-21`. Currently, it deletes ALL entries with `description LIKE 'E2E Sponsorship %'` regardless of `entered_by`, which could theoretically delete a real officer's entry with that prefix.

## Audit Reference
- **Findings:** Y31 (INFO)
- **Source:** AUDIT-v5 §6 finding Y31, §12 P3-6.

## Files Created / Modified
- [MODIFY] [tests/global-teardown.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-teardown.ts) — add `entered_by` filter

## Step-by-Step Instructions

### 1. Update teardown

```typescript
// BEFORE:
await supabaseAdmin
  .from('budget_entries')
  .delete()
  .like('description', 'E2E Sponsorship %');

// AFTER:
await supabaseAdmin
  .from('budget_entries')
  .delete()
  .eq('entered_by', TEST_USER_ID)
  .like('description', 'E2E Sponsorship %');
```

### 2. Verify

```bash
npx tsc --noEmit
```

## Acceptance Criteria
- [x] Teardown deletion includes `.eq('entered_by', TEST_USER_ID)`.
- [x] `npx tsc --noEmit` passes.
