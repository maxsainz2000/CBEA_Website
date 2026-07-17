import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BudgetEntryList from './BudgetEntryList';
import { BudgetEntry } from '../../lib/types';

const mockEntries: BudgetEntry[] = [
  {
    id: 'b1',
    type: 'income',
    description: 'Membership Fees',
    category: 'Fees',
    amount: 150000, // ₱1,500.00
    date: '2025-01-15',
    semester: '1st Sem',
    academic_year: '2024-2025',
    notes: 'Test note',
    status: 'paid',
    entered_by: 'officer-1',
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'b2',
    type: 'expense',
    description: 'Office Supplies',
    category: 'Supplies',
    amount: 50000, // -₱500.00
    date: '2025-01-16',
    semester: '1st Sem',
    academic_year: '2024-2025',
    notes: null,
    status: 'pending',
    entered_by: 'officer-1',
    created_at: '2025-01-16T00:00:00Z',
    updated_at: '2025-01-16T00:00:00Z',
  },
];

describe('BudgetEntryList Component', () => {
  it('renders default empty state message when no entries provided', () => {
    render(<BudgetEntryList entries={[]} />);
    expect(screen.getByTestId('budget-empty-state')).toBeDefined();
    expect(screen.getByText('No budget entries found.')).toBeDefined();
  });

  it('renders custom empty state message when specified', () => {
    render(<BudgetEntryList entries={[]} emptyMessage="Custom empty message" />);
    expect(screen.getByText('Custom empty message')).toBeDefined();
  });

  it('renders populated entries with correct formatting', () => {
    render(<BudgetEntryList entries={mockEntries} />);
    
    expect(screen.getByTestId('budget-entry-list')).toBeDefined();
    
    // Check descriptions and categories (use specific regex matching to avoid collision)
    expect(screen.getByText('Membership Fees')).toBeDefined();
    expect(screen.getByText('Office Supplies')).toBeDefined();
    expect(screen.getByText(/Fees •/)).toBeDefined();
    expect(screen.getByText(/Supplies •/)).toBeDefined();

    // Check amounts
    expect(screen.getByText('+₱1,500.00')).toBeDefined();
    expect(screen.getByText('-₱500.00')).toBeDefined();

    // Check status badges
    expect(screen.getByText('paid')).toBeDefined();
    expect(screen.getByText('pending')).toBeDefined();
  });

  it('calls onEntryClick when an entry row is clicked', () => {
    const handleEntryClick = vi.fn();
    render(<BudgetEntryList entries={mockEntries} onEntryClick={handleEntryClick} />);

    const row = screen.getByTestId('budget-entry-row-b1');
    fireEvent.click(row);

    expect(handleEntryClick).toHaveBeenCalledTimes(1);
    expect(handleEntryClick).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('calls onEntryClick when Enter key is pressed on an entry row', () => {
    const handleEntryClick = vi.fn();
    render(<BudgetEntryList entries={mockEntries} onEntryClick={handleEntryClick} />);

    const row = screen.getByTestId('budget-entry-row-b2');
    fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });

    expect(handleEntryClick).toHaveBeenCalledTimes(1);
    expect(handleEntryClick).toHaveBeenCalledWith(mockEntries[1]);
  });

  it('calls onEntryClick when Space key is pressed on an entry row', () => {
    const handleEntryClick = vi.fn();
    render(<BudgetEntryList entries={mockEntries} onEntryClick={handleEntryClick} />);

    const row = screen.getByTestId('budget-entry-row-b1');
    fireEvent.keyDown(row, { key: ' ', code: 'Space' });

    expect(handleEntryClick).toHaveBeenCalledTimes(1);
  });
});
