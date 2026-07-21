# Task 96: Expand log.ts sanitize redaction list

## Objective
Ensure sensitive headers and fields are not accidentally logged.

## Audit Reference
- **Findings:** N4 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [log.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/log.ts) — Add new sensitive keys

## Step-by-Step Instructions

### 1. Add Keys
Add authorization, email, apikey, etc. to `SENSITIVE_KEYS`.

### 1. Verification

```bash
npx vitest run lib/supabase/supabase.test.ts
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run lib/supabase/supabase.test.ts
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Additional sensitive keys are redacted
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
