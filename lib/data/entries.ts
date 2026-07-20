import { createClient } from '../supabase/server'
import { BudgetEntry } from '../types'

export type DataResult<T> =
  | { status: 'ok'; data: T }
  | { status: 'error'; message: string }

export async function getEntries(filters?: {
  semester?: string;
  category?: string;
  search?: string;
  page?: number;       // 1-indexed page number, default 1
  pageSize?: number;   // entries per page, default 50, max 100
}): Promise<DataResult<{ entries: BudgetEntry[]; totalCount: number; hasMore: boolean }>> {
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 50));

  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('*', { count: 'exact' });

    if (filters?.semester) query = query.eq('semester', filters.semester);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.search) query = query.ilike('description', `%${filters.search}%`);

    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error fetching entries:', error.message);
      return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
    }

    const totalCount = count ?? 0;
    return {
      status: 'ok',
      data: {
        entries: (data || []) as BudgetEntry[],
        totalCount,
        hasMore: page * pageSize < totalCount,
      },
    };
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
  if (!semester) {
    return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_summary_stats', { p_semester: semester });

    if (error) {
      console.error('Database error fetching summary stats:', error.message);
      return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
    }

    if (!data || data.length === 0) {
      return { status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } };
    }

    const row = data[0];
    return {
      status: 'ok',
      data: {
        totalCollected: Number(row.total_collected),
        totalSpent: Number(row.total_spent),
        remainingBalance: Number(row.remaining_balance),
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
