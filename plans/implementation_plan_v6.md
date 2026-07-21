# CBEA Budget Transparency Portal — Audit Remediation Plan v6 (Session 7)

Remediate all findings from the [strict code audit v6](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v6.md) 
dated 2026-07-21. The current grade is B+ (88/100). The target grade after full remediation is A+ (98/100).

## User Review Required

> [!CAUTION]
> **Information Disclosure** — Server actions and the login/EntryForm catch blocks currently leak raw database/exception messages to clients (Z1, Z2, Z3, N5). This must be fixed before the next production deploy.

> [!WARNING]
> **Numbered task continuation.** Session 6 tasks were 48–84. This plan 
> continues with 85–111 to preserve traceability across sessions.

---

## Proposed Changes

### P0 — Block Deploy (fix BEFORE next production deploy)

#### Task 85 — Stop surfacing raw error messages to clients

Fix five call sites that return raw error messages (`dbError.message` or `err.message`) to the client, which can leak DB column names, constraint names, query fragments, and stack-trace hints.

**Files:**
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — Replace dbError/err.message with generic fallback
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Replace err.message with generic fallback
- [MODIFY] [EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — Update tests to assert safe messages
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx) — Replace err.message with generic fallback
- [MODIFY] [page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.test.tsx) — Update test assertions

**Audit findings addressed:** Z1 (MEDIUM, -1 pts), Z2 (MEDIUM, -0.5 pts), Z3 (LOW, -0.25 pts), N5 (LOW, -0.25 pts)

---

#### Task 86 — Verify Supabase public signups are disabled

Verify operationally in the Supabase Dashboard that public Auth signups are disabled.

**Files:**
- [MODIFY] [verify-signup-disabled.js](file:///c:/Users/Admin/Documents/CBEA_Website/scratch/verify-signup-disabled.js) — Run this operational script

**Audit findings addressed:** (operational)

---

### P1 — High (fix within 30 days of production launch)

#### Task 87 — Add arrow-key navigation to EntryForm radiogroup

Add keyboard navigation to the Transaction Type radiogroup per WAI-ARIA APG to ensure WCAG 2.2 AA conformance.

**Files:**
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Add onKeyDown handler
- [MODIFY] [EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — Add 4 keyboard-nav tests

**Audit findings addressed:** R1 (MEDIUM, -0.5 pts)

---

#### Task 88 — Parallelize getOfficer with getSemesters

The `getOfficer()` call takes 2 RTTs and is currently awaited sequentially before `getSemesters()`. Parallelize them with `Promise.all`.

**Files:**
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — Use Promise.all

**Audit findings addressed:** Y14 (LOW, -0.5 pts), N3 (LOW)

---

#### Task 89 — Parallelize getLastUpdatedDate with main Promise.all

`getLastUpdatedDate` is awaited sequentially after the main `Promise.all`. It's independent, so it should be parallelized.

**Files:**
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — Add to Promise.all
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx) — Add to Promise.all

**Audit findings addressed:** Z5 (LOW, -0.5 pts)

---

#### Task 90 — Fix ESLint error in database.test.ts

Remove the `as any` cast that triggers an ESLint warning and replace it with a typed interface.

**Files:**
- [MODIFY] [database.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/database.test.ts) — Define SummaryStatsRow interface

**Audit findings addressed:** Z7 (LOW, -0.25 pts)

---

#### Task 91 — Replace as BudgetEntry casts with Zod parse

Remove `as BudgetEntry[]` and `as BudgetEntry | null` unchecked casts in `lib/data/entries.ts` and use `BudgetEntryRecordSchema.safeParse`.

**Files:**
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — Use Zod validation

**Audit findings addressed:** N2 (LOW, -0.25 pts)

---

#### Task 92 — Switch ErrorBanner to role="status"

Change `role="alert"` to `role="status"` on `ErrorBanner` since alerts present at initial page load are not announced by screen readers.

**Files:**
- [MODIFY] [ErrorBanner.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/ErrorBanner.tsx) — Change role
- [MODIFY] [BudgetEntryList.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.test.tsx) — Update related tests if applicable

**Audit findings addressed:** R2 (LOW, -0.25 pts)

---

#### Task 93 — Replace listUsers with getUserByEmail

The `listUsers()` API in global-setup is unpaginated. Replace it with `getUserByEmail()` to safely support projects with >1000 users.

**Files:**
- [MODIFY] [global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts) — Use getUserByEmail

**Audit findings addressed:** Y30 (LOW, -0.25 pts), R6 (LOW)

---

#### Task 94 — Fix as any cast in supabase.test.ts

Type the mock calls precisely instead of using `as any` when extracting `cookiesObj`.

**Files:**
- [MODIFY] [supabase.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/supabase.test.ts) — Use MockServerClientOptions interface

**Audit findings addressed:** Y29 (LOW, -0.25 pts)

---

#### Task 95 — Delete duplicate accent-lime token

Remove the duplicate `--color-accent-lime` token from the production theme.css.

**Files:**
- [MODIFY] [theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css) — Delete --color-accent-lime

**Audit findings addressed:** N1 (LOW, -0.25 pts), Y20 (LOW)

---

#### Task 96 — Expand log.ts sanitize redaction list

Add extra keys (like authorization, email, apikey) to the `SENSITIVE_KEYS` redaction list in the logger.

**Files:**
- [MODIFY] [log.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/log.ts) — Add keys to set

**Audit findings addressed:** N4 (LOW, -0.25 pts)

---

#### Task 97 — Replace opacity tints with pure colors

Replace `bg-surface/50` and `hover:bg-outline/50` with full opacity colors to adhere strictly to the Metro design system.

**Files:**
- [MODIFY] [EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) — Use bg-surface
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Use hover:bg-outline

**Audit findings addressed:** N6 (LOW, -0.25 pts), Z6 (LOW, -0.25 pts)

---

#### Task 98 — Update revalidateTag comments

Update comments in server actions to reflect the 2026 `revalidateTag` API (single-arg is deprecated).

**Files:**
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — Update comments

**Audit findings addressed:** R3 (LOW, -0.25 pts)

---

#### Task 99 — Fix min="0" on amount input

Change the HTML input constraint from `min="0"` to `min="0.01"` to match the Zod validation schema.

**Files:**
- [MODIFY] [EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — Change min to "0.01"

**Audit findings addressed:** Z4 (LOW, -0.25 pts)

---

#### Task 100 — Update DESIGN.md to reflect cleanup

Update the design system documentation to clarify that the 9 alternate accent tokens are not used in production.

**Files:**
- [MODIFY] [DESIGN.md](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/DESIGN.md) — Update documentation

**Audit findings addressed:** N7 (LOW, -0.25 pts)

---

#### Task 101 — Rename NEXT_PUBLIC_SUPABASE_ANON_KEY

Rename `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in environment variables and code.

**Files:**
- [MODIFY] [.env.example](file:///c:/Users/Admin/Documents/CBEA_Website/.env.example) — Rename variable
- [MODIFY] [client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts) — Use new variable name
- [MODIFY] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts) — Use new variable name
- [MODIFY] [server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts) — Use new variable name
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md) — Update references

**Audit findings addressed:** R4 (LOW, -0.25 pts)

---

### P2 — Medium (fix in v1.1+)

#### Task 102 — Add no-floating-promises ESLint rule

Add `@typescript-eslint/no-floating-promises: 'error'` to `eslint.config.mjs` to catch unawaited promises.

**Files:**
- [MODIFY] [eslint.config.mjs](file:///c:/Users/Admin/Documents/CBEA_Website/eslint.config.mjs) — Add rule

**Audit findings addressed:** R8 (INFO)

---

#### Task 103 — Add SECURITY INVOKER to update_modified_column

Add `SECURITY INVOKER` explicitly to the `update_modified_column()` SQL function for symmetry with `get_summary_stats()`.

**Files:**
- [MODIFY] [migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql) — Add SECURITY INVOKER

**Audit findings addressed:** R7 (INFO)

---

#### Task 104 — Surface isPending in AdminSemesterSelector

Render a loading indicator during semester switch when `isPending` is true.

**Files:**
- [MODIFY] [AdminSemesterSelector.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminSemesterSelector.tsx) — Surface isPending

**Audit findings addressed:** N12 (INFO, -0.25 pts)

---

#### Task 105 — Export HomepageContent as named export

Export `HomepageContent` as a named export from `app/page.tsx` and test it directly to avoid fragile JSX tree traversal.

**Files:**
- [MODIFY] [page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — Add named export
- [MODIFY] [page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.test.tsx) — Update test

**Audit findings addressed:** Z8 (LOW, -0.25 pts)

---

#### Task 106 — Use container option in layout test

Use `container: document.documentElement` in `layout.test.tsx` to fix JSDOM hydration warnings.

**Files:**
- [MODIFY] [layout.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.test.tsx) — Add container option

**Audit findings addressed:** Z9 (LOW, -0.25 pts)

---

#### Task 107 — Add Zod validation to getLastUpdatedDate return

Validate the returned `updated_at` value with a Zod schema in `getLastUpdatedDate`.

**Files:**
- [MODIFY] [entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — Add LastUpdatedSchema

**Audit findings addressed:** Z10 (LOW, -0.25 pts)

---

#### Task 108 — Extract copyCookies helper in middleware

Extract the duplicated cookie-copy logic in `middleware.ts` into a `copyCookies` helper function.

**Files:**
- [MODIFY] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts) — Extract helper

**Audit findings addressed:** Z12 (INFO)

---

#### Task 109 — Update global-setup.ts to check .single() error

Ensure the `.single()` query in `tests/global-setup.ts` correctly handles errors other than "no rows".

**Files:**
- [MODIFY] [global-setup.ts](file:///c:/Users/Admin/Documents/CBEA_Website/tests/global-setup.ts) — Check profileError

**Audit findings addressed:** N10 (INFO)

---

#### Task 110 — Remove cursor-pointer when no onEntryClick

Remove the `cursor-pointer` utility from `BudgetEntryList` rows when `onEntryClick` is not provided.

**Files:**
- [MODIFY] [BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx) — Make cursor-pointer conditional

**Audit findings addressed:** N9 (LOW, -0.25 pts)

---

### P3 — Low / Tech Debt (fix in v1.2+, polish)

| ID | Finding | File:Line | Fix | Effort |
|---|---|---|---|---|
| P3-1 | N8 | `app/theme.css:15-24` | Document as canonical full reference | S |
| P3-2 | N11 | `lib/auth/session.ts:27` | Replace narrowing cast with explicit `as string` + post-check | XS |
| P3-3 | Z11 | `app/page.test.tsx` | Wrap render in `await act(async () => ...)` or split tests | S |

#### Task 111 — Various cosmetic/tech debt fixes

Resolve the remaining P3 items grouped together in one task.

**Files:**
- [MODIFY] [theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/app/theme.css)
- [MODIFY] [session.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/auth/session.ts)
- [MODIFY] [page.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.test.tsx)

**Audit findings addressed:** N8, N11, Z11

---

### Monitor Only (no code change)

#### N15 — 2 moderate CVEs in transitive postcss (carryover)
`npm audit` flags vulnerabilities in `postcss` bundled within Next.js. Monitor until Next.js updates. No action required.

---

## Verification Plan

### Automated Tests
```bash
npx tsc --noEmit
npx eslint
npx vitest run
npm run build
```

---

## Grade Projection

| Fix Group | Points Gained | Running Total |
|---|---|---|
| Baseline | — | 88/100 |
| + P0 | + 2.00 | 90/100 |
| + P1 | + 4.50 | 94.5/100 |
| + P2 | + 1.50 | 96/100 |
| + P3 | + 2.00 | 98/100 |

---

## Suggested Implementation Order

**Sprint 1:** Tasks 85-86
**Sprint 2:** Tasks 87-101
**Sprint 3:** Tasks 102-111

---

## Cross-reference

| Document | Purpose |
|---|---|
| [AUDIT-v6.md](file:///c:/Users/Admin/Documents/CBEA_Website/documentations/AUDIT-v6.md) | Source audit |
| [implementation_plan_v5.md](file:///c:/Users/Admin/Documents/CBEA_Website/plans/implementation_plan_v5.md) | Previous plan |
