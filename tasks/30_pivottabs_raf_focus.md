# Task 30: Use `requestAnimationFrame` for PivotTabs Focus

## Objective
Replace `setTimeout(() => elementToFocus.focus(), 0)` with `requestAnimationFrame(() => elementToFocus.focus())` in `PivotTabs.tsx` for more reliable focus management during keyboard navigation. The current `setTimeout(…, 0)` pattern defers focus to the next macrotask, which can cause focus to be lost if the user navigates quickly. `requestAnimationFrame` runs before the next paint, which is the optimal time to apply focus changes after a DOM update.

## Audit Reference
- **Findings:** P3-5 (LOW), accessibility §5.8 item 2
- **Severity:** LOW (accessibility polish)
- **Current grade impact:** +0 points (quality improvement, not grade-changing).
- **Source:** AUDIT-v3 §5.8 minor gap 2, §7 Fix P3-5.

## Files Created / Modified
- [MODIFY] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx)

## Step-by-Step Instructions

### 1. Find the focus management code in `PivotTabs.tsx`

Locate the keyboard navigation handler that uses `setTimeout` for focus:

```tsx
// Current (REPLACE):
setTimeout(() => elementToFocus.focus(), 0);
```

This is likely inside the `onKeyDown` handler for the tab list, after computing the next tab index.

### 2. Replace with `requestAnimationFrame`

```tsx
// New:
requestAnimationFrame(() => elementToFocus.focus());
```

**Why `requestAnimationFrame` is better:**
- `setTimeout(…, 0)` defers to the next macrotask. Browser event processing, other timers, and I/O callbacks can run before the focus is applied.
- `requestAnimationFrame` runs before the next paint. This means:
  1. The DOM is updated (React's state change has been committed).
  2. The focus is applied before the browser paints.
  3. The user sees the focused element immediately, with no frame of "lost focus."
- For rapid keyboard navigation (e.g., holding ArrowDown), `requestAnimationFrame` is more reliable because it coalesces with the next paint frame, while multiple `setTimeout(…, 0)` calls can queue up and interfere with each other.

### 3. Verify keyboard navigation

Start the dev server and test the `PivotTabs` keyboard navigation:

1. Navigate to `/` (public homepage).
2. Tab to the semester pivot tabs.
3. Use ArrowRight / ArrowLeft to move between tabs.
4. Use ArrowDown / ArrowUp to move between tabs (if vertical).
5. Use Home to jump to the first tab.
6. Use End to jump to the last tab.
7. Verify focus moves visually to the correct tab on each keypress.
8. Try rapid key presses (hold ArrowRight) — focus should track smoothly without jumping or losing focus.

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Accessibility best practice:** `requestAnimationFrame` is the recommended way to apply focus changes after DOM updates. It is more reliable than `setTimeout(…, 0)` for assistive technology compatibility.
- **Browser compatibility:** `requestAnimationFrame` is supported in all modern browsers and is safe to use in a Next.js app.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the PivotTabs component tests:
npx vitest run app/components/PivotTabs.test.tsx

# Run the full test suite:
npx vitest run

# Type check:
npx tsc --noEmit
```

### Manual Verification
- Test keyboard navigation on the public homepage pivot tabs:
  - ArrowRight/Left: focus moves to next/previous tab.
  - Home/End: focus jumps to first/last tab.
  - Rapid key presses: focus tracks smoothly.
- Test keyboard navigation on the admin page semester selector (which reuses `PivotTabs`):
  - Same keyboard interactions should work correctly.

## Acceptance Criteria
- [x] `PivotTabs.tsx` uses `requestAnimationFrame(() => elementToFocus.focus())` instead of `setTimeout(() => elementToFocus.focus(), 0)`.
- [x] `npx vitest run app/components/PivotTabs.test.tsx` passes (3/3 tests).
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
- [x] Keyboard navigation works correctly on both the public homepage and admin semester selector (manual verification).
