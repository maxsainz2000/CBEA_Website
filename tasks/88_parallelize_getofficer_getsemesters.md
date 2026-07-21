# Task 88: Parallelize getOfficer with getSemesters

## Objective
Reduce request latency by running independent data queries concurrently.

## Audit Reference
- **Findings:** Y14, N3 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — Use Promise.all

## Step-by-Step Instructions

### 1. Parallelize Queries
Group `getOfficer()` and `getSemesters()` inside a `Promise.all()`.

### 1. Verification

```bash
npx vitest run app/admin/page.test.tsx
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/admin/page.test.tsx
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] admin page loads officer and semesters in parallel
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
