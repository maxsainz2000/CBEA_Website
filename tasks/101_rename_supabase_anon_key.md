# Task 101: Rename NEXT_PUBLIC_SUPABASE_ANON_KEY

## Objective
Align with updated Supabase environment variable naming conventions.

## Audit Reference
- **Findings:** R4 (LOW)
- **Severity:** VARIES (derived from findings)
- **Source:** AUDIT-v6

## Files Created / Modified
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example)
- [MODIFY] [client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts)
- [MODIFY] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)
- [MODIFY] [server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts)
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)

## Step-by-Step Instructions

### 1. Rename Env Var
Update variable references to use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 1. Verification

```bash
npm run build
```

## Metro Design Compliance & Best Coding Practices
- No design-system impact unless directly modifying UI styling.
- All code follows strict TypeScript conventions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npm run build
```

### Manual Verification
- N/A

## Acceptance Criteria
- [x] Build passes and uses the updated variable name
- [x] Final quality gate: `npx tsc --noEmit`, `npx vitest run`, `npm run build` all pass
