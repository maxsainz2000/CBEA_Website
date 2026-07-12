# Task 20: Migrate E2E Auth to Playwright `storageState`

## Objective
Replace the `IS_E2E`/`sb-mock-auth` mock-auth pattern with Playwright's recommended `storageState` + setup project approach. This removes all test-only logic from production code paths, eliminates the `sb-mock-auth` string from the client bundle, and tests the real Supabase Auth flow end-to-end.

## Audit Reference
- **Findings:** N4 (MEDIUM), N8 (LOW)
- **Severity:** MEDIUM (test-only logic in production code paths, client bundle leak)
- **Current grade impact:** +1 point toward the target grade.
- **Sources:**
  - [Playwright auth guide](https://playwright.dev/docs/auth) — `storageState` + setup project.
  - [supabase-community/e2e](https://github.com/supabase-community/e2e) — reference E2E setup with `auth.setup.ts` + `playwright/.auth/`.

## Files Created / Modified
- [NEW] [tests/auth.setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth.setup.ts)
- [MODIFY] [playwright.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/playwright.config.ts)
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)
- [MODIFY] [.gitignore](file:///c:/Users/Admin/Documents/CBEA_Website/.gitignore)

## Step-by-Step Instructions

### 1. Create a Playwright setup project — `tests/auth.setup.ts`

```ts
import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

setup('authenticate as test officer', async ({ page }) => {
  // 1. Ensure the test user exists (provision via admin API)
  const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(
    'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
  );
  if (!existingUser?.user) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
      email: 'jane.doe@csu.edu.ph',
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: 'Jane Doe', role: 'Treasurer' },
    });
    if (createError) throw createError;
  }

  // 2. Sign in via the UI (tests the real login flow)
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
  await page.locator('[data-testid="password-input"]').fill('Password123!');
  await page.locator('[data-testid="login-submit-button"]').click();
  await expect(page).toHaveURL(/\/admin/);

  // 3. Save the authenticated session
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

**Key design decisions:**
- The setup project provisions the test user via the admin API (idempotent — checks if the user exists first).
- Login is done via the real UI form, testing the actual Supabase Auth flow.
- The authenticated session is saved to `playwright/.auth/user.json` and reused by all test projects.
- The `data-testid` selectors should match the login page's existing test IDs. If the login form uses different selectors, update accordingly.

### 2. Configure Playwright to use the setup project — `playwright.config.ts`

Replace the current config with:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 2000 },
  },
  projects: [
    // Setup project — runs first, authenticates the test user
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main test project — uses the saved auth state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
```

**Note:** The `auth-flow.spec.ts > Valid Login` test still needs to log in via the form (it's testing the login flow itself). For that test, override the `storageState` to use a fresh context:

```ts
// In tests/auth-flow.spec.ts, for the "Valid Login" test:
test.use({ storageState: { cookies: [], origins: [] } });
```

### 3. Remove the `IS_E2E`/`sb-mock-auth` mock path — `lib/auth/session.ts`

Replace the current `getOfficer()` function with the clean version (remove the mock block):

```ts
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
  } catch {
    return null;
  }
}
```

Remove:
- The `import { cookies } from 'next/headers'` import (if no longer needed).
- The entire `if (process.env.IS_E2E === 'true') { ... }` block.

### 4. Remove the mock path from middleware — `lib/supabase/middleware.ts`

Remove the mock block (approximately lines 46–50):

```ts
// REMOVE this block:
if (!user && process.env.IS_E2E === 'true' &&
    request.cookies.get('sb-mock-auth')?.value === 'true') {
  user = { id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', email: 'jane.doe@csu.edu.ph' }
}
```

The middleware should only check `supabase.auth.getUser()` — no mock path.

### 5. Remove the `document.cookie` line from AdminHeader — `AdminHeader.tsx`

Remove line 15:

```ts
// REMOVE:
document.cookie = 'sb-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
```

This was clearing the mock-auth cookie on logout. With the mock path fully removed, this line is unnecessary. It was also the source of the `sb-mock-auth` string appearing in the client bundle.

### 6. Update `.env.example` and `.gitignore`

In `.env.example`, remove the `IS_E2E` line:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Service role key — for admin API operations only. NEVER commit.
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

In `.gitignore`, add:

```
playwright/.auth/
```

### 7. Update the E2E tests to remove login-by-form steps

**`tests/admin-crud.spec.ts`** — Remove the login block (lines 7–18). The `storageState` already has the session:

```ts
test('Full CRUD Lifecycle of a Budget Entry', async ({ page }) => {
  // storageState already has the session — go straight to /admin
  await page.goto('/admin');
  await expect(page).toHaveURL('http://localhost:3000/admin');

  const welcomeHeader = page.locator('h1');
  await expect(welcomeHeader).toContainText(/Officer Dashboard/i);
  await expect(page.locator('text=Jane Doe')).toBeVisible();
  // ... rest of the test unchanged
});
```

**`tests/auth-flow.spec.ts`** — The "Route Protection" and "Invalid Login" tests should use a fresh (unauthenticated) context. Add at the top of the test file:

```ts
// Use a fresh context for auth flow tests (no saved session)
test.use({ storageState: { cookies: [], origins: [] } });
```

The "Valid Login" test still logs in via the form — it's testing the login flow itself.

## Metro Design Compliance & Best Coding Practices
- This task removes test-only logic from production components (`AdminHeader.tsx`). No visual changes.
- **Security improvement:** The `sb-mock-auth` string will no longer appear in the client bundle after this migration.
- **Test quality improvement:** E2E tests now exercise the real Supabase Auth flow (sign-in, session refresh, JWT validation) instead of bypassing it with a mock cookie.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All E2E tests should pass via real auth:
npx playwright test --reporter=list

# Unit tests should still pass:
npx vitest run

# Build should succeed:
npm run build
```

### Security Verification
```bash
# After build, confirm sb-mock-auth is gone from client bundle:
grep -r 'sb-mock-auth' .next/static/          # should return nothing
grep -r 'IS_E2E' .next/static/                # should return nothing

# Confirm no mock path in source:
grep -r 'sb-mock-auth' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v 'tasks/' | grep -v 'plans/' | grep -v 'documentations/'
# should return nothing
```

### Runtime Verification
```bash
npm run dev &
# Mock cookie should have NO effect:
curl -sS --cookie 'sb-mock-auth=true' http://localhost:3000/admin -w '%{http_code}\n'
# Expected: 307 (redirect to /login)
```

## Acceptance Criteria
- [ ] `tests/auth.setup.ts` exists and provisions the test user + saves `storageState`.
- [ ] `playwright.config.ts` uses a `setup` project with `storageState` reuse.
- [ ] No file in the codebase references `IS_E2E` (except documentation/tasks/plans).
- [ ] No file in the codebase references `sb-mock-auth` (except documentation/tasks/plans).
- [ ] `AdminHeader.tsx` does not contain `document.cookie`.
- [ ] `grep -r 'sb-mock-auth' .next/static/` returns nothing.
- [ ] `npx playwright test` passes (all tests via real Supabase Auth).
- [ ] `npx vitest run` passes.
- [ ] `npm run build` succeeds.
- [ ] `playwright/.auth/` is in `.gitignore`.
