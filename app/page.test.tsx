import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Homepage, { HomepageContent } from './page';
import { getEntries, getSummaryStats, getSemesters, getCategories, getLastUpdatedDate } from '@/lib/data/entries';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/data/entries', () => ({
  getEntries: vi.fn(),
  getSummaryStats: vi.fn(),
  getSemesters: vi.fn(),
  getCategories: vi.fn(),
  getLastUpdatedDate: vi.fn(),
}));

const mockGetEntries = vi.mocked(getEntries);
const mockGetSummaryStats = vi.mocked(getSummaryStats);
const mockGetSemesters = vi.mocked(getSemesters);
const mockGetCategories = vi.mocked(getCategories);
const mockGetLastUpdatedDate = vi.mocked(getLastUpdatedDate);

describe('Homepage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLastUpdatedDate.mockResolvedValue('2026-07-20T00:00:00Z');
  });

  it('renders synchronous Homepage wrapper with Title and fallback loader', async () => {
    mockGetSemesters.mockResolvedValue({ status: 'ok', data: [] });
    mockGetEntries.mockResolvedValue({ status: 'ok', data: { entries: [], totalCount: 0, hasMore: false } });
    mockGetSummaryStats.mockResolvedValue({ status: 'ok', data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 } });
    mockGetCategories.mockResolvedValue({ status: 'ok', data: [] });

    await act(async () => {
      render(<Homepage searchParams={Promise.resolve({})} />);
    });
    
    expect(screen.getByText('Public Transparency Portal')).toBeDefined();
    expect(screen.getByText('CBEA Student Council Budget Transparency')).toBeDefined();
  });
});

describe('HomepageContent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully on valid data fetches', async () => {
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
            type: 'income',
            description: 'Mock Income Entry',
            category: 'Fees',
            amount: 10000,
            date: '2026-07-20',
            semester: '1st Sem',
            academic_year: '2025-2026',
            notes: null,
            status: 'paid',
            entered_by: 'officer-1',
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
        totalCollected: 10000,
        totalSpent: 0,
        remainingBalance: 10000,
      },
    });
    mockGetCategories.mockResolvedValue({
      status: 'ok',
      data: ['Fees', 'Supplies'],
    });

    const jsx = await HomepageContent({
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText(/Remaining Balance/i)).toBeDefined();
    expect(screen.getByText(/Total Collected/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/search/i)).toBeDefined();
    expect(screen.getByText('Mock Income Entry')).toBeDefined();
  });

  it('renders ErrorBanner when getSemesters fails', async () => {
    mockGetSemesters.mockResolvedValue({
      status: 'error',
      message: 'Failed to retrieve semesters from DB.',
    });

    const jsx = await HomepageContent({
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText('Failed to retrieve semesters from DB.')).toBeDefined();
  });

  it('renders fallback ErrorBanner when other fetches fail', async () => {
    mockGetSemesters.mockResolvedValue({
      status: 'ok',
      data: ['1st Sem'],
    });
    mockGetEntries.mockResolvedValue({
      status: 'error',
      message: 'Failed to retrieve entries.',
    });
    mockGetSummaryStats.mockResolvedValue({
      status: 'ok',
      data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 },
    });
    mockGetCategories.mockResolvedValue({
      status: 'ok',
      data: [],
    });

    const jsx = await HomepageContent({
      searchParams: Promise.resolve({}),
    });
    render(jsx);

    expect(screen.getByText("We couldn't load budget data. Please try again later.")).toBeDefined();
  });

  it('passes searchParams properly to data fetchers', async () => {
    mockGetSemesters.mockResolvedValue({
      status: 'ok',
      data: ['2nd Sem'],
    });
    mockGetEntries.mockResolvedValue({
      status: 'ok',
      data: { entries: [], totalCount: 0, hasMore: false },
    });
    mockGetSummaryStats.mockResolvedValue({
      status: 'ok',
      data: { totalCollected: 0, totalSpent: 0, remainingBalance: 0 },
    });
    mockGetCategories.mockResolvedValue({
      status: 'ok',
      data: [],
    });

    const jsx = await HomepageContent({
      searchParams: Promise.resolve({
        semester: '2nd Sem',
        category: 'Supplies',
        search: 'eraser',
        page: '2',
      }),
    });
    render(jsx);

    expect(mockGetEntries).toHaveBeenCalledWith({
      semester: '2nd Sem',
      category: 'Supplies',
      search: 'eraser',
      page: 2,
    });
    expect(mockGetSummaryStats).toHaveBeenCalledWith('2nd Sem');
  });
});
