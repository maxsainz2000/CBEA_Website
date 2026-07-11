# Task 1: Project Scaffolding and Tailwind v4 Integration

## Objective
Initialize the Next.js 15 App Router workspace, configure TypeScript, set up Tailwind CSS v4, integrate the `theme.css` Metro-derived styles, and configure Vitest for unit testing.

## Files Created / Modified
- [NEW] [package.json](file:///c:/Users/Admin/Documents/CBEA_Website/package.json) (Next.js 15, React 19, Tailwind CSS v4, `@supabase/ssr`, `@supabase/supabase-js`, `zod`, `vitest`, `@testing-library/react`)
- [NEW] [tsconfig.json](file:///c:/Users/Admin/Documents/CBEA_Website/tsconfig.json) (TypeScript strict settings)
- [NEW] [postcss.config.mjs](file:///c:/Users/Admin/Documents/CBEA_Website/postcss.config.mjs) (PostCSS integration for Tailwind v4)
- [NEW] [app/globals.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/globals.css) (Tailwind base overrides, resets)
- [NEW] [app/theme.css](file:///c:/Users/Admin/Documents/CBEA_Website/app/theme.css) (Copy from `cbea-metro-design/cbea-package/app/theme.css`)
- [NEW] [app/layout.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/layout.tsx) (Root layout with fonts, colors, and layout skeleton)
- [NEW] [vitest.config.ts](file:///c:/Users/Admin/Documents/CBEA_Website/vitest.config.ts) (Vitest config for React/TypeScript)

## Step-by-Step Instructions

### 1. Project Initialization
- Scaffold a Next.js App Router project in the root workspace directory.
- Configure dependency versions inside `package.json` to target Next.js 15.x and React 19.x, along with Tailwind CSS v4 and Supabase SSR libraries.
- Install the following packages:
  - Production: `tailwindcss` (v4), `@tailwindcss/postcss`, `postcss`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`
  - Development: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`, `@types/node`, `@types/react`, `eslint`, `typescript`

### 2. PostCSS and Tailwind v4 Configuration
- Create `postcss.config.mjs` to register `@tailwindcss/postcss`.
- Copy `cbea-metro-design/cbea-package/app/theme.css` into `app/theme.css`.
- In `app/globals.css`, remove the standard template rules and import both tailwind and the theme css:
  ```css
  @import "tailwindcss";
  @import "./theme.css";
  ```

### 3. Layout Setup
- In `app/layout.tsx`, import `./theme.css` and `./globals.css` (ensure theme is loaded first).
- Set layout container classes:
  - `html` with `lang="en"`.
  - `body` with `className="bg-background text-on-background font-body-sm min-h-screen selection:bg-primary selection:text-on-primary"`.
- Set page metadata (title, description) optimized for SEO:
  - Title: `"CBEA Student Council Budget Transparency Portal"`
  - Description: `"Public record of the CSU-Aparri College of Business, Economics, and Accountancy Student Council funds collected and spent."`

### 4. Vitest Setup
- Create `vitest.config.ts` configured for the `jsdom` environment and the `@vitejs/plugin-react` plugin.
- Create aliases pointing to `@/*` directories (e.g., `./app/*` and `./lib/*`).

## Metro Design Compliance & Best Coding Practices
- **No Rounded Corners:** Double-check that `radius` properties are `0px` for all elements unless they are explicitly circular icons/avatars (handled via `rounded-full`).
- **Typography Fallback:** Layout must use the humanist sans-serif fallback stack specified by `theme.css`: `Segoe UI`, `system-ui`, `-apple-system`, `Helvetica Neue`, `Arial`, `sans-serif`.
- **Content Before Chrome:** Do not add decorative shadows, box outlines, gradients, or containers. Elements are separated by negative space or thin `1px solid var(--color-outline)` borders.
- **Accessibility:** Make sure selection colors use high-contrast matching (black text on Lime background: `selection:bg-primary selection:text-on-primary`).

## Automated Testing & Verification Plan

### Automated Unit Tests
- Create a test file `app/layout.test.tsx` verifying that the layout:
  1. Renders the main element inside `<body>`.
  2. Integrates without TypeScript compiler errors.
- Run tests:
  ```bash
  npx vitest run
  ```

### Manual Verification
- Start the local development server:
  ```bash
  npm run dev
  ```
- Inspect in the browser console that:
  - `theme.css` variables are correctly loaded.
  - Background is white (`#ffffff`), text is black (`#000000`).
  - The default font resolves to `Segoe UI` or system-ui fallback.

## Acceptance Criteria
- [x] Next.js 15 runs locally on `http://localhost:3000` with no console errors.
- [x] Tailwind CSS v4 directives load successfully; theme configurations (`@theme`) match the design system tokens.
- [x] CSS resets and Metro system resets are correctly applied to the HTML body.
- [x] Running `npx vitest run` passes successfully with unit test execution.
