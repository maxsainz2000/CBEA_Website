# Task 70: Add Keyboard-Navigation Tests for PivotTabs

## Objective
Add test cases for ArrowRight, ArrowLeft (with wrap), Home, and End keyboard navigation in `PivotTabs.test.tsx`. The `handleKeyDown` logic (the riskiest code in the component) is currently untested.

## Audit Reference
- **Findings:** Y25 (LOW, -0.5 pts)
- **Severity:** LOW (untested keyboard navigation — the most complex logic in the component)
- **Current grade impact:** +0.5 points.
- **Source:** AUDIT-v5 §6 finding Y25, §11 P2-12 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/components/PivotTabs.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.test.tsx) — add keyboard-nav tests

## Step-by-Step Instructions

### 1. Add keyboard navigation tests

```typescript
import { fireEvent } from '@testing-library/react';

it('moves focus to next tab on ArrowRight', () => {
  const tabs = ['Tab 1', 'Tab 2', 'Tab 3'];
  const onTabChange = vi.fn();
  render(<PivotTabs tabs={tabs} activeTab="Tab 1" onTabChange={onTabChange} />);

  const tab1 = screen.getByTestId('pivot-tab-Tab 1');
  tab1.focus();
  fireEvent.keyDown(tab1, { key: 'ArrowRight' });

  expect(screen.getByTestId('pivot-tab-Tab 2')).toHaveFocus();
});

it('wraps focus to first tab on ArrowRight from last tab', () => {
  // ...
});

it('wraps focus to last tab on ArrowLeft from first tab', () => {
  // ...
});

it('moves focus to first tab on Home', () => {
  // ...
});

it('moves focus to last tab on End', () => {
  // ...
});
```

### 2. Verify

```bash
npx vitest run app/components/PivotTabs.test.tsx
```

## Acceptance Criteria
- [ ] Tests cover ArrowRight, ArrowLeft (with wrap), Home, and End keys.
- [ ] Tests verify focus moves to the correct tab element.
- [ ] `npx vitest run app/components/PivotTabs.test.tsx` passes.
