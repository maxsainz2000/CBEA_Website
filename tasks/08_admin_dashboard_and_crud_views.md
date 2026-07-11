# Task 8: Admin Dashboard and CRUD Operations

## Objective
Create the admin dashboard and administrative views for adding, editing, and deleting budget entries. Implement forms for data management with input validations, status badges, and inline actions with Metro-compliant confirm dialogs.

## Files Created / Modified
- [NEW] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) (Admin main dashboard layout)
- [NEW] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) (Add / Edit entry form component)
- [NEW] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) (Data table with actions)
- [NEW] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx) (Add entry screen)
- [NEW] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/[id]/page.tsx) (Edit entry screen)

## Step-by-Step Instructions

### 1. Main Admin Dashboard Layout (`app/admin/page.tsx`)
- Render the page layout using Server Components:
  - Add Header with Sign Out action.
  - Render `SummaryStats` to show current budget aggregates.
  - Render an `"Add New Entry"` primary CTA button (`.btn-primary`).
  - Render the list of existing records using the administrative `EntryTable` component.

### 2. Entry Management Form (`app/admin/components/EntryForm.tsx`)
- Implement a client form supporting both creation and editing modes.
- Accept initial entry data as an optional prop (`initialData?: BudgetEntry`).
- Add form inputs using `.input-underline` styling:
  - Type: Toggle button or simple tabs (Income vs Expense).
  - Description: text input.
  - Category: text input.
  - Amount: decimal number input (e.g., pesos).
  - Date: date input.
  - Notes: textarea input.
  - Status: Dropdown selection (Paid, Pending, Flagged).
- Form submission logic:
  - Validate values using the Client Zod Schema.
  - Call the corresponding Server Action (`createEntry` or `updateEntry`), passing the validated object. (Note: Do NOT convert to centavos on the client; the Server Action is responsible for this conversion to prevent double-conversion bugs).
  - Upon success, redirect to `/admin`.
  - Upon error, display the server validation message in red.

### 3. Data Table with Actions (`app/admin/components/EntryTable.tsx`)
- Build the data grid extending `.data-table` formatting:
  - Columns: Date, Type (Income/Expense indicator), Description, Category, Amount (tabular-nums), Status Badge, Actions.
- Status Badge: Display status values wrapped in status badges:
  - Paid: `.status-badge-paid` (green background, white text).
  - Pending: `.status-badge-pending` (orange background, black text).
  - Flagged: `.status-badge-flagged` (red background, white text).
- **Metro-Compliant Inline Delete Confirmation:**
  - Metro guidelines discourage popups/modals. Implement in-context confirmation within the table row itself.
  - Tapping "Delete" swaps the action button state to: `[ Confirm Delete? ]` (`.btn-danger`) and `[ Cancel ]` (`.btn-ghost`) inline, preventing accidental clicks without interrupting the user layout.

### 4. Create and Edit Wrapper Routes
- Wire `/admin/new/page.tsx` to render the `EntryForm` for creation.
- Wire `/admin/edit/[id]/page.tsx` to fetch the record.
  - **Next.js 15 Crucial Rule:** Await `params` before accessing the `id` (e.g., `const { id } = await params;`).
  - Use data fetching function `getEntry(id)` from `lib/data/entries.ts`.
  - Rehydrate `initialData`: Convert the database centavo amount back to decimal representation (e.g., `initialData.amount = fetchedEntry.amount / 100`) before passing it as `initialData` to `EntryForm`.

## Metro Design Compliance & Best Coding Practices
- **No Modal Popups:** All confirmations (such as delete) must take place in-context (inline) rather than using popup overlays or browser alerts.
- **Form Design:** Display labels cleanly aligned above input underlines.
- **Accented Focus:** Ensure keyboard tab navigation highlights input focus rings using the Lime accent color.

## Automated Testing & Verification Plan

### Automated E2E Tests
- Write a Playwright E2E test file (`tests/admin-crud.spec.ts`):
  1. **Login bypass:** Log in as an officer using seed credentials.
  2. **Create Entry:** Navigate to `/admin/new`, fill in entry fields (e.g., Description: "Sponsorship", Amount: "1500.50", Status: "Paid"), and submit. Verify that the user is redirected to `/admin` and the entry appears in the list.
  3. **Edit Entry:** Click Edit on the created entry. Modify the amount to "1600.00" and submit. Verify that the table updates.
  4. **Delete Entry (Inline Confirmation):** Click Delete on the entry. Verify that the inline confirmation triggers. Click Confirm. Verify that the entry disappears from the list.
  5. **Public Updates:** Verify that changes are reflected on the public homepage.
- Run tests:
  ```bash
  npx playwright test
  ```

## Acceptance Criteria
- [ ] Admin panel is fully protected by middleware authorization checks.
- [ ] Add/Edit forms validate fields and convert decimal values to integer centavos correctly.
- [ ] Table rows render status badges in matching semantic colors.
- [ ] Delete operations trigger inline confirmation states without modal alerts.
- [ ] E2E tests verify the full create-read-update-delete lifecycle.
