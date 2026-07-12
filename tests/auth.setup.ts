import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

setup('authenticate as test officer', async ({ page }) => {
  // 1. Ensure the test user exists (provision via admin API)
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;

  const targetEmail = 'jane.doe@csu.edu.ph';
  const targetId = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001';
  const existingUser = users.find(u => u.email === targetEmail);

  if (existingUser) {
    if (existingUser.id !== targetId) {
      // Delete existing user if UUID doesn't match target ID
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (deleteError) throw deleteError;
    }
  }

  // Double check if we need to create the user
  const { data: checkUser } = await supabaseAdmin.auth.admin.getUserById(targetId);
  if (!checkUser?.user) {
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      id: targetId,
      email: targetEmail,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: 'Jane Doe', role: 'Treasurer' },
    });
    if (createError) throw createError;
  }

  // 2. Ensure the profile exists in public.profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: targetId,
      full_name: 'Jane Doe',
      role: 'Treasurer',
    });
  if (profileError) throw profileError;

  // 3. Sign in via the UI (tests the real login flow)
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
  await page.locator('[data-testid="password-input"]').fill('Password123!');
  await page.locator('[data-testid="login-submit-button"]').click();
  await expect(page).toHaveURL(/\/admin/);

  // 3. Save the authenticated session
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
