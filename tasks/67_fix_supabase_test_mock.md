# Task 67: Fix supabase.test.ts Stale Mock Call Shape

## Objective
Remove the unnecessary `!` non-null assertion and extra `{}` second argument from `cookiesObj.setAll` call in `lib/supabase/supabase.test.ts:91`. The `setAll` method takes one argument; the extra `{}` is ignored. The `!` is unnecessary on a defined method.

## Audit Reference
- **Findings:** Y29 (LOW, -0.25 pts)
- **Severity:** LOW (stale mock call shape — passes by accident)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y29, §11 P2-9 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/supabase/supabase.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/supabase.test.ts) — fix setAll call

## Step-by-Step Instructions

### 1. Fix the call in `supabase.test.ts`

```typescript
// BEFORE (line 91):
cookiesObj.setAll!([{ name: 'sb-refresh-token', value: 'new-token', options: {} }], {})

// AFTER:
cookiesObj.setAll([{ name: 'sb-refresh-token', value: 'new-token', options: {} }])
```

### 2. Verify

```bash
npx vitest run lib/supabase/supabase.test.ts
```

## Acceptance Criteria
- [ ] `setAll` call has no `!` assertion and no extra `{}` argument.
- [ ] `npx vitest run lib/supabase/supabase.test.ts` passes.
