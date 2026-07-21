# Task 110: Remove cursor-pointer when no onEntryClick

## Objective
Fix false UI affordances where components look clickable but are not.

## Audit Reference
- **Findings:** N9 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx)

## Step-by-Step Instructions

### 1. Make Styles Conditional
Apply `cursor-pointer` only if `onEntryClick` exists.

### 1. Verification

```bash
npx vitest run app/components/BudgetEntryList.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/components/BudgetEntryList.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Cursor pointer is absent when component is unclickable
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
