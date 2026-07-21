# Task 73: Add aria-label to nav Element

## Objective
Add `aria-label="Primary"` to the `<nav>` element in `app/components/Header.tsx:16`. Best practice for landmark navigation.

## Audit Reference
- **Findings:** Y26 (LOW)
- **Source:** AUDIT-v5 §6 finding Y26, §12 P3-3.

## Files Created / Modified
- [MODIFY] [app/components/Header.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/Header.tsx) — add `aria-label="Primary"`

## Step-by-Step Instructions

### 1. Update `Header.tsx`

```typescript
// BEFORE:
<nav>

// AFTER:
<nav aria-label="Primary">
```

### 2. Verify

```bash
grep 'aria-label' app/components/Header.tsx
npx tsc --noEmit
```

## Acceptance Criteria
- [x] `<nav>` has `aria-label="Primary"`.
- [x] `npx tsc --noEmit` passes.
