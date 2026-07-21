# Task 97: Replace opacity tints with pure colors

## Objective
Follow strict Metro design system by avoiding opacity modifiers.

## Audit Reference
- **Findings:** N6, Z6 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)

## Step-by-Step Instructions

### 1. Fix Classes
Replace `bg-surface/50` and `hover:bg-outline/50`.

### 1. Verification

```bash
grep -rn "bg-surface/50\|hover:bg-outline/50" app/
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -rn "bg-surface/50\|hover:bg-outline/50" app/
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] No opacity modifiers are used for background colors
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
