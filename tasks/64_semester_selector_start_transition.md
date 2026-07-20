# Task 64: Wrap AdminSemesterSelector router.push in startTransition

## Objective
Add `useTransition` and wrap `router.push(...)` in `startTransition()` in `AdminSemesterSelector.tsx` for consistency with `ClientFilters.tsx` and to enable pending state surfacing.

## Audit Reference
- **Findings:** Y23 (LOW, -0.25 pts)
- **Severity:** LOW (inconsistent transition handling)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y23, §11 P2-6 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/components/AdminSemesterSelector.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminSemesterSelector.tsx) — add startTransition

## Step-by-Step Instructions

### 1. Update `AdminSemesterSelector.tsx`

```typescript
// BEFORE:
import { useRouter } from 'next/navigation';

const router = useRouter();
// ...
router.push(`?semester=${encodeURIComponent(tab)}`);

// AFTER:
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

const router = useRouter();
const [isPending, startTransition] = useTransition();
// ...
startTransition(() => {
  router.push(`?semester=${encodeURIComponent(tab)}`);
});
```

### 2. Verify

```bash
npx tsc --noEmit
```

## Acceptance Criteria
- [x] `router.push` is wrapped in `startTransition`.
- [x] `useTransition` is imported from React.
- [x] `npx tsc --noEmit` passes with 0 errors.
