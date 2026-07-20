# Task 57: Add Real Coverage to layout.test.tsx

## Objective
Replace the no-op test in `app/layout.test.tsx` (which renders `<div>Test Child</div>` and asserts "Test Child" is in the DOM) with real tests that render `<RootLayout>` and assert the `lang` attribute, body classes, and child rendering. The current test exists only to pad the test count — it provides zero coverage of `RootLayout`.

## Audit Reference
- **Findings:** Y6 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (test is a no-op — zero coverage of RootLayout)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y6, §10 P1-7 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/layout.test.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.test.tsx) — replace no-op test with real coverage

## Step-by-Step Instructions

### 1. Replace the test in `app/layout.test.tsx`

```typescript
// BEFORE (app/layout.test.tsx:1-13):
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('RootLayout', () => {
  it('renders children', () => {
    const { container } = render(<div>Test Child</div>)
    expect(container.textContent).toContain('Test Child')
  })
})

// AFTER:
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders children inside the HTML shell with correct lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <span>Test Child</span>
      </RootLayout>
    )

    expect(container.querySelector('html')?.lang).toBe('en')
    expect(container.querySelector('body')?.classList.contains('bg-background')).toBe(true)
    expect(container.querySelector('body')?.classList.contains('text-on-background')).toBe(true)
    expect(container.textContent).toContain('Test Child')
  })
})
```

Note: If `RootLayout` uses Next.js-specific APIs that don't work in Vitest/jsdom (e.g., `next/font`), you may need to mock those dependencies. Adjust the test accordingly.

### 2. Verify

```bash
npx vitest run app/layout.test.tsx
npx tsc --noEmit
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Testing best practice:** Layout tests should verify the HTML shell structure (lang, body classes, fonts) that affects every page.

## Automated Testing & Verification Plan

### Automated Tests
```bash
npx vitest run app/layout.test.tsx
npx tsc --noEmit
```

### Manual Verification
- Verify the test actually imports and renders `RootLayout`, not a plain `<div>`.

## Acceptance Criteria
- [x] `app/layout.test.tsx` imports and renders `<RootLayout>`.
- [x] Test asserts `container.querySelector('html')?.lang === 'en'`.
- [x] Test asserts body has `bg-background` and `text-on-background` classes.
- [x] Test asserts children are rendered inside `<body>`.
- [x] `npx vitest run app/layout.test.tsx` passes.
- [x] `npx tsc --noEmit` passes with 0 errors.
