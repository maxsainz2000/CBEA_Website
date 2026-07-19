import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ClientFilters from './ClientFilters';

const mockPush = vi.fn();
const mockPathname = '/';
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

describe('ClientFilters Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders semesters, categories, and search input correctly', () => {
    render(
      <ClientFilters
        semesters={['1st Sem', '2nd Sem']}
        categories={['Fees', 'Rental']}
        initialSemester="1st Sem"
        initialCategory=""
        initialSearch=""
      />
    );

    expect(screen.getByTestId('client-filters-container')).toBeDefined();
    expect(screen.getByTestId('pivot-tab-1st Sem')).toBeDefined();
    expect(screen.getByTestId('pivot-tab-2nd Sem')).toBeDefined();
    expect(screen.getByTestId('category-chip-All')).toBeDefined();
    expect(screen.getByTestId('category-chip-Fees')).toBeDefined();
    expect(screen.getByTestId('search-input')).toBeDefined();
  });

  it('updates URL on semester tab selection change', () => {
    render(
      <ClientFilters
        semesters={['1st Sem', '2nd Sem']}
        categories={['Fees']}
        initialSemester="1st Sem"
        initialCategory=""
        initialSearch=""
      />
    );

    const secondSemTab = screen.getByTestId('pivot-tab-2nd Sem');
    fireEvent.click(secondSemTab);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/?semester=2nd+Sem');
  });

  it('updates URL on category chip selection change', () => {
    render(
      <ClientFilters
        semesters={['1st Sem']}
        categories={['Fees', 'Rental']}
        initialSemester="1st Sem"
        initialCategory="All"
        initialSearch=""
      />
    );

    const feesChip = screen.getByTestId('category-chip-Fees');
    fireEvent.click(feesChip);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/?category=Fees');
  });

  it('clears category parameter when "All" is selected', () => {
    mockSearchParams.set('category', 'Fees');
    render(
      <ClientFilters
        semesters={['1st Sem']}
        categories={['Fees']}
        initialSemester="1st Sem"
        initialCategory="Fees"
        initialSearch=""
      />
    );

    const allChip = screen.getByTestId('category-chip-All');
    fireEvent.click(allChip);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalledWith(
      expect.stringContaining('category=')
    );
  });

  it('debounces search input updates and pushes to router', () => {
    render(
      <ClientFilters
        semesters={['1st Sem']}
        categories={['Fees']}
        initialSemester="1st Sem"
        initialCategory=""
        initialSearch=""
      />
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'party' } });

    // Should not have been called immediately
    expect(mockPush).not.toHaveBeenCalled();

    // Advance timer by 299ms - still not called
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(mockPush).not.toHaveBeenCalled();

    // Advance to 300ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/?search=party');
  });
});
