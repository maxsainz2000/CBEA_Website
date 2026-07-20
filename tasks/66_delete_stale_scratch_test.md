# Task 66: Delete Stale scratch/test-crud.test.ts

## Objective
Delete `scratch/test-crud.test.ts` — it mocks the old `getUser()` API (superseded by `getClaims()` in Task 26), so both test cases silently return "Unauthorized" regardless of input. The file is superseded by `app/actions/entries.test.ts` (18 proper tests).

## Audit Reference
- **Findings:** Y28 (LOW, -0.25 pts)
- **Severity:** LOW (stale mock — test does not verify what it claims)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y28, §11 P2-8 step-by-step instructions.

## Files Created / Modified
- [DELETE] [scratch/test-crud.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/scratch/test-crud.test.ts)

## Step-by-Step Instructions

### 1. Delete the file

```bash
rm scratch/test-crud.test.ts
```

### 2. Verify

```bash
ls scratch/test-crud.test.ts 2>/dev/null && echo "FAIL: file still exists" || echo "PASS: file deleted"
npx vitest run
```

## Acceptance Criteria
- [ ] `scratch/test-crud.test.ts` does not exist.
- [ ] `npx vitest run` passes all tests (scratch is excluded by vitest config).
