# Task 81: Fix `as Record<string, string[]>` Cast on Zod Field Errors

## Objective
Replace the `as Record<string, string[]>` cast on Zod's `flatten().fieldErrors` with a runtime filter. Zod's actual type is `{ [k]: string[] | undefined }` — the cast hides potential `undefined` values.

## Audit Reference
- **Findings:** Y13 (LOW)
- **Source:** AUDIT-v5 §6 finding Y13, §12 P3-13.

## Files Created / Modified
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — replace cast with runtime filter (lines 26 and 86)

## Step-by-Step Instructions

### 1. Replace the cast

```typescript
// BEFORE (line 26):
return { success: false, fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]> }

// AFTER:
const rawErrors = validation.error.flatten().fieldErrors;
const fieldErrors: Record<string, string[]> = {};
for (const [k, v] of Object.entries(rawErrors)) {
  if (v) fieldErrors[k] = v;
}
return { success: false, fieldErrors }
```

Repeat for line 86.

### 2. Verify

```bash
npx vitest run app/actions/entries.test.ts
npx tsc --noEmit
```

## Acceptance Criteria
- [ ] 0 `as Record<string, string[]>` casts on Zod field errors.
- [ ] Runtime filter removes `undefined` values.
- [ ] `npx vitest run app/actions/entries.test.ts` passes.
- [ ] `npx tsc --noEmit` passes.
