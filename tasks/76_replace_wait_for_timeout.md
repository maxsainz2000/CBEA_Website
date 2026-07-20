# Task 76: Replace waitForTimeout Magic Numbers in E2E Tests

## Objective
Replace `await page.waitForTimeout(500)` in `tests/admin-crud.spec.ts:19, 61` with proper element-visibility assertions. The magic timeouts are brittle (break if animation duration changes) and slow down tests.

## Audit Reference
- **Findings:** Y32 (LOW)
- **Source:** AUDIT-v5 §6 finding Y32, §12 P3-7.

## Files Created / Modified
- [MODIFY] [tests/admin-crud.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/admin-crud.spec.ts) — replace timeouts with visibility assertions

## Step-by-Step Instructions

### 1. Replace timeouts

```typescript
// BEFORE:
await page.waitForTimeout(500);

// AFTER:
await expect(page.locator('[data-testid="description-input"]')).toBeVisible();
```

### 2. Verify

```bash
grep 'waitForTimeout' tests/admin-crud.spec.ts
# Expected: 0 hits

npx tsc --noEmit
```

## Acceptance Criteria
- [ ] 0 `waitForTimeout` calls in `tests/admin-crud.spec.ts`.
- [ ] Replaced with proper element-visibility assertions.
- [ ] `npx tsc --noEmit` passes.
