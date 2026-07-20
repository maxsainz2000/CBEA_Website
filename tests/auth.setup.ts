import { test as setup, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL;
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD;

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for Playwright tests');
}

setup('authenticate as test officer', async ({ page }) => {
  // 1. Sign in via the UI (tests the real login flow)
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill(TEST_USER_EMAIL);
  await page.locator('[data-testid="password-input"]').fill(TEST_USER_PASSWORD);
  await page.locator('[data-testid="login-submit-button"]').click();
  await expect(page).toHaveURL(/\/admin/);

  // 2. Save the authenticated session
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

