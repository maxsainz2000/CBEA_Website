import { createClient } from '../supabase/server'
import { BudgetEntry, BudgetEntryRecordSchema } from '../types'
import { logger } from '../log'

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
    if (filters?.search) {
      // Escape ILIKE wildcards so user input is treated literally
      const escaped = filters.search.replace(/[%_\\]/g, '\\$&');
      query = query.ilike('description', `%${escaped}%`);
    }

    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Database error fetching entries', {
        code: error.code,
      });
      return { status: 'error', message: "We couldn't load budget entries. Please try again later." };
    }

    const totalCount = count ?? 0;
    const validatedEntries: BudgetEntry[] = [];
    if (data) {
      for (const row of data) {
        const parsed = BudgetEntryRecordSchema.safeParse(row);
        if (parsed.success) {
          validatedEntries.push(parsed.data);
        } else {
          logger.error('Invalid budget entry database row', {
            id: row.id,
            errors: parsed.error.issues,
          });
        }
      }
    }
    return {
      status: 'ok',
      data: {
        entries: validatedEntries,
        totalCount,
        hasMore: page * pageSize < totalCount,
      },
    };
  } catch {
    logger.error('Unhandled exception fetching entries');
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
      logger.error('Database error fetching entry', {
        id,
        code: error.code,
      });
      return { status: 'error', message: "We couldn't load this budget entry. Please try again later." };
    }

    if (!data) {
      return { status: 'ok', data: null };
    }

    const parsed = BudgetEntryRecordSchema.safeParse(data);
    if (!parsed.success) {
      logger.error('Invalid budget entry fetched', {
        id,
        errors: parsed.error.issues,
      });
      return { status: 'error', message: "We couldn't load this budget entry. Please try again later." };
    }

    return { status: 'ok', data: parsed.data };
  } catch {
    logger.error('Unhandled exception fetching entry', { id });
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
      logger.error('Database error fetching summary stats', {
        semester,
        code: error.code,
      });
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
  } catch {
    logger.error('Unhandled exception fetching summary stats', { semester });
    return { status: 'error', message: "We couldn't load summary statistics. Please try again later." };
  }
}

export async function getSemesters(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_semesters').select('semester');

    if (error) {
      logger.error('Database error fetching semesters', {
        code: error.code,
      });
      return { status: 'error', message: "We couldn't load semester options. Please try again later." };
    }

    return { status: 'ok', data: (data || []).map(row => row.semester) };
  } catch {
    logger.error('Unhandled exception fetching semesters');
    return { status: 'error', message: "We couldn't load semester options. Please try again later." };
  }
}

export async function getCategories(): Promise<DataResult<string[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('distinct_categories').select('category');

    if (error) {
      logger.error('Database error fetching categories', {
        code: error.code,
      });
      return { status: 'error', message: "We couldn't load category options. Please try again later." };
    }

    return { status: 'ok', data: (data || []).map(row => row.category) };
  } catch {
    logger.error('Unhandled exception fetching categories');
    return { status: 'error', message: "We couldn't load category options. Please try again later." };
  }
}

export async function getLastUpdatedDate(semester?: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    let query = supabase.from('budget_entries').select('updated_at');
    if (semester) query = query.eq('semester', semester);
    query = query.order('updated_at', { ascending: false }).limit(1);
    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;
    return data[0].updated_at;
  } catch {
    return null;
  }
}
