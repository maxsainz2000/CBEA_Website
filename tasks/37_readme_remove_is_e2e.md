# Task 37: Remove `IS_E2E` from README

## Objective
Remove the obsolete `IS_E2E` row from the README environment variables table and update the `SUPABASE_SERVICE_ROLE_KEY` description to reflect its current use in Playwright `globalSetup`/`globalTeardown`. Task 20 (Session 3) removed the `IS_E2E` env var from `.env.example` and all source code, but did not update README. A new developer following the README would set `IS_E2E=true` in their `.env.local` and nothing would happen — the variable is silently ignored. This doc-drift also creates a security risk if a future developer re-introduces the old backdoor based on the README's description.

## Audit Reference
- **Findings:** X10 (LOW, -0.25 pts)
- **Severity:** LOW (documentation drift — README documents a deleted env var)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X10, §8.10 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)

## Step-by-Step Instructions

### 1. Update the environment variables table in README.md

Find the Environment Variables section (approximately line 25) and replace the table:

```markdown
<!-- BEFORE: -->
## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Local only | Service role key for DB seeding scripts. **Never deploy to production.** |
| `IS_E2E` | Test only | Set to `true` to enable mock auth for Playwright tests. Server-side only. |

<!-- AFTER: -->
## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Test only | Service role key for Playwright `globalSetup` (provisions test user) and `globalTeardown` (cleans up test residue). **Never deploy to production.** |
```

### 2. Verify the reference is gone

```bash
grep 'IS_E2E' README.md
# Should return no hits
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Documentation hygiene:** README should accurately reflect the current state of the project. Stale documentation is worse than no documentation — it creates false assumptions.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# No code changes, just a doc edit. Verify with grep:
grep 'IS_E2E' README.md
# Should return no hits
```

### Manual Verification
- Open `README.md` and verify the `IS_E2E` row is gone.
- Verify the `SUPABASE_SERVICE_ROLE_KEY` description mentions Playwright `globalSetup`/`globalTeardown`.

## Acceptance Criteria
- [x] `README.md` does NOT contain `IS_E2E`.
- [x] `README.md` environment variables table has exactly 3 rows (not 4).
- [x] `SUPABASE_SERVICE_ROLE_KEY` description mentions Playwright `globalSetup` and `globalTeardown`.
- [x] `grep 'IS_E2E' README.md` returns no hits.
