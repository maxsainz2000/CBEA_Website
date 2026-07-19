# Task 42: Document `rounded-full` Spinner Exception

## Objective
Document the `rounded-full` exception (circular spinners and loading indicators) in both `README.md` and `cbea-metro-design/cbea-package/DESIGN.md` to resolve the apparent contradiction with the Metro "zero corner radius" rule. The design tokens define `--radius-full: 9999px` which is used by 2 spinner/loading elements — this is intentional but undocumented.

## Audit Reference
- **Findings:** X8 (LOW, -0.25 pts)
- **Severity:** LOW (design-system inconsistency — undocumented exception to zero-radius rule)
- **Current grade impact:** +0.25 points.
- **Source:** AUDIT-v4 §5 finding X8, §8.8 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [README.md](file:///c:/Users/Admin/Documents/CBEA_Website/README.md)
- [MODIFY] [cbea-metro-design/cbea-package/DESIGN.md](file:///c:/Users/Admin/Documents/CBEA_Website/cbea-metro-design/cbea-package/DESIGN.md)

## Step-by-Step Instructions

### 1. Update the design system section in README.md

Find the design system description and add the spinner exception:

```markdown
- Zero shadows, zero gradients, zero corner radius
- **Exception:** circular spinners and loading indicators use `rounded-full` (defined as `--radius-full: 9999px` in `app/theme.css`) — this is the only allowed deviation from the zero-radius rule.
```

### 2. Update DESIGN.md with the same exception note

Add a similar note to the design package documentation.

### 3. Verify

```bash
grep -A1 'rounded-full' README.md
# Should show the documented exception
```

## Metro Design Compliance & Best Coding Practices
- This task explicitly addresses the design-system inconsistency by documenting it. The `rounded-full` exception for spinners is a universally understood UI pattern — a non-circular spinner would confuse users.
- **Documentation:** The best solution for an intentional exception is to document it, not to force-fit a less recognizable pattern.

## Automated Testing & Verification Plan

### Automated Tests
No code changes — documentation only.

### Manual Verification
- Open `README.md` and verify the spinner exception is documented.
- Open `DESIGN.md` and verify the same.

## Acceptance Criteria
- [ ] `README.md` documents the `rounded-full` spinner exception.
- [ ] `cbea-metro-design/cbea-package/DESIGN.md` documents the same exception.
