# Task 85: Stop surfacing raw error messages to clients

## Objective
Prevent information disclosure by not exposing raw exception messages or database error details to clients.

## Audit Reference
- **Findings:** Z1, Z2, Z3, N5 (MEDIUM/LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — Replace dbError.message with safe fallbacks
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Use safe error messages
- [MODIFY] [EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — Update tests to assert safe messages
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx) — Use safe error messages in catch block
- [MODIFY] [page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.test.tsx) — Update tests to assert safe messages

## Step-by-Step Instructions

### 1. Update entries.ts
Replace `error: dbError.message` and `err.message` with `An unexpected error occurred. Please try again.` in all catch blocks.

### 2. Update EntryForm.tsx
Same.

### 3. Update Login page.tsx
Same.

### 1. Verification

```bash
grep -n "err.message" app/actions/entries.ts
npx vitest run app/login/page.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -n "err.message" app/actions/entries.ts
npx vitest run app/login/page.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] No raw error strings are surfaced directly to users
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
