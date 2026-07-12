# Task 12: Fix Design System Violations

## Objective
Fix all 6 design-system violations identified in the audit §5.1 table. These are real Metro compliance bugs where components diverge from the rules in DESIGN.md.

## Audit Reference
- **Findings:** P2-1 (header padding), P2-2 (active tab underline), P2-3 (headline font weight), P2-4 (form card border), P2-9 (delete button color + touch target)
- **Severity:** Design compliance
- **DESIGN.md rules violated:**
  - "24px margin on desktop / 16px on mobile"
  - "No underline indicator — the color change is the indicator, per Content Before Chrome"
  - "Use Light weights at large sizes (32px+)"
  - "Borders… never for card outlines"
  - "Don't mix semantic colors with interactive colors on the same element"
  - "Touch targets ≥ 48px"

## Files Created / Modified
- [MODIFY] [app/components/Header.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/Header.tsx)
- [MODIFY] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx)
- [MODIFY] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx)
- [MODIFY] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)
- [MODIFY] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx)
- [MODIFY] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/%5Bid%5D/page.tsx)
- [MODIFY] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx)
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)
- [MODIFY] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)

## Step-by-Step Instructions

### 1. Fix reversed header padding — `Header.tsx:12`

**DESIGN.md:** "24px margin on desktop / 16px on mobile."
**Bug:** `px-margin md:px-margin-mobile` → mobile gets 24px (wrong), desktop gets 16px (wrong).

```tsx
// Current:
<header className="w-full h-12 ... px-margin md:px-margin-mobile">

// Fix (swap — mobile-first Tailwind: base = mobile, md: = desktop):
<header className="w-full h-12 ... px-margin-mobile md:px-margin">
```

### 2. Remove active-tab underline — `PivotTabs.tsx:112`

**DESIGN.md:** "No underline indicator — the color change is the indicator, per Content Before Chrome."

```tsx
// Current:
className={`pivot-tab focus:outline-none ${isActive ? 'pivot-tab-active font-bold border-b-2 border-primary' : ''}`}

// Fix:
className={`pivot-tab focus:outline-none ${isActive ? 'pivot-tab-active' : ''}`}
```

Note: The `.pivot-tab-active` class in `theme.css` already handles the active state styling (background color change). The `font-bold` and `border-b-2 border-primary` are redundant and violate the spec.

### 3. Fix headline font-weight — Multiple files

**DESIGN.md:** "Use Light weights at large sizes (32px+)."
**Bug:** `font-weight-headline-display` is not a real Tailwind v4 utility. Tailwind v4 does not auto-generate `font-weight-*` utilities from `--font-weight-*` theme variables. Headlines render at 400 (Regular) instead of 300 (Light).

**Fix:** Use Tailwind's built-in weight utility `font-light` (300) instead:

Apply to all files that use `font-weight-headline-display`:
- `app/page.tsx:93`
- `app/admin/page.tsx:63`
- `app/admin/new/page.tsx:33`
- `app/admin/edit/[id]/page.tsx:52`
- `app/login/page.tsx:76`

```tsx
// Current:
className="font-headline-display text-headline-display font-weight-headline-display ..."

// Fix:
className="font-headline-display text-headline-display font-light ..."
```

Similarly, for any elements using `font-weight-headline-lg`, `font-weight-headline-md`, etc., replace with:
- Display/display-xl sizes (32px+): `font-light` (300)
- Headline/strong sizes: `font-semibold` (600)

### 4. Remove EntryForm card border — `EntryForm.tsx:115`

**DESIGN.md:** "Borders, where they appear, are 1px solid `colors.outline` — used for table row separators and input focus underlines, never for card outlines."

```tsx
// Current:
<form ... className="flex flex-col gap-lg bg-surface p-lg border border-outline w-full min-w-[300px] max-w-xl mx-auto" ...>

// Fix (remove border, keep bg-surface for tonal separation):
<form ... className="flex flex-col gap-lg bg-surface p-lg w-full min-w-[300px] max-w-xl mx-auto" ...>
```

### 5. Fix delete button color and touch target — `EntryTable.tsx:148`

**DESIGN.md:** "Don't mix semantic colors with interactive colors on the same element." And: "Touch targets ≥ 48px."

**Part A — Add `.btn-ghost-danger` to `theme.css`:**

```css
/* In app/theme.css, after .btn-ghost: */
.btn-ghost-danger {
  background: transparent;
  color: var(--color-expense);
  font-family: var(--font-body-sm-strong);
  font-weight: var(--font-weight-body-sm-strong);
  border: 0;
  border-radius: 0;
  height: var(--spacing-touch-target);
  padding: 0 var(--spacing-md);
  cursor: pointer;
}
```

**Part B — Update delete button in `EntryTable.tsx`:**

```tsx
// Current:
className="btn-ghost flex items-center justify-center cursor-pointer text-body-sm h-10 px-sm select-none text-expense!"

// Fix:
className="btn-ghost-danger flex items-center justify-center text-body-sm h-12 px-sm select-none"
```

**Part C — Bump all inline action buttons to 48px touch targets:**

Change `h-10` (40px) to `h-12` (48px) on the Delete, Confirm, and Cancel buttons at lines ~118, 127, 138, 148.

## Metro Design Compliance & Best Coding Practices
- **Zero shadows, zero gradients, zero corner radius** — no changes needed; these are already correct.
- **Content Before Chrome** — removing the active-tab underline reinforces this principle.
- **Tabular numerals** — not affected by these changes.
- **Print styles** — not affected by these changes.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Existing component tests should still pass:
npx vitest run app/components/PivotTabs.test.tsx
npx vitest run app/components/SummaryStats.test.tsx

# Full suite:
npx vitest run
npx playwright test
```

### Manual Verification
- Open the homepage in the browser. Verify:
  - Headline renders at font-weight 300 (Light) — check in DevTools Computed panel.
  - Header padding is 16px on mobile viewport, 24px on `md` (768px+) viewport.
- Open the admin page. Verify:
  - EntryForm has no border (just `bg-surface` tonal fill).
  - Delete button is red text (not Lime), and the button height is 48px.
  - Active pivot tab has no bottom border — only the background/text color change.

## Acceptance Criteria
- [x] Header padding: 16px on mobile, 24px on desktop (inspect with DevTools).
- [x] Active pivot tab has no `border-b-2` — only color change indicates active state.
- [x] All headlines at 32px+ render at `font-weight: 300` (Light).
- [x] EntryForm has no `border border-outline` class.
- [x] Delete button uses `.btn-ghost-danger` (not `.btn-ghost` + `text-expense!`).
- [x] All inline action buttons (Delete, Confirm, Cancel) have `h-12` (48px touch target).
- [x] `npx vitest run` passes (component tests unbroken).
- [x] `npx playwright test` passes.
