# Task 71: Delete Unused Accent Tokens from theme.css

## Objective
Delete 9 unused `--color-accent-*` tokens (blue, brown, magenta, purple, teal, green, red, orange, pink) from `app/theme.css:15-24`. Metro spec mandates single Lime accent. These tokens invite future design-system violations.

## Audit Reference
- **Findings:** Y20 (LOW)
- **Source:** AUDIT-v5 §6 finding Y20, §12 P3-1.

## Files Created / Modified
- [MODIFY] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css) — delete `--color-accent-*` tokens

## Step-by-Step Instructions

### 1. Delete unused accent tokens from `app/theme.css:15-24`

Remove all `--color-accent-*` custom properties except those used as semantic colors (`--color-primary`, `--color-income`, `--color-expense`).

### 2. Verify

```bash
grep 'color-accent' app/theme.css
# Should show 0 hits (or only --color-accent-lime if aliased to --color-primary)

npm run build
```

## Acceptance Criteria
- [ ] Unused `--color-accent-*` tokens are removed from `app/theme.css`.
- [ ] `--color-primary` (Lime), `--color-income`, `--color-expense` are preserved.
- [ ] `npm run build` succeeds with no CSS errors.
