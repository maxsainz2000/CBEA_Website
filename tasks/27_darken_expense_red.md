# Task 27: Darken Expense Red for WCAG AA Buffer

## Objective
Darken the expense red token from `#E51400` to `#C81000` to improve the WCAG AA contrast buffer. The AUDIT-v3 independently calculated the contrast ratio of `#E51400` on white as **4.74:1** — only 0.24 above the WCAG AA 4.5:1 threshold. The prior AUDIT-v2 claimed 5.25:1, which was inaccurate. While `#E51400` technically passes AA, the thin margin means anti-aliasing, subpixel rendering, or slight background variations could push it below threshold. Darkening to `#C81000` yields a **5.83:1** ratio — a comfortable 1.33 buffer above AA.

## Audit Reference
- **Findings:** N14 (LOW)
- **Severity:** LOW (passes AA, but by a thin margin)
- **Current grade impact:** +0 points (already passes AA — this is a quality improvement, not a grade-changing fix).
- **Sources:**
  - [W3C WCAG 2.2 contrast-minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) — 4.5:1 for AA normal text.
  - [WebAIM contrast checker](https://webaim.org/resources/contrastchecker) — for verification.
  - AUDIT-v3 §7 N14 — full calculation and recommendation.

## Files Created / Modified
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)

## Step-by-Step Instructions

### 1. Update the color tokens in `app/theme.css`

Find the three color tokens that reference `#e51400`:

```css
/* Current (REPLACE): */
--color-expense: #e51400;
--color-error: #e51400;
--color-accent-red: #e51400;
```

Replace with the darker shade:

```css
/* New: */
--color-expense: #c81000;      /* was #e51400 — contrast ratio 5.83:1 on white (AA buffer +1.33) */
--color-error: #c81000;        /* was #e51400 — keep in sync with expense */
--color-accent-red: #c81000;   /* was #e51400 — keep in sync (alternate accent) */
```

**Key design decisions:**
- All three tokens (`expense`, `error`, `accent-red`) are kept in sync to maintain color consistency.
- The Metro design system (Windows Phone 7) originally used `#E51400` as a signature red. `#C81000` is a slightly darker shade that still reads as "Metro red" but provides a safer WCAG AA buffer.
- The darkening is subtle — from RGB(229, 20, 0) to RGB(200, 16, 0). Most users will not notice the difference.

### 2. Verify the contrast ratio

Use the [WebAIM contrast checker](https://webaim.org/resources/contrastchecker):
- **Foreground:** `#C81000`
- **Background:** `#FFFFFF`
- **Expected ratio:** ~5.83:1

Verify it passes:
- WCAG AA (normal text): 4.5:1 — ✅ PASS (buffer: 1.33)
- WCAG AA (large text): 3:1 — ✅ PASS (buffer: 2.83)
- WCAG AAA (normal text): 7:1 — ❌ FAIL (still below AAA)
- WCAG AAA (large text): 4.5:1 — ✅ PASS (buffer: 1.33)

### 3. Visual review

Start the dev server and visually verify the expense red in the following contexts:
- **Public homepage:** Expense entry indicators (the "Expense" type label)
- **Public homepage:** Negative balance in `SummaryStats` (if expenses exceed income)
- **Admin dashboard:** Expense entries in `EntryTable`
- **Admin dashboard:** Delete button (`.btn-ghost-danger` uses `--color-error`)
- **Admin dashboard:** Server validation error messages

The color should still be clearly "red" and identifiable as an expense/error indicator, but slightly darker and more readable.

## Metro Design Compliance & Best Coding Practices
- **Design-system deviation:** This is a minor deviation from the original Metro `#E51400` signature red. The design system spec in `cbea-metro-design/cbea-package/DESIGN.md` documents the original color. After this change, `app/theme.css` will diverge from the design package on these 3 tokens. Consider updating the design package to match.
- **WCAG compliance:** The project already passes WCAG AA for all color tokens. This change widens the safety margin on the expense red from 0.24 to 1.33, which is a meaningful improvement for accessibility robustness.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Build (should succeed — no functional changes):
npm run build

# Unit tests (should pass — no component logic changed):
npx vitest run

# Type check:
npx tsc --noEmit
```

### Contrast Verification
- Use [WebAIM contrast checker](https://webaim.org/resources/contrastchecker) with `#C81000` on `#FFFFFF`.
- Expected ratio: ~5.83:1 (AA PASS with 1.33 buffer).

### Visual Verification
- Start `npm run dev` and inspect the following pages:
  - `/` — expense entries, negative totals
  - `/admin` — entry table, delete buttons, error messages
  - `/admin/new` — validation error text
- Verify the red still reads as "Metro red" — not too dark, not too muted.

## Acceptance Criteria
- [ ] `app/theme.css` has `--color-expense`, `--color-error`, and `--color-accent-red` set to `#c81000`.
- [ ] WebAIM contrast checker confirms the new ratio is ≥ 5.5:1 for `#C81000` on `#FFFFFF`.
- [ ] Visual review: the expense red still reads as "Metro red" — clearly identifiable as red.
- [ ] `npm run build` succeeds.
- [ ] `npx vitest run` passes.
