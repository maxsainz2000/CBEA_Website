# Task 58: Add role="alert" to Error Divs

## Objective
Add `role="alert"` to the error display divs in `app/login/page.tsx`, `app/admin/components/EntryForm.tsx`, and `app/admin/components/EntryTable.tsx` so screen readers announce errors when they appear. The existing `ErrorBanner.tsx` component already uses `role="alert"` — these 3 files are inconsistent.

## Audit Reference
- **Findings:** Y17 (LOW, -0.5 pts), Y18 (LOW, -0.5 pts)
- **Severity:** LOW (accessibility inconsistency — error divs not announced by screen readers)
- **Current grade impact:** +1 point total.
- **Source:** AUDIT-v5 §6 findings Y17 and Y18, §10 P1-8 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx) — add `role="alert"` to error div
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — add `role="alert"` to server error div
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx) — add `role="alert"` to server error div

## Step-by-Step Instructions

### 1. Update `app/login/page.tsx`

```typescript
// BEFORE (app/login/page.tsx:72-79):
{error && (
  <div className="p-sm bg-error/10 border-l-4 border-error text-error font-body-sm text-body-sm select-none">
    {error}
  </div>
)}

// AFTER:
{error && (
  <div
    role="alert"
    className="p-sm bg-error/10 border-l-4 border-error text-error font-body-sm text-body-sm select-none"
  >
    {error}
  </div>
)}
```

### 2. Update `app/admin/components/EntryForm.tsx`

```typescript
// BEFORE (app/admin/components/EntryForm.tsx:117-121):
{serverError && (
  <div className="...">
    {serverError}
  </div>
)}

// AFTER:
{serverError && (
  <div role="alert" className="...">
    {serverError}
  </div>
)}
```

### 3. Update `app/admin/components/EntryTable.tsx`

```typescript
// BEFORE (app/admin/components/EntryTable.tsx:33-37):
{error && (
  <div className="...">
    {error}
  </div>
)}

// AFTER:
{error && (
  <div role="alert" className="...">
    {error}
  </div>
)}
```

### 4. Verify

```bash
grep -rn 'role="alert"' app/login/page.tsx app/admin/components/EntryForm.tsx app/admin/components/EntryTable.tsx
# Expected: at least 3 hits

npx vitest run
npx tsc --noEmit
```

## Metro Design Compliance & Best Coding Practices
- This task does not change any visual styling. No design-system impact.
- **Accessibility best practice:** `role="alert"` ensures screen readers announce the error content when the element appears in the DOM. This is the standard WAI-ARIA pattern for inline error messages.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -rn 'role="alert"' app/login/page.tsx app/admin/components/EntryForm.tsx app/admin/components/EntryTable.tsx
# Expected: at least 3 hits

npx vitest run
npx tsc --noEmit
```

### Manual Verification
- Use a screen reader (VoiceOver, NVDA, or browser DevTools accessibility tree).
- Trigger a login error — screen reader should announce the error message.
- Trigger a server error on the entry form — screen reader should announce it.

## Acceptance Criteria
- [x] `app/login/page.tsx` error div has `role="alert"`.
- [x] `app/admin/components/EntryForm.tsx` server error div has `role="alert"`.
- [x] `app/admin/components/EntryTable.tsx` error div has `role="alert"`.
- [x] All 3 are consistent with `ErrorBanner.tsx`'s existing `role="alert"`.
- [x] `npx vitest run` passes all tests.
- [x] `npx tsc --noEmit` passes with 0 errors.
