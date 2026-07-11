import { createClient } from '../supabase/server'
import { BudgetEntry } from '../types'

const MOCK_ENTRIES: BudgetEntry[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    type: 'income',
    description: 'Student Council Membership Fees - 1st Sem',
    category: 'Membership Fee',
    amount: 4500000,
    date: '2025-09-05',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: '₱50 per student for 900 students',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    type: 'income',
    description: 'Acquaintance Party Ticket Sales',
    category: 'Ticket Sales',
    amount: 3500000,
    date: '2025-09-12',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: '₱100 per ticket for 350 attendees',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    type: 'income',
    description: 'Laro ng Lahi Registration Fees',
    category: 'Sports Fest',
    amount: 1200000,
    date: '2025-10-10',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: '₱300 per team for 40 teams',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    type: 'expense',
    description: 'CSU Gym Rental for Acquaintance Party',
    category: 'Rental',
    amount: 800000,
    date: '2025-09-10',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Paid to CSU administration',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    type: 'expense',
    description: 'Sound System and Lights Rental',
    category: 'Rental',
    amount: 1500000,
    date: '2025-09-15',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Acquaintance party suppliers',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    type: 'expense',
    description: 'Sound System Rental - Sports Fest',
    category: 'Rental',
    amount: 500000,
    date: '2025-10-12',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Laro ng Lahi events',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    type: 'expense',
    description: 'Prizes for sports events',
    category: 'Prizes',
    amount: 1000000,
    date: '2025-10-15',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Cash prizes and medals',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    type: 'expense',
    description: 'Office Supplies and Printing Flyers',
    category: 'Supplies',
    amount: 250000,
    date: '2025-09-08',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Paper, ink, folders',
    status: 'paid',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    type: 'expense',
    description: 'Purchase of new printer (Pending approval)',
    category: 'Supplies',
    amount: 1250000,
    date: '2025-11-20',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Pending dean approval',
    status: 'pending',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000010',
    type: 'expense',
    description: 'Snacks for General Assembly (Discrepancy)',
    category: 'Meeting Expense',
    amount: 180000,
    date: '2025-10-25',
    semester: '1st Sem',
    academic_year: '2025-2026',
    notes: 'Flagged for missing receipt copy',
    status: 'flagged',
    entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002',
    created_at: '2026-07-11T00:00:00Z',
    updated_at: '2026-07-11T00:00:00Z',
  }
]

function getMockEntries(filters?: { semester?: string; category?: string; search?: string }) {
  let result = [...MOCK_ENTRIES]
  if (filters?.semester) {
    result = result.filter((e) => e.semester === filters.semester)
  }
  if (filters?.category) {
    result = result.filter((e) => e.category === filters.category)
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase()
    result = result.filter((e) => e.description.toLowerCase().includes(s))
  }
  return result.sort((a, b) => b.date.localeCompare(a.date))
}

function getMockSummaryStats(semester?: string) {
  let entries = [...MOCK_ENTRIES]
  if (semester) {
    entries = entries.filter((e) => e.semester === semester)
  }
  let totalCollected = 0
  let totalSpent = 0
  for (const entry of entries) {
    if (entry.type === 'income') {
      totalCollected += entry.amount
    } else if (entry.type === 'expense') {
      totalSpent += entry.amount
    }
  }
  return {
    totalCollected,
    totalSpent,
    remainingBalance: totalCollected - totalSpent,
  }
}

export async function getEntries(filters?: { semester?: string; category?: string; search?: string }) {
  try {
    const supabase = await createClient()
    let query = supabase.from('budget_entries').select('*')

    if (filters?.semester) {
      query = query.eq('semester', filters.semester)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }

    // Order by date descending, then created_at descending to present structured info
    query = query.order('date', { ascending: false }).order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.warn('Database error while fetching entries, falling back to mock data:', error.message)
      return getMockEntries(filters)
    }

    return (data || []) as BudgetEntry[]
  } catch (err) {
    console.warn('Unhandled exception while fetching entries, falling back to mock data:', err)
    return getMockEntries(filters)
  }
}

export async function getEntry(id: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('budget_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.warn(`Database error fetching budget entry ${id}:`, error.message)
      return MOCK_ENTRIES.find((e) => e.id === id) || null
    }

    return data as BudgetEntry | null
  } catch (err) {
    console.warn(`Unhandled exception fetching entry ${id}:`, err)
    return MOCK_ENTRIES.find((e) => e.id === id) || null
  }
}

export async function getSummaryStats(semester?: string) {
  try {
    const supabase = await createClient()
    let query = supabase.from('budget_entries').select('type, amount')

    if (semester) {
      query = query.eq('semester', semester)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Database error while fetching summary stats, falling back to mock stats:', error.message)
      return getMockSummaryStats(semester)
    }

    let totalCollected = 0
    let totalSpent = 0

    if (data) {
      for (const entry of data) {
        if (entry.type === 'income') {
          totalCollected += Number(entry.amount)
        } else if (entry.type === 'expense') {
          totalSpent += Number(entry.amount)
        }
      }
    }

    const remainingBalance = totalCollected - totalSpent

    return {
      totalCollected,
      totalSpent,
      remainingBalance,
    }
  } catch (err) {
    console.warn('Unhandled exception while fetching summary stats, falling back to mock stats:', err)
    return getMockSummaryStats(semester)
  }
}

export async function getSemesters(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('budget_entries').select('semester')

    if (error) {
      console.warn('Database error while fetching semesters, falling back to mock semesters:', error.message)
      return Array.from(new Set(MOCK_ENTRIES.map((e) => e.semester))).sort()
    }

    const semesters = Array.from(new Set((data || []).map((entry) => entry.semester)))
    return semesters.length > 0 ? semesters.sort() : Array.from(new Set(MOCK_ENTRIES.map((e) => e.semester))).sort()
  } catch (err) {
    console.warn('Unhandled exception while fetching semesters, falling back to mock semesters:', err)
    return Array.from(new Set(MOCK_ENTRIES.map((e) => e.semester))).sort()
  }
}

export async function getCategories(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('budget_entries').select('category')

    if (error) {
      console.warn('Database error while fetching categories, falling back to mock categories:', error.message)
      return Array.from(new Set(MOCK_ENTRIES.map((e) => e.category))).sort()
    }

    const categories = Array.from(new Set((data || []).map((entry) => entry.category)))
    return categories.length > 0 ? categories.sort() : Array.from(new Set(MOCK_ENTRIES.map((e) => e.category))).sort()
  } catch (err) {
    console.warn('Unhandled exception while fetching categories, falling back to mock categories:', err)
    return Array.from(new Set(MOCK_ENTRIES.map((e) => e.category))).sort()
  }
}
