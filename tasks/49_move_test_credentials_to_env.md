# Task 49: Move Hardcoded Test Credentials to Environment Variables

## Objective
Move the hardcoded test credentials `jane.doe@csu.edu.ph` / `Password123!` from 4 source files into environment variables (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`) loaded from `.env.local`. If the production Supabase project is the same as the test project (plausible for a student-council project on a free tier), anyone with read access to the repo can authenticate as the Treasurer. Moving credentials to `.env.local` (which is `.gitignore`d) closes this exposure.

## Audit Reference
- **Findings:** Y7 (MEDIUM, -2 pts)
- **Severity:** MEDIUM (hardcoded credentials in source — potential unauthorized access)
- **Current grade impact:** +2 points.
- **Source:** AUDIT-v5 §6 finding Y7, §9 P0-2 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [tests/global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts) — replace hardcoded credentials with env vars
- [MODIFY] [tests/auth.setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth.setup.ts) — replace hardcoded credentials with env vars
- [MODIFY] [tests/auth-flow.spec.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/auth-flow.spec.ts) — replace hardcoded credentials with env vars
- [MODIFY] [scratch/create-test-user.ts](file:///c:/Users/Admin/Documents/CBEA_Website/scratch/create-test-user.ts) — replace hardcoded credentials with env vars
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example) — add TEST_USER_EMAIL, TEST_USER_PASSWORD placeholders

## Step-by-Step Instructions

### 1. Update `tests/global-setup.ts`

```typescript
// BEFORE (tests/global-setup.ts:4-5):
const TEST_USER_EMAIL = 'jane.doe@csu.edu.ph'
const TEST_USER_PASSWORD = 'Password123!'

// AFTER:
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for Playwright tests')
}
```

### 2. Update `tests/auth.setup.ts`

```typescript
// BEFORE (tests/auth.setup.ts:6-7):
const TEST_USER_EMAIL = 'jane.doe@csu.edu.ph'
const TEST_USER_PASSWORD = 'Password123!'

// AFTER:
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local for Playwright tests')
}
```

### 3. Update `tests/auth-flow.spec.ts`

```typescript
// BEFORE (tests/auth-flow.spec.ts:43-44):
await page.getByLabel('Email').fill('jane.doe@csu.edu.ph')
await page.getByLabel('Password').fill('Password123!')

// AFTER:
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL!
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD!
await page.getByLabel('Email').fill(TEST_USER_EMAIL)
await page.getByLabel('Password').fill(TEST_USER_PASSWORD)
```

### 4. Update `scratch/create-test-user.ts`

```typescript
// BEFORE (scratch/create-test-user.ts:8-9):
const TEST_USER_EMAIL = 'jane.doe@csu.edu.ph'
const TEST_USER_PASSWORD = 'Password123!'

// AFTER:
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD

if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD) {
  throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local')
}
```

### 5. Update `.env.example`

Add at the end of `.env.example`:

```bash
# Required for Playwright E2E tests (globalSetup/globalTeardown). Never deploy to production.
TEST_USER_EMAIL=test-officer@your-project.supabase.co
TEST_USER_PASSWORD=your-test-password
```

### 6. Update `.env.local` (developer action)

Add the real test credentials to your local `.env.local`:

```bash
TEST_USER_EMAIL=jane.doe@csu.edu.ph
TEST_USER_PASSWORD=Password123!
```

### 7. Verify

```bash
# Confirm no hardcoded credentials in source:
grep -rn 'jane.doe@csu.edu.ph' app/ lib/ supabase/ tests/ scratch/ middleware.ts
# Expected: 0 hits

grep -rn 'Password123' app/ lib/ supabase/ tests/ scratch/ middleware.ts
# Expected: 0 hits

npx tsc --noEmit
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Security best practice:** Never commit credentials to source control. Use environment variables loaded from `.gitignore`d files (`.env.local`).

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Grep verification (no hardcoded credentials):
grep -rn 'jane.doe@csu.edu.ph' app/ lib/ supabase/ tests/ scratch/ middleware.ts
grep -rn 'Password123' app/ lib/ supabase/ tests/ scratch/ middleware.ts
# Both should return 0 hits

npx tsc --noEmit
```

### Manual Verification
- Confirm `.env.local` contains `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`.
- Confirm `.env.example` documents the new env vars with placeholder values.
- Run `npx playwright test` (requires real Supabase creds) to verify E2E tests still pass.

## Acceptance Criteria
- [ ] `tests/global-setup.ts` reads credentials from `process.env.TEST_USER_EMAIL` and `process.env.TEST_USER_PASSWORD`.
- [ ] `tests/auth.setup.ts` reads credentials from env vars.
- [ ] `tests/auth-flow.spec.ts` reads credentials from env vars.
- [ ] `scratch/create-test-user.ts` reads credentials from env vars.
- [ ] All 4 files throw a descriptive error if env vars are missing.
- [ ] `.env.example` documents `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` with placeholder values.
- [ ] `grep -rn 'jane.doe@csu.edu.ph' app/ lib/ supabase/ tests/ scratch/ middleware.ts` returns 0 hits.
- [ ] `grep -rn 'Password123' app/ lib/ supabase/ tests/ scratch/ middleware.ts` returns 0 hits.
- [ ] `npx tsc --noEmit` passes with 0 errors.
