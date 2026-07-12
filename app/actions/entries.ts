'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'
import { BudgetEntrySchema, BudgetEntry } from '../../lib/types'

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> }

export async function createEntry(data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    let supabase = await createClient()

    // 1. Authenticate user
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true'
    const mockAuth = cookieStore.get('sb-mock-auth')?.value === 'true'

    let userId = null

    if (isE2e && mockAuth) {
      userId = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createServerClient } = await import('@supabase/ssr')
        supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() { /* ignore */ }
          }
        })
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
      }
      userId = user.id
    }

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

    // 3. Convert amount from decimal to centavos (Math.round to prevent float inaccuracy)
    const amountInCentavos = Math.round(validData.amount * 100)

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

    // 5. Bust caches
    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, data: insertedData as BudgetEntry }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}

export async function updateEntry(id: string, data: unknown): Promise<ActionResponse<BudgetEntry>> {
  try {
    let supabase = await createClient()

    // 1. Authenticate user
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true'
    const mockAuth = cookieStore.get('sb-mock-auth')?.value === 'true'

    if (isE2e && mockAuth) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createServerClient } = await import('@supabase/ssr')
        supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() { /* ignore */ }
          }
        })
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
      }
    }

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

    // 3. Convert amount from decimal to centavos
    const amountInCentavos = Math.round(validData.amount * 100)

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
      .select()
      .single()

    if (dbError) {
      console.error('Database update error:', dbError)
      return { success: false, error: dbError.message }
    }

    // 5. Bust caches
    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, data: updatedData as BudgetEntry }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}

export async function deleteEntry(id: string): Promise<ActionResponse<{ id: string }>> {
  try {
    let supabase = await createClient()

    // 1. Authenticate user
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true'
    const mockAuth = cookieStore.get('sb-mock-auth')?.value === 'true'

    if (isE2e && mockAuth) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const { createServerClient } = await import('@supabase/ssr')
        supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() { /* ignore */ }
          }
        })
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
      }
    }

    // 2. Delete database record
    const { error: dbError } = await supabase
      .from('budget_entries')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { success: false, error: dbError.message }
    }

    // 3. Bust caches
    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, data: { id } }
  } catch (err) {
    console.error('Unhandled action error:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.'
    return { success: false, error: errorMessage }
  }
}
