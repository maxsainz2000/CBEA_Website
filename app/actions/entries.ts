'use server'


import { BudgetEntrySchema, BudgetEntry } from '../../lib/types'
import { getOfficerAndClient } from '../../lib/auth/session'

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> }

export async function createEntry(data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    // 1. Authenticate user and get client
    const { officer, supabase } = await getOfficerAndClient()
    if (!officer) {
      return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
    }
    const userId = officer.id

    // 2. Validate input schema
    const validation = BudgetEntrySchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const validData = validation.data

    // 3. Convert amount from decimal to centavos using toFixed(2) to avoid IEEE-754 error.
    // Examples: 1.005 → "1.01" → 101, 19.99 → "19.99" → 1999, 1500.5 → "1500.50" → 150050
    const amountInCentavos = Math.round(Number(validData.amount.toFixed(2)) * 100)

    // 4. Insert database record
    const { data: insertedData, error: dbError } = await supabase
      .from('budget_entries')
      .insert({
        type: validData.type,
        description: validData.description,
        category: validData.category,
        amount: amountInCentavos,
        date: validData.date,
        semester: validData.semester,
        academic_year: validData.academic_year,
        notes: validData.notes || null,
        status: validData.status,
        entered_by: userId,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return { success: false, error: dbError.message }
    }

    // 5. Cache invalidation: both / and /admin are dynamic routes (force-dynamic
    //    + searchParams), so revalidatePath is a no-op. The admin UI calls
    //    router.refresh() after success; the public homepage re-fetches on
    //    next request. If we migrate to unstable_cache + tags later, switch
    //    to revalidateTag('budget-entries') here.

    return { success: true, data: insertedData as BudgetEntry }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}

export async function updateEntry(id: string, data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    // 1. Authenticate user and get client
    const { officer, supabase } = await getOfficerAndClient()
    if (!officer) {
      return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
    }
    const userId = officer.id

    // 2. Validate input schema
    const validation = BudgetEntrySchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    const validData = validation.data

    // 3. Convert amount from decimal to centavos using toFixed(2) to avoid IEEE-754 error.
    // Examples: 1.005 → "1.01" → 101, 19.99 → "19.99" → 1999, 1500.5 → "1500.50" → 150050
    const amountInCentavos = Math.round(Number(validData.amount.toFixed(2)) * 100)

    // 4. Update database record
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
      .eq('entered_by', userId)
      .select()
      .single()

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return { success: false, error: 'Entry not found or you do not have permission to modify it.' }
      }
      console.error('Database update error:', dbError)
      return { success: false, error: 'Failed to update entry. Please try again.' }
    }

    // 5. Cache invalidation note: see createEntry comment. Dynamic routes,
    //    router.refresh() handles admin; public homepage re-fetches on next request.

    return { success: true, data: updatedData as BudgetEntry }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}

export async function deleteEntry(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    // 1. Authenticate user and get client
    const { officer, supabase } = await getOfficerAndClient()
    if (!officer) {
      return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
    }
    const userId = officer.id

    // 2. Delete database record
    const { error: dbError, count } = await supabase
      .from('budget_entries')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('entered_by', userId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { success: false, error: 'Failed to delete entry. Please try again.' }
    }

    if (count === 0) {
      return { success: false, error: 'Entry not found or you do not have permission to delete it.' }
    }

    // 3. Cache invalidation note: see createEntry comment. Dynamic routes,
    //    router.refresh() handles admin; public homepage re-fetches on next request.

    return { success: true, data: { id } }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}
