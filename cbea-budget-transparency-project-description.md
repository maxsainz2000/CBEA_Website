# CBEA Student Council Budget Transparency Portal

## 1. Overview

A public-facing website for the CBEA (College of Business, Economics, and Accountancy) Student Council at Cagayan State University – Aparri campus, built to give students clear, easy access to how council funds are collected and spent. The site solves a trust problem: right now, budget info likely lives in reports that students never see or that get buried in group chats/bulletin posts. This gives it a permanent, always-visible home.

## 2. Problem Statement

Students have no simple way to check what the Student Council is doing with their fees/collections. Financial reports may exist internally, but there's no accessible public record. This creates room for doubt about where funds go, even when spending is legitimate.

## 3. Goals (v1 / MVP)

- Let any visitor view budget breakdowns without needing an account
- Let designated officers (Treasurer, President, etc.) enter and update budget entries through a simple admin panel
- Keep the whole stack free to run and easy to maintain by one person (you)

## 4. Core Features

**Public side (no login required)**
- Browse budget entries — income and expenses — ideally grouped by event/activity, semester, or category
- See totals: total collected, total spent, remaining balance
- Search/filter by date, category, or event
- Mobile-friendly, since most students will check this on their phones

**Admin side (login required)**
- Simple authenticated login for council officers
- Add/edit/delete budget entries (amount, description, category, date, supporting notes)
- Manual entry only for v1 — no document parsing/OCR, keeps things simple and accurate

## 5. User Roles

| Role | Access |
|---|---|
| Student / Public visitor | Read-only, no login |
| Council officer (admin) | Login required, can create/edit/delete entries |

v1 assumption: a single shared "admin" role is enough — no need to build granular permissions (e.g. Treasurer vs. President) unless you want an audit trail of who entered what later.

## 6. Tech Stack

- **Framework:** Next.js (App Router) — deploys natively on Vercel, handles both the public pages and admin panel in one codebase
- **Styling:** Tailwind CSS
- **Database:** Supabase (free tier, Postgres) — since Vercel's free tier doesn't include persistent storage on its own
- **Auth (admin login):** Supabase Auth — no separate auth provider needed since it's bundled with the database
- **Hosting:** Vercel free tier (Hobby plan)

## 7. Hosting Constraint — What Vercel Free Tier Means for This Project

- No built-in database → handled by Supabase's free tier instead
- Serverless function limits (execution time, monthly invocations) — a low-traffic student council site is well within free-tier limits
- No persistent file storage on the server — any file uploads (e.g. receipt images) later could use Supabase Storage's free tier — not needed for v1 since entries are manual, not upload-based
- Supabase free tier note: projects pause after 1 week of inactivity (auto-resumes on the next request, with a short delay) — worth knowing so it's not mistaken for a bug during quiet periods
- Custom domain optional — Vercel gives a free `.vercel.app` subdomain, which is fine to start

## 8. Out of Scope for v1

- Document/receipt upload and parsing
- Multiple officer roles with different permissions
- Comments, questions, or feedback from students
- Fund request/proposal submission
- Notifications or email alerts

These are reasonable v2 ideas once the core transparency portal is live and being used.

## 9. Success Criteria

- Any CBEA student can find and understand budget info without asking an officer directly
- Officers can post a new budget entry in under a minute
- Site runs entirely within Vercel free tier + Supabase free tier — ₱0 hosting cost
