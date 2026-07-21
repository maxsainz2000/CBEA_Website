# Task 94: Fix as any cast in supabase.test.ts

## Objective
Remove `as any` when mocking.

## Audit Reference
- **Findings:** Y29-partial (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [supabase.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/supabase.test.ts) — Type the mock client

## Step-by-Step Instructions

### 1. Remove Cast
Define and use `MockServerClientOptions`.

### 1. Verification

```bash
npx eslint lib/supabase/supabase.test.ts
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx eslint lib/supabase/supabase.test.ts
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] No as any casts in the file
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
