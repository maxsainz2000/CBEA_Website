import { test as setup, expect } from '@playwright/test';

setup('authenticate as test officer', async ({ page }) => {
  // 1. Sign in via the UI (tests the real login flow)
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
  await page.locator('[data-testid="password-input"]').fill('Password123!');
  await page.locator('[data-testid="login-submit-button"]').click();
  await expect(page).toHaveURL(/\/admin/);

  // 2. Save the authenticated session
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

