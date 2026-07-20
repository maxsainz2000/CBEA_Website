# Task 78: Replace Redundant timezone() Wrapper with now()

## Objective
Replace `DEFAULT timezone('utc'::text, now())` with `DEFAULT now()` at `supabase/migration.sql:19-20, 36-37`. The `timezone()` wrapper returns `timestamp without time zone`, which is implicitly cast back to `timestamptz` — functionally equivalent to `now()` but subtly session-dependent. Supabase convention is just `now()`.

## Audit Reference
- **Findings:** Y34 (LOW)
- **Source:** AUDIT-v5 §6 finding Y34, §12 P3-9.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) — replace `timezone('utc'::text, now())` with `now()`

## Step-by-Step Instructions

### 1. Update migration.sql

```sql
-- BEFORE (lines 19-20, 36-37):
created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,

-- AFTER:
created_at timestamptz DEFAULT now() NOT NULL,
updated_at timestamptz DEFAULT now() NOT NULL,
```

### 2. Verify

```bash
grep "timezone('utc'" supabase/migration.sql
# Expected: 0 hits

npx vitest run supabase/database.test.ts
```

## Acceptance Criteria
- [ ] 0 `timezone('utc'::text, now())` calls in migration.sql.
- [ ] Replaced with `DEFAULT now()`.
- [ ] `npx vitest run supabase/database.test.ts` passes.
