/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntries, getSummaryStats, getLastUpdatedDate } from './entries';
import { createClient } from '../supabase/server';

vi.mock('../supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('getEntries', () => {
  let mockQuery: any;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMockSupabase = (data: any, error: any, count: number | null = null) => {
    mockQuery = {
      select: vi.fn().mockImplementation(() => mockQuery),
      eq: vi.fn().mockImplementation(() => mockQuery),
      ilike: vi.fn().mockImplementation(() => mockQuery),
      order: vi.fn().mockImplementation(() => mockQuery),
      range: vi.fn().mockImplementation(() => mockQuery),
      limit: vi.fn().mockImplementation(() => mockQuery),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve({ data, error, count }).then(onfulfilled);
      }),
    };

    mockSupabase = {
      from: vi.fn().mockImplementation(() => mockQuery),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  };

  it('returns error status when Supabase returns an error', async () => {
    setupMockSupabase(null, { message: 'Database is down' });

    const result = await getEntries();

    expect(result).toEqual({
      status: 'error',
      message: "We couldn't load budget entries. Please try again later.",
    });
  });

  it('returns error status when an unhandled exception is thrown', async () => {
    // Force createClient to throw an error
    vi.mocked(createClient).mockRejectedValue(new Error('Connection failure'));

    const result = await getEntries();

    expect(result).toEqual({
      status: 'error',
      message: "We couldn't load budget entries. Please try again later.",
    });
  });

  it('returns ok status with empty array when Supabase returns no data', async () => {
    setupMockSupabase(null, null, 0);

    const result = await getEntries();

    expect(result).toEqual({
      status: 'ok',
      data: {
        entries: [],
        totalCount: 0,
        hasMore: false,
      },
    });
  });

  it('returns paginated data with correct hasMore and totalCount', async () => {
    const mockData = Array(60).fill({
      id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
      type: 'income',
      description: 'a',
      category: 'Fees',
      amount: 100,
      date: '2025-01-15',
      semester: '1st Sem',
      academic_year: '2024-2025',
      notes: null,
      status: 'paid',
      entered_by: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    setupMockSupabase(mockData.slice(0, 50), null, 60);

    const result = await getEntries({ page: 1, pageSize: 50 });

    expect(result).toEqual({
      status: 'ok',
      data: {
        entries: mockData.slice(0, 50),
        totalCount: 60,
        hasMore: true,
      },
    });
    expect(mockQuery.range).toHaveBeenCalledWith(0, 49);
  });

  it('NEVER returns mock data', async () => {
    setupMockSupabase(null, { message: 'Database connection failed' });

    const result = await getEntries();

    expect(result.status).toBe('error');
    expect(result).not.toHaveProperty('data');
    // Ensure it doesn't return MOCK_ENTRIES or fallback values
    expect((result as any).data).toBeUndefined();
  });

  it('escapes ILIKE wildcards in search', async () => {
    setupMockSupabase([], null);

    await getEntries({ search: '100%_\\foo' });

    expect(mockQuery.ilike).toHaveBeenCalledWith('description', '%100\\%\\_\\\\foo%');
  });
});

describe('getSummaryStats', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupMockRpc = (data: any, error: any) => {
    mockSupabase = {
      rpc: vi.fn().mockResolvedValue({ data, error }),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  };

  it('returns zeros if semester is not provided', async () => {
    const result = await getSummaryStats();
    expect(result).toEqual({
      status: 'ok',
      data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 },
    });
  });

  it('calls rpc and returns correct statistics when database query succeeds', async () => {
    setupMockRpc(
      [
        {
          total_collected: 5000,
          total_spent: 3000,
          remaining_balance: 2000,
        },
      ],
      null
    );

    const result = await getSummaryStats('1st Sem');

    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_summary_stats', { p_semester: '1st Sem' });
    expect(result).toEqual({
      status: 'ok',
      data: {
        totalCollected: 5000,
        totalSpent: 3000,
        remainingBalance: 2000,
      },
    });
  });

  it('returns default zeros if rpc returns no data', async () => {
    setupMockRpc([], null);

    const result = await getSummaryStats('1st Sem');

    expect(result).toEqual({
      status: 'ok',
      data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 },
    });
  });

  it('returns error status when rpc call returns an error', async () => {
    setupMockRpc(null, { message: 'RPC execution failed' });

    const result = await getSummaryStats('1st Sem');

    expect(result).toEqual({
      status: 'error',
      message: "We couldn't load summary statistics. Please try again later.",
    });
  });

  it('returns error status when createClient or rpc throws an exception', async () => {
    vi.mocked(createClient).mockRejectedValue(new Error('Connection failure'));

    const result = await getSummaryStats('1st Sem');

    expect(result).toEqual({
      status: 'error',
      message: "We couldn't load summary statistics. Please try again later.",
    });
  });
});

describe('getLastUpdatedDate', () => {
  let mockQuery: any;
  let mockSupabase: any;

  const setupMockSupabase = (data: any, error: any) => {
    mockQuery = {
      select: vi.fn().mockImplementation(() => mockQuery),
      eq: vi.fn().mockImplementation(() => mockQuery),
      order: vi.fn().mockImplementation(() => mockQuery),
      limit: vi.fn().mockImplementation(() => mockQuery),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve({ data, error }).then(onfulfilled);
      }),
    };
    mockSupabase = {
      from: vi.fn().mockImplementation(() => mockQuery),
    };
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  };

  it('returns validated updated_at timestamp when database returns it', async () => {
    setupMockSupabase([{ updated_at: '2026-07-20T00:00:00Z' }], null);
    const result = await getLastUpdatedDate('1st Sem');
    expect(result).toBe('2026-07-20T00:00:00Z');
  });

  it('returns null on database error or empty payload', async () => {
    setupMockSupabase(null, { message: 'DB Error' });
    const result = await getLastUpdatedDate('1st Sem');
    expect(result).toBeNull();
  });

  it('returns null if validation fails (missing updated_at)', async () => {
    setupMockSupabase([{ not_updated_at: '2026-07-20' }], null);
    const result = await getLastUpdatedDate('1st Sem');
    expect(result).toBeNull();
  });
});
