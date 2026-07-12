# Task 11: Fix Failing E2E and Lint Issues

## Objective
Fix the 1 failing Playwright test (`auth-flow.spec.ts > Valid Login`), the 1 TypeScript error (`admin-crud.spec.ts:39`), and the 1 ESLint warning (unused `valErrors` in `admin-crud.spec.ts:61`). After this task, `npx playwright test`, `npx tsc --noEmit`, and `npx eslint` all pass cleanly.

## Audit Reference
- **Findings:** P1-2 (stale Playwright selector), P1-3 (TS error), P1-4 (unused variable)
- **Severity:** High (P1-2 blocks Task 7 acceptance), Medium (P1-3 breaks CI), Low (P1-4)

## Files Created / Modified
- [MODIFY] [tests/auth-flow.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth-flow.spec.ts)
- [MODIFY] [tests/admin-crud.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/admin-crud.spec.ts)

## Step-by-Step Instructions

### 1. Fix the `Valid Login` Playwright test — `tests/auth-flow.spec.ts`

**Problem:** Lines 50–53 expect an `<h2>` containing "Welcome" and "Jane Doe":
```ts
const welcomeHeader = page.locator('h2');
await expect(welcomeHeader).toContainText(/Welcome/i);
await expect(welcomeHeader).toContainText(/Jane Doe/i);
```

The admin page (`app/admin/page.tsx`) has **two** `<h2>` elements ("Overall Financial Aggregates" and "Manage Budget Records") — neither contains "Welcome" or "Jane Doe". The officer's name is in a `<span>` next to an `<h1>` ("Officer Dashboard"). Playwright's strict mode refuses to match multiple elements.

**Fix:** Replace lines 50–53 with selectors that match the actual implementation:
```ts
const h1 = page.locator('h1');
await expect(h1).toContainText(/Officer Dashboard/i);
await expect(page.locator('text=Jane Doe')).toBeVisible();
```

This matches what the passing `admin-crud.spec.ts:18-20` already does.

### 2. Fix the TypeScript error — `tests/admin-crud.spec.ts:39`

**Problem:** `page.evaluate(...)` returns a value based on `document.querySelector('[data-testid="description-input"]')` which returns `Element | null`, but the surrounding code expects `HTMLElement`. TypeScript reports:
```
TS2345: Argument of type 'HTMLElement | null' is not assignable to parameter of type 'Element'.
```

**Recommended fix:** Delete the entire debug block (lines 32–42). It writes to `console.log`, the test does not assert on `rect`, and it was left over from debugging:
```ts
// DELETE lines 32-42 entirely (the page.evaluate block that logs rect)
```

**Alternative fix (if you want to keep it):** Cast the querySelector result:
```ts
const el = document.querySelector('[data-testid="description-input"]') as HTMLInputElement | null;
```

### 3. Remove the unused `valErrors` variable — `tests/admin-crud.spec.ts:61`

**Problem:** Line 61 assigns `valErrors` but never uses it:
```ts
const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();
```

**Fix (option A — delete):** Remove the line entirely if it serves no purpose.

**Fix (option B — assert):** Add an assertion to make it useful:
```ts
const valErrors = await page.locator('.text-expense.mt-xs').allTextContents();
expect(valErrors).toEqual([]); // no validation errors expected after valid submission
```

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Test hygiene:** Remove debug artifacts (`console.log`, unused variables) from test files before they reach CI.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# TypeScript — should report 0 errors:
npx tsc --noEmit

# ESLint — should report 0 warnings:
npx eslint './**/*.{ts,tsx}' --ignore-pattern 'node_modules/**' --ignore-pattern '.next/**' --ignore-pattern 'scratch/**'

# Playwright — all 9 should pass:
npx playwright test --reporter=list
```

## Acceptance Criteria
- [x] `npx playwright test` reports 9/9 pass, 0 fail.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] `npx eslint` reports 0 errors, 0 warnings.
- [x] No `console.log` debug statements remain in test files.
- [x] The `auth-flow.spec.ts > Valid Login` test correctly asserts on `<h1>` "Officer Dashboard" and `text=Jane Doe`.
