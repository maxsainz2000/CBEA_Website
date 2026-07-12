import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type Officer = { id: string; email: string }

/**
 * Returns the authenticated officer, or null.
 * Server-only. Never call from a client component.
 *
 * The E2E mock path is gated by a NON-public env var (IS_E2E, no NEXT_PUBLIC_
 * prefix) so it can never leak into the client bundle. The mock is only
 * active when IS_E2E=true AND the sb-mock-auth cookie is set, AND only on
 * the server.
 */
export async function getOfficer(): Promise<Officer | null> {
  // E2E mock — server-only, never in client bundle
  if (process.env.IS_E2E === 'true') {
    const cookieStore = await cookies()
    if (cookieStore.get('sb-mock-auth')?.value === 'true') {
      return {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        email: 'jane.doe@csu.edu.ph',
      }
    }
  }

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
