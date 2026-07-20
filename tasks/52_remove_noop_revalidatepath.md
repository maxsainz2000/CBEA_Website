# Task 52: Remove No-Op revalidatePath Calls from Server Actions

## Objective
Remove the 6 no-op `revalidatePath('/')` and `revalidatePath('/admin')` calls from `createEntry`, `updateEntry`, and `deleteEntry` in `app/actions/entries.ts`. Both routes are dynamic (`force-dynamic` + `searchParams`), so `revalidatePath` does nothing. The admin UI already calls `router.refresh()` after success, which re-fetches server components. Replace the calls with explanatory comments about the cache strategy.

## Audit Reference
- **Findings:** Y3 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (broken cache-invalidation strategy — no-op calls that mislead future developers)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y3, §10 P1-2 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — remove 6 revalidatePath calls, add comments
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — remove revalidatePath assertions

## Step-by-Step Instructions

### 1. Remove `revalidatePath` from `createEntry`

```typescript
// BEFORE (app/actions/entries.ts:59-61):
    // 5. Bust caches
    revalidatePath('/')
    revalidatePath('/admin')

// AFTER:
    // 5. Cache invalidation: both / and /admin are dynamic routes (force-dynamic
    //    + searchParams), so revalidatePath is a no-op. The admin UI calls
    //    router.refresh() after success; the public homepage re-fetches on
    //    next request. If we migrate to unstable_cache + tags later, switch
    //    to revalidateTag('budget-entries') here.
```

### 2. Remove `revalidatePath` from `updateEntry`

```typescript
// BEFORE (app/actions/entries.ts:124-125):
    revalidatePath('/')
    revalidatePath('/admin')

// AFTER:
    // Cache invalidation note: see createEntry comment. Dynamic routes,
    // router.refresh() handles admin; public homepage re-fetches on next request.
```

### 3. Remove `revalidatePath` from `deleteEntry`

```typescript
// BEFORE (app/actions/entries.ts:161-162):
    revalidatePath('/')
    revalidatePath('/admin')

// AFTER:
    // Cache invalidation note: see createEntry comment. Dynamic routes,
    // router.refresh() handles admin; public homepage re-fetches on next request.
```

### 4. Remove the `revalidatePath` import if no longer used

```typescript
// BEFORE:
import { revalidatePath } from 'next/cache'

// AFTER: (remove this import entirely)
```

### 5. Update `entries.test.ts` — remove revalidatePath assertions

```typescript
// BEFORE (app/actions/entries.test.ts:241-242, 280-281, 294-295):
expect(revalidatePath).toHaveBeenCalledWith('/')
expect(revalidatePath).toHaveBeenCalledWith('/admin')

// AFTER: (remove these assertions entirely)
// Also remove the revalidatePath mock import if no longer used.
```

### 6. Verify

```bash
# Confirm no more revalidatePath calls in actions:
grep -n 'revalidatePath' app/actions/entries.ts
# Expected: 0 hits

npx vitest run app/actions/entries.test.ts
npx tsc --noEmit
npm run build
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Cache strategy clarity:** Removing no-op calls prevents future developers from assuming cache invalidation is working when it isn't.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/actions/entries.test.ts
npx tsc --noEmit
npm run build

grep -n 'revalidatePath' app/actions/entries.ts
# Expected: 0 hits
```

### Manual Verification
- Create/update/delete an entry via the admin UI.
- Verify the admin page refreshes correctly (via `router.refresh()`).
- Verify the public homepage shows the updated data on next load.

## Acceptance Criteria
- [ ] `app/actions/entries.ts` contains 0 `revalidatePath` calls.
- [ ] `app/actions/entries.ts` has explanatory comments about the cache strategy.
- [ ] `revalidatePath` import is removed from `app/actions/entries.ts`.
- [ ] `app/actions/entries.test.ts` has 0 `revalidatePath` assertions.
- [ ] `npx vitest run app/actions/entries.test.ts` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `npm run build` succeeds.
