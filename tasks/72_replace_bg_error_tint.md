# Task 72: Replace bg-error/10 Tint with bg-surface

## Objective
Replace `bg-error/10` (10% red tint — violates strict Metro pure white BG) with `bg-surface` (light gray, consistent with `ErrorBanner.tsx`) in `EntryForm.tsx:118` and `EntryTable.tsx:34`.

## Audit Reference
- **Findings:** Y22 (LOW)
- **Source:** AUDIT-v5 §6 finding Y22, §12 P3-2.

## Files Created / Modified
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — replace `bg-error/10` with `bg-surface`
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) — replace `bg-error/10` with `bg-surface`

## Step-by-Step Instructions

### 1. Update both files

```typescript
// BEFORE:
className="... bg-error/10 ..."

// AFTER:
className="... bg-surface ..."
```

### 2. Verify

```bash
grep 'bg-error/10' app/admin/components/EntryForm.tsx app/admin/components/EntryTable.tsx
# Expected: 0 hits

npx vitest run
npm run build
```

## Acceptance Criteria
- [x] `bg-error/10` replaced with `bg-surface` in both files.
- [x] Consistent with `ErrorBanner.tsx` styling.
- [x] `npm run build` succeeds.
