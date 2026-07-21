# Task 99: Fix HTML min="0" on amount input

## Objective
Align HTML form validation with Zod schema validation.

## Audit Reference
- **Findings:** Z4 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)

## Step-by-Step Instructions

### 1. Update Min Attribute
Change `min="0"` to `min="0.01"`.

### 1. Verification

```bash
grep "min=\"0\"" app/admin/components/EntryForm.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep "min=\"0\"" app/admin/components/EntryForm.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] The HTML element uses min="0.01"
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
