# Task 10: Fix Server Action Unit Tests

## Objective
Fix all 9 failing vitest tests in `app/actions/entries.test.ts`. The tests fail because each server action dynamically imports `next/headers` (which throws outside a Next.js request scope), and the test file does not mock it. This task refactors the actions to use the centralized `getOfficer()` helper (created in Task 09) and updates the test mocks accordingly.

## Audit Reference
- **Finding:** P1-1 (9/9 action tests fail)
- **Severity:** High — blocks Task 4 acceptance criterion
- **Root cause:** `app/actions/entries.ts` calls `await import('next/headers')` at lines 16, 98, 176. The test mocks `../../lib/supabase/server` and `next/cache` but NOT `next/headers`. The dynamic import resolves to the real `next/headers`, which throws `cookies was called outside a request scope`.

## Dependencies
- **Task 09 must be completed first.** This task depends on `lib/auth/session.ts` existing and the server actions already being refactored to use `getOfficer()`.

## Files Created / Modified
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) (already modified in Task 09 — verify `getOfficer()` usage)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts)

## Step-by-Step Instructions

### 1. Verify server actions use `getOfficer()` (from Task 09)

Confirm that `app/actions/entries.ts` no longer contains:
- `await import('next/headers')`
- `process.env.NEXT_PUBLIC_IS_E2E`
- `SUPABASE_SERVICE_ROLE_KEY` in request-time code paths

All three actions (`createEntry`, `updateEntry`, `deleteEntry`) should call:
```ts
const officer = await getOfficer()
if (!officer) return { success: false, error: 'Unauthorized' }
```

### 2. Update test mocks in `entries.test.ts`

Add a mock for `lib/auth/session` at the top of the test file:

```ts
vi.mock('../../lib/auth/session', () => ({
  getOfficer: vi.fn(),
}))

import { getOfficer } from '../../lib/auth/session'
```

Remove any existing mock of `next/headers` if present (it should not be needed after the refactor).

### 3. Update test setup

In `beforeEach`, reset the mock and set a default (unauthenticated) state:

```ts
beforeEach(() => {
  vi.clearAllMocks()
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null) // default: unauth
})
```

### 4. Update individual test cases

**For tests that expect `'Unauthorized'` rejection:**
```ts
it('rejects unauthenticated createEntry', async () => {
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  const result = await createEntry(/* ... */)
  expect(result.success).toBe(false)
  expect(result.error).toBe('Unauthorized')
})
```

**For tests that expect successful operations:**
```ts
it('creates entry with authenticated user', async () => {
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: 'test-user-uuid',
    email: 'test@csu.edu.ph',
  })
  // ... set up mock Supabase query ...
  const result = await createEntry(/* ... */)
  expect(result.success).toBe(true)
})
```

**For tests that expect validation errors:**
```ts
it('rejects invalid input with validation errors', async () => {
  ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: 'test-user-uuid',
    email: 'test@csu.edu.ph',
  })
  const result = await createEntry(/* invalid data */)
  expect(result.success).toBe(false)
  expect(result.error).toBe('Validation failed')
})
```

### 5. Remove stale mocks

If the test file previously mocked `next/headers` or had workarounds for the dynamic import, remove them. The only mocks needed should be:
- `../../lib/auth/session` (for `getOfficer`)
- `../../lib/supabase/server` (for the Supabase client)
- `next/cache` (for `revalidatePath`)

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Testing best practice:** Mock at the boundary (the `getOfficer()` function), not at the infrastructure layer (`next/headers`). This makes tests resilient to implementation changes.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/actions/entries.test.ts
# Expected: 9/9 pass (previously 0/9)

npx vitest run
# Expected: 37/37 pass (all tests green)
```

### Verification
- Confirm no test still references `next/headers` as a mock target.
- Confirm the test covers: unauthenticated rejection, validation rejection, successful create/update/delete.

## Acceptance Criteria
- [x] All 9 tests in `app/actions/entries.test.ts` pass.
- [x] `npx vitest run` reports 37/37 pass, 0 fail.
- [x] The test file mocks `lib/auth/session` (not `next/headers`).
- [x] No dynamic `import('next/headers')` remains in `app/actions/entries.ts`.
