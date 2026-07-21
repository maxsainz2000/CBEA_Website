# Task 108: Extract copyCookies helper in middleware

## Objective
Avoid duplicated block of code for copying cookies.

## Audit Reference
- **Findings:** Z12 (INFO)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)

## Step-by-Step Instructions

### 1. Create Helper Function
Move copy logic to `copyCookies()` and reuse.

### 1. Verification

```bash
npm run build
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npm run build
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Middleware code is simplified without logic changes
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
