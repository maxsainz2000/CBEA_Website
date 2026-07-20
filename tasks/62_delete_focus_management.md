# Task 62: Fix Delete-Confirmation Focus Loss

## Objective
Add a `useRef` + `useEffect` to `EntryTable` that focuses the Confirm button when `confirmingId` changes. Currently, clicking Delete unmounts the Delete button and focus jumps to `<body>`, losing keyboard users' place.

## Audit Reference
- **Findings:** Y16 (LOW, -0.5 pts)
- **Severity:** LOW (accessibility — keyboard focus loss on delete confirmation)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v5 §6 finding Y16, §11 P2-4 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) — add focus management
- [MODIFY] [app/admin/components/EntryTable.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.test.tsx) — add focus assertion test

## Step-by-Step Instructions

### 1. Add ref and useEffect

```typescript
import { useState, useTransition, useRef, useEffect } from 'react';

const confirmBtnRef = useRef<HTMLButtonElement>(null);
const [confirmingId, setConfirmingId] = useState<string | null>(null);

useEffect(() => {
  if (confirmingId) {
    confirmBtnRef.current?.focus();
  }
}, [confirmingId]);
```

### 2. Attach ref to Confirm button

```typescript
<button
  ref={confirmBtnRef}
  onClick={() => handleDelete(entry.id)}
  className="btn-danger h-12"
  data-testid={`confirm-delete-${entry.id}`}
>
  Confirm
</button>
```

### 3. Add test

```typescript
it('focuses Confirm button when delete confirmation is shown', async () => {
  // Click Delete button
  // Assert Confirm button has focus
});
```

### 4. Verify

```bash
npx vitest run app/admin/components/EntryTable.test.tsx
npx tsc --noEmit
```

## Acceptance Criteria
- [x] Confirm button receives focus when delete confirmation is shown.
- [x] Test verifies focus moves to Confirm button.
- [x] `npx vitest run app/admin/components/EntryTable.test.tsx` passes.
- [x] `npx tsc --noEmit` passes with 0 errors.
