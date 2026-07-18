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
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    return { id: data.claims.sub, email: data.claims.email ?? '' }
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
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return { officer: null, supabase }
    return {
      officer: { id: data.claims.sub, email: data.claims.email ?? '' },
      supabase,
    }
  } catch {
    return { officer: null, supabase }
  }
}
