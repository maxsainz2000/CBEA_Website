# Task 59: Replace `as BudgetEntry` Casts with Zod Parse

## Objective
Replace 4 `as BudgetEntry` unchecked type casts with `BudgetEntrySchema.safeParse()` for runtime validation. Create a `BudgetEntryRecordSchema` that extends `BudgetEntrySchema` with DB-generated fields (`id`, `entered_by`, `created_at`, `updated_at`). If the DB schema drifts (e.g., a column rename), the Zod parse will catch it at runtime instead of silently returning `undefined`.

## Audit Reference
- **Findings:** Y8 (MEDIUM, -0.5 pts)
- **Severity:** MEDIUM (unchecked type casts — silent schema drift risk)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v5 §6 finding Y8, §11 P2-1 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts) — add `BudgetEntryRecordSchema`
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — replace 2 `as BudgetEntry` casts
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx) — replace 2 `as BudgetEntry` casts

## Step-by-Step Instructions

### 1. Add `BudgetEntryRecordSchema` to `lib/types.ts`

```typescript
// Add after BudgetEntrySchema:
export const BudgetEntryRecordSchema = BudgetEntrySchema.extend({
  id: z.string().uuid(),
  entered_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
});
```

### 2. Replace casts in `app/actions/entries.ts`

```typescript
// BEFORE (line 63):
return { success: true, data: insertedData as BudgetEntry }

// AFTER:
const parsed = BudgetEntryRecordSchema.safeParse(insertedData)
if (!parsed.success) {
  logger.error('Schema validation failed on inserted data', { errors: parsed.error.issues })
  return { success: false, error: 'Inserted data failed schema validation.' }
}
return { success: true, data: parsed.data }
```

Repeat for the update action (line 127).

### 3. Replace casts in `app/admin/edit/[id]/page.tsx`

Replace `(entry as BudgetEntry)` with `BudgetEntryRecordSchema.parse(entry)` wrapped in try/catch.

### 4. Verify

```bash
npx vitest run app/actions/entries.test.ts
npx tsc --noEmit
```

## Acceptance Criteria
- [ ] `BudgetEntryRecordSchema` exists in `lib/types.ts` with `id`, `entered_by`, `created_at`, `updated_at`.
- [ ] 0 `as BudgetEntry` casts remain in `app/actions/entries.ts` and `app/admin/edit/[id]/page.tsx`.
- [ ] `npx vitest run` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
