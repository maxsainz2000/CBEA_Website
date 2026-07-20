# Task 68: Fix global-setup.ts TOCTOU and Missing Error Handling

## Objective
Fix the TOCTOU (time-of-check-to-time-of-use) race condition and missing error handling in `tests/global-setup.ts`. The `error` return from `getUserById` is never checked — on transient network error, `existingUser?.user` is null, causing the code to attempt `createUser` on an existing user.

## Audit Reference
- **Findings:** Y30 (LOW, -0.25 pts)
- **Severity:** LOW (E2E test setup robustness — TOCTOU race condition)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v5 §6 finding Y30, §11 P2-10 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [tests/global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts) — add error handling, fix TOCTOU

## Step-by-Step Instructions

### 1. Add error handling to `getUserById`

```typescript
// BEFORE:
const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);
if (existingUser?.user) {
  // user exists — delete residual entries
} else {
  // create user
}

// AFTER:
const { data: existingUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(TEST_USER_ID);

if (getUserError) {
  if (getUserError.message.includes('User not found')) {
    // Create the user
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
    });
    if (createError) throw new Error(`Failed to create test user: ${createError.message}`);
  } else {
    throw new Error(`Failed to check test user: ${getUserError.message}`);
  }
} else {
  // User exists — delete residual entries
  const { error: deleteError } = await supabaseAdmin
    .from('budget_entries')
    .delete()
    .eq('entered_by', TEST_USER_ID)
    .like('description', 'E2E Sponsorship %');
  if (deleteError) {
    console.warn(`Failed to clean up test entries: ${deleteError.message}`);
  }
}
```

### 2. Verify

```bash
npx tsc --noEmit
# E2E tests require real Supabase — [UNVERIFIED] from local
```

## Acceptance Criteria
- [ ] `getUserById` error is checked and handled.
- [ ] "User not found" error triggers user creation.
- [ ] Transient errors throw descriptive Error.
- [ ] Cleanup deletion has error handling.
- [ ] `npx tsc --noEmit` passes with 0 errors.
