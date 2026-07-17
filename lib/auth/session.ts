import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

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

export async function getOfficerAndClient(): Promise<{
  officer: Officer | null;
  supabase: SupabaseClient;
}> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return { officer: null, supabase }
    return {
      officer: { id: data.user.id, email: data.user.email ?? '' },
      supabase,
    }
  } catch {
    return { officer: null, supabase }
  }
}
