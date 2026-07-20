-- =============================================================================
-- LOCAL-ONLY AUTH STUBS FOR PGlite TESTING
-- DO NOT run this in a real Supabase project — Supabase already provides
-- auth.users and auth.uid().
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE
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
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', 'test-officer@your-project.supabase.co'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', 'john.smith@csu.edu.ph')
ON CONFLICT (id) DO NOTHING;
