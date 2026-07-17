# Task 23: Code Quality and Design-System Cleanup

## Objective
Fix 7 minor code quality and design-system issues identified in the post-remediation audit. These are individually LOW severity but collectively represent a code-discipline gap. Addressing them ensures the codebase is clean, consistent, and maintainable.

## Audit Reference
- **Findings:** N5 (LOW — sandbox), N6 (LOW — color drift), N7 (LOW — type cast), N8 (LOW — document.cookie), N10 (LOW — double createClient)
- **Severity:** LOW (each individually), P2 collectively
- **Current grade impact:** No direct grade impact, but addresses 5 audit findings.

## Files Created / Modified
- [MODIFY] [app/sandbox/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/sandbox/page.tsx)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/components/SearchFilter.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SearchFilter.tsx)
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx)
- [MODIFY] [lib/auth/session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)

## Step-by-Step Instructions

### 1. Fix color-discipline drift (N6) — `EntryForm.tsx` and `EntryTable.tsx`

Replace `accent-red` with `error` in error message styling. The hex value is identical (`#E51400`), but `error` is the correct semantic token.

**`app/admin/components/EntryForm.tsx:118`:**

```tsx
// Current:
<div className="p-sm bg-accent-red/10 border-l-4 border-accent-red text-accent-red ...">

// Fixed — use the semantic 'error' token:
<div className="p-sm bg-error/10 border-l-4 border-error text-error ...">
```

**`app/admin/components/EntryTable.tsx:34`:**

Apply the same replacement — `accent-red` → `error`.

### 2. Remove redundant inline `borderRadius` (N6) — `SearchFilter.tsx`

**`app/components/SearchFilter.tsx:59`:**

```tsx
// Current:
<button
  ...
  style={{ borderRadius: '0px' }}
  ...
>

// Fixed — remove the style prop (the @theme block already sets --radius-*: 0px):
<button
  ...
  // (style prop removed entirely)
  ...
>
```

### 3. Gate or remove `document.cookie` (N8) — `AdminHeader.tsx`

**Note:** If Task 20 (migrate to `storageState`) is also applied, simply delete the line entirely. If Task 20 is not applied, gate it behind `NODE_ENV`:

**`app/admin/components/AdminHeader.tsx:15`:**

```ts
// Option A (if Task 20 is applied — recommended): DELETE the line entirely.

// Option B (if Task 20 is NOT applied): Gate behind NODE_ENV:
if (process.env.NODE_ENV !== 'production') {
  document.cookie = 'sb-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
}
```

Next.js inlines `NODE_ENV` at build time, so the `if` block is tree-shaken out of the production bundle.

### 4. Fix sandbox page issues (N5, N7) — `app/sandbox/page.tsx`

**4a. Fix non-existent CSS classes (lines 65, 75, 85, 92, 101, 112, 115):**

```tsx
// Current (no-ops — these classes don't exist in theme.css):
text-title-lg font-title-lg
text-title-md font-title-md

// Fixed — use existing classes from theme.css:
text-headline-md font-headline-md
text-headline-sm font-headline-sm
```

**4b. Fix backwards padding (line 61):**

```tsx
// Current (reversed — mobile gets desktop padding):
p-margin md:p-margin-mobile

// Fixed:
p-margin-mobile md:p-margin
```

**4c. Fix type cast (line 113):**

```tsx
// Current (defeats the type system):
<BudgetEntryList entries={entries as unknown as BudgetEntry[]} ... />

// Fixed — use Partial<BudgetEntry>[]:
const entries: Partial<BudgetEntry>[] = [
  { id: '1', description: '...', amount: 15000, date: '...', type: 'income', category: 'Fees', status: 'paid' },
  // ...
];

// Update the component call:
<BudgetEntryList entries={entries as BudgetEntry[]} ... />
```

**4d. Fix negative amount in mock data (line 47):**

```tsx
// Current (schema says amount >= 0):
amount: -5000

// Fixed:
amount: 5000
```

**Alternative:** If the sandbox page is not needed for production, delete it entirely or exclude it from the production build by moving to `app/(dev)/sandbox/`.

### 5. Refactor `getOfficer()` to return `{ officer, supabase }` (N10) — `lib/auth/session.ts` and `app/actions/entries.ts`

**`lib/auth/session.ts` — add a new function:**

```ts
export async function getOfficerAndClient(): Promise<{
  officer: Officer | null;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { officer: null, supabase };
    return {
      officer: { id: data.user.id, email: data.user.email ?? '' },
      supabase,
    };
  } catch {
    return { officer: null, supabase };
  }
}
```

**`app/actions/entries.ts` — update each action:**

```ts
// Current (two clients created):
export async function createEntry(data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    const supabase = await createClient()    // client #1
    const officer = await getOfficer()       // client #2 (inside getOfficer)
    // ...

// Fixed (one client):
export async function createEntry(data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    const { officer, supabase } = await getOfficerAndClient()
    if (!officer) return { success: false, error: 'Unauthorized' }
    // use supabase directly — no separate createClient() call
    // ...
```

Repeat for `updateEntry` and `deleteEntry`.

**Note:** Keep the existing `getOfficer()` function for backward compatibility (it's used by admin pages that don't need the Supabase client). Add `getOfficerAndClient()` as a new export.

## Metro Design Compliance & Best Coding Practices
- **Color discipline:** Using semantic tokens (`error`) instead of alternate accents (`accent-red`) ensures the design system's intent is preserved. The visual result is identical, but the code communicates the correct purpose.
- **Inline styles:** The Metro design system enforces `--radius-*: 0px` via the `@theme` block. Redundant `style={{ borderRadius: '0px' }}` violates the "don't mix inline styles with utility classes" rule.
- **Type safety:** `as unknown as BudgetEntry[]` defeats TypeScript's type system entirely. Using `Partial<BudgetEntry>[]` preserves type-checking for available fields.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All tests should still pass:
npx tsc --noEmit
npx vitest run
npx playwright test

# Build should succeed:
npm run build
```

### Security Verification (if N8 applied)
```bash
# After build, confirm sb-mock-auth is gone from client bundle:
grep -r 'sb-mock-auth' .next/static/    # should return nothing (if Task 20 also applied)
```

### Manual Verification
- Open the sandbox page (`/sandbox`) and verify:
  - Headings render with visible text (not no-op classes).
  - Padding is correct (smaller on mobile, larger on desktop).
  - No console errors.
- Open the admin pages and verify:
  - Error messages (validation errors, delete errors) use the correct red color.
  - The error styling visually matches before and after (hex is identical).
- Verify CRUD still works end-to-end (the `getOfficerAndClient()` refactor must not break anything).

## Acceptance Criteria
- [x] `EntryForm.tsx` and `EntryTable.tsx` use `error` instead of `accent-red` for error styling.
- [x] `SearchFilter.tsx` does not have `style={{ borderRadius: '0px' }}`.
- [x] `AdminHeader.tsx:15` `document.cookie` line is removed or gated behind `NODE_ENV`.
- [x] `sandbox/page.tsx` uses existing CSS classes (`text-headline-md` etc.) instead of non-existent ones.
- [x] `sandbox/page.tsx` padding is `p-margin-mobile md:p-margin` (not reversed).
- [x] `sandbox/page.tsx` mock data does not have negative amounts.
- [x] `sandbox/page.tsx` does not use `as unknown as BudgetEntry[]`.
- [x] `lib/auth/session.ts` exports `getOfficerAndClient()`.
- [x] Server actions use `getOfficerAndClient()` — only one `createClient()` call per action.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx vitest run` passes.
- [x] `npm run build` succeeds.
