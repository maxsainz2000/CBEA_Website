# Task 63: Add role="radiogroup" to Type Toggle

## Objective
Wrap the Income/Expense toggle buttons in `<fieldset role="radiogroup">` with `<legend>` and add `role="radio"` + `aria-checked` attributes to each button. Screen readers currently announce them as generic buttons with no indication they are a mutually-exclusive choice.

## Audit Reference
- **Findings:** Y19 (LOW, -0.5 pts)
- **Severity:** LOW (accessibility — toggle not announced as mutually-exclusive choice)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v5 §6 finding Y19, §11 P2-5 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx) — wrap toggle in fieldset/radiogroup
- [MODIFY] [app/admin/components/EntryForm.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.test.tsx) — assert aria-checked toggles

## Step-by-Step Instructions

### 1. Update `EntryForm.tsx`

```typescript
// BEFORE:
<span className="...">Transaction Type</span>
<div className="grid grid-cols-2 gap-0 border border-outline h-12">
  <button type="button" onClick={() => handleTypeChange('income')} ...>INCOME</button>
  <button type="button" onClick={() => handleTypeChange('expense')} ...>EXPENSE</button>
</div>

// AFTER:
<fieldset role="radiogroup" aria-label="Transaction Type" className="border-0 p-0 m-0">
  <legend className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
    Transaction Type
  </legend>
  <div className="grid grid-cols-2 gap-0 border border-outline h-12">
    <button
      type="button"
      role="radio"
      aria-checked={formData.type === 'income'}
      onClick={() => handleTypeChange('income')}
      ...
    >
      INCOME
    </button>
    <button
      type="button"
      role="radio"
      aria-checked={formData.type === 'expense'}
      onClick={() => handleTypeChange('expense')}
      ...
    >
      EXPENSE
    </button>
  </div>
</fieldset>
```

### 2. Add test for aria-checked

```typescript
it('toggles aria-checked on type buttons', () => {
  // Render form, assert income button has aria-checked="true"
  // Click expense button, assert expense has aria-checked="true" and income has aria-checked="false"
});
```

### 3. Verify

```bash
npx vitest run app/admin/components/EntryForm.test.tsx
npx tsc --noEmit
```

## Acceptance Criteria
- [x] Type toggle is wrapped in `<fieldset role="radiogroup">`.
- [x] Each button has `role="radio"` and `aria-checked`.
- [x] `aria-checked` toggles correctly between income and expense.
- [x] `npx vitest run app/admin/components/EntryForm.test.tsx` passes.
- [x] `npx tsc --noEmit` passes with 0 errors.
