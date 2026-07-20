# Task 65: Escape ILIKE Wildcards in Search Input

## Objective
Escape `%`, `_`, and `\` characters in user search input before passing to Supabase `.ilike()`. Currently, searching `100%` matches everything containing `100` followed by anything because `%` is treated as a wildcard.

## Audit Reference
- **Findings:** Y27 (LOW, -0.25 pts)
- **Severity:** LOW (ILIKE wildcards not escaped — functional bug, not security)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y27, §11 P2-7 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — escape wildcards
- [MODIFY] [lib/data/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.test.ts) — add escape test

## Step-by-Step Instructions

### 1. Update `lib/data/entries.ts`

```typescript
// BEFORE:
if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

// AFTER:
if (filters?.search) {
  // Escape ILIKE wildcards so user input is treated literally
  const escaped = filters.search.replace(/[%_\\]/g, '\\$&');
  query = query.ilike('description', `%${escaped}%`);
}
```

### 2. Add test

```typescript
it('escapes ILIKE wildcards in search', () => {
  // Search for "100%" should not match everything containing "100"
});
```

### 3. Verify

```bash
npx vitest run lib/data/entries.test.ts
npx tsc --noEmit
```

## Acceptance Criteria
- [x] `%`, `_`, and `\` are escaped before ILIKE query.
- [x] Test verifies wildcard escaping.
- [x] `npx vitest run` passes all tests.
- [x] `npx tsc --noEmit` passes with 0 errors.
