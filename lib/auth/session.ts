import { createClient } from '@/lib/supabase/server'

export type Officer = { id: string; email: string }

/**
 * Returns the authenticated officer, or null.
 * Server-only. Never call from a client component.
 */
export async function getOfficer(): Promise<Officer | null> {
  // Real auth path
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email ?? '' }
  } catch {
    return null
  }
}
