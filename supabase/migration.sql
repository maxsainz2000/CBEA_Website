-- 1. Create auth schema stub for local testing / independent runs
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text
);

-- Define helper for auth.uid()
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- 2. Create custom database types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_type') THEN
        CREATE TYPE public.entry_type AS ENUM ('income', 'expense');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_status') THEN
        CREATE TYPE public.entry_status AS ENUM ('paid', 'pending', 'flagged');
    END IF;
END$$;

-- 3. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    role text NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Create budget_entries table
CREATE TABLE IF NOT EXISTS public.budget_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.entry_type NOT NULL,
    description varchar(255) NOT NULL,
    category varchar(100) NOT NULL,
    amount bigint NOT NULL CHECK (amount >= 0),
    date date NOT NULL,
    semester varchar(50) NOT NULL,
    academic_year varchar(50) NOT NULL,
    notes text,
    status public.entry_status NOT NULL DEFAULT 'paid',
    entered_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 5. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS budget_entries_date_idx ON public.budget_entries (date);
CREATE INDEX IF NOT EXISTS budget_entries_category_idx ON public.budget_entries (category);

-- 6. Trigger for updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_budget_entries_updated_at ON public.budget_entries;
CREATE TRIGGER update_budget_entries_updated_at
    BEFORE UPDATE ON public.budget_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for budget_entries
DROP POLICY IF EXISTS "Allow public read access on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow public read access on budget_entries" ON public.budget_entries
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated write on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow authenticated write on budget_entries" ON public.budget_entries
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. Grant privileges to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.budget_entries TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.budget_entries TO authenticated;
