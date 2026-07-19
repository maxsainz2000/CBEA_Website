# Task 43: Fix Broken Assertion in `ClientFilters.test.tsx`

## Objective
Replace the broken `expect(mockPush).not.toContain('category=')` assertion in `app/components/ClientFilters.test.tsx` (line 99) with the correct `expect(mockPush).not.toHaveBeenCalledWith(expect.stringContaining('category='))`. The current assertion silently passes because `mockPush` is a `vi.fn()` (a function object), and `.toContain` doesn't work on functions — it falls back to checking if the function is array-like or string-like, neither of which it is. The test claims to verify that clicking "All" clears the category filter, but it actually verifies nothing.

## Audit Reference
- **Findings:** X12 (LOW, -0.25 pts)
- **Severity:** LOW (broken test assertion — silently passes without verifying intended behavior)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X12, §8.12 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/components/ClientFilters.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ClientFilters.test.tsx)

## Step-by-Step Instructions

### 1. Find the broken assertion at line 99

```typescript
// CURRENT (broken):
expect(mockPush).not.toContain('category=');
```

### 2. Replace with correct assertion

Option A (simple):
```typescript
// FIXED (Option A):
expect(mockPush).not.toHaveBeenCalledWith(
  expect.stringContaining('category=')
);
```

Option B (more robust — inspects the actual pushed URL):
```typescript
// FIXED (Option B):
await waitFor(() => {
  expect(mockPush).toHaveBeenCalledTimes(1);
});
const pushedUrl = mockPush.mock.calls[0]?.[0] as string;
expect(pushedUrl).not.toMatch(/category=/);
```

### 3. Verify the test now catches regressions

To confirm the fixed assertion actually works:
1. Temporarily break `ClientFilters.tsx` so it does NOT clear the category param when "All" is clicked.
2. Run `npx vitest run app/components/ClientFilters.test.tsx`.
3. The test should now FAIL (proving the assertion is working).
4. Revert the temporary break.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Test quality:** A test that silently passes without verifying its intended behavior is worse than no test — it provides false confidence.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the ClientFilters tests:
npx vitest run app/components/ClientFilters.test.tsx

# Full test suite:
npx vitest run
```

### Manual Verification
- Verify the fixed test actually catches a regression (see Step 3 above).

## Acceptance Criteria
- [x] `app/components/ClientFilters.test.tsx` line 99 uses `expect(mockPush).not.toHaveBeenCalledWith(...)` (not `.not.toContain(...)`).
- [x] `npx vitest run app/components/ClientFilters.test.tsx` passes (5/5 tests).
- [x] `npx vitest run` passes.
