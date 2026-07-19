/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEntries } from './entries';
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

  const setupMockSupabase = (data: any, error: any) => {
    mockQuery = {
      select: vi.fn().mockImplementation(() => mockQuery),
      eq: vi.fn().mockImplementation(() => mockQuery),
      ilike: vi.fn().mockImplementation(() => mockQuery),
      order: vi.fn().mockImplementation(() => mockQuery),
      then: vi.fn().mockImplementation((onfulfilled) => {
        return Promise.resolve({ data, error }).then(onfulfilled);
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
    setupMockSupabase(null, null);

    const result = await getEntries();

    expect(result).toEqual({
      status: 'ok',
      data: [],
    });
  });

  it('NEVER returns mock data', async () => {
    setupMockSupabase(null, { message: 'Database connection failed' });

    const result = await getEntries();

    expect(result.status).toBe('error');
    expect(result).not.toHaveProperty('data');
    // Ensure it doesn't return MOCK_ENTRIES or fallback values
    expect((result as any).data).toBeUndefined();
  });
});
