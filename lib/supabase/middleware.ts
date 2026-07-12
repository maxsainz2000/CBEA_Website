import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Use getUser() instead of getSession() to prevent cookie spoofing
  let user: { id: string; email?: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  // E2E mock — server-only, gated by IS_E2E (no NEXT_PUBLIC_ prefix)
  if (!user && process.env.IS_E2E === 'true' &&
      request.cookies.get('sb-mock-auth')?.value === 'true') {
    user = { id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', email: 'jane.doe@csu.edu.ph' }
  }

  // Guard routing logic
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

  if (isAdminPage && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    
    const response = NextResponse.redirect(redirectUrl)
    // Copy cookies to redirect response to persist the updated session if any
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      })
    })
    return response
  }

  if (isLoginPage && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin'
    
    const response = NextResponse.redirect(redirectUrl)
    // Copy cookies to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        maxAge: cookie.maxAge,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
      })
    })
    return response
  }

  return supabaseResponse
}
