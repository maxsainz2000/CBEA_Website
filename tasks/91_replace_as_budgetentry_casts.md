# Task 91: Replace as BudgetEntry casts with Zod parse

## Objective
Prevent unsafe runtime casts.

## Audit Reference
- **Findings:** N2 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — Use Zod validation

## Step-by-Step Instructions

### 1. Update getEntries
Use `BudgetEntryRecordSchema.array().safeParse()`.

### 1. Verification

```bash
npx vitest run lib/data/entries.test.ts
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run lib/data/entries.test.ts
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Zod schema is used instead of unchecked casts
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
