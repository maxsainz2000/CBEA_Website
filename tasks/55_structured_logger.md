# Task 55: Replace console.error with Structured Logger

## Objective
Create `lib/log.ts` with a structured JSON logger that redacts sensitive fields. Replace all 17 `console.error` calls in production paths (`app/actions/entries.ts`, `lib/data/entries.ts`, `app/admin/components/AdminHeader.tsx`) with `logger.error(...)`. Unstructured `console.error` has no log level, no redaction, no correlation ID, and can leak internal DB details (column names, constraint names, query fragments) to Vercel server logs.

## Audit Reference
- **Findings:** Y4 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (17 console.error in production — potential information disclosure via server logs)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v5 §6 finding Y4, §10 P1-5 step-by-step instructions.

## Files Created / Modified
- [NEW] [lib/log.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/log.ts) — structured logger
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts) — replace 6 console.error
- [MODIFY] [lib/data/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/lib/data/entries.ts) — replace 10 console.error
- [MODIFY] [app/admin/components/AdminHeader.tsx](file:///c:/Users/Admin/Documents/CBEA_Website/app/admin/components/AdminHeader.tsx) — replace 1 console.error

## Step-by-Step Instructions

### 1. Create `lib/log.ts`

```typescript
// lib/log.ts — Structured JSON logger for production safety
type LogLevel = 'error' | 'warn' | 'info';

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && level === 'info') return;

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // In production, use console.error for errors (visible in Vercel logs);
  // in dev, use console.log for visibility.
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
};
```

### 2. Replace `console.error` calls in `app/actions/entries.ts`

```typescript
// BEFORE:
console.error('Database insert error:', dbError)

// AFTER:
import { logger } from '@/lib/log';

logger.error('Database insert failed', {
  code: dbError.code,
  table: 'budget_entries',
  // Don't log dbError.message or dbError.details — may contain query fragments
})
```

Repeat for all 6 `console.error` calls in the file. For each, log only safe metadata (`code`, `table`, `action`) — never `error.message` or `error.details`.

### 3. Replace `console.error` calls in `lib/data/entries.ts`

Replace all 10 `console.error` calls following the same pattern. Each call should log the operation name and error code, but not raw error messages.

### 4. Replace `console.error` in `app/admin/components/AdminHeader.tsx`

Replace the 1 `console.error` call with `logger.error(...)`.

### 5. Verify

```bash
# No raw console.error in production paths:
grep -rn 'console\.error' app/ lib/ | grep -v test | grep -v node_modules
# Expected: 0 hits

npx vitest run
npx tsc --noEmit
npm run build
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Logging best practice:** Structured JSON logs are parseable by log aggregation tools. Redacting `error.message` and `error.details` prevents leaking internal DB schema information.

## Automated Testing & Verification Plan

### Automated Tests
```bash
grep -rn 'console\.error' app/ lib/ | grep -v test | grep -v node_modules
# Expected: 0 hits

npx vitest run
npx tsc --noEmit
npm run build
```

### Manual Verification
- Trigger an error condition (e.g., invalid Supabase URL).
- Check server logs — should see structured JSON, not raw Supabase error details.

## Acceptance Criteria
- [ ] `lib/log.ts` exists with `logger.error`, `logger.warn`, `logger.info` exports.
- [ ] Logger outputs structured JSON with `level`, `message`, `timestamp`.
- [ ] Logger suppresses `info` level in production.
- [ ] `app/actions/entries.ts` has 0 `console.error` calls.
- [ ] `lib/data/entries.ts` has 0 `console.error` calls.
- [ ] `app/admin/components/AdminHeader.tsx` has 0 `console.error` calls.
- [ ] No raw `error.message` or `error.details` from Supabase is logged.
- [ ] `grep -rn 'console\.error' app/ lib/ | grep -v test` returns 0 hits.
- [ ] `npx vitest run` passes all tests.
- [ ] `npx tsc --noEmit` passes with 0 errors.
