# Task 106: Use container option in layout test

## Objective
Fix hydration warnings in JSDOM testing environment.

## Audit Reference
- **Findings:** Z9 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [layout.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.test.tsx)

## Step-by-Step Instructions

### 1. Use Document Container
Pass `{ container: document.documentElement }` to `render`.

### 1. Verification

```bash
npx vitest run app/layout.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/layout.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Hydration warnings are resolved
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
