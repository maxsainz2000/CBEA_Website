# Task 44: Pin `search_path = ''` on Trigger Function

## Objective
Add `SET search_path = ''` to the `update_modified_column()` trigger function in `supabase/migration.sql`. This function is a trigger function that runs with the privileges of the table owner. Postgres best practice (and Supabase's own security recommendation) is to pin `search_path = ''` on all trigger functions to prevent search_path injection attacks. An attacker who can create objects in the `public` schema could shadow built-in functions like `now()` and hijack the trigger.

## Audit Reference
- **Findings:** X13 (LOW, -0.25 pts)
- **Severity:** LOW (defense-in-depth — trigger function missing search_path pinning)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X13, §8.13 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

## Step-by-Step Instructions

### 1. Replace the trigger function definition

Find the `update_modified_column()` function (approximately lines 45–51) and replace:

```sql
-- BEFORE:
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- AFTER:
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
```

### 2. Verify triggers still work

The PGlite tests for `updated_at` trigger behavior (`supabase/database.test.ts`) should still pass — `SET search_path = ''` doesn't affect `now()` resolution because `now()` is a built-in function, not a schema-qualified one. Postgres resolves built-ins regardless of `search_path`.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Supabase security best practice:** All trigger functions and `SECURITY DEFINER` functions should have `SET search_path = ''` to prevent search_path injection.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the database tests (verify triggers still work):
npx vitest run supabase/database.test.ts

# Full test suite:
npx vitest run
```

### Manual Verification
- After applying to production, verify `updated_at` still auto-updates on row changes.

## Acceptance Criteria
- [ ] `update_modified_column()` function has `SET search_path = ''`.
- [ ] `npx vitest run supabase/database.test.ts` passes (triggers still work).
- [ ] `npx vitest run` passes.
