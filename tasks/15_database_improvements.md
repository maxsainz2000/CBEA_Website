# Task 15: Database Improvements

## Objective
Improve the database schema for production deployability and query performance: split the migration file so it can run in the Supabase SQL editor, add an index for the primary query pattern, and add a `created_at` column to the `profiles` table for officer provenance.

## Audit Reference
- **Findings:** P3-2 (migration/seed split), P3-3 (semester index), P3-4 (profiles `created_at`)
- **Severity:** Polish / Performance
- **Context:**
  - The current `migration.sql` creates a stub `auth.users` table and `auth.uid()` function for PGlite tests. Running this in a real Supabase project will fail with "schema auth already exists".
  - Every public query filters by `semester` but there is no index. With ≥1k entries this will table-scan.
  - The `profiles` table has no `created_at` column, weakening provenance tracking.

## Files Created / Modified
- [MODIFY] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)
- [NEW] [supabase/seed.local.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/seed.local.sql)
- [MODIFY] [supabase/database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts)

## Step-by-Step Instructions

### 1. Split migration — extract PGlite auth stubs

**Move the following blocks from `migration.sql` into a new `supabase/seed.local.sql`:**

- `CREATE SCHEMA IF NOT EXISTS auth;`
- `CREATE TABLE IF NOT EXISTS auth.users (...)` (the stub table)
- `CREATE OR REPLACE FUNCTION auth.uid()` (the stub function)
- Any `INSERT INTO auth.users` seed data

**`supabase/seed.local.sql`** (new file):
```sql
-- =============================================================================
-- LOCAL-ONLY AUTH STUBS FOR PGlite TESTING
-- DO NOT run this in a real Supabase project — Supabase already provides
-- auth.users and auth.uid().
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    -- ... (copy the stub columns from migration.sql)
);

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true)::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;

-- Seed auth users for testing
INSERT INTO auth.users (id, email) VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', 'jane.doe@csu.edu.ph'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', 'john.smith@csu.edu.ph')
ON CONFLICT (id) DO NOTHING;
```

**The production `migration.sql` should retain:**
- `CREATE TABLE public.budget_entries (...)`
- `CREATE TABLE public.profiles (...)`
- All triggers (`update_budget_entries_updated_at`, `update_profiles_updated_at`)
- All RLS policies
- Seed data for `public.profiles` and `public.budget_entries`

### 2. Add semester index — `migration.sql`

Add the following at the end of `migration.sql`, after the table definitions:

```sql
-- Index for the primary public query: WHERE semester = ? ORDER BY date DESC
CREATE INDEX IF NOT EXISTS budget_entries_semester_idx
  ON public.budget_entries (semester);

CREATE INDEX IF NOT EXISTS budget_entries_semester_date_idx
  ON public.budget_entries (semester, date DESC);
```

The composite index `(semester, date DESC)` covers the most common query pattern on the public homepage, avoiding a sequential scan as the entry count grows.

### 3. Add `created_at` to `profiles` — `migration.sql`

Update the `profiles` table definition:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

The `updated_at` trigger (`update_profiles_updated_at`) already exists. The `created_at` column uses the same default pattern.

### 4. Update PGlite test to use `seed.local.sql`

In `supabase/database.test.ts`, update the test setup to load both files:

```ts
// Load production migration (tables, triggers, RLS)
const migrationSQL = fs.readFileSync(
  path.join(__dirname, 'migration.sql'),
  'utf-8'
);

// Load local-only auth stubs (for PGlite)
const seedLocalSQL = fs.readFileSync(
  path.join(__dirname, 'seed.local.sql'),
  'utf-8'
);

// Execute in order: stubs first (auth.users needed for FK), then migration
await client.query(seedLocalSQL);
await client.query(migrationSQL);
```

Note: The auth stubs must be loaded BEFORE the migration because `profiles.id` references `auth.users(id)`.

### 5. Update seed data for `profiles.created_at`

If `seed.sql` has `INSERT INTO profiles` statements, add the `created_at` column:

```sql
INSERT INTO public.profiles (id, full_name, role, created_at) VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', 'Jane Doe', 'Treasurer', '2026-01-01T00:00:00Z'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', 'John Smith', 'Auditor', '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
```

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Database best practice:** Separate test-only DDL (auth stubs) from production DDL (application tables). Indexes should match the primary query patterns.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# PGlite tests must still pass with the split files:
npx vitest run supabase/database.test.ts
# Expected: 8/8 pass

# Full suite:
npx vitest run
```

### Manual Verification
- Verify that `migration.sql` can be copy-pasted into the Supabase SQL editor without errors (no `CREATE SCHEMA auth` block).
- Run `\d+ budget_entries` in the Supabase SQL editor to confirm the semester indexes exist.
- Run `\d+ profiles` to confirm the `created_at` column exists.

## Acceptance Criteria
- [x] `supabase/seed.local.sql` exists and contains the `auth` schema stubs.
- [x] `supabase/migration.sql` does NOT contain `CREATE SCHEMA auth` or `auth.users` stubs.
- [x] `migration.sql` includes `CREATE INDEX ... budget_entries_semester_idx` and `budget_entries_semester_date_idx`.
- [x] `profiles` table has a `created_at` column with a UTC default.
- [x] `npx vitest run supabase/database.test.ts` passes (8/8).
- [x] `migration.sql` can be run in the Supabase SQL editor without errors (assuming `auth.users` already exists).
