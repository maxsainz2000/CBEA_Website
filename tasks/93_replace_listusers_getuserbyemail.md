# Task 93: Replace listUsers with getUserByEmail

## Objective
Fix unpaginated user list retrieval which fails on larger datasets.

## Audit Reference
- **Findings:** Y30-partial, R6 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts) — Use getUserByEmail

## Step-by-Step Instructions

### 1. Use getUserByEmail
Replace `admin.listUsers()` with `admin.getUserByEmail()`.

### 1. Verification

```bash
npx playwright test --reporter=list
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx playwright test --reporter=list
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Test setup correctly queries users using getUserByEmail
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
