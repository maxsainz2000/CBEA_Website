# Task 16: Performance Optimization

## Objective
Replace `force-dynamic` with ISR (Incremental Static Regeneration) on the public homepage to enable CDN caching, and document the optimization path for semester/category queries.

## Audit Reference
- **Findings:** P3-5 (SELECT DISTINCT for semesters/categories), P3-6 (ISR instead of force-dynamic)
- **Severity:** Polish / Performance
- **Context:**
  - The homepage sets `export const dynamic = 'force-dynamic'` to read `searchParams`. This disables static optimization — every visit hits Supabase. For a low-traffic council portal this is acceptable, but CDN caching would improve load times and reduce Supabase usage.
  - `getCategories` and `getSemesters` fetch all rows then dedupe client-side. For <100 entries this is fine, but the path to optimization should be documented.

## Files Created / Modified
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts)

## Step-by-Step Instructions

### 1. Replace `force-dynamic` with ISR — `app/page.tsx`

```ts
// Current (line 9):
export const dynamic = 'force-dynamic';

// Fix — ISR with 60-second revalidation:
export const revalidate = 60;
```

**How this works:**
- Vercel (or any Next.js host) caches the rendered HTML for 60 seconds at the CDN edge.
- After 60 seconds, the next request triggers a background re-render. The stale page is served immediately while the fresh page is generated.
- The `revalidatePath('/')` calls in server actions (`createEntry`, `updateEntry`, `deleteEntry`) bust the cache immediately after a mutation, so the public page always reflects the latest data within seconds of an admin change.

**Important:** `searchParams` are still available in the page component. ISR with `searchParams` means each unique combination of query params gets its own cached version. For a portal with ~4 semesters × ~5 categories, this is a small number of cached pages.

### 2. Document the semester/category query optimization — `lib/data/entries.ts`

The current `getSemesters()` and `getCategories()` functions fetch all `budget_entries` rows and dedupe client-side with `Array.from(new Set(...))`. For <100 entries, this is fine.

Add a code comment documenting the optimization path for when the entry count grows:

```ts
/**
 * Returns distinct semesters from budget_entries.
 *
 * NOTE: Currently fetches all rows and dedupes client-side. This is
 * acceptable for <1k entries. For larger datasets, consider:
 * - Creating a Postgres view: CREATE VIEW distinct_semesters AS
 *   SELECT DISTINCT semester FROM budget_entries ORDER BY semester;
 * - Or using an RPC: supabase.rpc('get_distinct_semesters')
 * - The Supabase JS client does not support SELECT DISTINCT directly.
 */
export async function getSemesters(): Promise<string[]> {
  // ... existing implementation
}
```

Do NOT change the actual query logic — the current approach is correct for the project's scale. Only add the documentation.

### 3. (Optional) Consider removing `SummaryStats` `'use client'` directive

The audit notes that `SummaryStats.tsx` is marked `'use client'` only because it uses `useEffect` to format the current date. If the date is passed as a prop from the server component (`app/page.tsx`), `SummaryStats` could become a server component, eliminating client hydration for the stat card grid.

This is a minor optimization. If pursued:

```tsx
// In app/page.tsx (server component):
const asOfDate = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila'
});

<SummaryStats stats={stats} asOfDate={asOfDate} />

// In SummaryStats.tsx — remove 'use client', remove useEffect, use asOfDate prop directly
```

## Metro Design Compliance & Best Coding Practices
- No visual changes in this task.
- **Performance best practice:** ISR gives the best of both worlds — fresh data after mutations (via `revalidatePath`) and fast CDN-cached responses for repeat visitors.
- **YAGNI:** Don't optimize the semester/category queries until there's actual performance data showing a problem. Document the path instead.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# All tests should still pass:
npx vitest run
npx playwright test

# Build should succeed:
npm run build
```

### Manual Verification
- After `npm run build`, check the build output:
  - The `/` route should show `ISR` or `revalidate: 60` instead of `dynamic`.
- Start the production build (`npm start`) and verify:
  - First request to `/` takes ~1s (cold render).
  - Second request within 60s is near-instant (cached).
  - After creating an entry via `/admin/new`, the homepage reflects the new entry immediately (cache busted by `revalidatePath`).

## Acceptance Criteria
- [ ] `app/page.tsx` uses `export const revalidate = 60` instead of `export const dynamic = 'force-dynamic'`.
- [x] `lib/data/entries.ts` has documentation comments on `getSemesters()` and `getCategories()` explaining the optimization path.
- [x] `npm run build` succeeds.
- [x] `npx vitest run` passes.
- [x] `npx playwright test` passes.
- [ ] The homepage loads from CDN cache on repeat visits (verify via response headers or build output).
