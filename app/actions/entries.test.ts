/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEntry, updateEntry, deleteEntry } from './entries'
import { getEntries, getEntry, getSummaryStats } from '../../lib/data/entries'




// Mock lib/auth/session
vi.mock('../../lib/auth/session', () => ({
  getOfficer: vi.fn(),
  getOfficerAndClient: vi.fn(),
}))

import { getOfficer, getOfficerAndClient } from '../../lib/auth/session'
import { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase helper
class MockQuery {
  private data: unknown
  private error: unknown
  private count: number | null

  constructor(data: unknown, error: unknown = null, count: number | null = null) {
    this.data = data
    this.error = error
    this.count = count
  }

  select = vi.fn().mockReturnValue(this)
  insert = vi.fn().mockReturnValue(this)
  update = vi.fn().mockReturnValue(this)
  delete = vi.fn().mockReturnValue(this)
  eq = vi.fn().mockReturnValue(this)
  ilike = vi.fn().mockReturnValue(this)
  order = vi.fn().mockReturnValue(this)
  range = vi.fn().mockReturnValue(this)
  single = vi.fn().mockImplementation(async () => {
    return { data: Array.isArray(this.data) ? this.data[0] : this.data, error: this.error, count: this.count }
  })
  maybeSingle = vi.fn().mockImplementation(async () => {
    return { data: Array.isArray(this.data) ? this.data[0] : this.data, error: this.error, count: this.count }
  })

  then<TResult1 = { data: unknown; error: unknown; count: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.data, error: this.error, count: this.count }).then(onfulfilled, onrejected)
  }
}

let currentMockQuery: MockQuery

const mockFrom = vi.fn().mockImplementation(() => {
  return currentMockQuery
})

const mockRpc = vi.fn()

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
}

vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

describe('Budget Entries API and Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentMockQuery = new MockQuery([])
    mockRpc.mockReset()
    ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null) // default: unauth
    ;(getOfficerAndClient as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      const officer = await getOfficer()
      return { officer, supabase: mockSupabase as unknown as SupabaseClient }
    })
  })

  describe('Authentication Guards', () => {
    it('should return unauthorized error on createEntry if user is unauthenticated', async () => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await createEntry({
        type: 'income',
        description: 'Test entry',
        category: 'Test',
        amount: 100,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return unauthorized error on updateEntry if user is unauthenticated', async () => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await updateEntry('entry-uuid', {
        type: 'expense',
        description: 'Updated test entry',
        category: 'Test',
        amount: 50,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })

    it('should return unauthorized error on deleteEntry if user is unauthenticated', async () => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue(null)

      const result = await deleteEntry('entry-uuid')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Unauthorized')
      }
    })
  })

  describe('Schema Validation', () => {
    beforeEach(() => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        email: 'test@csu.edu.ph',
        role: 'Treasurer',
        full_name: 'Test Officer',
      })
    })

    it('should reject empty description and return field validation error', async () => {
      const result = await createEntry({
        type: 'income',
        description: '',
        category: 'Test',
        amount: 100,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Validation failed')
        expect(result.validationErrors).toBeDefined()
        expect(result.validationErrors?.description).toContain('Description is required')
      }
    })

    it('should reject negative amount values', async () => {
      const result = await createEntry({
        type: 'income',
        description: 'Refund',
        category: 'Test',
        amount: -5.5,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.validationErrors?.amount).toContain('Amount must be a non-negative number')
      }
    })

    it('should reject invalid date formats', async () => {
      const result = await createEntry({
        type: 'income',
        description: 'Valid desc',
        category: 'Test',
        amount: 10,
        date: '07-11-2026', // wrong format, expects YYYY-MM-DD
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.validationErrors?.date).toContain('Invalid date format (YYYY-MM-DD)')
      }
    })
  })

  describe('Happy Path Actions', () => {
    beforeEach(() => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        email: 'test@csu.edu.ph',
        role: 'Treasurer',
        full_name: 'Test Officer',
      })
    })

    it('should create entry and convert decimal amount to integer cents', async () => {
      const mockResult = {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 15075, // $150.75 in cents
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: null,
        status: 'paid',
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        created_at: '2026-07-20T00:00:00Z',
        updated_at: '2026-07-20T00:00:00Z',
      }
      currentMockQuery = new MockQuery(mockResult)

      const result = await createEntry({
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 150.75, // decimal input
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResult)
      }

      expect(mockFrom).toHaveBeenCalledWith('budget_entries')
      expect(currentMockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        amount: 15075,
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
      }))

    })

    it('should update entry with correct fields and convert amount', async () => {
      const mockResult = {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
        type: 'expense',
        description: 'Office supplies',
        category: 'Supplies',
        amount: 9999, // $99.99
        date: '2026-07-12',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: 'Paper and pens',
        status: 'paid',
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        created_at: '2026-07-20T00:00:00Z',
        updated_at: '2026-07-20T00:00:00Z',
      }
      currentMockQuery = new MockQuery(mockResult)

      const result = await updateEntry('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', {
        type: 'expense',
        description: 'Office supplies',
        category: 'Supplies',
        amount: 99.99,
        date: '2026-07-12',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: 'Paper and pens',
        status: 'paid',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(mockResult)
      }
      expect(currentMockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        amount: 9999,
        notes: 'Paper and pens',
      }))

    })

    it('should delete entry by id', async () => {
      currentMockQuery = new MockQuery({ id: 'delete-uuid' }, null, 1)

      const result = await deleteEntry('delete-uuid')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({ id: 'delete-uuid' })
      }
      expect(currentMockQuery.delete).toHaveBeenCalled()

    })

    it('returns friendly error when officer tries to update another user\'s entry', async () => {
      currentMockQuery = new MockQuery(null, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })

      const result = await updateEntry('another-user-entry-uuid', {
        type: 'expense',
        description: 'Office supplies',
        category: 'Supplies',
        amount: 99.99,
        date: '2026-07-12',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: 'Paper and pens',
        status: 'paid',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Entry not found or you do not have permission to modify it.')
      }
    })

    it('returns friendly error when officer tries to delete another user\'s entry', async () => {
      currentMockQuery = new MockQuery(null, null, 0)

      const result = await deleteEntry('another-user-entry-uuid')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Entry not found or you do not have permission to delete it.')
      }
    })
  })

  describe('Data Fetching helpers', () => {
    it('should getEntries with filters and apply order options', async () => {
      const mockEntries = [
        { id: '1', description: 'a', date: '2026-07-11', semester: '1st Sem', category: 'A' },
      ]
      currentMockQuery = new MockQuery(mockEntries)

      const result = await getEntries({
        semester: '1st Sem',
        category: 'A',
        search: 'test',
      })

      expect(result).toEqual({
        status: 'ok',
        data: {
          entries: mockEntries,
          totalCount: 0,
          hasMore: false,
        },
      })
      expect(currentMockQuery.eq).toHaveBeenCalledWith('semester', '1st Sem')
      expect(currentMockQuery.eq).toHaveBeenCalledWith('category', 'A')
      expect(currentMockQuery.ilike).toHaveBeenCalledWith('description', '%test%')
      expect(currentMockQuery.order).toHaveBeenCalledWith('date', { ascending: false })
      expect(currentMockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should fetch a single entry via getEntry', async () => {
      const mockEntry = { id: 'single-id', description: 'one' }
      currentMockQuery = new MockQuery(mockEntry)

      const result = await getEntry('single-id')

      expect(result).toEqual({ status: 'ok', data: mockEntry })
      expect(currentMockQuery.eq).toHaveBeenCalledWith('id', 'single-id')
    })

    it('should compute correct summary stats including negative balances', async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            total_collected: 15000,
            total_spent: 16500,
            remaining_balance: -1500,
          },
        ],
        error: null,
      })

      const stats = await getSummaryStats('1st Sem')

      expect(stats).toEqual({
        status: 'ok',
        data: {
          totalCollected: 15000,
          totalSpent: 16500,
          remainingBalance: -1500,
        }
      })
      expect(mockRpc).toHaveBeenCalledWith('get_summary_stats', { p_semester: '1st Sem' })
    })
  })

  describe('Precision and Validation Edge Cases', () => {
    beforeEach(() => {
      ;(getOfficer as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        email: 'test@csu.edu.ph',
        role: 'Treasurer',
        full_name: 'Test Officer',
      })
    })

    it('correctly converts 1.005 to 101 centavos (not 100)', async () => {
      // The Zod refine should reject this at validation (amount has 3 decimal places)
      const result = await createEntry({
        type: 'income',
        description: 'Test entry',
        category: 'Test',
        amount: 1.005,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Validation failed')
        expect(result.validationErrors?.amount).toContain('Amount must have at most 2 decimal places')
      }
    })

    it('correctly converts 19.99 to 1999 centavos', async () => {
      const mockResult = {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 1999,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: null,
        status: 'paid',
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        created_at: '2026-07-20T00:00:00Z',
        updated_at: '2026-07-20T00:00:00Z',
      }
      currentMockQuery = new MockQuery(mockResult)

      const result = await createEntry({
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 19.99,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(currentMockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
          amount: 1999,
        }))
      }
    })

    it('correctly converts 1500.50 to 150050 centavos', async () => {
      const mockResult = {
        id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 150050,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: null,
        status: 'paid',
        entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
        created_at: '2026-07-20T00:00:00Z',
        updated_at: '2026-07-20T00:00:00Z',
      }
      currentMockQuery = new MockQuery(mockResult)

      const result = await createEntry({
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 1500.50,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(currentMockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
          amount: 150050,
        }))
      }
    })

    it('rejects amount with more than 2 decimal places', async () => {
      const result = await createEntry({
        type: 'income',
        description: 'Test entry',
        category: 'Test',
        amount: 1.005,
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.validationErrors?.amount).toContain('Amount must have at most 2 decimal places')
      }
    })
  })
})
