-- Production Migration File

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
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
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
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.profiles;
CREATE POLICY "Allow authenticated users to insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for budget_entries
DROP POLICY IF EXISTS "Allow public read access on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow public read access on budget_entries" ON public.budget_entries
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated write on budget_entries" ON public.budget_entries;
CREATE POLICY "Allow authenticated insert on budget_entries" ON public.budget_entries
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated update on budget_entries" ON public.budget_entries
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = entered_by)
    WITH CHECK ((select auth.uid()) = entered_by);

CREATE POLICY "Allow authenticated delete on budget_entries" ON public.budget_entries
    FOR DELETE TO authenticated
    USING ((select auth.uid()) = entered_by);

-- 8. Grant privileges to roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.budget_entries TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.budget_entries TO authenticated;

-- Index for the primary public query: WHERE semester = ? ORDER BY date DESC
CREATE INDEX IF NOT EXISTS budget_entries_semester_idx
  ON public.budget_entries (semester);

CREATE INDEX IF NOT EXISTS budget_entries_semester_date_idx
  ON public.budget_entries (semester, date DESC);

-- Index for RLS ownership lookups: WHERE entered_by = auth.uid()
-- Also supports ON DELETE SET NULL cascade from profiles
CREATE INDEX IF NOT EXISTS budget_entries_entered_by_idx
  ON public.budget_entries (entered_by);

