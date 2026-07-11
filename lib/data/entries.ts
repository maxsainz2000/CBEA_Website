import { createClient } from '../supabase/server'
import { BudgetEntry } from '../types'

export async function getEntries(filters?: { semester?: string; category?: string; search?: string }) {
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
    console.error('Error fetching budget entries:', error)
    throw new Error(error.message)
  }

  return (data || []) as BudgetEntry[]
}

export async function getEntry(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching budget entry with id ${id}:`, error)
    return null
  }

  return data as BudgetEntry | null
}

export async function getSummaryStats(semester?: string) {
  const supabase = await createClient()
  let query = supabase.from('budget_entries').select('type, amount')

  if (semester) {
    query = query.eq('semester', semester)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching summary stats:', error)
    throw new Error(error.message)
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
}
