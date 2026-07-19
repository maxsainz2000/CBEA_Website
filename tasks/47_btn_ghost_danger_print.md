# Task 47: Add `.btn-ghost-danger` to Print Styles

## Objective
Add `.btn-ghost-danger` to the `@media print` `display: none` list in `app/theme.css`. Currently, the print styles hide `.btn-primary`, `.btn-ghost`, and `.btn-danger` — but NOT `.btn-ghost-danger` (the Delete button class, added in Task 12). If an officer prints the admin dashboard, the Delete buttons would remain visible on the printout. Also back-port this change to `cbea-metro-design/cbea-package/app/theme.css` to maintain design-package parity.

## Audit Reference
- **Findings:** X18 (LOW, -0.25 pts)
- **Severity:** LOW (design-system inconsistency — missing class in print-styles)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X18, §8.18 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)
- [MODIFY] [cbea-metro-design/cbea-package/app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/app/theme.css)

## Step-by-Step Instructions

### 1. Update the print-styles in `app/theme.css`

Find the `@media print` block (approximately line 342–349) and add `.btn-ghost-danger` to the `display: none` list:

```css
/* BEFORE (line 345): */
.btn-primary, .btn-ghost, .btn-danger,
.pivot-tab, .status-badge { display: none !important; }

/* AFTER: */
.btn-primary, .btn-ghost, .btn-ghost-danger, .btn-danger,
.pivot-tab, .status-badge { display: none !important; }
```

### 2. Apply the same change to the design package

Make the identical edit in `cbea-metro-design/cbea-package/app/theme.css` to maintain parity between the app theme and the design package source.

### 3. Verify

```bash
grep 'btn-ghost-danger' app/theme.css
# Should show 2 hits: the class definition (~line 262) + the print-styles rule (~line 345)

grep 'btn-ghost-danger' cbea-metro-design/cbea-package/app/theme.css
# Should also show the class in the print-styles rule
```

## Metro Design Compliance & Best Coding Practices
- **Print-styles consistency:** All interactive button variants should be hidden in print. The `.btn-ghost-danger` class was added in Task 12 but the print-styles were not updated to include it — this closes that gap.
- **Design-package parity:** The README warns "Don't edit `app/theme.css` directly — your changes will be lost on the next export." Back-porting to the design package ensures the change survives a re-export.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# No functional code changes. Verify with grep:
grep 'btn-ghost-danger' app/theme.css
# Should show 2 hits

# Build to verify no CSS syntax errors:
npm run build
```

### Manual Verification
- Open the admin dashboard in a browser.
- Use the browser's Print Preview (Ctrl+P / Cmd+P).
- Verify that Delete buttons are NOT visible in the print preview.

## Acceptance Criteria
- [ ] `app/theme.css` `@media print` block includes `.btn-ghost-danger` in the `display: none` list.
- [ ] `cbea-metro-design/cbea-package/app/theme.css` has the same change.
- [ ] `npm run build` succeeds (no CSS syntax errors).
- [ ] Delete buttons are hidden in print preview.
