# Task 60: Fix Hydration Risk from new Date() in EntryForm

## Objective
Replace `new Date().toISOString().split('T')[0]` in `useState` initializer with empty string, then set today's date in `useEffect`. If the server renders at 23:59:59 UTC and the client hydrates at 00:00:01 UTC, the default date differs by one day, causing a React hydration mismatch warning.

## Audit Reference
- **Findings:** Y9 (MEDIUM, -0.5 pts)
- **Severity:** MEDIUM (hydration risk — date mismatch across midnight UTC boundary)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v5 §6 finding Y9, §11 P2-2 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — move date initialization to useEffect
- [MODIFY] [app/admin/components/EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — update test for empty initial date

## Step-by-Step Instructions

### 1. Update `EntryForm.tsx`

```typescript
// BEFORE (line 20):
date: initialData?.date || new Date().toISOString().split('T')[0],

// AFTER:
date: initialData?.date || '',  // empty initial — set in useEffect

// Add useEffect after useState:
useEffect(() => {
  if (!formData.date) {
    setFormData(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0]
    }));
  }
}, []); // run once on mount
```

Ensure `useEffect` is imported: `import { useState, useEffect } from 'react'`.

### 2. Verify

```bash
npx vitest run app/admin/components/EntryForm.test.tsx
npx tsc --noEmit
```

## Acceptance Criteria
- [x] `useState` initializer uses empty string for date (not `new Date()`).
- [x] `useEffect` sets today's date on mount when date is empty.
- [x] `npx vitest run app/admin/components/EntryForm.test.tsx` passes.
- [x] `npx tsc --noEmit` passes with 0 errors.
