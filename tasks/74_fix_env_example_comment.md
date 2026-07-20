# Task 74: Fix .env.example Stale Comment

## Objective
Update the stale comment in `.env.example:3` from "Optional: service role key for local DB seeding scripts only" to "Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production." — matching `README.md:24`.

## Audit Reference
- **Findings:** Y35 (LOW)
- **Source:** AUDIT-v5 §6 finding Y35, §12 P3-4.

## Files Created / Modified
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example) — update stale comment

## Step-by-Step Instructions

### 1. Update `.env.example`

```bash
# BEFORE:
# Optional: service role key for local DB seeding scripts only

# AFTER:
# Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production.
```

### 2. Verify

```bash
cat .env.example
```

## Acceptance Criteria
- [ ] `.env.example` comment matches README's description of `SUPABASE_SERVICE_ROLE_KEY`.
