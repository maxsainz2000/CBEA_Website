# Task 41: Add CHECK/ENUM Constraints on `semester`, `academic_year`, `role`

## Objective
Add CHECK constraints to `budget_entries.semester`, `budget_entries.academic_year`, and `profiles.role` to enforce domain integrity at the database level. Currently, `type`, `amount`, and `status` have proper constraints (ENUM + CHECK), but `semester`, `academic_year`, and `role` accept ANY string. The app's `<select>` dropdowns restrict values on the UI, but a malicious actor calling the Server Action directly could submit arbitrary strings. Also update the Zod schema in `lib/types.ts` to mirror these constraints at the validation layer.

## Audit Reference
- **Findings:** X16 (LOW, -0.5 pts)
- **Severity:** LOW (missing domain integrity constraints on 3 columns)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v4 §5 finding X16, §8.16 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — add constraint violation tests

## Step-by-Step Instructions

### 1. Add CHECK constraints to migration

Add these SQL statements at the end of `supabase/migration.sql`:

```sql
-- Domain integrity constraints (mirror app-layer dropdown restrictions)
ALTER TABLE public.budget_entries
  ADD CONSTRAINT budget_entries_semester_check
  CHECK (semester IN ('1st Sem', '2nd Sem', 'Summer'));

ALTER TABLE public.budget_entries
  ADD CONSTRAINT budget_entries_academic_year_check
  CHECK (academic_year ~ '^\d{4}-\d{4}$');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary'));
```

**Why CHECK constraints instead of ENUM types:** CHECK constraints are more flexible — they can be altered with a simple `ALTER TABLE ... DROP CONSTRAINT / ADD CONSTRAINT` without needing to drop/recreate the type. ENUM types require a more complex migration path when adding new values.

### 2. Update Zod schema to mirror

```typescript
// lib/types.ts — update the budget entry schema fields
semester: z.enum(['1st Sem', '2nd Sem', 'Summer'], {
  errorMap: () => ({ message: 'Semester must be 1st Sem, 2nd Sem, or Summer' }),
}),
academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be YYYY-YYYY format'),
```

Note: `role` is on the `profiles` table, not `budget_entries` — it doesn't need a Zod update unless there's a separate profiles schema.

### 3. Add PGlite tests verifying constraints fire

```typescript
// supabase/database.test.ts — add tests
it('should reject invalid semester value', async () => {
  await expect(
    db.query(`INSERT INTO public.budget_entries
      (type, description, category, amount, date, semester, academic_year, entered_by)
      VALUES ('income', 'Test', 'Test', 100, '2025-01-01', '1st semm', '2025-2026', $1)`,
      [testUserId])
  ).rejects.toThrow(/violates check constraint/i);
});

it('should reject invalid academic_year format', async () => {
  await expect(
    db.query(`INSERT INTO public.budget_entries
      (type, description, category, amount, date, semester, academic_year, entered_by)
      VALUES ('income', 'Test', 'Test', 100, '2025-01-01', '1st Sem', '2025', $1)`,
      [testUserId])
  ).rejects.toThrow(/violates check constraint/i);
});

it('should accept valid semester values', async () => {
  // Test '1st Sem', '2nd Sem', 'Summer' all succeed
  // (may need to wrap in transactions to avoid test interference)
});
```

### 4. Update seed data if needed

Verify that `supabase/seed.sql` and `supabase/seed.local.sql` use valid values for `semester`, `academic_year`, and `role`. If any seed data uses non-conforming values, update them to match the constraints.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Defense-in-depth:** The Zod schema validates on the app layer; CHECK constraints validate on the DB layer. Two independent lines of defense.
- **Consistency:** `type` and `status` already have ENUM constraints. `semester`, `academic_year`, and `role` should have equivalent constraints.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests:
npx vitest run supabase/database.test.ts

# Run the full test suite (verify Zod changes don't break forms):
npx vitest run

# Type check:
npx tsc --noEmit

# Build:
npm run build
```

### Manual Verification
- In the Supabase SQL editor, try inserting a `budget_entries` row with `semester = 'invalid'` — should fail with constraint violation.
- In the admin panel, verify the entry form still works correctly with valid semester/academic year values.

## Acceptance Criteria
- [x] `supabase/migration.sql` has `budget_entries_semester_check` constraint.
- [x] `supabase/migration.sql` has `budget_entries_academic_year_check` constraint.
- [x] `supabase/migration.sql` has `profiles_role_check` constraint.
- [x] `lib/types.ts` uses `z.enum()` for `semester` and `z.string().regex()` for `academic_year`.
- [x] `npx vitest run supabase/database.test.ts` passes (all existing + new constraint tests).
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
