# Task 22: Fix E2E Test Data Coupling and Residue

## Objective
Make E2E tests work reliably on a fresh database by provisioning the test user deterministically via the Supabase admin API, and cleaning up test residue after the suite completes. Currently, the Playwright tests only pass because a `profiles` row for the real auth user (`700f2ee8-...`) was previously provisioned manually. A fresh database would fail the E2E suite. Additionally, interrupted CRUD tests leave orphaned entries in the database.

## Audit Reference
- **Findings:** N11 (MEDIUM)
- **Severity:** MEDIUM (CI blocker on fresh databases, test hygiene)
- **Current grade impact:** +1 point toward the target grade (quality).

## Files Created / Modified
- [NEW] [tests/global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts)
- [NEW] [tests/global-teardown.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-teardown.ts)
- [MODIFY] [playwright.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/playwright.config.ts)
- [MODIFY] [supabase/seed.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/seed.sql)

## Step-by-Step Instructions

### 1. Create `tests/global-setup.ts`

This script runs once before the entire test suite. It provisions the test user with a deterministic UUID via the Supabase admin API, and ensures a matching `profiles` row exists.

```ts
import { createClient } from '@supabase/supabase-js';

const TEST_USER_ID = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';
const TEST_USER_EMAIL = 'jane.doe@csu.edu.ph';
const TEST_USER_PASSWORD = 'Password123!';

export default async function globalSetup() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Ensure the test user exists with the deterministic UUID
  const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);
  if (!existingUser?.user) {
    // Check if a user with this email already exists (different UUID)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingByEmail = users?.find(u => u.email === TEST_USER_EMAIL);
    if (existingByEmail) {
      // Delete the existing user so we can recreate with the target UUID
      await supabaseAdmin.auth.admin.deleteUser(existingByEmail.id);
    }

    // Create the user with the deterministic UUID
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Jane Doe', role: 'Treasurer' },
    });
    if (createError) throw createError;
  }

  // 2. Ensure a profiles row exists for the test user
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', TEST_USER_ID)
    .single();

  if (!profile) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: TEST_USER_ID,
        full_name: 'Jane Doe',
        role: 'Treasurer',
      });
    if (profileError) throw profileError;
  }
}
```

**Key design decisions:**
- Uses `admin.getUserById` for idempotency — if the user already exists with the correct UUID, skip creation.
- If a user with the same email but different UUID exists (e.g., from a prior `signUp`), it deletes and recreates with the target UUID.
- Ensures the `profiles` row exists and matches the seed data.
- Uses the service-role key (admin API) — this is the only legitimate use of the service-role key in the project.

### 2. Create `tests/global-teardown.ts`

This script runs once after the entire test suite. It cleans up any test residue (orphaned entries from interrupted CRUD tests).

```ts
import { createClient } from '@supabase/supabase-js';

export default async function globalTeardown() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Clean up any E2E test entries (CRUD test creates entries with 'E2E Sponsorship' prefix)
  const { error } = await supabaseAdmin
    .from('budget_entries')
    .delete()
    .like('description', 'E2E Sponsorship %');

  if (error) {
    console.warn('Global teardown: failed to clean up test entries:', error.message);
  }
}
```

### 3. Update `playwright.config.ts`

Add the `globalSetup` and `globalTeardown` references:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
  // ... rest of config unchanged
});
```

**Note:** If Task 20 (Playwright `storageState` migration) is also applied, merge the setup project and `globalSetup` configurations. The `globalSetup` provisions the user; the setup project authenticates and saves `storageState`.

### 4. Update `supabase/seed.sql` for consistency

Ensure the seed data uses the same deterministic UUID (`d0d0d0d0-...d001`) that the `globalSetup` provisions. The current seed already uses this UUID — verify it matches.

Also consider adding an `ON CONFLICT` clause to make the seed idempotent:

```sql
-- Make seed idempotent:
INSERT INTO public.profiles (id, full_name, role)
VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', 'Jane Doe', 'Treasurer'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', 'John Smith', 'President')
ON CONFLICT (id) DO NOTHING;
```

### 5. Clean up the live database (one-time manual step)

Remove the orphaned profile row and leftover test entries:

```sql
-- Remove the orphaned profile for the real auth user (if it still exists)
DELETE FROM public.profiles WHERE id = '700f2ee8-9e5e-4c88-a9aa-76479108abdf';

-- Remove leftover test entries
DELETE FROM public.budget_entries WHERE description LIKE 'E2E Sponsorship %';

-- Verify: should have exactly 2 profiles (seed) and 10 budget entries (seed)
SELECT COUNT(*) FROM public.profiles;          -- expected: 2
SELECT COUNT(*) FROM public.budget_entries;    -- expected: 10
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components. No design-system impact.
- **Test hygiene best practice:** E2E tests should be runnable on a fresh database without manual provisioning. The `globalSetup`/`globalTeardown` pattern is Playwright's recommended approach.
- **Idempotency:** The setup script is idempotent — running it multiple times has no side effects.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# E2E tests should pass on a fresh setup:
npx playwright test --reporter=list

# Unit tests should still pass:
npx vitest run
```

### Fresh Database Verification
To verify the fix works on a truly fresh database:
1. Reset the Supabase project (or create a new one).
2. Apply `migration.sql` and `seed.sql`.
3. Run `npx playwright test` — all tests should pass.

### Post-Suite Verification
After the test suite completes:
```sql
-- No test residue should remain:
SELECT COUNT(*) FROM public.budget_entries WHERE description LIKE 'E2E Sponsorship %';
-- Expected: 0
```

## Acceptance Criteria
- [ ] `tests/global-setup.ts` exists and provisions the test user with UUID `d0d0d0d0-...d001`.
- [ ] `tests/global-teardown.ts` exists and cleans up `E2E Sponsorship %` entries.
- [ ] `playwright.config.ts` references both `globalSetup` and `globalTeardown`.
- [ ] `supabase/seed.sql` uses `ON CONFLICT` for idempotency.
- [ ] A fresh database + `npx playwright test` passes all tests.
- [ ] No leftover test entries remain after the suite completes.
- [ ] `npx vitest run` passes.
