# Task 5: Shared UI Components

## Objective
Build the reusable UI components for both the public-facing portal and the admin dashboard. Ensure components strictly adopt the Metro-derived design system tokens, support responsiveness, keyboard accessibility, print mode, and tabular alignment of monetary values.

## Files Created / Modified
- [NEW] [app/components/Header.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/Header.tsx) (Navigation Header)
- [NEW] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx) (3-card financial stat layout)
- [NEW] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx) (Semester / category navigation tabs)
- [NEW] [app/components/BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx) (Public budget entry rows)
- [NEW] [app/components/SearchFilter.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SearchFilter.tsx) (Search query and category inputs)

## Step-by-Step Instructions

### 1. Header Navigation (`app/components/Header.tsx`)
- Render a top navbar:
  - Left: `"CBEA Student Council"` title (headline-sm typography).
  - Right: Link to `/admin` or logout buttons using `.btn-ghost` formatting.
- Ensure 48px height and left-aligned alignment.

### 2. Summary Stats Display (`app/components/SummaryStats.tsx`)
- Accept `totalCollected`, `totalSpent`, and `remainingBalance` (in centavos) as props.
- Convert inputs from centavos to decimal display (e.g., divide by 100).
- Render a 3-column layout (stacked on mobile, side-by-side on desktop):
  1. **Collected Card:** `.stat-card` formatting. Displays `"TOTAL COLLECTED"`, value in `.stat-value-positive` (green), and metadata timestamp.
  2. **Spent Card:** `.stat-card` formatting. Displays `"TOTAL SPENT"`, value in `.stat-value-negative` (red), and metadata timestamp.
  3. **Remaining Card:** `.stat-card` formatting. Displays `"REMAINING BALANCE"`. If the balance is positive or zero, use `.stat-value-neutral` (black text). If the balance is negative, use `.stat-value-negative` (red text) and format with a negative sign (e.g., `-₱150.00`).
- Ensure cards are borderless with `0px` radius and a `4px` left accent border (`.stat-card-active`) on the currently active filter card.

### 3. Semester / Category Pivots (`app/components/PivotTabs.tsx`)
- Accept a list of `tabs`, `activeTab`, and `onTabChange` callback.
- Render a horizontal row of buttons styled as `.pivot-tab`.
- **Constraint check:** If the list of tabs exceeds 7 options, render a dropdown select box styled with `.input-underline` instead of flat tabs to prevent horizontal wrapping.
- Implement full keyboard accessibility (arrow key switching, focus outlines).

### 4. Public Budget Entry Row (`app/components/BudgetEntryList.tsx`)
- Display list items using the `.budget-entry` grid.
- Each row contains:
  - Left indicator strip: green for income, red for expense.
  - Left main column: Description (body-sm-strong) and date/category metadata (caption-meta).
  - Right column: Amount formatted with `₱` currency and `+` or `-` indicators, right-aligned and styled with `.tabular-nums`.
- Handle empty states gracefully by showing a simple centered informational note.

### 5. Search and Filters (`app/components/SearchFilter.tsx`)
- Implement a search text field styled with `.input-underline`. Focus triggers the Lime accent bottom line.
- Provide quick filter chips or categories.

## Metro Design Compliance & Best Coding Practices
- **Tabular Numerals:** All currency display items must explicitly contain the `.tabular-nums` class.
- **Zero Elevation:** Do not add box-shadows, rounded borders (`rounded-none` is default), or color gradients.
- **Color Rules:** Do not mix semantic colors (income green, expense red) with interactive colors (accent Lime) on the same element to avoid visual confusion.
- **Contrast Check:** Ensure all text passes WCAG AA. Accent Lime surfaces must use black text (`#000000`), never white.

## Automated Testing & Verification Plan

### Automated Component Tests
- Write unit tests using Vitest and React Testing Library:
  - **`SummaryStats` test (`app/components/SummaryStats.test.tsx`):**
    1. Pass positive balance: assert text color is neutral (black).
    2. Pass negative balance: assert text color is expense (red) and format shows a negative sign.
    3. Verify currency conversions are correct.
  - **`PivotTabs` test (`app/components/PivotTabs.test.tsx`):**
    1. Render 5 tabs: assert buttons render.
    2. Render 8 tabs: assert a `<select>` dropdown renders instead of tabs.
    3. Assert active tab styling applies `.pivot-tab-active`.
- Run tests:
  ```bash
  npx vitest run
  ```

### Manual Verification
- Render components in the browser, resizing from mobile viewport (375px) to desktop (1280px). Verify layout grids rearrange dynamically.

## Acceptance Criteria
- [x] UI elements show sharp 0px corners, flat backgrounds, and thin separator outlines.
- [x] Keyboard focus outlines show high-visibility border outlines.
- [x] Pivot switcher displays select input fallback when options count > 7.
- [x] Negative remaining balances display in red with correct sign formatting.
- [x] Numeric values utilize tabular layout alignment properties.
