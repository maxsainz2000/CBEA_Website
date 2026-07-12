# Task 2: Database Schema and Migration Setup

## Objective
Configure the PostgreSQL database schema in Supabase by defining the migrations, schema tables (`budget_entries` and `profiles`), constraints, triggers, and Row Level Security (RLS) policies to allow public read access and authenticated officer write access.

## Files Created / Modified
- [NEW] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) (PostgreSQL migration file defining tables, types, constraints, functions, triggers, and RLS policies)
- [NEW] [supabase/seed.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/seed.sql) (SQL script for seeding mock budget entries and profiles for local development and staging verification)

## Step-by-Step Instructions

### 1. Database Types & Tables Definition
- Define custom Postgres enums if needed:
  - `entry_type`: `'income'`, `'expense'`
  - `entry_status`: `'paid'`, `'pending'`, `'flagged'`
- Create the `profiles` table to record council officer identities:
  - `id` (UUID, primary key, references `auth.users` on delete cascade)
  - `full_name` (text, not null)
  - `role` (text, not null) -- e.g., 'Treasurer', 'President'
  - `updated_at` (timestamp with time zone default `timezone('utc'::text, now())`)
- Create the `budget_entries` table:
  - `id` (UUID, primary key, default `gen_random_uuid()`)
  - `type` (`entry_type`, not null)
  - `description` (varchar(255), not null)
  - `category` (varchar(100), not null)
  - `amount` (bigint, not null) -- Stored in centavos (cents) to avoid floating-point math issues (e.g., ₱100.50 stored as 10050)
  - `date` (date, not null)
  - `semester` (varchar(50), not null) -- Explicitly store the semester (e.g., '1st Sem', '2nd Sem', 'Summer')
  - `academic_year` (varchar(50), not null) -- e.g., '2025-2026'
  - `notes` (text, nullable)
  - `status` (`entry_status`, default `'paid'`, not null)
  - `entered_by` (UUID, references `profiles(id)` on delete set null)
  - `created_at` (timestamp with time zone default `timezone('utc'::text, now())`)
  - `updated_at` (timestamp with time zone default `timezone('utc'::text, now())`)

### 2. Auto-Update Timestamp Function & Trigger
- Write a standard PL/pgSQL function to update the `updated_at` column:
  ```sql
  CREATE OR REPLACE FUNCTION update_modified_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.updated_at = now();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- Attach this trigger to both the `profiles` and `budget_entries` tables.

### 3. Row Level Security (RLS) Configuration
- Enable RLS on both tables:
  ```sql
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;
  ```
- Write RLS policies for `profiles`:
  - Read: Public read access for display or auth checking:
    `CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);`
  - Write: Authenticated officers can manage their own profile:
    `CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`
- Write RLS policies for `budget_entries`:
  - Read: Any student/visitor can read budget entries:
    `CREATE POLICY "Allow public read access on budget_entries" ON public.budget_entries FOR SELECT USING (true);`
  - Write: Authenticated officers can insert, update, or delete:
    `CREATE POLICY "Allow authenticated write on budget_entries" ON public.budget_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);`

### 4. Create Local Seed Data
- In `supabase/seed.sql`, populate sample profiles and entries matching the Metro design specifications. E.g., setup income rows for fundraisers, acquaintance party student collections, and expense rows for venue rentals, printing flyers, and office supplies.

## Metro Design Compliance & Best Coding Practices
- **Numeric Precision:** Store all values as `bigint` (representing centavos). Never use floating-point types (`real`, `double precision`) for currency.
- **Auditable Provenance:** Every change must have trace integrity back to the officer (`entered_by` field referencing `profiles`).
- **Strict Separation of Concerns:** Use standard migrations. Avoid using custom auth schemas outside of the official Supabase `auth` link structure.

## Automated Testing & Verification Plan

### Automated Database Tests
- To verify the schema works correctly, write a local test using a mock PostgreSQL client or directly run the commands in the Supabase local container:
  1. Confirm `budget_entries` cannot contain negative amounts (amount validation check constraint: `CHECK (amount >= 0)`).
  2. Confirm RLS blocks anonymous inserts:
     - Run SQL `set role anon;` and perform `INSERT INTO public.budget_entries ...` - assert it raises permission denied.
     - Run SQL `set role authenticated;` and perform `INSERT INTO public.budget_entries ...` - assert it succeeds.

### Manual Verification
- Deploy migration to the Supabase database instance (via Supabase SQL editor or Supabase CLI).
- Confirm the table relationships, foreign key constraints, and indices on `date` and `category` are successfully created.

## Acceptance Criteria
- [x] Both tables (`profiles` and `budget_entries`) exist in the database with their respective trigger functions.
- [x] Check constraint `amount >= 0` is enforced to prevent negative numbers.
- [x] RLS policies prevent unauthenticated inserts, updates, and deletes on `budget_entries` and `profiles`.
- [x] Seed data script loads without foreign key constraint errors and creates initial mock records for testing.
