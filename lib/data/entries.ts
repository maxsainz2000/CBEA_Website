import { createClient } from '../supabase/server'
import { BudgetEntry } from '../types'

export type DataResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }

export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
}): Promise<DataResult<BudgetEntry[]>> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('*');

    if (filters?.semester) query = query.eq('semester', filters.semester);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching entries:', error.message);
      return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
    }

    return { status: 'ok', data: (data || []) as BudgetEntry[] };
  } catch (err) {
    console.error('Unhandled exception fetching entries:', err);
    return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
  }
}

export async function getEntry(id: string): Promise<DataResult<BudgetEntry | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('budget_entries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(`Database error fetching entry ${id}:`, error.message);
      return { status: 'error', message: "We couldn't load this budget entry. Please try again later." };
    }

    return { status: 'ok', data: data as BudgetEntry | null };
  } catch (err) {
    console.error(`Unhandled exception fetching entry ${id}:`, err);
    return { status: 'error', message: "We couldn't load this budget entry. Please try again later." };
  }
}

export async function getSummaryStats(semester?: string): Promise<DataResult<{
  totalCollected: number;
  totalSpent: number;
  remainingBalance: number;
}>> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('type, amount');

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error fetching summary stats:', error.message);
      return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
    }

    let totalCollected = 0;
    let totalSpent = 0;

    if (data) {
      for (const entry of data) {
        if (entry.type === 'income') {
          totalCollected += Number(entry.amount);
        } else if (entry.type === 'expense') {
          totalSpent += Number(entry.amount);
        }
      }
    }

    const remainingBalance = totalCollected - totalSpent;

    return {
      status: 'ok',
      data: {
        totalCollected,
        totalSpent,
        remainingBalance,
      },
    };
  } catch (err) {
    console.error('Unhandled exception fetching summary stats:', err);
    return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
  }
}

export async function getSemesters(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_semesters').select('semester');

    if (error) {
      console.error('Database error fetching semesters:', error.message);
      return { status: 'error', message: "We couldn't load semester options. Please try again later." };
    }

    return { status: 'ok', data: (data || []).map(row => row.semester) };
  } catch (err) {
    console.error('Unhandled exception fetching semesters:', err);
    return { status: 'error', message: "We couldn't load semester options. Please try again later." };
  }
}

export async function getCategories(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_categories').select('category');

    if (error) {
      console.error('Database error fetching categories:', error.message);
      return { status: 'error', message: "We couldn't load category options. Please try again later." };
    }

    return { status: 'ok', data: (data || []).map(row => row.category) };
  } catch (err) {
    console.error('Unhandled exception fetching categories:', err);
    return { status: 'error', message: "We couldn't load category options. Please try again later." };
  }
}
