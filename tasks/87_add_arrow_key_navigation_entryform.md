# Task 87: Add arrow-key navigation to EntryForm radiogroup

## Objective
Improve accessibility for the radiogroup widget using arrow keys to change selections.

## Audit Reference
- **Findings:** R1 (MEDIUM)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Add onKeyDown handler
- [MODIFY] [EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — Add tests

## Step-by-Step Instructions

### 1. Add handleKeyDown
Implement arrow key navigation with wrapping focus.
### 2. Add Tests
Ensure ArrowRight, ArrowLeft update focus and selection appropriately.

### 1. Verification

```bash
npx vitest run app/admin/components/EntryForm.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/admin/components/EntryForm.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Arrow keys change the selected radio option
- [x] Tests added and passing
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
