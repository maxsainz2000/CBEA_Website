# Task 79: Remove Tests Entrenching No-Op revalidatePath

## Objective
Remove or update the `revalidatePath` assertions in `app/actions/entries.test.ts:241-242, 280-281, 294-295` that entrench the no-op behavior. **Depends on Task 52** — apply after revalidatePath calls are removed from the actions.

## Audit Reference
- **Findings:** Y36 (LOW)
- **Source:** AUDIT-v5 §6 finding Y36, §12 P3-11.
- **Dependency:** Task 52 (remove revalidatePath calls) must be applied first.

## Files Created / Modified
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — remove revalidatePath assertions

## Step-by-Step Instructions

### 1. Remove assertions

After Task 52 removes the `revalidatePath` calls, remove these test assertions:

```typescript
// REMOVE:
expect(revalidatePath).toHaveBeenCalledWith('/')
expect(revalidatePath).toHaveBeenCalledWith('/admin')
```

Also remove the `revalidatePath` mock import if no longer used.

### 2. Verify

```bash
npx vitest run app/actions/entries.test.ts
```

## Acceptance Criteria
- [ ] Task 52 is applied first.
- [ ] 0 `revalidatePath` assertions remain in tests.
- [ ] `npx vitest run app/actions/entries.test.ts` passes.
