# Task 102: Add no-floating-promises ESLint rule

## Objective
Prevent issues caused by unhandled promises during testing.

## Audit Reference
- **Findings:** R8 (INFO)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [eslint.config.mjs](file:///c:/Users/Admin/Documents/CBEA_Website/eslint.config.mjs)

## Step-by-Step Instructions

### 1. Add Rule
Add `@typescript-eslint/no-floating-promises: "error"`.

### 1. Verification

```bash
npx eslint
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx eslint
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] ESLint rule is enforced
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
