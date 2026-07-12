# Task 7: Officer Authentication Flow

## Objective
Build the authenticated officer login interface (`app/login/page.tsx`) to allow designated council members to access administrative routes. Integrate the authentication flow with Supabase Auth and configure redirect policies based on user state.

## Files Created / Modified
- [NEW] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx) (Officer login form)

## Step-by-Step Instructions

### 1. Form Interface Construction
- Build a clean, centered login panel (no box-shadows, pure flat backgrounds).
- Create form input fields for:
  - Email: `.input-underline` format, with focus state transitioning to the Lime accent color.
  - Password: `.input-underline` secure text entry.
- Create a primary submit button: `.btn-primary` (Lime background, black text).

### 2. Connect Login Logic
- Mark the form container or component as a client component (`"use client"`).
- Initialize the browser-side Supabase client using `createBrowserClient` from `lib/supabase/client.ts`.
- On form submit:
  - Perform client-side validation (check for empty values).
  - Call `supabase.auth.signInWithPassword({ email, password })`.
  - Handle errors: if login fails, display the error message in the form area styled in `.text-error` (red).
  - Handle success: redirect the user to the `/admin` path using the Next.js `useRouter` hook.

### 3. Handle Middleware Redirects
- Ensure that the routing rules configured in `middleware.ts` (Task 3) intercept request redirection:
  - Unauthenticated users trying to access `/admin` -> redirect to `/login`.
  - Authenticated users trying to access `/login` -> redirect to `/admin`.

## Metro Design Compliance & Best Coding Practices
- **Fierce Reduction:** One primary action per screen. The login button is the sole prominent filled button.
- **Accented Interaction:** Underline borders on input focus provide active visual cues.
- **Error Tone:** Validation errors must be colored in the semantic `error` red color (#E51400) and display plain text error descriptions clearly.
- **No Decoration:** Avoid graphic logos or styling elements in the login container. Focus entirely on the credential fields.

## Automated Testing & Verification Plan

### Automated E2E Tests
- Write a Playwright E2E test file (`tests/auth-flow.spec.ts`):
  1. **Invalid Login:** Attempt to log in with fake credentials. Assert that an error message displays and the user remains on the `/login` route.
  2. **Valid Login:** Fill in mock seed credentials, submit the form, and assert that the browser redirects to the `/admin` page.
  3. **Route Protection:** Navigate directly to `/admin` while unauthenticated. Assert that the browser is automatically redirected back to `/login`.
- Run tests:
  ```bash
  npx playwright test
  ```

### Manual Verification
- Attempt to navigate to `/admin` and confirm redirection. Verify that typing credentials and pressing Enter successfully submits the form.

## Acceptance Criteria
- [x] Login screen contains email, password, and primary submit button with Metro style.
- [x] Errors display inline in semantic red text.
- [x] Successful credentials authenticate via Supabase Auth and trigger redirection to `/admin`.
- [x] Route guarding prevents authenticated users from re-accessing `/login`.
- [x] Playwright E2E tests pass for valid/invalid inputs and redirects.
