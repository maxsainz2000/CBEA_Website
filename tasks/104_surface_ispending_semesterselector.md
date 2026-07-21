# Task 104: Surface isPending in AdminSemesterSelector

## Objective
Improve UX by displaying loading state during data fetching.

## Audit Reference
- **Findings:** N12 (INFO)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [AdminSemesterSelector.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminSemesterSelector.tsx)

## Step-by-Step Instructions

### 1. Display Pending State
Render a "Switching..." span when `isPending` is true.

### 1. Verification

```bash
npx vitest run app/admin/components/AdminSemesterSelector.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/admin/components/AdminSemesterSelector.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Loading indicator renders when switching semesters
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
