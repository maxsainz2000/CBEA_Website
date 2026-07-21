# Task 95: Delete duplicate accent-lime token

## Objective
Remove redundant design system token.

## Audit Reference
- **Findings:** N1, Y20-partial (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css) — Delete --color-accent-lime

## Step-by-Step Instructions

### 1. Remove Token
Delete `--color-accent-lime`.

### 1. Verification

```bash
grep "color-accent" app/theme.css
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep "color-accent" app/theme.css
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Token is removed from theme.css
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
