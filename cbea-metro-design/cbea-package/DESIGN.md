---
version: alpha
name: CBEA Budget Transparency Portal
description: Metro-derived design system for the CBEA Student Council Budget Transparency Portal at Cagayan State University – Aparri. Light theme, Lime accent, black-on-accent for accessibility. Built for Next.js App Router + Tailwind v4 + Supabase + Vercel.
colors:
  primary: "{colors.accent-lime}"
  on-primary: "#000000"
  background: "#FFFFFF"
  on-background: "#000000"
  secondary: "#7A7A7A"
  tertiary: "#4A4A4A"
  surface: "#F4F4F4"
  outline: "#E0E0E0"
  income: "#2D7A2D"
  on-income: "#FFFFFF"
  expense: "#C81000"
  on-expense: "#FFFFFF"
  error: "#C81000"
  warning: "#F09609"
  accent-blue: "#1BA1E2"
  accent-brown: "#A05000"
  accent-magenta: "#FF0097"
  accent-purple: "#A200FF"
  accent-teal: "#00ABA9"
  accent-green: "#339933"
  accent-red: "#C81000"
  accent-orange: "#F09609"
  accent-pink: "#E671B8"
  accent-lime: "#8CBF26"
typography:
  caption:
    fontFamily: "Segoe UI"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  body-sm:
    fontFamily: "Segoe UI"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm-strong:
    fontFamily: "Segoe UI"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  body-md:
    fontFamily: "Segoe UI"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  headline-sm:
    fontFamily: "Segoe UI"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
  headline-md:
    fontFamily: "Segoe UI"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
  headline-lg:
    fontFamily: "Segoe UI"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-display:
    fontFamily: "Segoe UI"
    fontSize: 40px
    fontWeight: 300
    lineHeight: 52px
    letterSpacing: -0.02em
  display-xl:
    fontFamily: "Segoe UI"
    fontSize: 56px
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: -0.02em
  stat-value:
    fontFamily: "Segoe UI"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 44px
    letterSpacing: -0.01em
  label-caps:
    fontFamily: "Segoe UI"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  none: 0px
  sm: 0px
  md: 0px
  lg: 0px
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
  margin-mobile: 16px
  baseline: 24px
  grid-columns-desktop: 8
  grid-columns-mobile: 4
  touch-target: 48px
  stat-card-min: 240px
  table-row-height: 56px
components:
  summary-stat-income:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    size: "{spacing.stat-card-min}"
  summary-stat-expense:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    size: "{spacing.stat-card-min}"
  summary-stat-balance:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
    size: "{spacing.stat-card-min}"
  stat-label:
    textColor: "{colors.secondary}"
    typography: "{typography.label-caps}"
  stat-value-positive:
    textColor: "{colors.income}"
    typography: "{typography.stat-value}"
  stat-value-negative:
    textColor: "{colors.expense}"
    typography: "{typography.stat-value}"
  stat-value-neutral:
    textColor: "{colors.on-background}"
    typography: "{typography.stat-value}"
  budget-entry-income:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
    padding: "{spacing.md} {spacing.lg}"
    height: "{spacing.table-row-height}"
  budget-entry-expense:
    backgroundColor: "{colors.background}"
    textColor: "{colors.on-background}"
    rounded: "{rounded.none}"
    padding: "{spacing.md} {spacing.lg}"
    height: "{spacing.table-row-height}"
  budget-entry-hover:
    backgroundColor: "{colors.surface}"
  data-table-header:
    textColor: "{colors.secondary}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm} {spacing.lg}"
    height: "{spacing.table-row-height}"
  data-table-row:
    textColor: "{colors.on-background}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm} {spacing.lg}"
    height: "{spacing.table-row-height}"
  status-badge-paid:
    backgroundColor: "{colors.income}"
    textColor: "{colors.on-income}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "{spacing.xs} {spacing.sm}"
  status-badge-pending:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.on-background}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "{spacing.xs} {spacing.sm}"
  status-badge-flagged:
    backgroundColor: "{colors.expense}"
    textColor: "{colors.on-expense}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.none}"
    padding: "{spacing.xs} {spacing.sm}"
  pivot-header:
    textColor: "{colors.on-background}"
    typography: "{typography.headline-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm} 0"
    height: "{spacing.touch-target}"
  pivot-header-selected:
    textColor: "{colors.primary}"
    typography: "{typography.headline-sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.none}"
    height: "{spacing.touch-target}"
    padding: "0 {spacing.lg}"
  button-primary-pressed:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.background}"
  button-ghost:
    textColor: "{colors.primary}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.none}"
    height: "{spacing.touch-target}"
    padding: "0 {spacing.md}"
  button-danger:
    backgroundColor: "{colors.expense}"
    textColor: "{colors.on-expense}"
    typography: "{typography.body-sm-strong}"
    rounded: "{rounded.none}"
    height: "{spacing.touch-target}"
    padding: "0 {spacing.lg}"
  list-item:
    textColor: "{colors.on-background}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "{spacing.md} {spacing.sm}"
    height: "{spacing.touch-target}"
  list-item-selected:
    textColor: "{colors.primary}"
    typography: "{typography.body-sm-strong}"
  input-field:
    textColor: "{colors.on-background}"
    typography: "{typography.body-md}"
    rounded: "{rounded.none}"
    padding: "{spacing.sm} 0"
    height: "{spacing.touch-target}"
  input-field-error:
    textColor: "{colors.expense}"
  caption-meta:
    textColor: "{colors.secondary}"
    typography: "{typography.caption}"
---

## Overview

This design system governs the CBEA Student Council Budget Transparency Portal — a public-facing website for the College of Business, Economics, and Accountancy Student Council at Cagayan State University – Aparri. The portal exists to solve a specific trust problem: students have no simple way to verify how council funds are collected and spent. The design language must reinforce that trust by being **legible, calm, and incorruptible-looking** — every visual choice should signal that the data is the point, not the presentation.

The system is derived from Microsoft's Metro design language (refined for Windows Phone 7, 2010) as documented in the *Tiles, Type, and Transit* field guide. Metro is an unusually good fit for a transparency portal because its founding principle — **Content Before Chrome** — is exactly what financial disclosure demands: no decorative borders, no shadows, no gradients, no ornament. The data is the container. A user who lands on the homepage should see the numbers immediately, with nothing competing for attention.

The five Metro principles, stated as imperatives the agent must execute:

1. **Content Before Chrome.** Discard decorative borders, drop shadows, gradients, bevels, and visual noise. Budget figures are the content; they do not need to be framed. The default treatment of any surface is a flat fill, and a flat fill only.
2. **Clean Typography.** Carry hierarchy through type — weight, size, color — using the Segoe UI family (with cross-platform fallbacks, since students will visit from Windows, macOS, Linux, Android, and iOS devices). Currency figures use tabular numerals so columns align.
3. **Alive in Motion.** Motion is feedback, not flourish. A new budget entry slides in; a deleted entry fades out; a loading state shows progress dots. No animation without a cause.
4. **Authentically Digital.** Never imitate physical materials. No paper textures, no ledger-book metaphors, no calculator skeuomorphs. The screen is a screen; the data is the data.
5. **Fierce Reduction.** One primary action per screen. One accent color. Maximum six-to-seven pivots (semester tabs, category tabs). The totals — collected, spent, remaining — are the three most prominent things on the homepage; everything else is subsidiary.

The emotional response target is **institutional calm**: a student should feel they are reading a well-edited public record, not navigating a dashboard, not being sold something. The Lime accent (#8CBF26) carries the single signal of "this is interactive / this is the council's brand color"; semantic colors (green for income, red for expense) carry the meaning.

## Colors

The color logic is severe by design, in service of trust. The background is pure **white (#FFFFFF)** — maximum print-legibility, no tint to suggest softness or apology. Foreground text is pure **black (#000000)**. Borders and dividers, where they appear, are 1px solid `outline` (#E0E0E0). The single accent — **Lime #8CBF26** — is the council's brand color and the sole indicator of "interactive" or "primary action."

**Accessibility decision.** The authentic Metro pairing of white text on a Lime accent fill yields only 2.2:1 contrast, which fails WCAG AA. For a public-service transparency portal that must serve all students — including those with low vision — this is unacceptable. This DESIGN.md therefore pairs the Lime accent with **black text** (#000000 on #8CBF26 = 9.6:1, passes WCAG AAA). This is also authentic to light-theme Metro: on a white background, the accent fill reads as a high-contrast badge behind dark text, not as a colored surface behind white text. White-on-accent is reserved for the dark semantic colors (income green, expense red), where it passes AA comfortably.

**Semantic colors for budget data.** A transparency portal must let users distinguish income from expense at a glance. Two semantic colors carry this meaning:

| Role | Token | Hex | Usage | Contrast (white on fill / fill on white) |
|:-----|:------|:----|:------|:-----------------------------------------|
| Income (positive flow) | `colors.income` | #2D7A2D | Income entry indicators, positive totals, "paid" badges | 5.35:1 / 5.35:1 (AA pass both ways) |
| Expense (negative flow) | `colors.expense` | #C81000 | Expense entry indicators, negative totals, "flagged" badges, delete buttons | 5.83:1 / 5.83:1 (AA pass both ways) |

The income green is darkened from the canonical WP7 #339933 to #2D7A2D so it passes WCAG AA both as fill behind white text AND as text on white background. The authentic WP7 value is preserved as `accent-green` for theme-alternate purposes. The "remaining balance" stat does not need its own color: if positive it uses `on-background` (black), if negative it uses `expense` (red) — two semantic colors are sufficient.

Only the single brand accent (`colors.primary` aliased to Lime) is active. The other nine alternate accent tokens are not used in production and have been removed from the theme configuration to keep the stylesheet clean. Do not introduce a second active accent in a single view.

**Color discipline rules:**
- The Lime accent (`primary`) is for interactive elements only: primary buttons, selected pivot tabs, links, focus rings.
- Semantic colors (`income`, `expense`, `balance`) are for data meaning only: entry indicators, stat values, status badges. Never use a semantic color for navigation or branding.
- Neutral grays (`secondary`, `tertiary`, `outline`) are for hierarchy: captions, metadata, dividers, table headers.
- Never combine the accent and a semantic color in the same component — that creates ambiguity about which signal wins.

## Typography

The type system rests on **Segoe UI** — the humanist sans-serif used in Windows 8 and later. Segoe UI is the canonical Metro typeface and is pre-installed on Windows, which covers the majority of student devices in a Philippine university computer lab context. For students visiting from macOS, Linux, Android, or iOS, the CSS fallback stack is: `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`. This stack degrades gracefully — system-ui on macOS renders San Francisco (similar humanist geometry), and Arial elsewhere preserves the open-counter legibility Metro requires.

Weights favor **Light (300)** for large display titles and **Semibold (600)** for everything else carrying emphasis. Regular (400) is reserved for body copy. The classic Metro look — light weight, large size, generous whitespace — is used for the homepage hero ("CBEA Student Council Budget Transparency") and for stat-card labels.

**Currency figures.** All money values use `font-variant-numeric: tabular-nums` so that digits align in columns. This is critical for a budget portal: students scanning a list of expenses must be able to compare amounts visually, which requires the "1" to occupy the same width as the "8". The `stat-value` typography token is intended for this; apply tabular-nums in the component CSS.

The type ramp:

| Token | Role | Weight | Size / Line-height | Typical usage |
|:------|:-----|:-------|:-------------------|:--------------|
| `caption` | Caption | Regular (400) | 12px / 16px | Timestamps, "entered by Treasurer", last-updated |
| `body-sm` | Body small | Regular (400) | 14px / 20px | Table cells, list items, secondary text |
| `body-sm-strong` | Body small strong | Semibold (600) | 14px / 20px | Emphasized table cells, button labels |
| `body-md` | Body | Regular (400) | 16px / 24px | Article text, descriptions, admin form labels |
| `headline-sm` | Subtitle | Semibold (600) | 20px / 28px | Pivot headers, section labels, "Income" / "Expense" |
| `headline-md` | Title 3 | Semibold (600) | 24px / 32px | Page section headers, modal titles |
| `headline-lg` | Title 1 | Semibold (600) | 32px / 40px | Page headers ("Budget Transparency") |
| `headline-display` | Large Title | Light (300) | 40px / 52px | Homepage hero |
| `display-xl` | Display | Light (300) | 56px / 1.1 | Numbers in hero (e.g., total collected) |
| `stat-value` | Stat value | Semibold (600) | 36px / 44px | Summary stat numbers (totals) |
| `label-caps` | Label | Semibold (600) | 11px / 14px, +0.08em | Uppercase metadata, table headers, status badges |

Body copy is flush-left, ragged-right, never justified. Justified text creates rivers of white space and uneven word spacing — unacceptable in a portal where students skim. The left edge is the sacred anchor; the right edge breathes.

## Layout

The grid is non-negotiable: **8 columns on desktop**, **4 columns on mobile**, with a **16px gutter** and **24px margin on desktop / 16px on mobile**. The 4-column mobile grid is critical — most CBEA students will check the portal on their phones, and a 4-column grid gives enough resolution for a stat-card row (3 cards spanning 1 col + 1 col + 1 col + 1 col gutter, or 4 cards across) without cramming. The `spacing` tokens encode both: `grid-columns-desktop: 8`, `grid-columns-mobile: 4`.

**The homepage layout** follows Metro's left-anchored asymmetry:

- Hero: full-width, headline-display title, display-xl total-collected figure, single primary CTA ("View breakdown").
- Summary stats: 3-card row (Collected / Spent / Remaining), each on `surface` background, left-aligned label, large stat-value, semantic color for the figure.
- Pivot navigation: semester tabs (1st Sem 2025, 2nd Sem 2025, etc.) — maximum 6–7 tabs.
- Budget entries: filterable list or data table below the pivots, left-anchored, with category filter chips on the left rail.

**Admin panel layout** is denser but follows the same grid:

- Form fields use the 4-column mobile grid even on desktop (labels above inputs, single-column layout) — this keeps the admin UX simple for a single officer maintaining the site.
- The entry list appears below the form, in the same data-table component as the public side, with edit/delete actions on the right.

**Touch targets** must be at least 48px × 48px (`spacing.touch-target`). This applies to every interactive element: buttons, list rows, pivot tabs, filter chips. On mobile, this is non-negotiable — a student tapping a pivot tab with their thumb must not miss.

**Negative space is structural.** A 24px minimum margin around primary content is encoded as `spacing.margin`. Cramped, edge-kissing layouts are forbidden; they read as desperate, which undermines trust.

### Modality

This portal is **touch-first on mobile, pointer on desktop**, and must work on both without friction. Concrete requirements:

- **Touch targets** ≥ 48px on every interactive element.
- **Hover states** are a desktop enhancement, not a primary affordance. The `budget-entry-hover` token (surface background) signals interactivity on hover; on touch, the same signal appears on tap-down.
- **Keyboard navigation** must work for accessibility: Tab moves between interactive elements, Enter activates, Escape closes modals. The pivot tabs respond to arrow-left / arrow-right.
- **Scroll-wheel behavior** is vertical everywhere — this portal does not use lateral panorama scrolling. Budget lists scroll vertically; pivots switch horizontally but via tab tap, not scroll.
- **Print styles**: students may print the budget for reference. The light theme prints cleanly; ensure no background colors on printable areas (use `@media print` to strip `surface` backgrounds).

## Elevation & Depth

There is no elevation. Metro conveys hierarchy through **tonal layers and the accent**, never through shadows, bevels, or material depth. A flat fill is the default treatment of any surface.

When two surfaces must be distinguished — for example, the page background versus a summary-stat card — use a 4% tonal step: `colors.background` (#FFFFFF) for the page, `colors.surface` (#F4F4F4) for the card. Borders, where they appear, are 1px solid `colors.outline` (#E0E0E0) — used for table row separators and input focus underlines, never for card outlines.

**Why no shadows?** A shadow implies a light source, which implies a physical material, which violates *Authentically Digital*. More practically, shadows add visual noise that competes with the numbers — and a transparency portal's job is to make the numbers win every time.

The accent color itself is the strongest elevation-equivalent: a Lime-bordered or Lime-filled element reads as "foreground" against a neutral background, without any visual depth at all. The summary-stat cards use `surface` background with a 4px-wide Lime left-border on the "active" stat (the one currently being filtered by), achieving hierarchy through color, not depth.

## Shapes

The shape language is **squared angles**. Corner radius is 0px by default for every component, container, and input. This is non-negotiable Metro DNA — softening the corners would drift toward Fluent and erode the geometric integrity that makes the system legible.

The `rounded` tokens encode this: `none`, `sm`, `md`, `lg` are all 0px; only `full` (9999px) is non-zero, reserved for circular elements (a council logo mark, a user avatar in the admin panel, the loading-progress dots).

- **Exceptions:**
  1. Circular spinners and loading indicators use `rounded-full` (defined as `--radius-full: 9999px` in `app/theme.css`) — this is the only allowed deviation from the zero-radius rule.
  2. `--color-income` green (`#2d7a2d`) is used for income entries. Serves a semantic data-communication purpose: income (green) vs expense (red `#c81000`). Using Lime for both the primary accent and income would create ambiguity between interactive elements and data categories.

Mixing rounded and sharp corners in the same view is forbidden. If a single circular element appears (the logo, an avatar), it must be the only circular element in its immediate visual context; everything around it stays squared.

## Components

This portal uses a small, precisely-defined component set. The Panorama/Pivot distinction from Metro is preserved: **Panorama is dropped** (irrelevant to a budget portal — there is no "magazine cover" entry view), while **Pivot is kept** and used for semester and category tabs. The pivot cap of 6–7 tabs maps cleanly to "1st Sem, 2nd Sem, Midyear, plus 3–4 category filters."

### Summary Stats (homepage hero)

Three cards in a row: **Collected**, **Spent**, **Remaining**. Each card uses `surface` background, 24px padding, left-aligned `stat-label` (uppercase, secondary color), and a large `stat-value` figure in the appropriate semantic color (green for collected, red for spent, neutral for remaining — or red if remaining is negative). The cards are equal-width on desktop (3 × ~2.6 columns of the 8-col grid) and stack vertically on mobile.

The `stat-value` typography uses tabular numerals so the three figures align visually across cards. The `caption` row beneath each stat shows "as of [date]" or "last updated by [officer]" — small, secondary color, no border.

### Budget Entries

Each entry is a row in a data table or a card in a list (depending on viewport). The row contains:

- **Indicator strip** (4px wide, full row height) on the left edge: green for income, red for expense. This is the at-a-glance signal.
- **Description** (body-sm-strong) — e.g., "T-shirt sales, Acquaintance Party."
- **Category** (caption, secondary color) — e.g., "Income · Fundraiser."
- **Date** (caption, secondary color) — e.g., "2026-03-15."
- **Amount** (body-sm-strong, tabular-nums, right-aligned) — e.g., "₱12,450.00," colored green for income, red for expense.
- **Status badge** (optional, for admin view) — paid/pending/flagged.

On hover (desktop) or tap-down (mobile), the row background becomes `surface`. On the admin side, edit and delete actions appear on the right.

### Data Table

For the searchable/filterable list view, a data table is preferred over cards — it aligns amounts in columns, which is what financial data demands. The table uses `data-table-header` (uppercase label-caps, secondary color, 1px solid bottom border in `outline`) and `data-table-row` (body-sm, 56px row height, 1px solid bottom border in `outline`). No zebra striping — Metro rejects it as visual noise. Hover state: row background becomes `surface`.

### Pivot Navigation

Pivot tabs sit above the data table, left-aligned, with the active tab in `primary` (Lime) text and inactive tabs in `on-background` (black) text. The tab height is 48px (touch target). No underline indicator — the color change is the indicator, per *Content Before Chrome*. Maximum 7 tabs; if more semesters are needed, switch to a dropdown (which is itself a Metro-friendly pattern — see the Windows 8 app bar).

### Buttons

- **`button-primary`**: Lime fill, **black text** (AAA contrast), body-sm-strong typography, 48px height, 0px radius. Used for the single primary action per screen ("Submit entry" in admin, "View breakdown" on homepage).
- **`button-ghost`**: Transparent, Lime text, same typography/height. Used for secondary actions ("Cancel," "Filter").
- **`button-danger`**: Red (`expense`) fill, white text. Used only for destructive actions ("Delete entry") in the admin panel.
- One primary button per screen. Secondary actions are ghost. Destructive actions are danger. Never combine.

### Inputs

`input-field` is borderless by default — a transparent surface with `on-background` text. A 1px solid bottom border in `outline` appears on focus, becoming 2px solid `primary` (Lime) when actively focused. Error state: border becomes `expense` (red), helper text appears in `expense` color. This pattern is authentic Metro: the input is the content, the chrome appears only when needed.

### Status Badges

Three variants, all using `label-caps` typography (uppercase, 11px, semibold, tracked):
- `status-badge-paid` (green fill, white text) — for confirmed income.
- `status-badge-pending` (orange fill, black text) — for entries awaiting verification.
- `status-badge-flagged` (red fill, white text) — for entries under review.

Status badges are 4px padding, 0px radius, inline-block. They appear in the admin entry list and in the public view only when an entry is flagged (transparency demands visibility of contested items).

### Motion Vocabulary

Motion in this portal is feedback, not flourish. The vocabulary is small and bound to specific triggers:

| Animation | Trigger | Duration | Easing |
|:----------|:--------|:---------|:-------|
| **Slide-in (vertical)** | New budget entry added (admin) or data loaded (public) | 200ms | ease-out |
| **Fade-out** | Budget entry deleted (admin) | 150ms | ease-in |
| **Pivot switch** | User tapped a different semester/category tab | 200ms | ease-out |
| **Progress dots** | Loading budget data from Supabase | indefinite, 1.2s loop | linear |
| **Press squash** | User pressed a button or row (tap feedback) | 100ms | ease-out |
| **Accent reveal** | User hovered/focused a tappable row (compensation clause) | 150ms | ease-out |

No tile flips (no live tiles in this portal). No lateral panorama scroll. No page-curl. No skeuomorphic transitions. Anything not in this table is forbidden. Durations are short — a transparency portal is a tool, not a performance.

## Do's and Don'ts

**Banned patterns.** These are load-bearing walls. Relaxing any of them erodes the trust the portal is meant to build.

- **Don't** use box-shadows on cards, tables, or any surface. Depth is conveyed through tonal layers (white → surface → surface-alt), never through shadows.
- **Don't** use gradients on buttons, headers, or backgrounds. Flat fills only.
- **Don't** use skeuomorphic materials — no paper, no ledger lines, no calculator buttons. The screen is a screen.
- **Don't** justify text. Body copy is flush-left, ragged-right, always.
- **Don't** use all-caps for headings or navigation. Default to sentence case; reserve all-caps for `label-caps` (metadata, table headers, status badges).
- **Don't** introduce a second active accent color. One accent per app (Lime); semantic colors (income/expense/balance) are for data meaning only.
- **Don't** use zebra striping in tables. Hover state is enough; alternating rows add noise.

**Fierce Reduction rules.**

- **Do** keep pivot tabs to a maximum of seven. If you need more semesters, switch to a dropdown.
- **Do** limit each screen to one primary action. The homepage's primary action is "View breakdown"; the admin form's primary action is "Submit entry"; the entry list's primary action is "Add new entry."
- **Do** pair every reduction with a discoverability rule. Tappable rows reveal `surface` background on hover/focus; the active pivot tab reveals `primary` color; the focused input reveals a 2px Lime underline.

**Accessibility.**

- **Do** maintain WCAG AA contrast (4.5:1) for all text. The Lime accent uses **black** text (9.6:1, AAA), not white.
- **Do** use black text on the Lime accent for all primary buttons. This is non-negotiable for a public-service portal.
- **Do** keep touch targets at or above 48px × 48px. Students on phones must not miss.
- **Do** use tabular numerals (`font-variant-numeric: tabular-nums`) for all currency figures so columns align.
- **Do** provide keyboard navigation: Tab, Enter, Escape, arrow keys for pivots.
- **Do** include `@media print` styles that strip backgrounds and accent fills — students may print the budget.

**Typography discipline.**

- **Don't** use more than two font weights on a single screen. The ramp is Light, Regular, Semibold — pick two per view.
- **Do** use Light weights at large sizes (32px+). That is the signature Metro look, and it signals "calm institution."
- **Don't** invent intermediate type sizes not in the ramp. If a size is needed, extend the ramp explicitly.

**Data integrity (specific to this portal).**

- **Do** always show the entry date and entering officer (caption, secondary color) on every budget entry. Transparency demands provenance.
- **Do** show "last updated" timestamps on the homepage hero. A stale transparency portal is worse than no portal.
- **Don't** round currency figures. Show centavos; a portal that rounds invites suspicion.
- **Do** display negative balances in `expense` red. Hiding a deficit breaks trust.
