import { vi, describe, it } from 'vitest'

// Set fake environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: () => {},
    get: () => null,
  })),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { createEntry } from '../app/actions/entries'
import * as serverClient from '../lib/supabase/server'

describe('Sandbox Manual Test', () => {
  it('runs validation and auth checks and prints responses', async () => {
    console.log("--- START SANDBOX MANUAL TEST ---")

    const createClientSpy = vi.spyOn(serverClient, 'createClient')

    console.log("1. Testing Create Entry with Invalid Data (Zod Rejection Verification)...")
    // For validation test, mock an authenticated user
    const mockAuthClient = {
      auth: {
        getUser: async () => ({ data: { user: { id: 'test-user-uuid' } }, error: null })
      }
    }
    createClientSpy.mockResolvedValue(mockAuthClient as any)

    const invalidResult = await createEntry({
      type: 'income',
      description: '', // invalid
      category: 'Test',
      amount: -50.25, // invalid (negative)
      date: 'invalid-date', // invalid (not YYYY-MM-DD)
      semester: '1st Sem',
      academic_year: '2025-2026',
    })
    console.log("Validation failure output:", JSON.stringify(invalidResult, null, 2))

    console.log("2. Testing Create Entry without Auth (Auth Guard Verification)...")
    // For auth guard test, mock an unauthenticated user
    const mockUnauthClient = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null })
      }
    }
    createClientSpy.mockResolvedValue(mockUnauthClient as any)

    const unauthResult = await createEntry({
      type: 'income',
      description: 'Test Valid Description',
      category: 'Test Category',
      amount: 120.50,
      date: '2026-07-11',
      semester: '1st Sem',
      academic_year: '2025-2026',
    })
    console.log("Auth guard output:", JSON.stringify(unauthResult, null, 2))

    console.log("--- END SANDBOX MANUAL TEST ---")
  })
})
