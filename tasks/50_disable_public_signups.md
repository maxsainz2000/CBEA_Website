# Task 50: Disable Public Supabase Auth Signups

## Objective
Operationally disable public signups in the Supabase Dashboard to prevent unauthorized users from creating accounts via the public anon key. This is a Dashboard action, not a code change, but is documented as a task for traceability. Combined with Task 48 (role check), this provides defense-in-depth: even if a user bypasses the app-layer role check, they cannot create a new account to authenticate with.

## Audit Reference
- **Findings:** P0-3 (operational defense-in-depth for Y1)
- **Severity:** HIGH (operational — prevents the Y1 attack vector at the infrastructure level)
- **Current grade impact:** Part of the +6 pts from P0 tier.
- **Source:** AUDIT-v5 §9 P0-3.

## Files Created / Modified
- None (Dashboard action)
- [NEW] [scratch/verify-signup-disabled.js](file:///c:/Users/Admin/Documents/CBEA_Website/scratch/verify-signup-disabled.js) — optional verification script

## Step-by-Step Instructions

### 1. Disable public signups in Supabase Dashboard

1. Navigate to your Supabase project Dashboard.
2. Go to **Authentication → Providers → Email**.
3. Toggle OFF **"Allow new users to sign up"**.
4. Save the configuration.

### 2. Create a verification script (optional)

Create `scratch/verify-signup-disabled.js`:

```javascript
// scratch/verify-signup-disabled.js
// Run: node scratch/verify-signup-disabled.js
// Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verify() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test-attacker@example.com',
    password: 'Test1234!',
  });

  if (error) {
    console.log('✅ PASS — signups disabled:', error.message);
  } else {
    console.log('❌ FAIL — signup succeeded for:', data.user?.email);
    console.log('   Go to Dashboard → Authentication → Providers → Email → disable signups.');
  }
}

verify();
```

### 3. Verify

```bash
node scratch/verify-signup-disabled.js
# Should print: ✅ PASS — signups disabled: Signups not allowed for this instance
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Security best practice:** Disable public signups for internal-use applications. Only designated officers should have accounts, provisioned manually by the project admin.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# No code changes. Run verification script:
node scratch/verify-signup-disabled.js
```

### Manual Verification
- Go to Supabase Dashboard → Authentication → Providers → Email.
- Verify "Allow new users to sign up" is toggled OFF.
- Try to sign up via the SDK — should fail with "Signups not allowed for this instance."

## Acceptance Criteria
- [ ] Supabase Dashboard → Authentication → Providers → Email → "Allow new users to sign up" is OFF.
- [ ] Attempting to sign up via the SDK with the anon key fails with an appropriate error.
- [ ] Verification script `scratch/verify-signup-disabled.js` exists and prints PASS.
