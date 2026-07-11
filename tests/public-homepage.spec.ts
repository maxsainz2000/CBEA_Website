import { test, expect } from '@playwright/test';

test.describe('Public Homepage Assembly & Interaction', () => {
  
  test.beforeEach(async ({ page }) => {
    // Go to homepage
    await page.goto('/');
  });

  test('Page Load: Verify title renders and currency format', async ({ page }) => {
    // Verify the page title is displayed
    const title = page.locator('h1');
    await expect(title).toContainText('CBEA Student Council Budget Transparency');

    // Verify stats cards show values formatted with Peso (₱) symbol
    const collectedValue = page.locator('[data-testid="stat-collected-value"]');
    await expect(collectedValue).toContainText('₱');
    
    const spentValue = page.locator('[data-testid="stat-spent-value"]');
    await expect(spentValue).toContainText('₱');

    const remainingValue = page.locator('[data-testid="stat-remaining-value"]');
    await expect(remainingValue).toContainText('₱');

    // Verify budget entry list rows contain Peso (₱) symbol
    const entryAmount = page.locator('.budget-entry-amount').first();
    await expect(entryAmount).toContainText('₱');
  });

  test('Filtering: Click on a semester pivot button and verify URL updates', async ({ page }) => {
    // Locate semester tabs container
    const pivotContainer = page.locator('[data-testid="pivot-tabs-container"]');
    await expect(pivotContainer).toBeVisible();

    // Locate the "1st Sem" tab (it should be loaded dynamically from seeded data)
    const firstSemTab = page.locator('[data-testid="pivot-tab-1st Sem"]');
    await expect(firstSemTab).toBeVisible();

    // Click the tab
    await firstSemTab.click();

    // URL should be updated with ?semester=1st+Sem
    await expect(page).toHaveURL(/semester=1st\+Sem/);

    // Verify budget entry list matches the semester
    const entries = page.locator('.budget-entry');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('Filtering: Click on a category chip and verify URL and list updates', async ({ page }) => {
    // Locate Rental category chip
    const rentalChip = page.locator('[data-testid="category-chip-Rental"]');
    await expect(rentalChip).toBeVisible();

    // Click Rental chip
    await rentalChip.click();

    // URL should contain category=Rental
    await expect(page).toHaveURL(/category=Rental/);

    // Verify that the entries list is filtered to only show Rental category
    const entriesList = page.locator('.budget-entry');
    const count = await entriesList.count();
    
    // In seed, we have 3 Rental entries: CSU Gym Rental, Sound System & Lights, Sound System Sports Fest
    expect(count).toBe(3);

    for (let i = 0; i < count; i++) {
      const entryText = await entriesList.nth(i).textContent();
      expect(entryText).toContain('Rental');
    }
  });

  test('Search: Input a search query and verify results update and URL transitions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    // Type query "party"
    await searchInput.fill('party');

    // Wait for the URL to change due to debouncing
    await expect(page).toHaveURL(/search=party/);

    // Check that we only see items matching "party" (description or notes)
    // Seed has: "Acquaintance Party Ticket Sales" and "CSU Gym Rental for Acquaintance Party" (and sound system lights rental has "Acquaintance party" in notes, but getEntries only checks description in database via .ilike('description', ...))
    // Let's verify that the entries shown contain "Party" in their description
    const entriesList = page.locator('.budget-entry');
    const count = await entriesList.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const entryText = await entriesList.nth(i).textContent();
      expect(entryText?.toLowerCase()).toContain('party');
    }
  });

  test('Print Layout: Verify elements hide and transparent styling is applied', async ({ page }) => {
    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    // Verify that header is hidden
    const header = page.locator('header').first();
    await expect(header).toHaveCSS('display', 'none');

    // Verify client filters container (tabs and search filters) is hidden
    const filters = page.locator('[data-testid="client-filters-container"]');
    await expect(filters).toHaveCSS('display', 'none');

    // Verify stats cards have transparent backgrounds in print mode
    const statCard = page.locator('.stat-card').first();
    await expect(statCard).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });
});
