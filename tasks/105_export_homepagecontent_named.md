# Task 105: Export HomepageContent as named export

## Objective
Remove fragile JSX tree traversal from tests.

## Audit Reference
- **Findings:** Z8 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [MODIFY] [page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.test.tsx)

## Step-by-Step Instructions

### 1. Named Export
Export `HomepageContent` directly.
### 2. Update Test
Import and render `HomepageContent` directly.

### 1. Verification

```bash
npx vitest run app/page.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/page.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Test uses direct component import and passes
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
