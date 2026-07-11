# Task 3: Supabase Client and Auth Middleware Setup

## Objective
Implement client-side and server-side Supabase client initialization in Next.js 15 App Router using the `@supabase/ssr` package, handle asynchronous cookie storage, and set up auth redirection middleware to protect administrative routes.

## Files Created / Modified
- [NEW] [lib/supabase/client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts) (Browser-side client helper)
- [NEW] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts) (Asynchronous server-side client helper)
- [NEW] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts) (Session refresh helper called from middleware)
- [NEW] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/middleware.ts) (Next.js middleware routing guard)
- [NEW] [.env.local](file:///c:/Users/Admin/Documents/CBEA_Website/.env.local) (Local environmental configurations)

## Step-by-Step Instructions

### 1. Environmental Setup
- Scaffold `.env.local` containing placeholder configurations:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- Make sure to add `.env.local` to `.gitignore` to prevent secret leaks.

### 2. Browser Client Setup (`lib/supabase/client.ts`)
- Use `createBrowserClient` from `@supabase/ssr` to initialize the browser client.
- Ensure it uses environment variables: `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Asynchronous Server Client Setup (`lib/supabase/server.ts`)
- Use `createServerClient` from `@supabase/ssr`.
- **Next.js 15 Crucial Rule:** `cookies()` from `next/headers` is asynchronous and returns a Promise. You must `await cookies()` before accessing cookies.
- Implement cookie storage get/set logic:
  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore cookie mutations if called from a Server Component
            }
          },
        },
      }
    )
  }
  ```

### 4. Middleware Session Refresher (`lib/supabase/middleware.ts`)
- Create an asynchronous `updateSession` helper that takes a `NextRequest` and returns a `NextResponse` or updates the current response.
- Instantiates a `createServerClient` using an inline request/response cookie editor. This refreshes expired auth tokens dynamically.
- Always use `supabase.auth.getUser()` in verification steps to prevent cookie spoofing.

### 5. Routing Guard (`middleware.ts`)
- Intercept incoming HTTP requests using `middleware.ts` in the project root.
- Match all routes except static assets, favicon, etc.
- In `middleware.ts`:
  1. Call `updateSession(request)`.
  2. If the path starts with `/admin`:
     - Check if the user is authenticated.
     - If authenticated, allow them to proceed.
     - If unauthenticated, redirect them to `/login`.
  3. If the path is `/login` and the user is authenticated:
     - Redirect them to `/admin`.

## Metro Design Compliance & Best Coding Practices
- **Security Strictness:** Never use `supabase.auth.getSession()` for authorization decisions. Always await and use `supabase.auth.getUser()`, as it fetches the user details securely from the Supabase server.
- **Asynchronous Cookie handling:** Next.js 15 requires `await cookies()`. Failing to await will result in compilation and runtime errors.

## Automated Testing & Verification Plan

### Automated Unit Tests
- Create unit tests at `lib/supabase/supabase.test.ts` to test client generation:
  1. Mock `@supabase/ssr` to verify that `createBrowserClient` reads environmental variables correctly.
  2. Mock `next/headers` cookies to return a mocked cookie store.
  3. Verify that `createClient()` (from `lib/supabase/server.ts`) successfully calls `createServerClient` with the mocked cookies.
- Run tests:
  ```bash
  npx vitest run
  ```

### Manual Verification
- Test unauthorized access: Visit `/admin` in private browsing without logging in. Verify you are redirected to `/login`.

## Acceptance Criteria
- [x] Browser and Server clients correctly leverage environment variables.
- [x] Next.js 15 `await cookies()` is correctly integrated without warnings/errors.
- [x] Middleware blocks unauthenticated navigation to `/admin` and subpaths, redirecting users to `/login`.
- [x] Authentic session credentials refresh dynamically on active navigation.
