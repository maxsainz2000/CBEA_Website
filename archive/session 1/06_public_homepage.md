# Task 6: Public Homepage Assembly

## Objective
Assemble the main public homepage (`app/page.tsx`), fetching the budget entries and stats on the server using Server Actions, and implementing search and filtering based on URL search parameters.

## Files Created / Modified
- [NEW] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) (Public budget transparency homepage)

## Step-by-Step Instructions

### 1. Route Layout & Server Data Fetching
- Define `app/page.tsx` as a Server Component.
- Accept URL query params via the `searchParams` prop (e.g., `searchParams: Promise<{ search?: string, semester?: string, category?: string }>` in Next.js 15).
- Await `searchParams` and extract filter inputs.
- Import and invoke the data fetching functions `getEntries({ search, semester, category })` and `getSummaryStats(semester)` from `lib/data/entries.ts` directly within the page component to load data dynamically.

### 2. Assembly of UI Layout
- Render the page title `"CBEA Student Council Budget Transparency"` using the `.font-headline-display` styling.
- Render the `SummaryStats` component with computed sums (Collected, Spent, Balance).
- Below the stats, render search input filters (`SearchFilter`) and navigation tabs (`PivotTabs` for semesters).
- Below filters, render the list of entries using `BudgetEntryList` or the administrative data table.

### 3. Wire URL-driven State Transitions
- To support deep linking and search-engine friendliness, update the active semester tab and search inputs by updating the URL search params (e.g., using `useRouter` and `usePathname` in React Client Components).
- When a student taps a new semester tab or types a search query:
  - Transition the URL parameters: `?semester=1st-sem-2025&search=party`.
  - Let Next.js re-render the server component with the updated parameters and fetch refreshed database data.

### 4. Layout Transitions (Motion Vocabulary)
- Wrap list items or data tables in simple CSS animation transitions (such as vertical slide-in and opacity fade, 200ms ease-out) to signal data loading completion.

## Metro Design Compliance & Best Coding Practices
- **URL-based State:** Favor URL search parameters over isolated React state for high-level filters. This keeps the application responsive, bookmarkable, and SEO-friendly.
- **Asymmetric Margins:** Ensure margins strictly match the specifications: `24px` gutter and margins on desktop, `16px` on mobile.
- **Content is King:** Do not inject decorative graphics or banners. The financial figures are the focal point of the page.

## Automated Testing & Verification Plan

### Automated Integration & E2E Tests
- Write a Playwright integration test (`tests/public-homepage.spec.ts`):
  1. **Page Load:** Verify that the title renders and currency items show correctly format (`₱`).
  2. **Filtering:** Click on a semester pivot button (e.g., "1st Sem 2025"). Verify that the URL updates to `?semester=...` and the entry list updates to show only matching entries.
  3. **Search:** Input a search query (e.g., "party"). Verify list results update.
  4. **Print Layout:** Trigger print media evaluation. Verify header/navigation controls hide and background card color fills disappear, while text tables remain readable.
- Run Playwright:
  ```bash
  npx playwright test
  ```

### Manual Verification
- Confirm that the page loads correctly and is fully functional on mobile viewports. Check that touch targets are easily clickable (minimum 48px size).

## Acceptance Criteria
- [x] Homepage fetches records on the server and displays financial summaries dynamically.
- [x] Filter transitions are URL-based and allow bookmarking page states.
- [x] Print mode hides buttons and interactive chrome, and presents a clean white ledger table.
- [x] Loading indicators display progress loops during active queries.
- [x] E2E integration test asserts homepage filters function correctly.
