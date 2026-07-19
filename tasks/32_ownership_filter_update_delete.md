# Task 32: Add Query-Layer Ownership Filter to Update/Delete

## Objective
Add `.eq('entered_by', officer.id)` to both `updateEntry` and `deleteEntry` server actions in `app/actions/entries.ts`. Currently, these actions authenticate the officer and rely solely on RLS to block cross-user writes. If RLS is ever misconfigured, disabled, or bypassed (e.g., by a future service-role client), this becomes a horizontal-privilege-escalation hole. Defense-in-depth says: filter at the query layer too. Also replace the raw Postgres error message with a friendly "Entry not found or you do not have permission" message.

## Audit Reference
- **Findings:** X2 (MEDIUM, -1 pt)
- **Severity:** MEDIUM (defense-in-depth gap — RLS is the only line of defense)
- **Current grade impact:** +1 point.
- **Source:** AUDIT-v4 §5 finding X2, §8.2 step-by-step instructions.

## Files Created / Modified
- [MODIFY] [app/actions/entries.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.ts)
- [MODIFY] [app/actions/entries.test.ts](file:///c:/Users/Admin/Documents/CBEA_Website/app/actions/entries.test.ts) — add cross-user test cases

## Step-by-Step Instructions

### 1. Update `updateEntry` to filter by `entered_by`

Find the `.update()` chain in `updateEntry` (approximately lines 94–109) and add `.eq('entered_by', userId)`:

```typescript
// app/actions/entries.ts — updateEntry, replace the .update() chain
const { data: updatedData, error: dbError } = await supabase
  .from('budget_entries')
  .update({
    type: validData.type,
    description: validData.description,
    category: validData.category,
    amount: amountInCentavos,
    date: validData.date,
    semester: validData.semester,
    academic_year: validData.academic_year,
    notes: validData.notes || null,
    status: validData.status,
  })
  .eq('id', id)
  .eq('entered_by', userId)   // ← ADD THIS: defense-in-depth ownership filter
  .select()
  .single();

if (dbError) {
  // PGRST116 = "JSON object requested, multiple (or no) rows returned"
  if (dbError.code === 'PGRST116') {
    return { success: false, error: 'Entry not found or you do not have permission to modify it.' };
  }
  console.error('Database update error:', dbError);
  return { success: false, error: 'Failed to update entry. Please try again.' };
}
```

### 2. Update `deleteEntry` to filter by `entered_by`

Find the `.delete()` chain in `deleteEntry` (approximately lines 137–141) and add `.eq('entered_by', userId)` plus a count check:

```typescript
// app/actions/entries.ts — deleteEntry, replace the .delete() chain
const { error: dbError, count } = await supabase
  .from('budget_entries')
  .delete({ count: 'exact' })
  .eq('id', id)
  .eq('entered_by', userId);   // ← ADD THIS: defense-in-depth ownership filter

if (dbError) {
  console.error('Database delete error:', dbError);
  return { success: false, error: 'Failed to delete entry. Please try again.' };
}

if (count === 0) {
  return { success: false, error: 'Entry not found or you do not have permission to delete it.' };
}
```

### 3. Add cross-user test cases to `app/actions/entries.test.ts`

```typescript
// app/actions/entries.test.ts — add tests
it('returns friendly error when officer tries to update another user\'s entry', async () => {
  // Mock getOfficerAndClient to return officer A
  // Mock supabase.update().eq().eq().select().single() to return error code PGRST116
  // Call updateEntry('some-id', validData)
  // Assert response is { success: false, error: 'Entry not found or you do not have permission to modify it.' }
});

it('returns friendly error when officer tries to delete another user\'s entry', async () => {
  // Mock getOfficerAndClient to return officer A
  // Mock supabase.delete().eq().eq() to return { count: 0, error: null }
  // Call deleteEntry('some-id')
  // Assert response is { success: false, error: 'Entry not found or you do not have permission to delete it.' }
});
```

## Metro Design Compliance & Best Coding Practices
- This task does not modify any visual components or styling. No design-system impact.
- **Defense-in-depth:** The query-layer filter mirrors the RLS predicate, ensuring two independent lines of defense.
- **Consistent with `createEntry`:** The `createEntry` action already sets `entered_by: userId` at insert time (line 48). Now update and delete consistently reference `entered_by` as well.
- **User-friendly errors:** Instead of exposing raw Postgres error messages, users see a clear, actionable message.

## Automated Testing & Verification Plan

### Automated Tests
```bash
# Run the server action tests:
npx vitest run app/actions/entries.test.ts

# Run the full test suite:
npx vitest run

# Type check:
npx tsc --noEmit
```

### Manual Verification
- Login as Officer A, create an entry.
- Login as Officer B, attempt to update/delete Officer A's entry via the admin UI.
- Should see "Entry not found or you do not have permission" error (NOT a raw Postgres error).

## Acceptance Criteria
- [x] `updateEntry` includes `.eq('entered_by', userId)` in the update query.
- [x] `deleteEntry` includes `.eq('entered_by', userId)` in the delete query.
- [x] `updateEntry` returns "Entry not found or you do not have permission to modify it." on PGRST116 error.
- [x] `deleteEntry` returns "Entry not found or you do not have permission to delete it." when `count === 0`.
- [x] `npx vitest run app/actions/entries.test.ts` passes (all 12 existing + 2 new tests).
- [x] `npx vitest run` passes.
- [x] `npx tsc --noEmit` reports 0 errors.
