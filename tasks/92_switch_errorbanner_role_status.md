# Task 92: Switch ErrorBanner to role="status"

## Objective
Ensure initial load error messages are properly announced by screen readers.

## Audit Reference
- **Findings:** R2 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [ErrorBanner.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ErrorBanner.tsx) — Change role
- [MODIFY] [BudgetEntryList.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.test.tsx) — Update related tests if applicable

## Step-by-Step Instructions

### 1. Update Role
Change `role="alert"` to `role="status"`.

### 1. Verification

```bash
grep -rn 'role="alert"' app/components/ErrorBanner.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -rn 'role="alert"' app/components/ErrorBanner.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] ErrorBanner uses role="status"
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
