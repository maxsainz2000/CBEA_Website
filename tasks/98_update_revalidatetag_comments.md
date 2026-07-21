# Task 98: Update revalidateTag comments

## Objective
Keep technical comments accurate for newer Next.js versions.

## Audit Reference
- **Findings:** R3 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)

## Step-by-Step Instructions

### 1. Update Comment
Reference the updated revalidateTag API.

### 1. Verification

```bash
grep -n "revalidateTag" app/actions/entries.ts
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -n "revalidateTag" app/actions/entries.ts
```

### Manual Verification
- N/A

## Acceptance Criteria
- [ ] Comments mention the newer 2026 API
- [ ] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
