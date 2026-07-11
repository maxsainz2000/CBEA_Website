# Task 4: Server Actions and CRUD Validation

## Objective
Implement server-side database access logic using Next.js Server Actions. Manage creation, reading, updating, and deletion of budget records while enforcing schema validation using Zod and ensuring user authorization checks.

## Files Created / Modified
- [NEW] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts) (Type models for budget entries and forms)
- [NEW] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) (Next.js Server Actions for mutations)
- [NEW] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) (Server-side data fetching functions)

## Step-by-Step Instructions

### 1. Types Definition (`lib/types.ts`)
- Define the TypeScript type `BudgetEntry`:
  ```typescript
  export type BudgetEntry = {
    id: string;
    type: 'income' | 'expense';
    description: string;
    category: string;
    amount: number; // Stored as integer centavos
    date: string; // ISO date string (YYYY-MM-DD)
    semester: string;
    academic_year: string;
    notes: string | null;
    status: 'paid' | 'pending' | 'flagged';
    entered_by: string | null;
    created_at: string;
    updated_at: string;
  };
  ```
- Define input validation schemas using Zod:
  - `BudgetEntrySchema`: Validates type, description, category, amount (positive number, converted to integer cents in the action), date, semester, academic_year, notes (optional), and status.

### 2. Implement Data Fetching (`lib/data/entries.ts`)
Do NOT use `"use server"`. Export standard async functions to run safely on the server without exposing POST endpoints:

- `getEntries(filters?: { semester?: string; category?: string; search?: string })`
  - Query the database to retrieve budget entries. Apply `where` clauses based on `semester` and `category` fields directly.

- `getEntry(id: string)`
  - Retrieve a single budget entry by ID.

- `getSummaryStats(semester?: string)`
  - Fetch entries (optionally filtered by semester).
  - Sum the amounts for `income` and `expense` to compute `totalCollected`, `totalSpent`, and `remainingBalance`. Return in centavos.

### 3. Implement Server Actions (`app/actions/entries.ts`)
Add `"use server"` at the top of the file to handle mutations. Export:

- `createEntry(data: unknown)`
  - Check authentication by calling `supabase.auth.getUser()`. Throw an error or return a failure object if unauthenticated.
  - Parse `data` with `BudgetEntrySchema`.
  - Convert dollar/peso amounts (with potential decimals) to integer cents (e.g., `Math.round(amount * 100)`).
  - Insert entry into `budget_entries`, setting `entered_by` to the authenticated user's ID.
  - Call `revalidatePath('/')` and `revalidatePath('/admin')` to bust the cache.

- `updateEntry(id: string, data: unknown)`
  - Authenticate the user.
  - Validate the schema.
  - Update the record in `budget_entries` matching the ID.
  - Call `revalidatePath` to clear cache.

- `deleteEntry(id: string)`
  - Authenticate the user.
  - Delete the record from `budget_entries` matching the ID.
  - Call `revalidatePath` to clear cache.

## Metro Design Compliance & Best Coding Practices
- **Strict Server Validation:** Never trust client-side validation alone. Always validate payloads using Zod on the server.
- **Cache Invalidation:** Use Next.js `revalidatePath` after mutate events (`createEntry`, `updateEntry`, `deleteEntry`) to ensure users instantly view fresh data without manual page refreshes.
- **Centavos Conversion:** Always perform currency multiplication on the server side using safe integer math (`Math.round`) to avoid floating-point representation limits (e.g., `0.1 + 0.2 !== 0.3` in JS).

## Automated Testing & Verification Plan

### Automated Unit Tests
- Create `app/actions/entries.test.ts` to test each Server Action:
  1. **Authentication guards:** Call `createEntry`, `updateEntry`, and `deleteEntry` with a mocked unauthenticated user. Assert that they return error codes or throw errors.
  2. **Schema validation:** Call `createEntry` with invalid inputs (empty description, negative amount). Verify Zod validation catches these issues and returns validation errors.
  3. **Calculation logic:** Mock database select results for `getSummaryStats` and assert that math computations for Collected, Spent, and Balance are correct (including negative balances).
- Run Vitest tests:
  ```bash
  npx vitest run
  ```

### Manual Verification
- Implement temporary mock tests in a sandbox script under `scratch/` directory to invoke the actions and console log results to verify success.

## Acceptance Criteria
- [ ] Zod parsing rejects invalid inputs (negative values, empty strings) with descriptive error messages.
- [ ] Server actions enforce authentic state validation via `supabase.auth.getUser()`.
- [ ] Server actions convert decimal values to integer centavos for storage and query retrieval.
- [ ] `revalidatePath` triggers refresh on the public page and admin dashboard after mutations.
- [ ] Vitest unit tests cover happy paths, validation errors, and authentication failures for all server actions.
