# CBEA Budget Transparency Portal — Design System Package

This package adapts the Metro-derived DESIGN.md (originally authored from the
*Tiles, Type, and Transit* field guide) specifically for the **CBEA Student
Council Budget Transparency Portal** at Cagayan State University – Aparri.

It is built to drop into your stack: **Next.js (App Router) + Tailwind CSS +
Supabase + Vercel free tier**.

---

## What's in this package

| File | Purpose | Use when… |
|:-----|:--------|:----------|
| `DESIGN.md` | The normative design-system spec. Machine-readable tokens in YAML front matter, human-readable rationale in Markdown prose. | You want the source of truth — both for yourself and for any AI agent that helps you build the UI. |
| `app/theme.css` | Tailwind v4 `@theme` block + ready-to-use component utility classes (`.stat-card`, `.budget-entry`, `.pivot-tab`, `.input-underline`, `.btn-primary`, `.status-badge-paid`, `.data-table`, print styles, reduced-motion). | **You're on Tailwind v4** (the 2026 default for new Next.js projects). This is the canonical integration file. |
| `tailwind.config.ts` | Tailwind v3 `theme.extend` config with all tokens mapped to colors / fontFamily / fontSize / radius / spacing. | You're on Tailwind v3. Use this instead of `app/theme.css`. |
| `tokens.dtcg.json` | W3C Design Tokens Format Module JSON. | You want to import the tokens into Figma, Tokens Studio, or another design tool. |

---

## Quick start — Tailwind v4 (recommended)

1. **Copy `app/theme.css` into your Next.js project** at `app/theme.css` (or
   `styles/theme.css` — anywhere that gets imported).

2. **Import it from your root layout.** In `app/layout.tsx`:

   ```tsx
   import './theme.css'
   import './globals.css' // your existing globals, if any

   export const metadata = {
     title: 'CBEA Student Council Budget Transparency',
     description: 'Public record of council fund collection and spending.',
   }

   export default function RootLayout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <body className="bg-background text-on-background font-body-sm">
           {children}
         </body>
       </html>
     )
   }
   ```

3. **Use the tokens as Tailwind utilities.** Every color, font, size, and
   spacing token becomes a Tailwind utility automatically:

   ```tsx
   // A summary stat card
   <div className="stat-card stat-card-active">
     <div className="stat-label">Total Collected</div>
     <div className="stat-value stat-value-positive tabular-nums">₱48,250.00</div>
     <div className="stat-meta">as of 2026-07-10 · entered by Treasurer</div>
   </div>

   // A primary button
   <button className="btn-primary">Submit entry</button>

   // A pivot tab
   <button className="pivot-tab pivot-tab-active">1st Sem 2025</button>
   <button className="pivot-tab">2nd Sem 2025</button>

   // An income entry row
   <div className="budget-entry">
     <div className="budget-entry-indicator budget-entry-indicator-income" />
     <div>T-shirt sales, Acquaintance Party</div>
     <div className="caption-meta">2026-03-15</div>
     <div className="budget-entry-amount budget-entry-amount-income tabular-nums">+₱12,450.00</div>
   </div>
   ```

4. **Verify tokens are wired.** Run `npm run dev`, open the homepage, and you
   should see: pure white background, black text, Lime accent on interactive
   elements, Segoe UI on Windows (system-ui on macOS). If you see Times New
   Roman or default browser styling, the theme.css import is missing.

---

## Quick start — Tailwind v3 (fallback)

If your project is on Tailwind v3 (check your `package.json` — if
`tailwindcss` is `^3.x`, you're on v3):

1. Replace your `tailwind.config.ts` with the included `tailwind.config.ts`.
2. Make sure your `app/globals.css` (or equivalent) has the three Tailwind
   directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
3. Use the same Tailwind utility classes as above (`bg-background`,
   `text-on-background`, etc.). The component utility classes
   (`.stat-card`, `.btn-primary`, etc.) are NOT included in v3 — you'll need
   to copy them from `app/theme.css` into your `globals.css` as plain CSS,
   wrapped in `@layer components { ... }`.

---

## How the design maps to your project

| Your project need | Design-system component | Token / class |
|:------------------|:------------------------|:--------------|
| Homepage hero with total collected | `.stat-card` + `.stat-value` | `headline-display` for title, `stat-value` for the figure |
| Collected / Spent / Remaining cards | 3 × `.stat-card` in a grid | `stat-value-positive` (green), `stat-value-negative` (red), `stat-value-neutral` (black) |
| Browse by semester | `.pivot-tab` row | Maximum 7 tabs; if more, switch to a `<select>` |
| Browse by category | `.pivot-tab` row (separate from semester) | Same component, different state |
| Search/filter | `.input-underline` with icon | Borderless, 48px tall, Lime underline on focus |
| Budget entry list | `.budget-entry` rows or `.data-table` | Income = green strip, Expense = red strip |
| Currency alignment | `.tabular-nums` on every amount | Required — non-negotiable for financial data |
| Status badges | `.status-badge-paid` / `-pending` / `-flagged` | Used in admin view; flagged shown publicly |
| Admin form | `.input-underline` fields + `.btn-primary` submit | One primary action per form |
| Admin delete | `.btn-danger` (red fill, white text) | Confirms destructive intent |
| Mobile layout | 4-column grid (use Tailwind's `grid-cols-4`) | Touch targets ≥ 48px |

---

## Design decisions made for this project

These decisions were made when adapting the generic MetroUI DESIGN.md to the
CBEA budget portal. Each is documented so you can revisit it if requirements
change.

### 1. Black text on Lime accent (not white)

The authentic Metro pairing is white-on-accent (e.g., white on Lime #8CBF26).
That yields 2.2:1 contrast — **fails WCAG AA**. For a public-service
transparency portal that must serve all students including those with low
vision, this is unacceptable.

This package uses **black text on Lime** (#000 on #8CBF26 = 9.6:1, passes
WCAG AAA). This is also authentic to light-theme Metro: on a white
background, the accent reads as a high-contrast badge behind dark text, not
as a colored surface behind white text.

If you want to revert to authentic white-on-Lime (and accept the WCAG
failure), change `colors.on-primary` from `#000000` to `#FFFFFF` in
`DESIGN.md`, re-export, and update `app/theme.css`.

### 2. Income green darkened from #339933 to #2D7A2D

The canonical Windows Phone 7 "green" accent is #339933. As a text color on
white, that yields 3.66:1 — fails WCAG AA. The semantic `income` token is
darkened to #2D7A2D, which passes AA both as fill-behind-white-text (5.35:1)
and as text-on-white-background (5.35:1).

The authentic WP7 value is preserved as `accent-green` for future
theme-alternate purposes. If you don't need the alternates, you can drop all
`accent-*` tokens except `accent-lime`.

### 3. Two semantic colors only (income, expense) — no "balance" color

The original spec considered a third semantic color for "balance"
(informational blue). This was dropped: the "remaining balance" stat doesn't
need its own color. If positive, it uses `on-background` (black). If
negative, it uses `expense` (red). Two semantic colors are sufficient and
sharper.

### 4. Dropped Panorama; kept Pivot

Metro has two lateral-navigation components: **Panorama** (exploration,
magazine-cover style) and **Pivot** (filtering, tabbed). A budget
transparency portal only needs Pivot — for semester and category tabs.
Panorama was dropped to keep the component set lean.

### 5. Added budget-specific components

`summary-stat`, `budget-entry-income` / `-expense`, `data-table`,
`status-badge-paid` / `-pending` / `-flagged`, `input-underline`,
`button-danger` — none of these exist in generic Metro; all were added
because the portal needs them.

### 6. Cross-platform font fallback stack

Segoe UI is Windows-only. Students visiting from macOS, Linux, Android, or
iOS would see a fallback serif. The CSS uses:
`'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`
— this degrades gracefully to San Francisco on macOS, Roboto on Android,
and Arial elsewhere, all of which preserve the humanist-sans geometry Metro
requires.

---

## Linter status

This DESIGN.md was validated with `@google/design.md lint`:

```
errors:   0
warnings: 9   (all are unused accent-* alternate tokens — expected)
infos:    1
```

The 9 warnings are the 9 inactive WP7 accent colors (`accent-blue`,
`accent-brown`, etc.). They are user-selectable alternates for future
theming and are intentionally preserved. **Zero contrast warnings** — all
component color pairings pass WCAG AA.

To re-validate after edits:

```bash
# from the design.md repo
bun run packages/cli/src/index.ts lint path/to/DESIGN.md
```

---

## Re-exporting after edits

If you edit `DESIGN.md`, regenerate the export files:

```bash
# Tailwind v4 @theme block
bun run packages/cli/src/index.ts export --format css-tailwind DESIGN.md > raw_theme.css
# then run scripts/build_theme_css.py to apply font fallbacks + component utilities

# Tailwind v3 config
bun run packages/cli/src/index.ts export --format json-tailwind DESIGN.md > raw_tailwind.json
# then run scripts/build_tailwind_config.py

# DTCG tokens (no post-processing needed)
bun run packages/cli/src/index.ts export --format dtcg DESIGN.md > tokens.dtcg.json
```

The post-processing scripts (`build_theme_css.py` and
`build_tailwind_config.py`) live in `/home/z/my-project/scripts/` if you
need them. They are not required for the package to work — they were used
once to produce the files in this zip.

---

## Maintenance notes for a single maintainer

- **Editing tokens:** edit `DESIGN.md` YAML front matter, then re-export.
  Don't edit `app/theme.css` or `tailwind.config.ts` directly — your
  changes will be lost on the next export.
- **Editing component utilities:** the `.stat-card`, `.btn-primary`, etc.
  classes in `app/theme.css` are hand-written, not auto-generated. Edit
  them directly when you need component-level changes (e.g., adjusting
  padding on `.stat-card`).
- **Adding a new component:** add it to the `components:` block in
  `DESIGN.md` if it has token-level properties (colors, typography, size).
  Add it as a utility class in `app/theme.css` if it has structural CSS
  (layout, transitions). Most real components need both.
- **Backing up:** commit `DESIGN.md` to your project repo. The exported
  files (`theme.css`, `tailwind.config.ts`, `tokens.dtcg.json`) can be
  regenerated from it, so they don't strictly need to be committed — but
  committing them saves you from needing the `@google/design.md` CLI
  installed on every machine.

---

## Stack compatibility notes

| Layer | Works with | Notes |
|:------|:-----------|:------|
| Next.js App Router | ✅ Yes — designed for it | `app/theme.css` imported from `app/layout.tsx` |
| Next.js Pages Router | ⚠️ Works, but use `pages/_app.tsx` import instead | Same tokens, different import location |
| Tailwind v4 | ✅ Canonical — use `app/theme.css` | The `@theme {}` block is the v4 native format |
| Tailwind v3 | ✅ Fallback — use `tailwind.config.ts` | Component utility classes need manual port to `globals.css` |
| Supabase | ✅ No interaction | Tokens are presentation-only; Supabase handles data + auth |
| Vercel free tier | ✅ No interaction | CSS is static; zero runtime cost |
| Mobile browsers | ✅ Tested fallbacks | Font stack degrades gracefully on iOS/Android |
| Print | ✅ Built-in `@media print` styles | Strips backgrounds, hides buttons, preserves data |

---

## Questions to expect from stakeholders

**"Why does it look so plain?"** — Plain is the point. Metro's *Content
Before Chrome* principle says the data is the content; ornament competes
with the numbers. A transparency portal that looks flashy invites suspicion;
a transparency portal that looks like a public record earns trust.

**"Can we add our logo?"** — Yes, in the top-left of the header. Keep it
monochrome (black on white) and ≤ 48px tall. Don't surround it with a
rounded container — squared angles are the design language.

**"Can we use the university colors instead of Lime?"** — Yes. Edit
`colors.primary` in `DESIGN.md` to point at a different `accent-*` token, or
define a new color token (e.g., `maroon: "#7A0019"` for a CSU maroon) and
repoint `primary` to it. Re-export and the entire UI updates.

**"Why is the income green darker than I expected?"** — WCAG AA. The
authentic Metro green (#339933) fails contrast as text on white. The
darkened #2D7A2D passes AA in both directions. This is documented in the
DESIGN.md and in this README.

---

*Generated 2026-07-10. DESIGN.md is the source of truth; all other files
are derived from it.*
