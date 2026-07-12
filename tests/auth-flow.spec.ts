import { test, expect } from '@playwright/test';

test.describe('Officer Authentication Flow', () => {
  // Use a fresh context for auth flow tests (no saved session)
  test.use({ storageState: { cookies: [], origins: [] } });
  
  test('Route Protection: Navigate directly to /admin while unauthenticated redirects to /login', async ({ page }) => {
    // Attempt to access the admin dashboard directly
    await page.goto('/admin');

    // Wait for the URL to change to the login page
    await expect(page).toHaveURL(/\/login/);

    // Verify login page visual indicators are present
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Officer Sign In');
  });

  test('Invalid Login: Fails with incorrect credentials and displays inline error', async ({ page }) => {
    await page.goto('/login');

    // Fill in incorrect/fake credentials
    await page.locator('[data-testid="email-input"]').fill('nonexistent@csu.edu.ph');
    await page.locator('[data-testid="password-input"]').fill('wrongpassword');

    // Click submit
    await page.locator('[data-testid="login-submit-button"]').click();

    // Verify that we remain on the login page
    await expect(page).toHaveURL(/\/login/);

    // Verify error message container is visible and displays error text
    const errorMsg = page.locator('[data-testid="login-error-message"]');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText(/invalid/i);
  });

  test('Valid Login: Successfully authenticates and redirects to /admin dashboard', async ({ page }) => {
    await page.goto('/login');

    // Fill in mock seeded credentials
    // Note: This relies on the user jane.doe@csu.edu.ph being configured with Password123! in Supabase Auth
    await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
    await page.locator('[data-testid="password-input"]').fill('Password123!');

    // Click submit
    await page.locator('[data-testid="login-submit-button"]').click();

    // Verify redirect to /admin dashboard
    await expect(page).toHaveURL(/\/admin/);

    // Verify dashboard welcome message is visible
    const h1 = page.locator('h1');
    await expect(h1).toContainText(/Officer Dashboard/i);
    await expect(page.locator('text=Jane Doe')).toBeVisible();
  });
});
