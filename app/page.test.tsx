import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Homepage from './page';
import { getEntries, getSummaryStats, getSemesters, getCategories } from '@/lib/data/entries';

// Extract the private HomepageContent component using JSX tree traversal of the default-exported Homepage.
// Next.js pages strictly prohibit exporting anything other than page/metadata configurations,
// so this method avoids Next.js type compiler errors while retaining testability.
const getHomepageContentComponent = () => {
  const homepageElement = Homepage({ searchParams: Promise.resolve({}) });
  const mainElement = homepageElement.props.children[1];
  const suspenseElement = mainElement.props.children[1];
  const homepageContentElement = suspenseElement.props.children;
  return homepageContentElement.type;
};

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
}));

const mockGetEntries = vi.mocked(getEntries);
const mockGetSummaryStats = vi.mocked(getSummaryStats);
const mockGetSemesters = vi.mocked(getSemesters);
const mockGetCategories = vi.mocked(getCategories);

describe('Homepage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders synchronous Homepage wrapper with Title and fallback loader', () => {
    render(<Homepage searchParams={Promise.resolve({})} />);
    
    expect(screen.getByText('Public Transparency Portal')).toBeDefined();
    expect(screen.getByText('CBEA Student Council Budget Transparency')).toBeDefined();
    expect(screen.getByTestId('fallback-loader')).toBeDefined();
  });
});

describe('HomepageContent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders successfully on valid data fetches', async () => {
    const HomepageContent = getHomepageContentComponent();
    
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
    const HomepageContent = getHomepageContentComponent();
    
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
    const HomepageContent = getHomepageContentComponent();
    
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
    const HomepageContent = getHomepageContentComponent();
    
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
