import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminPage from './page';
import { getOfficer } from '@/lib/auth/session';
import { getEntries, getSummaryStats, getSemesters, getLastUpdatedDate } from '@/lib/data/entries';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to ${url}`);
  }),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/auth/session', () => ({
  getOfficer: vi.fn(),
}));

vi.mock('@/lib/data/entries', () => ({
  getEntries: vi.fn(),
  getSummaryStats: vi.fn(),
  getSemesters: vi.fn(),
  getLastUpdatedDate: vi.fn(),
}));

const mockGetOfficer = vi.mocked(getOfficer);
const mockGetEntries = vi.mocked(getEntries);
const mockGetSummaryStats = vi.mocked(getSummaryStats);
const mockGetSemesters = vi.mocked(getSemesters);
const mockGetLastUpdatedDate = vi.mocked(getLastUpdatedDate);

describe('AdminPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLastUpdatedDate.mockResolvedValue('2026-07-20T00:00:00Z');
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);

    await expect(
      AdminPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow('Redirect to /login');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders dashboard successfully when authenticated', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockGetSemesters.mockResolvedValue({
      status: 'ok',
      data: ['1st Sem', '2nd Sem'],
    });

    mockGetEntries.mockResolvedValue({
      status: 'ok',
      data: {
        entries: [
          {
            id: 'e1',
            type: 'expense',
            description: 'Office Supplies Purchase',
            category: 'Supplies',
            amount: 5000, // 50 pesos
            date: '2026-07-20',
            semester: '1st Sem',
            academic_year: '2025-2026',
            notes: null,
            status: 'paid',
            entered_by: 'o1',
            created_at: '2026-07-20T00:00:00Z',
            updated_at: '2026-07-20T00:00:00Z',
          },
        ],
        totalCount: 1,
        hasMore: false,
      },
    });

    mockGetSummaryStats.mockResolvedValue({
      status: 'ok',
      data: {
        totalCollected: 100000,
        totalSpent: 5000,
        remainingBalance: 95000,
      },
    });

    const jsx = await AdminPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    // Verify officer details rendering
    expect(screen.getByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('Treasurer')).toBeDefined();
    expect(screen.getByText('Add New Entry')).toBeDefined();

    // Verify statistics cards are rendered (case-insensitive checks)
    expect(screen.getByText(/Remaining Balance/i)).toBeDefined();
    
    // Verify entry table items
    expect(screen.getByText('Office Supplies Purchase')).toBeDefined();
  });

  it('renders error banner when getSemesters fails', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockGetSemesters.mockResolvedValue({
      status: 'error',
      message: 'Failed to load semesters.',
    });

    const jsx = await AdminPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText('Failed to load semesters.')).toBeDefined();
  });

  it('renders error banner when entries or statistics fetch fails', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    mockGetSemesters.mockResolvedValue({
      status: 'ok',
      data: ['1st Sem'],
    });

    mockGetEntries.mockResolvedValue({
      status: 'error',
      message: 'Connection failed.',
    });

    mockGetSummaryStats.mockResolvedValue({
      status: 'ok',
      data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 },
    });

    const jsx = await AdminPage({ searchParams: Promise.resolve({}) });
    render(jsx);

    expect(screen.getByText("We couldn't load budget data. Please try again later.")).toBeDefined();
  });
});
