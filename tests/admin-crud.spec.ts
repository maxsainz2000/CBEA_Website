import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard CRUD and Inline Actions', () => {

  test('Full CRUD Lifecycle of a Budget Entry', async ({ page }) => {
    // 1. Login Bypass
    await page.goto('/login');
    
    // Listen to all console and errors
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
    await page.locator('[data-testid="password-input"]').fill('Password123!');
    await page.locator('[data-testid="login-submit-button"]').click();
    await expect(page).toHaveURL('http://localhost:3000/admin');

    const welcomeHeader = page.locator('h1');
    await expect(welcomeHeader).toContainText(/Officer Dashboard/i);
    await expect(page.locator('text=Jane Doe')).toBeVisible();

    // 2. Create Entry
    // Find and click the "Add New Entry" CTA button
    const addCta = page.locator('[data-testid="add-entry-cta"]');
    await expect(addCta).toBeVisible();
    await addCta.click();
    await expect(page).toHaveURL(/\/admin\/new/);
    await page.waitForTimeout(500); // Wait for form slide-in animation to finish

    // Fill form fields
    const description = `E2E Sponsorship ${Date.now()}`;
    const rect = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="description-input"]');
      return el ? {
        bounds: el.getBoundingClientRect(),
        display: window.getComputedStyle(el).display,
        visibility: window.getComputedStyle(el).visibility,
        opacity: window.getComputedStyle(el).opacity,
        parentDisplay: window.getComputedStyle(el.parentElement).display,
      } : null;
    });
    console.log("INPUT DEBUG:", rect);
    
    await page.locator('[data-testid="type-toggle-income"]').dispatchEvent('click'); // Toggle as Income
    await page.locator('[data-testid="description-input"]').fill(description);
    await page.locator('[data-testid="category-input"]').fill('Sports Fest');
    await page.locator('[data-testid="amount-input"]').fill('1500.50');
    await page.locator('[data-testid="date-input"]').fill('2025-10-10');
    await page.locator('[data-testid="semester-input"]').selectOption('1st Sem');
    await page.locator('[data-testid="academic-year-input"]').fill('2025-2026');
    await page.locator('[data-testid="notes-input"]').fill('E2E testing sponsorship registration');
    await page.locator('[data-testid="status-input"]').selectOption('paid');
    // Submit form
    await page.locator('[data-testid="submit-form-button"]').dispatchEvent('click');

    // Check for errors
    const errorMsg = await page.locator('[data-testid="form-error-message"]').textContent({ timeout: 1000 }).catch(() => null);
    console.log("SERVER ERROR MSG:", errorMsg);

    // Check for validation errors
    const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();
    
    await expect(page).toHaveURL('http://localhost:3000/admin');
    
    const row = page.locator(`tr:has-text("${description}")`);
    await expect(row).toBeVisible();
    await expect(row.locator('.amount-col')).toContainText('+₱1,500.50');

    // 3. Verify public updates (creation/update)
    await page.goto('/');
    // Check that our new entry is shown on the public site
    await expect(page.locator(`text=${description}`)).toBeVisible();
    await expect(page.locator(`text=${description}`).locator('xpath=../..').locator('.budget-entry-amount')).toContainText('+₱1,500.50');

    // Go back to admin dashboard
    await page.goto('/admin');
    await expect(page).toHaveURL('http://localhost:3000/admin');

    // 4. Edit Entry
    const editBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="edit-btn-"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await expect(page).toHaveURL(/\/admin\/edit\//);
    await page.waitForTimeout(500);

    // Verify fields are pre-populated
    const descValue = await page.locator('[data-testid="description-input"]').inputValue();
    expect(descValue).toBe(description);

    // Modify amount to 1600.00
    await page.locator('[data-testid="amount-input"]').fill('1600.00');
    await page.locator('[data-testid="submit-form-button"]').click();

    // Verify updated on admin table
    await expect(page).toHaveURL('http://localhost:3000/admin');
    const updatedRow = page.locator(`tr:has-text("${description}")`);
    await expect(updatedRow.locator('.amount-col')).toContainText('+₱1,600.00');

    // 5. Delete Entry with Inline Confirmation
    const deleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="delete-btn-"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Check inline confirmation states
    const confirmDeleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="confirm-delete-"]');
    const cancelDeleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="cancel-delete-"]');
    await expect(confirmDeleteBtn).toBeVisible();
    await expect(cancelDeleteBtn).toBeVisible();

    // Test Cancel
    await cancelDeleteBtn.click();
    await expect(confirmDeleteBtn).not.toBeVisible();
    await expect(deleteBtn).toBeVisible();

    // Perform Delete
    await deleteBtn.click();
    await confirmDeleteBtn.click();

    // Verify entry is gone from admin dashboard
    await expect(page.locator(`tr:has-text("${description}")`)).not.toBeVisible();

    // 6. Verify gone from public homepage
    await page.goto('/');
    await expect(page.locator(`text=${description}`)).not.toBeVisible();
  });
});
