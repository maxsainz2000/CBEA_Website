# Task 77: Fix Fragile RLS Test Data

## Objective
Fix the RLS test at `supabase/database.test.ts:305` that uses `semester='1st Semester AY 2024-2025'`, which also violates the `budget_entries_semester_check` CHECK constraint. Use a valid semester value so the only failing predicate is RLS.

## Audit Reference
- **Findings:** Y33 (LOW)
- **Source:** AUDIT-v5 §6 finding Y33, §12 P3-8.

## Files Created / Modified
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — use valid semester in RLS test

## Step-by-Step Instructions

### 1. Update test data

```typescript
// BEFORE:
semester: '1st Semester AY 2024-2025'

// AFTER:
semester: '1st Sem'
```

### 2. Verify

```bash
npx vitest run supabase/database.test.ts
```

## Acceptance Criteria
- [x] RLS test uses a valid semester value that passes the CHECK constraint.
- [x] The test still correctly verifies RLS blocks cross-user writes.
- [x] `npx vitest run supabase/database.test.ts` passes.
