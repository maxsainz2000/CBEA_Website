# Task 84: Map Login Error to Safe Messages

## Objective
Replace raw Supabase error display in `app/login/page.tsx:38` with a mapped safe message. Default Supabase returns generic "Invalid login credentials" (OK), but custom configs may leak email-existence info. Map known error codes to safe messages and fall back to "Invalid email or password."

## Audit Reference
- **Findings:** Y24 (LOW)
- **Source:** AUDIT-v5 §6 finding Y24, §12 P3-19.

## Files Created / Modified
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx) — map error codes to safe messages

## Step-by-Step Instructions

### 1. Update error handling in login page

```typescript
// BEFORE:
setError(signInError.message)

// AFTER:
const safeMessages: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password.',
  'Email not confirmed': 'Please confirm your email address before signing in.',
  'Too many requests': 'Too many login attempts. Please wait a moment and try again.',
};

const safeMessage = safeMessages[signInError.message] ?? 'Invalid email or password.';
setError(safeMessage);
```

### 2. Verify

```bash
npx tsc --noEmit
npx vitest run
```

## Acceptance Criteria
- [ ] Login page maps known Supabase error messages to safe user-facing messages.
- [ ] Unknown errors fall back to "Invalid email or password."
- [ ] Raw Supabase error messages are never displayed to the user.
- [ ] `npx tsc --noEmit` passes.
