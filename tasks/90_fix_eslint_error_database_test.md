# Task 90: Fix ESLint error in database.test.ts

## Objective
Resolve "Unexpected any" ESLint failure.

## Audit Reference
- **Findings:** Z7 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — Define SummaryStatsRow interface

## Step-by-Step Instructions

### 1. Define Type
Replace `as any` with a well-defined `SummaryStatsRow` type.

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
- [x] npx eslint passes without errors
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
