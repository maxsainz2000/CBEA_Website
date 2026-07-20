import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditEntryPage from './page';
import { getOfficer } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to ${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('Not Found');
  }),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getOfficer: vi.fn(),
}));

const mockMaybeSingle = vi.fn();
const mockEqSecond = vi.fn(() => ({
  maybeSingle: mockMaybeSingle,
}));
const mockEqFirst = vi.fn(() => ({
  eq: mockEqSecond,
}));
const mockSelect = vi.fn(() => ({
  eq: mockEqFirst,
}));
const mockFrom = vi.fn(() => ({
  select: mockSelect,
}));
const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}));

const mockGetOfficer = vi.mocked(getOfficer);

describe('EditEntryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);

    await expect(
      EditEntryPage({ params: Promise.resolve({ id: 'e1' }) })
    ).rejects.toThrow('Redirect to /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('calls notFound() if entry does not exist or officer does not own it', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      EditEntryPage({ params: Promise.resolve({ id: 'e1' }) })
    ).rejects.toThrow('Not Found');

    expect(mockFrom).toHaveBeenCalledWith('budget_entries');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEqFirst).toHaveBeenCalledWith('id', 'e1');
    expect(mockEqSecond).toHaveBeenCalledWith('entered_by', 'o1');
    expect(notFound).toHaveBeenCalled();
  });

  it('calls notFound() if database query returns an error', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Database failure' },
    });

    await expect(
      EditEntryPage({ params: Promise.resolve({ id: 'e1' }) })
    ).rejects.toThrow('Not Found');

    expect(notFound).toHaveBeenCalled();
  });

  it('renders pre-populated EntryForm when entry is found and owned by officer', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: 'e1',
        type: 'income',
        description: 'Semester Membership Fees',
        category: 'Fees',
        amount: 25000, // 250 pesos in centavos
        date: '2026-07-20',
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: 'Pre-populated notes',
        status: 'paid',
        entered_by: 'o1',
      },
      error: null,
    });

    const jsx = await EditEntryPage({ params: Promise.resolve({ id: 'e1' }) });
    render(jsx);

    expect(screen.getByText('Modify Entry')).toBeDefined();
    expect(screen.getByText('Edit Budget Record')).toBeDefined();
    
    // Check that form input values are pre-filled correctly
    expect((screen.getByTestId('description-input') as HTMLInputElement).value).toBe('Semester Membership Fees');
    expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('250'); // 25000 cents -> 250 pesos
    expect((screen.getByTestId('notes-input') as HTMLTextAreaElement).value).toBe('Pre-populated notes');
  });
});
