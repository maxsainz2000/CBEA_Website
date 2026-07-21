# Task 86: Verify Supabase public signups are disabled

## Objective
Ensure the production database restricts unauthorized signups.

## Audit Reference
- **Findings:** operational
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [verify-signup-disabled.js](file:///c:/Users/Admin/Documents/CBEA_Website/scratch/verify-signup-disabled.js)

## Step-by-Step Instructions

### 1. Run Script
Run `node scratch/verify-signup-disabled.js`.

### 1. Verification

```bash
node scratch/verify-signup-disabled.js
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
node scratch/verify-signup-disabled.js
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Script passes
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
