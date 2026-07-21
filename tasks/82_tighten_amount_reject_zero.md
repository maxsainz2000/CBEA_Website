# Task 82: Tighten Amount to Reject Zero

## Objective
Tighten `budget_entries.amount` CHECK constraint from `CHECK (amount >= 0)` to `CHECK (amount > 0)` and update Zod schema from `.min(0)` to `.min(0.01, "Amount must be greater than zero")`. A zero-amount entry is semantically meaningless for a budget transparency portal.

## Audit Reference
- **Findings:** Y37 (LOW)
- **Source:** AUDIT-v5 §6 finding Y37, §12 P3-14.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) — change `CHECK (amount >= 0)` to `CHECK (amount > 0)`
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts) — change `.min(0)` to `.min(0.01, "Amount must be greater than zero")`

## Step-by-Step Instructions

### 1. Update migration.sql

```sql
-- BEFORE:
CHECK (amount >= 0)

-- AFTER:
CHECK (amount > 0)
```

### 2. Update lib/types.ts

```typescript
// BEFORE:
amount: z.number().min(0)

// AFTER:
amount: z.number().min(0.01, "Amount must be greater than zero")
```

### 3. Verify

```bash
npx vitest run
npx tsc --noEmit
```

## Acceptance Criteria
- [x] DB CHECK constraint rejects `amount = 0`.
- [x] Zod schema rejects `amount < 0.01`.
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` passes.
