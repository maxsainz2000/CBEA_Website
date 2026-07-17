import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EntryTable from './EntryTable';
import { BudgetEntry } from '@/lib/types';
import { deleteEntry } from '@/app/actions/entries';

vi.mock('@/app/actions/entries', () => ({
  deleteEntry: vi.fn(),
}));

const mockEntries: BudgetEntry[] = [
  {
    id: 'b1',
    type: 'income',
    description: 'Membership Fees',
    category: 'Fees',
    amount: 150000,
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
    amount: 50000,
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

describe('EntryTable Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty table when no entries are provided', () => {
    render(<EntryTable entries={[]} />);
    expect(screen.getByTestId('admin-entry-table')).toBeDefined();
    expect(screen.getByText('No records found in the database.')).toBeDefined();
  });

  it('renders entries in a table with appropriate details', () => {
    render(<EntryTable entries={mockEntries} />);

    expect(screen.getByTestId('admin-entry-table')).toBeDefined();
    expect(screen.getByText('Membership Fees')).toBeDefined();
    expect(screen.getByText('Office Supplies')).toBeDefined();

    // Amount checks
    expect(screen.getByText('+₱1,500.00')).toBeDefined();
    expect(screen.getByText('-₱500.00')).toBeDefined();

    // Type checks
    expect(screen.getByText('Income')).toBeDefined();
    expect(screen.getByText('Expense')).toBeDefined();

    // Edit/Delete buttons exist
    const editBtn = screen.getByTestId('edit-btn-b1');
    expect(editBtn).toBeDefined();
    expect(editBtn.getAttribute('href')).toBe('/admin/edit/b1');
    expect(screen.getByTestId('delete-btn-b1')).toBeDefined();
  });

  it('handles delete confirmation flow correctly (showing Cancel/Confirm buttons)', async () => {
    render(<EntryTable entries={mockEntries} />);

    const deleteBtn = screen.getByTestId('delete-btn-b1');
    fireEvent.click(deleteBtn);

    // Should show "Confirm Delete?" and "Cancel" buttons, hide "Edit" and "Delete"
    expect(screen.queryByTestId('delete-btn-b1')).toBeNull();
    expect(screen.queryByTestId('edit-btn-b1')).toBeNull();
    expect(screen.getByTestId('confirm-delete-b1')).toBeDefined();
    expect(screen.getByTestId('cancel-delete-b1')).toBeDefined();

    // Click cancel
    const cancelBtn = screen.getByTestId('cancel-delete-b1');
    fireEvent.click(cancelBtn);

    // Revert back to original buttons
    expect(screen.getByTestId('delete-btn-b1')).toBeDefined();
    expect(screen.getByTestId('edit-btn-b1')).toBeDefined();
    expect(screen.queryByTestId('confirm-delete-b1')).toBeNull();
    expect(screen.queryByTestId('cancel-delete-b1')).toBeNull();
  });

  it('calls deleteEntry action when confirming delete', async () => {
    (deleteEntry as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    render(<EntryTable entries={mockEntries} />);

    // Trigger delete confirmation
    fireEvent.click(screen.getByTestId('delete-btn-b2'));

    // Confirm
    const confirmBtn = screen.getByTestId('confirm-delete-b2');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteEntry).toHaveBeenCalledTimes(1);
      expect(deleteEntry).toHaveBeenCalledWith('b2');
    });
  });

  it('renders error message when delete action fails', async () => {
    (deleteEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Cannot delete: record is locked.',
    });

    render(<EntryTable entries={mockEntries} />);

    // Trigger delete confirmation
    fireEvent.click(screen.getByTestId('delete-btn-b1'));

    // Confirm
    const confirmBtn = screen.getByTestId('confirm-delete-b1');
    fireEvent.click(confirmBtn);

    const errMsg = await screen.findByTestId('table-error-message');
    expect(errMsg.textContent).toContain('Cannot delete: record is locked.');
  });
});
