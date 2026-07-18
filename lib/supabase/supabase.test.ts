/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createClient as createBrowserClientHelper } from './client'
import { createClient as createServerClientHelper } from './server'
import { updateSession } from './middleware'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Mock @supabase/ssr
const mockGetClaims = vi.fn()
const mockAuth = {
  getClaims: mockGetClaims,
}
const mockSupabaseClient = {
  auth: mockAuth,
}

vi.mock('@supabase/ssr', () => {
  return {
    createBrowserClient: vi.fn(() => mockSupabaseClient),
    createServerClient: vi.fn(() => mockSupabaseClient),
  }
})

// Mock next/headers
const mockCookieStore = {
  getAll: vi.fn(() => [{ name: 'sb-access-token', value: 'fake-token' }]),
  set: vi.fn(),
}

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(async () => mockCookieStore),
  }
})

describe('Supabase Client and Middleware Setup', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
    }
  })

  describe('Browser Client Setup', () => {
    it('should initialize the browser client with env variables', () => {
      const client = createBrowserClientHelper()
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://your-project.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key'
      )
      expect(client).toBe(mockSupabaseClient)
    })

    it('should throw an error if env variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      expect(() => createBrowserClientHelper()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/)
    })
  })

  describe('Server Client Setup', () => {
    it('should initialize the server client and handle cookies', async () => {
      const client = await createServerClientHelper()
      expect(cookies).toHaveBeenCalled()
      expect(createServerClient).toHaveBeenCalledWith(
        'https://your-project.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key',
        expect.objectContaining({
          cookies: expect.any(Object),
        })
      )
      expect(client).toBe(mockSupabaseClient)

      // Test cookie helper wrapper functions
      const serverClientCalls = vi.mocked(createServerClient).mock.calls
      const cookiesObj = serverClientCalls[serverClientCalls.length - 1][2].cookies

      // Test getAll
      const allCookies = cookiesObj.getAll()
      expect(allCookies).toEqual([{ name: 'sb-access-token', value: 'fake-token' }])

      // Test setAll
      cookiesObj.setAll!([{ name: 'sb-refresh-token', value: 'new-token', options: {} }], {})
      expect(mockCookieStore.set).toHaveBeenCalledWith('sb-refresh-token', 'new-token', {})
    })

    it('should throw an error if env variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      await expect(createServerClientHelper()).rejects.toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/)
    })
  })

  describe('Middleware Session and Auth Guard', () => {
    it('should allow public page requests and pass through', async () => {
      mockGetClaims.mockResolvedValue({ data: null, error: null })
      
      const request = new NextRequest('http://localhost/')
      const response = await updateSession(request)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(200) // OK passthrough
      // Verify getClaims was called to refresh session
      expect(mockGetClaims).toHaveBeenCalled()
    })

    it('should redirect unauthenticated users from /admin to /login', async () => {
      mockGetClaims.mockResolvedValue({ data: null, error: null })
      
      const request = new NextRequest('http://localhost/admin')
      const response = await updateSession(request)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(307) // Temporary redirect
      expect(response.headers.get('location')).toBe('http://localhost/login')
    })

    it('should allow authenticated users on /admin and pass through', async () => {
      mockGetClaims.mockResolvedValue({
        data: {
          claims: { sub: 'user-123', email: 'u@e.ph' }
        },
        error: null
      })
      
      const request = new NextRequest('http://localhost/admin')
      const response = await updateSession(request)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should redirect authenticated users from /login to /admin', async () => {
      mockGetClaims.mockResolvedValue({
        data: {
          claims: { sub: 'user-123', email: 'u@e.ph' }
        },
        error: null
      })
      
      const request = new NextRequest('http://localhost/login')
      const response = await updateSession(request)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost/admin')
    })

    it('should allow unauthenticated users on /login and pass through', async () => {
      mockGetClaims.mockResolvedValue({ data: null, error: null })
      
      const request = new NextRequest('http://localhost/login')
      const response = await updateSession(request)
      
      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })
  })
})
