# Task 83: Document --color-income Green as Permitted Semantic Color

## Objective
Document `--color-income` (`#2d7a2d` green) as a permitted semantic color deviation from the single-Lime-accent Metro rule in both `README.md` and `cbea-metro-design/cbea-package/DESIGN.md`. Income green serves a data-communication purpose (income vs expense distinction) that Lime alone cannot fulfill.

## Audit Reference
- **Findings:** Y21 (LOW)
- **Source:** AUDIT-v5 §6 finding Y21, §12 P3-17.

## Files Created / Modified
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md) — document green as permitted semantic color
- [MODIFY] [cbea-metro-design/cbea-package/DESIGN.md](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/DESIGN.md) — document green as permitted semantic color

## Step-by-Step Instructions

### 1. Add to design system documentation

Add a "Permitted deviations" section (or extend the existing `rounded-full` exception section):

```markdown
### Permitted Deviations from Strict Metro

1. **`rounded-full`** for circular spinners and loading indicators (documented in Task 42).
2. **`--color-income` green (`#2d7a2d`)** for income entries. Serves a semantic data-communication purpose: income (green) vs expense (red `#c81000`). Using Lime for both the primary accent and income would create ambiguity between interactive elements and data categories.
```

### 2. Verify

```bash
grep 'color-income' README.md
# Should have documentation hit

npm run build
```

## Acceptance Criteria
- [ ] `README.md` documents `--color-income` green as a permitted semantic deviation.
- [ ] `DESIGN.md` documents the same.
- [ ] `npm run build` succeeds.
