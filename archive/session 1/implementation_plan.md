# CBEA Student Council Budget Transparency Portal — Implementation Plan

Build a public-facing budget transparency website for the CBEA Student Council at CSU-Aparri. The portal gives students read-only access to council fund data (income/expenses/balance) and gives authorized officers a login-protected admin panel to manage entries. The design follows the Metro-derived design system provided in the `cbea-metro-design.zip` package.

## User Review Required

> [!IMPORTANT]
> **Supabase credentials needed.** Before we can wire up the database and auth, you'll need to create a Supabase project and provide:
> - `NEXT_PUBLIC_SUPABASE_URL`
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
>
> I'll scaffold the full app with a placeholder `.env.local` file. You can fill in the values once the Supabase project is ready.

> [!IMPORTANT]
> **Tailwind version.** The project spec says Tailwind CSS. The design package includes both a Tailwind v4 `@theme` file (`app/theme.css`) and a Tailwind v3 `tailwind.config.ts`. New Next.js projects (2026) default to Tailwind v4. **I will use Tailwind v4** with the provided `app/theme.css` as the canonical integration. If you prefer v3, let me know.

## Open Questions

1. **Supabase project setup** — Should I include the SQL migration file for creating the `budget_entries` and `profiles` tables so you can run it in the Supabase SQL editor? (Recommended: yes.)
2. **Demo/seed data** — Should I seed the database with sample budget entries so you can see the portal working immediately? Or start with an empty database?
3. **Domain** — Are you deploying to the default `.vercel.app` subdomain, or do you have a custom domain in mind?

---

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] Next.js App Router project (root)

Initialize a new Next.js project with App Router and Tailwind CSS v4 in the workspace root.

- `npx -y create-next-app@latest ./` with TypeScript, App Router, Tailwind, ESLint, `src/` disabled (app dir at root)
- Install Supabase client: `@supabase/supabase-js` and `@supabase/ssr`

#### [NEW] [.env.local](file:///c:/Users/Admin/Documents/CBEA_Website/.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

### 2. Design System Integration

#### [NEW] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css)

Copy the provided `theme.css` from the design package. Contains:
- `@theme` block with all color, typography, spacing, and radius tokens
- Component utility classes: `.stat-card`, `.budget-entry`, `.pivot-tab`, `.input-underline`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.status-badge-*`, `.data-table`
- Print styles and reduced-motion support

#### [MODIFY] [app/layout.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.tsx)

- Import `./theme.css` before `./globals.css`
- Set `<body className="bg-background text-on-background font-body-sm">`
- Add metadata: title, description, viewport

#### [MODIFY] [app/globals.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/globals.css)

- Strip default Next.js styles
- Keep only minimal resets that complement the design system

---

### 3. Supabase Integration

#### [NEW] [lib/supabase/client.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/client.ts)

Browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`.

#### [NEW] [lib/supabase/server.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/server.ts)

Server-side Supabase client using `createServerClient` from `@supabase/ssr` with cookie handling for App Router.

#### [NEW] [lib/supabase/middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/supabase/middleware.ts)

Middleware helper to refresh auth tokens on every request.

#### [NEW] [middleware.ts](file:///c:/Users/Admin/Documents/CBEA_Website/middleware.ts)

Next.js middleware that:
- Refreshes Supabase auth session on every request
- Protects `/admin/*` routes — redirects to `/login` if unauthenticated

#### [NEW] [lib/types.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/types.ts)

TypeScript types for:
```ts
type BudgetEntry = {
  id: string
  type: 'income' | 'expense'
  description: string
  category: string
  amount: number          // stored in centavos to avoid floating point
  date: string            // ISO date
  notes: string | null
  status: 'paid' | 'pending' | 'flagged'
  entered_by: string
  created_at: string
  updated_at: string
}
```

#### [NEW] [supabase/migration.sql](file:///c:/Users/Admin/Documents/CBEA_Website/supabase/migration.sql)

SQL to create:
- `budget_entries` table with RLS policies (public read, authenticated write)
- Enable Row Level Security
- Create policy for public `SELECT`
- Create policy for authenticated `INSERT`, `UPDATE`, `DELETE`

---

### 4. Public Pages

#### [NEW] [app/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/page.tsx) — Homepage

The main public page with:
- **Hero section**: Large title "CBEA Student Council Budget Transparency" using `headline-display`, total collected figure using `display-xl`, "View breakdown" primary CTA
- **Summary stats row**: 3 × `.stat-card` (Collected / Spent / Remaining) with semantic colors
- **Pivot tabs**: Semester navigation using `.pivot-tab` components
- **Budget entry list**: Filterable list using `.budget-entry` rows with income/expense indicators
- **Search/filter bar**: `.input-underline` with category filter chips
- Data fetched server-side from Supabase

#### [NEW] [app/components/Header.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/Header.tsx)

Minimal header:
- Left: "CBEA Student Council" text (no logo for now — can be added)
- Right: "Admin" link (text only, ghost style)

#### [NEW] [app/components/SummaryStats.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SummaryStats.tsx)

Client component displaying the 3 stat cards with:
- Labels: "TOTAL COLLECTED", "TOTAL SPENT", "REMAINING BALANCE"
- Values with tabular numerals and semantic colors
- "as of [date]" caption

#### [NEW] [app/components/PivotTabs.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/PivotTabs.tsx)

Client component for semester/category tab navigation. Max 7 tabs, switches to `<select>` beyond that.

#### [NEW] [app/components/BudgetEntryList.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/BudgetEntryList.tsx)

Client component rendering budget entries as `.budget-entry` rows with:
- Income/expense indicator strip
- Description, category, date, amount
- Semantic color coding
- Hover state
- Empty state message when no entries match filters

#### [NEW] [app/components/SearchFilter.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/components/SearchFilter.tsx)

Client component with:
- Search input (`.input-underline`)
- Category filter (pivot-style tabs or chips)
- Date range filter (optional, simple start/end inputs)

---

### 5. Auth & Login

#### [NEW] [app/login/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/login/page.tsx)

Login page for council officers:
- Simple centered form with email + password fields (`.input-underline`)
- "Sign in" button (`.btn-primary`)
- Error state for invalid credentials
- Redirects to `/admin` on success

---

### 6. Admin Panel

#### [NEW] [app/admin/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/page.tsx)

Protected admin dashboard:
- Summary stats at top (same component as public, but with admin context)
- "Add new entry" primary CTA
- Budget entry table with edit/delete actions

#### [NEW] [app/admin/components/EntryForm.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryForm.tsx)

Form for adding/editing budget entries:
- Fields: Type (income/expense toggle), Description, Category, Amount, Date, Notes, Status
- All inputs use `.input-underline`
- Single `.btn-primary` submit, `.btn-ghost` cancel
- Client-side validation with error states

#### [NEW] [app/admin/components/EntryTable.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/EntryTable.tsx)

Admin data table (extends `.data-table`):
- All columns from public view + Status badge + Actions
- Edit button (ghost), Delete button (`.btn-danger`)
- Delete confirmation (inline, not modal — Metro prefers in-context)

#### [NEW] [app/admin/new/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/new/page.tsx)

"Add new entry" page with the `EntryForm` component.

#### [NEW] [app/admin/edit/[id]/page.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/edit/[id]/page.tsx)

"Edit entry" page with `EntryForm` pre-populated with entry data.

---

### 7. API Routes (Server Actions)

#### [NEW] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)

Next.js Server Actions for:
- `getEntries(filters)` — fetch entries with optional filters (semester, category, search, date range)
- `getEntry(id)` — fetch single entry for editing
- `createEntry(data)` — insert new entry (authenticated)
- `updateEntry(id, data)` — update entry (authenticated)
- `deleteEntry(id)` — delete entry (authenticated)
- `getSummaryStats(semester?)` — compute totals (collected, spent, remaining)

---

### 8. File Structure Summary

```
CBEA_Website/
├── app/
│   ├── theme.css              ← Design system (from package)
│   ├── globals.css            ← Minimal resets
│   ├── layout.tsx             ← Root layout
│   ├── page.tsx               ← Public homepage
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SummaryStats.tsx
│   │   ├── PivotTabs.tsx
│   │   ├── BudgetEntryList.tsx
│   │   └── SearchFilter.tsx
│   ├── login/
│   │   └── page.tsx           ← Officer login
│   ├── admin/
│   │   ├── page.tsx           ← Admin dashboard
│   │   ├── new/
│   │   │   └── page.tsx       ← Add entry
│   │   ├── edit/
│   │   │   └── [id]/
│   │   │       └── page.tsx   ← Edit entry
│   │   └── components/
│   │       ├── EntryForm.tsx
│   │       └── EntryTable.tsx
│   └── actions/
│       └── entries.ts         ← Server actions
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── types.ts
├── middleware.ts               ← Auth guard
├── supabase/
│   └── migration.sql          ← Database schema
├── .env.local                 ← Supabase credentials
├── tailwind.config.ts         ← (auto-generated by Next.js for v4)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Verification Plan

### Automated Tests
```bash
npm run build    # Verify the project compiles without errors
npm run lint     # Verify ESLint passes
```

### Manual Verification
1. **Dev server**: `npm run dev` — verify homepage renders with Metro design tokens (white background, Lime accent, Segoe UI font stack)
2. **Stat cards**: Verify 3 summary stat cards render with correct semantic colors
3. **Budget entries**: Verify income (green) and expense (red) indicator strips display correctly
4. **Pivot tabs**: Verify semester tabs switch content
5. **Mobile**: Verify responsive layout at 375px viewport (4-column grid, stacked stat cards)
6. **Login flow**: Navigate to `/login`, sign in, verify redirect to `/admin`
7. **Admin CRUD**: Add, edit, delete a budget entry; verify it appears/updates/disappears on the public homepage
8. **Print**: `Ctrl+P` on the homepage — verify backgrounds are stripped and buttons are hidden

> [!NOTE]
> The app will not connect to real data until Supabase credentials are configured. During initial development, I'll include fallback mock data so you can see the full UI immediately.
