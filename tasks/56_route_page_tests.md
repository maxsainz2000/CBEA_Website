# Task 56: Add Co-Located Tests for 5 Route Pages

## Objective
Add `*.test.tsx` co-located test files for the 5 route pages that currently have zero tests: `app/page.tsx`, `app/login/page.tsx`, `app/admin/page.tsx`, `app/admin/new/page.tsx`, `app/admin/edit/[id]/page.tsx`. Test auth-redirect logic, `searchParams` parsing, error banner rendering, and data-fetch failure states.

## Audit Reference
- **Findings:** Y5 (MEDIUM, -2 pts)
- **Severity:** MEDIUM (5 route pages with 0 tests — auth-redirect and error states untested)
- **Current grade impact:** +2 points.
- **Source:** AUDIT-v5 §6 finding Y5, §10 P1-6 step-by-step instructions.

## Files Created / Modified
- [NEW] [app/page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.test.tsx) — homepage route tests
- [NEW] [app/login/page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.test.tsx) — login route tests
- [NEW] [app/admin/page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.test.tsx) — admin dashboard route tests
- [NEW] [app/admin/new/page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.test.tsx) — new entry route tests
- [NEW] [app/admin/edit/[id]/page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.test.tsx) — edit entry route tests

## Step-by-Step Instructions

### 1. Create `app/admin/page.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/session', () => ({
  getOfficer: vi.fn(),
}));

vi.mock('@/lib/data/entries', () => ({
  getEntries: vi.fn(),
  getSummaryStats: vi.fn(),
  getSemesters: vi.fn(),
}));

import AdminPage from './page';
import { getOfficer } from '@/lib/auth/session';
import { getEntries, getSummaryStats, getSemesters } from '@/lib/data/entries';

const mockGetOfficer = vi.mocked(getOfficer);
const mockGetEntries = vi.mocked(getEntries);
const mockGetSummaryStats = vi.mocked(getSummaryStats);
const mockGetSemesters = vi.mocked(getSemesters);

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);
    await expect(AdminPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('NEXT_REDIRECT');
  });

  it('renders error banner when getSemesters fails', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'u1', email: 'officer@test', role: 'Treasurer', full_name: 'Test Officer'
    });
    mockGetSemesters.mockResolvedValue({ status: 'error', message: 'DB down' });
    // Assert error banner is rendered
  });
});
```

### 2. Create tests for remaining 4 routes

Follow the same pattern:
- **`app/page.test.tsx`:** Mock `getEntries`, `getSummaryStats`, `getSemesters`, `getCategories`. Assert entries list renders on success, error banner renders on failure.
- **`app/login/page.test.tsx`:** Test login form rendering, error state display.
- **`app/admin/new/page.test.tsx`:** Mock `getOfficer`. Assert redirect when unauthenticated, form renders when authenticated.
- **`app/admin/edit/[id]/page.test.tsx`:** Mock `getOfficer` and Supabase client. Assert redirect when unauthenticated, 404 when entry not found, form renders with entry data.

### 3. Verify

```bash
npx vitest run
# Expected: test count grows from 87 to ~100+

npx tsc --noEmit
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Testing best practice:** Co-located route tests catch auth-redirect regressions, searchParams parsing bugs, and error-state rendering issues that component-level tests miss.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run
npx tsc --noEmit
```

### Manual Verification
- Verify test count in `npx vitest run` output is ≥100.

## Acceptance Criteria
- [ ] `app/page.test.tsx` exists with tests for data loading and error states.
- [ ] `app/login/page.test.tsx` exists with tests for form rendering and error display.
- [ ] `app/admin/page.test.tsx` exists with tests for auth redirect and dashboard rendering.
- [ ] `app/admin/new/page.test.tsx` exists with tests for auth redirect and form rendering.
- [ ] `app/admin/edit/[id]/page.test.tsx` exists with tests for auth redirect, 404, and form rendering.
- [ ] Each test file covers at least: (a) unauthenticated redirect, (b) successful render, (c) error state.
- [ ] `npx vitest run` passes all tests (≥100 total).
- [ ] `npx tsc --noEmit` passes with 0 errors.
