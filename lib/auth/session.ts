import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export type Officer = { id: string; email: string; role: string; full_name: string | null }

const AUTHORIZED_ROLES = ['Treasurer', 'Auditor', 'President', 'Vice President', 'Secretary'] as const

/**
 * Returns the authenticated officer, or null.
 * Server-only. Never call from a client component.
 */
export async function getOfficer(): Promise<Officer | null> {
  const supabase = await createClient()
  try {
    const { data, error } = await supabase.auth.getClaims()
    if (error || !data || !data.claims.sub) return null
    const id = data.claims.sub
    const email = data.claims.email ?? ''

    // Verify the user has a profiles row with an authorized role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', id)
      .maybeSingle()

    if (profileError || !profile) {
      return null
    }

    const roleStr = profile.role as string
    if (!AUTHORIZED_ROLES.includes(roleStr as typeof AUTHORIZED_ROLES[number])) {
      return null
    }

    return { id, email, role: roleStr as Officer['role'], full_name: profile.full_name }
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
    const officer = await getOfficer()
    return { officer, supabase }
  } catch {
    return { officer: null, supabase }
  }
}
