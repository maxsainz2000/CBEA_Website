'use server'

import { ChangePasswordSchema } from '@/lib/types'
import { getOfficerAndClient } from '@/lib/auth/session'
import { logger } from '@/lib/log'

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; validationErrors?: Record<string, string[]> }

export async function changePassword(data: unknown): Promise<ActionResponse<{ message: string }>> {
  try {
    // 1. Authenticate officer
    const { officer, supabase } = await getOfficerAndClient()
    if (!officer) {
      return { success: false, error: 'Unauthorized: You must be signed in to perform this action.' }
    }

    // 2. Validate input schema
    const validation = ChangePasswordSchema.safeParse(data)
    if (!validation.success) {
      const rawErrors = validation.error.flatten().fieldErrors;
      const fieldErrors: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(rawErrors)) {
        if (v) fieldErrors[k] = v;
      }
      return {
        success: false,
        error: 'Validation failed',
        validationErrors: fieldErrors,
      }
    }

    const { newPassword } = validation.data

    // 3. Call Supabase auth.updateUser
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      logger.error('Failed to update password', {
        message: error.message,
        officerId: officer.id,
      })
      return { success: false, error: error.message || 'Failed to update password. Please try again.' }
    }

    return { success: true, data: { message: 'Password updated successfully.' } }
  } catch (err) {
    logger.error('Unhandled action error in changePassword', {
      error: err instanceof Error ? err.message : String(err),
    })
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
