/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createEntry, updateEntry, deleteEntry } from './entries'
import { getEntries, getEntry, getSummaryStats } from '../../lib/data/entries'
import { revalidatePath } from 'next/cache'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase helper
const mockGetUser = vi.fn()

class MockQuery {
  private data: unknown
  private error: unknown

  constructor(data: unknown, error: unknown = null) {
    this.data = data
    this.error = error
  }

  select = vi.fn().mockReturnValue(this)
  insert = vi.fn().mockReturnValue(this)
  update = vi.fn().mockReturnValue(this)
  delete = vi.fn().mockReturnValue(this)
  eq = vi.fn().mockReturnValue(this)
  ilike = vi.fn().mockReturnValue(this)
  order = vi.fn().mockReturnValue(this)
  single = vi.fn().mockImplementation(async () => {
    return { data: Array.isArray(this.data) ? this.data[0] : this.data, error: this.error }
  })
  maybeSingle = vi.fn().mockImplementation(async () => {
    return { data: Array.isArray(this.data) ? this.data[0] : this.data, error: this.error }
  })

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve({ data: this.data, error: this.error }).then(onfulfilled, onrejected)
  }
}

let currentMockQuery: MockQuery

const mockFrom = vi.fn().mockImplementation(() => {
  return currentMockQuery
})

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
  },
  from: mockFrom,
}

vi.mock('../../lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

describe('Budget Entries API and Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentMockQuery = new MockQuery([])
  })

  describe('Authentication Guards', () => {
    it('should return unauthorized error on createEntry if user is unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

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
      expect(result.error).toContain('Unauthorized')
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should return unauthorized error on updateEntry if user is unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

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
      expect(result.error).toContain('Unauthorized')
    })

    it('should return unauthorized error on deleteEntry if user is unauthenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      const result = await deleteEntry('entry-uuid')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })

  describe('Schema Validation', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null })
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
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toBeDefined()
      expect(result.validationErrors?.description).toContain('Description is required')
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
      expect(result.validationErrors?.amount).toContain('Amount must be a non-negative number')
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
      expect(result.validationErrors?.date).toContain('Invalid date format (YYYY-MM-DD)')
    })
  })

  describe('Happy Path Actions', () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-uuid' } }, error: null })
    })

    it('should create entry and convert decimal amount to integer cents', async () => {
      const mockResult = {
        id: 'new-entry-uuid',
        type: 'income',
        description: 'Student fees',
        category: 'Fees',
        amount: 15075, // $150.75 in cents
        date: '2026-07-11',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: null,
        status: 'paid',
        entered_by: 'user-uuid',
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
      expect(result.data).toEqual(mockResult)

      expect(mockFrom).toHaveBeenCalledWith('budget_entries')
      expect(currentMockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
        amount: 15075,
        entered_by: 'user-uuid',
      }))
      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/admin')
    })

    it('should update entry with correct fields and convert amount', async () => {
      const mockResult = {
        id: 'existing-uuid',
        type: 'expense',
        description: 'Office supplies',
        category: 'Supplies',
        amount: 9999, // $99.99
        date: '2026-07-12',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: 'Paper and pens',
        status: 'paid',
      }
      currentMockQuery = new MockQuery(mockResult)

      const result = await updateEntry('existing-uuid', {
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
      expect(result.data).toEqual(mockResult)
      expect(currentMockQuery.update).toHaveBeenCalledWith(expect.objectContaining({
        amount: 9999,
        notes: 'Paper and pens',
      }))
      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/admin')
    })

    it('should delete entry by id', async () => {
      currentMockQuery = new MockQuery({ id: 'delete-uuid' })

      const result = await deleteEntry('delete-uuid')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 'delete-uuid' })
      expect(currentMockQuery.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/')
      expect(revalidatePath).toHaveBeenCalledWith('/admin')
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

      expect(result).toEqual(mockEntries)
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

      expect(result).toEqual(mockEntry)
      expect(currentMockQuery.eq).toHaveBeenCalledWith('id', 'single-id')
    })

    it('should compute correct summary stats including negative balances', async () => {
      const dbRows = [
        { type: 'income', amount: 10000 },  // 100.00
        { type: 'expense', amount: 4500 },  // 45.00
        { type: 'income', amount: 5000 },   // 50.00
        { type: 'expense', amount: 12000 }, // 120.00
      ]
      // Income = 15000, Expense = 16500, Balance = -1500
      currentMockQuery = new MockQuery(dbRows)

      const stats = await getSummaryStats('1st Sem')

      expect(stats.totalCollected).toBe(15000)
      expect(stats.totalSpent).toBe(16500)
      expect(stats.remainingBalance).toBe(-1500)
      expect(currentMockQuery.eq).toHaveBeenCalledWith('semester', '1st Sem')
    })
  })
})
