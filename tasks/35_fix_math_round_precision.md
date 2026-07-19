# Task 35: Fix `Math.round` IEEE-754 Precision Bug

## Objective
Replace `Math.round(validData.amount * 100)` with `Math.round(Number(validData.amount.toFixed(2)) * 100)` in both `createEntry` and `updateEntry` server actions. The current code has a well-known IEEE-754 precision bug: `Math.round(1.005 * 100)` returns **100** instead of 101, because `1.005 * 100` evaluates to `100.49999999999999` in IEEE-754 float arithmetic BEFORE `Math.round` is applied. For a financial app, this means certain legitimate user inputs silently get stored as the wrong centavo amount. Also add a Zod refinement to reject amounts with more than 2 decimal places at the validation layer.

## Audit Reference
- **Findings:** X6 (MEDIUM, -0.5 pts)
- **Severity:** MEDIUM (silent centavo rounding errors in financial data)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v4 §5 finding X6, §8.6 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — fix Math.round in createEntry and updateEntry
- [MODIFY] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts) — add Zod refinement for max 2 decimal places
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — add precision edge-case tests

## Step-by-Step Instructions

### 1. Update the Zod schema to guard decimal places

```typescript
// lib/types.ts — replace the amount field in the budget entry schema
amount: z.number({ required_error: "Amount is required" })
  .min(0, "Amount must be a non-negative number")
  .refine(
    (n) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
    { message: "Amount must have at most 2 decimal places" }
  ),
```

**Why this refine works:** For `1.005`, `1.005 * 100 = 100.49999999999999`, `Math.round(...) = 100`, `Math.abs(100.49999999999999 - 100) = 0.4999...` which is **> 0.001**, so the refinement REJECTS it. For `1.01`, `1.01 * 100 = 101`, `Math.round(...) = 101`, `Math.abs(101 - 101) = 0` which is **< 0.001**, so it PASSES.

### 2. Replace `Math.round(amount * 100)` with `toFixed(2)`-based conversion

In `app/actions/entries.ts`, find both occurrences of the centavo conversion (in `createEntry` at approximately line 33 and in `updateEntry` at approximately line 91) and replace:

```typescript
// BEFORE (lines 32-33):
// 3. Convert amount from decimal to centavos (Math.round to prevent float inaccuracy)
const amountInCentavos = Math.round(validData.amount * 100)

// AFTER:
// 3. Convert amount from decimal to centavos using toFixed(2) to avoid IEEE-754 error.
// Examples: 1.005 → "1.01" → 101, 19.99 → "19.99" → 1999, 1500.5 → "1500.50" → 150050
const amountInCentavos = Math.round(Number(validData.amount.toFixed(2)) * 100);
```

Apply the same change in `updateEntry` (approximately line 91).

### 3. Add precision edge-case tests

```typescript
// app/actions/entries.test.ts — add tests

it('correctly converts 1.005 to 101 centavos (not 100)', async () => {
  // Mock getOfficerAndClient to return a valid officer
  // Mock supabase.insert to capture the amount value
  // Call createEntry with amount: 1.005
  // The Zod refine should reject this at validation (amount has 3 decimal places)
  // Assert result.success is false with validation error
});

it('correctly converts 19.99 to 1999 centavos', async () => {
  // Mock getOfficerAndClient
  // Mock supabase.insert to return success
  // Call createEntry with amount: 19.99
  // Verify the insert was called with amount: 1999
});

it('correctly converts 1500.50 to 150050 centavos', async () => {
  // Similar to above with amount: 1500.50
  // Verify insert was called with amount: 150050
});

it('rejects amount with more than 2 decimal places', async () => {
  // Call createEntry with amount: 1.005
  // Assert result is { success: false } with validation error about decimal places
});
```

### 4. Verify the fix works

```bash
# Quick verification:
node -e "console.log('BEFORE:', Math.round(1.005 * 100))"
# Output: BEFORE: 100 (WRONG)

node -e "console.log('AFTER:', Math.round(Number((1.005).toFixed(2)) * 100))"
# Output: AFTER: 101 (CORRECT)
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Financial accuracy:** Centavo-level precision is critical for a budget transparency portal. The current code silently loses centavos on certain inputs.
- **Defense-in-depth:** The Zod refinement catches invalid inputs BEFORE the server action processes them. The `toFixed(2)` conversion is a second line of defense in case a value with >2 decimal places somehow passes validation.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the server action tests:
npx vitest run app/actions/entries.test.ts

# Run the full test suite:
npx vitest run

# Type check:
npx tsc --noEmit

# Build:
npm run build
```

### Manual Verification
- In the admin panel, create a new entry with amount `₱1.01`.
- Verify the entry is stored as 101 centavos in the DB (check via Supabase Table Editor).
- Try creating an entry with amount `₱1.005` — should see a validation error "Amount must have at most 2 decimal places".

## Acceptance Criteria
- [x] `app/actions/entries.ts` uses `Math.round(Number(validData.amount.toFixed(2)) * 100)` in both `createEntry` and `updateEntry`.
- [x] `lib/types.ts` has a Zod `.refine()` that rejects amounts with more than 2 decimal places.
- [x] `Math.round(Number((1.005).toFixed(2)) * 100)` returns 101 (not 100).
- [x] `npx vitest run app/actions/entries.test.ts` passes (all existing + new precision tests).
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
