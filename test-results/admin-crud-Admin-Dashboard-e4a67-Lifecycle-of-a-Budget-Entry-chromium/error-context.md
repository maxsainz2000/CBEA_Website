# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-crud.spec.ts >> Admin Dashboard CRUD and Inline Actions >> Full CRUD Lifecycle of a Budget Entry
- Location: tests\admin-crud.spec.ts:5:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="email-input"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "404" [level=1] [ref=e4]
  - heading "This page could not be found." [level=2] [ref=e6]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Admin Dashboard CRUD and Inline Actions', () => {
  4   | 
  5   |   test('Full CRUD Lifecycle of a Budget Entry', async ({ page }) => {
  6   |     // 1. Login Bypass
  7   |     await page.goto('/login');
  8   |     
  9   |     // Listen to all console and errors
  10  |     page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  11  |     page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  12  |     
> 13  |     await page.locator('[data-testid="email-input"]').fill('jane.doe@csu.edu.ph');
      |                                                       ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  14  |     await page.locator('[data-testid="password-input"]').fill('Password123!');
  15  |     await page.locator('[data-testid="login-submit-button"]').click();
  16  |     await expect(page).toHaveURL('http://localhost:3000/admin');
  17  | 
  18  |     const welcomeHeader = page.locator('h1');
  19  |     await expect(welcomeHeader).toContainText(/Officer Dashboard/i);
  20  |     await expect(page.locator('text=Jane Doe')).toBeVisible();
  21  | 
  22  |     // 2. Create Entry
  23  |     // Find and click the "Add New Entry" CTA button
  24  |     const addCta = page.locator('[data-testid="add-entry-cta"]');
  25  |     await expect(addCta).toBeVisible();
  26  |     await addCta.click();
  27  |     await expect(page).toHaveURL(/\/admin\/new/);
  28  |     await page.waitForTimeout(500); // Wait for form slide-in animation to finish
  29  | 
  30  |     // Fill form fields
  31  |     const description = `E2E Sponsorship ${Date.now()}`;
  32  |     const rect = await page.evaluate(() => {
  33  |       const el = document.querySelector('[data-testid="description-input"]');
  34  |       return el ? {
  35  |         bounds: el.getBoundingClientRect(),
  36  |         display: window.getComputedStyle(el).display,
  37  |         visibility: window.getComputedStyle(el).visibility,
  38  |         opacity: window.getComputedStyle(el).opacity,
  39  |         parentDisplay: window.getComputedStyle(el.parentElement).display,
  40  |       } : null;
  41  |     });
  42  |     console.log("INPUT DEBUG:", rect);
  43  |     
  44  |     await page.locator('[data-testid="type-toggle-income"]').dispatchEvent('click'); // Toggle as Income
  45  |     await page.locator('[data-testid="description-input"]').fill(description);
  46  |     await page.locator('[data-testid="category-input"]').fill('Sports Fest');
  47  |     await page.locator('[data-testid="amount-input"]').fill('1500.50');
  48  |     await page.locator('[data-testid="date-input"]').fill('2025-10-10');
  49  |     await page.locator('[data-testid="semester-input"]').selectOption('1st Sem');
  50  |     await page.locator('[data-testid="academic-year-input"]').fill('2025-2026');
  51  |     await page.locator('[data-testid="notes-input"]').fill('E2E testing sponsorship registration');
  52  |     await page.locator('[data-testid="status-input"]').selectOption('paid');
  53  |     // Submit form
  54  |     await page.locator('[data-testid="submit-form-button"]').dispatchEvent('click');
  55  | 
  56  |     // Check for errors
  57  |     const errorMsg = await page.locator('[data-testid="form-error-message"]').textContent({ timeout: 1000 }).catch(() => null);
  58  |     console.log("SERVER ERROR MSG:", errorMsg);
  59  | 
  60  |     // Check for validation errors
  61  |     const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();
  62  |     
  63  |     await expect(page).toHaveURL('http://localhost:3000/admin');
  64  |     
  65  |     const row = page.locator(`tr:has-text("${description}")`);
  66  |     await expect(row).toBeVisible();
  67  |     await expect(row.locator('.amount-col')).toContainText('+₱1,500.50');
  68  | 
  69  |     // 3. Verify public updates (creation/update)
  70  |     await page.goto('/');
  71  |     // Check that our new entry is shown on the public site
  72  |     await expect(page.locator(`text=${description}`)).toBeVisible();
  73  |     await expect(page.locator(`text=${description}`).locator('xpath=../..').locator('.budget-entry-amount')).toContainText('+₱1,500.50');
  74  | 
  75  |     // Go back to admin dashboard
  76  |     await page.goto('/admin');
  77  |     await expect(page).toHaveURL('http://localhost:3000/admin');
  78  | 
  79  |     // 4. Edit Entry
  80  |     const editBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="edit-btn-"]');
  81  |     await expect(editBtn).toBeVisible();
  82  |     await editBtn.click();
  83  |     await expect(page).toHaveURL(/\/admin\/edit\//);
  84  |     await page.waitForTimeout(500);
  85  | 
  86  |     // Verify fields are pre-populated
  87  |     const descValue = await page.locator('[data-testid="description-input"]').inputValue();
  88  |     expect(descValue).toBe(description);
  89  | 
  90  |     // Modify amount to 1600.00
  91  |     await page.locator('[data-testid="amount-input"]').fill('1600.00');
  92  |     await page.locator('[data-testid="submit-form-button"]').click();
  93  | 
  94  |     // Verify updated on admin table
  95  |     await expect(page).toHaveURL('http://localhost:3000/admin');
  96  |     const updatedRow = page.locator(`tr:has-text("${description}")`);
  97  |     await expect(updatedRow.locator('.amount-col')).toContainText('+₱1,600.00');
  98  | 
  99  |     // 5. Delete Entry with Inline Confirmation
  100 |     const deleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="delete-btn-"]');
  101 |     await expect(deleteBtn).toBeVisible();
  102 |     await deleteBtn.click();
  103 | 
  104 |     // Check inline confirmation states
  105 |     const confirmDeleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="confirm-delete-"]');
  106 |     const cancelDeleteBtn = page.locator(`tr:has-text("${description}")`).locator('[data-testid^="cancel-delete-"]');
  107 |     await expect(confirmDeleteBtn).toBeVisible();
  108 |     await expect(cancelDeleteBtn).toBeVisible();
  109 | 
  110 |     // Test Cancel
  111 |     await cancelDeleteBtn.click();
  112 |     await expect(confirmDeleteBtn).not.toBeVisible();
  113 |     await expect(deleteBtn).toBeVisible();
```