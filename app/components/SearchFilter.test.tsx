import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchFilter from './SearchFilter';

describe('SearchFilter Component', () => {
  it('renders search input with placeholder', () => {
    render(
      <SearchFilter
        searchQuery=""
        onSearchChange={vi.fn()}
        categories={[]}
        selectedCategory=""
        onCategoryChange={vi.fn()}
      />
    );

    const input = screen.getByTestId('search-input') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.getAttribute('placeholder')).toBe('Search budget entries...');
  });

  it('renders custom placeholder when provided', () => {
    render(
      <SearchFilter
        searchQuery=""
        onSearchChange={vi.fn()}
        categories={[]}
        selectedCategory=""
        onCategoryChange={vi.fn()}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeDefined();
  });

  it('calls onSearchChange when typing in the search input', () => {
    const handleSearchChange = vi.fn();
    render(
      <SearchFilter
        searchQuery=""
        onSearchChange={handleSearchChange}
        categories={[]}
        selectedCategory=""
        onCategoryChange={vi.fn()}
      />
    );

    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'party' } });

    expect(handleSearchChange).toHaveBeenCalledTimes(1);
    expect(handleSearchChange).toHaveBeenCalledWith('party');
  });

  it('renders category chips and triggers onCategoryChange on click', () => {
    const handleCategoryChange = vi.fn();
    const categories = ['All', 'Fees', 'Rental'];

    render(
      <SearchFilter
        searchQuery=""
        onSearchChange={vi.fn()}
        categories={categories}
        selectedCategory="All"
        onCategoryChange={handleCategoryChange}
      />
    );

    // Check all chips render
    categories.forEach(cat => {
      expect(screen.getByTestId(`category-chip-${cat}`)).toBeDefined();
    });

    // Check active class on selected category
    const activeChip = screen.getByTestId('category-chip-All');
    expect(activeChip.className).toContain('bg-primary');
    expect(activeChip.className).toContain('text-on-primary');

    // Check inactive class on other category
    const inactiveChip = screen.getByTestId('category-chip-Fees');
    expect(inactiveChip.className).toContain('bg-surface');

    // Click inactive chip
    fireEvent.click(inactiveChip);
    expect(handleCategoryChange).toHaveBeenCalledTimes(1);
    expect(handleCategoryChange).toHaveBeenCalledWith('Fees');
  });
});
