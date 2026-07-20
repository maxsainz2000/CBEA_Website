import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EntryForm, { EntryFormInitialData } from './EntryForm';
import { createEntry, updateEntry } from '@/app/actions/entries';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock('@/app/actions/entries', () => ({
  createEntry: vi.fn(),
  updateEntry: vi.fn(),
}));

const mockInitialData: EntryFormInitialData = {
  id: 'b1',
  type: 'income',
  description: 'Membership Fee Collection',
  category: 'Fees',
  amount: 1500, // decimal pesos -> ₱1,500.00 (form receives pesos, not centavos)
  date: '2025-01-15',
  semester: '1st Sem',
  academic_year: '2024-2025',
  notes: 'Notes text',
  status: 'paid',
  entered_by: 'officer-1',
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

describe('EntryForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Add form with default empty values', () => {
    render(<EntryForm />);

    expect(screen.getByText('Add New Budget Record')).toBeDefined();
    
    // Default type is expense, check styling
    expect(screen.getByTestId('type-toggle-expense').className).toContain('bg-expense');
    expect(screen.getByTestId('type-toggle-income').className).not.toContain('bg-income');

    expect((screen.getByTestId('description-input') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('category-input') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('');
    expect((screen.getByTestId('notes-input') as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByTestId('semester-input') as HTMLSelectElement).value).toBe('1st Sem');
    expect((screen.getByTestId('academic-year-input') as HTMLInputElement).value).toBe('2025-2026');
    expect((screen.getByTestId('status-input') as HTMLSelectElement).value).toBe('paid');
  });

  it('renders Edit form with initial data values', () => {
    render(<EntryForm initialData={mockInitialData} />);

    expect(screen.getByText('Edit Budget Record')).toBeDefined();
    
    // Type is income, check styling
    expect(screen.getByTestId('type-toggle-income').className).toContain('bg-income');
    expect(screen.getByTestId('type-toggle-expense').className).not.toContain('bg-expense');

    expect((screen.getByTestId('description-input') as HTMLInputElement).value).toBe('Membership Fee Collection');
    expect((screen.getByTestId('category-input') as HTMLInputElement).value).toBe('Fees');
    expect((screen.getByTestId('amount-input') as HTMLInputElement).value).toBe('1500'); // form receives pesos, not centavos
    expect((screen.getByTestId('notes-input') as HTMLTextAreaElement).value).toBe('Notes text');
    expect((screen.getByTestId('semester-input') as HTMLSelectElement).value).toBe('1st Sem');
    expect((screen.getByTestId('academic-year-input') as HTMLInputElement).value).toBe('2024-2025');
    expect((screen.getByTestId('status-input') as HTMLSelectElement).value).toBe('paid');
  });

  it('toggles transaction type on button click', () => {
    render(<EntryForm />);

    const incomeToggle = screen.getByTestId('type-toggle-income');
    const expenseToggle = screen.getByTestId('type-toggle-expense');

    // Default: expense
    expect(expenseToggle.className).toContain('bg-expense');

    // Click income
    fireEvent.click(incomeToggle);
    expect(incomeToggle.className).toContain('bg-income');
    expect(expenseToggle.className).not.toContain('bg-expense');
  });

  it('toggles aria-checked on type buttons', () => {
    render(<EntryForm />);

    const incomeToggle = screen.getByTestId('type-toggle-income');
    const expenseToggle = screen.getByTestId('type-toggle-expense');

    // Default: expense
    expect(expenseToggle.getAttribute('aria-checked')).toBe('true');
    expect(incomeToggle.getAttribute('aria-checked')).toBe('false');

    // Click income
    fireEvent.click(incomeToggle);
    expect(incomeToggle.getAttribute('aria-checked')).toBe('true');
    expect(expenseToggle.getAttribute('aria-checked')).toBe('false');
  });

  it('initializes date to empty then updates to today in useEffect', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    render(<EntryForm />);
    const dateInput = screen.getByTestId('date-input') as HTMLInputElement;
    expect(dateInput.value).toBe(todayStr);
  });

  it('triggers client-side validations on empty inputs', async () => {
    render(<EntryForm />);

    const submitBtn = screen.getByTestId('submit-form-button');
    fireEvent.click(submitBtn);

    // Should show error validation messages
    const errorDesc = await screen.findByTestId('error-description');
    const errorCat = await screen.findByTestId('error-category');
    const errorAmt = await screen.findByTestId('error-amount');

    expect(errorDesc.textContent).toContain('required');
    expect(errorCat.textContent).toContain('required');
    expect(errorAmt.textContent).toContain('required');
    
    expect(createEntry).not.toHaveBeenCalled();
  });

  it('submits form successfully and calls createEntry action for Add mode', async () => {
    (createEntry as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    render(<EntryForm />);

    // Fill form
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'New Chair' } });
    fireEvent.change(screen.getByTestId('category-input'), { target: { value: 'Equipment' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '15000' } });
    fireEvent.change(screen.getByTestId('academic-year-input'), { target: { value: '2025-2026' } });

    // Submit
    fireEvent.click(screen.getByTestId('submit-form-button'));

    await waitFor(() => {
      expect(createEntry).toHaveBeenCalledTimes(1);
      expect(createEntry).toHaveBeenCalledWith({
        type: 'expense',
        description: 'New Chair',
        category: 'Equipment',
        amount: 15000,
        date: expect.any(String),
        semester: '1st Sem',
        academic_year: '2025-2026',
        notes: null,
        status: 'paid',
      });
      expect(mockPush).toHaveBeenCalledWith('/admin');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('submits form successfully and calls updateEntry action for Edit mode', async () => {
    (updateEntry as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    render(<EntryForm initialData={mockInitialData} />);

    // Edit description
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'Updated Membership Fee' } });

    // Submit
    fireEvent.click(screen.getByTestId('submit-form-button'));

    await waitFor(() => {
      expect(updateEntry).toHaveBeenCalledTimes(1);
      expect(updateEntry).toHaveBeenCalledWith('b1', {
        type: 'income',
        description: 'Updated Membership Fee',
        category: 'Fees',
        amount: 1500,
        date: '2025-01-15',
        semester: '1st Sem',
        academic_year: '2024-2025',
        notes: 'Notes text',
        status: 'paid',
      });
      expect(mockPush).toHaveBeenCalledWith('/admin');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('renders server validation errors returned by action', async () => {
    (createEntry as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      error: 'Form validation failed.',
      validationErrors: {
        description: ['Description is too short.'],
      },
    });

    render(<EntryForm />);

    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'a' } });
    fireEvent.change(screen.getByTestId('category-input'), { target: { value: 'Equipment' } });
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '15000' } });

    fireEvent.click(screen.getByTestId('submit-form-button'));

    const errorDesc = await screen.findByTestId('error-description');
    const serverErr = await screen.findByTestId('form-server-error');

    expect(errorDesc.textContent).toContain('Description is too short.');
    expect(serverErr.textContent).toContain('Form validation failed.');
  });
});
