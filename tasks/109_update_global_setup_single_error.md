# Task 109: Update global-setup.ts to check .single() error

## Objective
Ensure initialization setup safely recovers from DB issues.

## Audit Reference
- **Findings:** N10 (INFO)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts)

## Step-by-Step Instructions

### 1. Check Error Code
Verify `error.code !== "PGRST116"`.

### 1. Verification

```bash
npx tsc --noEmit
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx tsc --noEmit
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Error handling captures legitimate failures
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
