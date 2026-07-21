'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BudgetEntry, BudgetEntrySchema } from '@/lib/types';
import { createEntry, updateEntry } from '@/app/actions/entries';

// Form initial data: amount is in decimal pesos (user-facing), NOT centavos.
// This is distinct from BudgetEntry (which stores amount as integer centavos).
export type EntryFormInitialData = Omit<BudgetEntry, 'amount'> & {
  amount: number; // decimal pesos
};

interface EntryFormProps {
  initialData?: EntryFormInitialData;
}

export default function EntryForm({ initialData }: EntryFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: initialData?.type || 'expense',
    description: initialData?.description || '',
    category: initialData?.category || '',
    amount: initialData?.amount !== undefined ? String(initialData.amount) : '',
    date: initialData?.date || '',
    semester: initialData?.semester || '1st Sem',
    academic_year: initialData?.academic_year || '2025-2026',
    notes: initialData?.notes || '',
    status: initialData?.status || 'paid',
  });

  useEffect(() => {
    if (!formData.date) {
      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split('T')[0],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleTypeChange = (type: 'income' | 'expense') => {
    setFormData((prev) => ({ ...prev, type }));
    if (validationErrors.type) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy.type;
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setValidationErrors({});

    const amountNum = parseFloat(formData.amount);
    const dataToValidate = {
      ...formData,
      amount: isNaN(amountNum) ? undefined : amountNum,
      notes: formData.notes.trim() || null,
    };

    // Client-side validation
    const validation = BudgetEntrySchema.safeParse(dataToValidate);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setValidationErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let response;
      if (initialData?.id) {
        response = await updateEntry(initialData.id, dataToValidate);
      } else {
        response = await createEntry(dataToValidate);
      }

      if (response.success) {
        router.push('/admin');
        router.refresh();
      } else {
        if (response.validationErrors) {
          const serverValErrors: Record<string, string> = {};
          for (const [key, val] of Object.entries(response.validationErrors)) {
            serverValErrors[key] = val.join(', ');
          }
          setValidationErrors(serverValErrors);
        }
        setServerError(response.error || 'Failed to submit the form.');
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg bg-surface p-lg w-full min-w-[300px] max-w-xl mx-auto" data-testid="entry-form">
      <h2 className="font-headline-md text-headline-md text-on-background select-none">
        {initialData ? 'Edit Budget Record' : 'Add New Budget Record'}
      </h2>

      {serverError && (
        <div role="alert" className="p-sm bg-surface border-l-4 border-error text-error font-body-sm text-body-sm select-none" data-testid="form-server-error">
          {serverError}
        </div>
      )}

      {/* Field: Type (Income/Expense toggle) */}
      <div className="flex flex-col gap-xs">
        <fieldset role="radiogroup" aria-label="Transaction Type" className="border-0 p-0 m-0">
          <legend className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none mb-xs">
            Transaction Type
          </legend>
          <div className="grid grid-cols-2 gap-0 border border-outline h-12">
            <button
              type="button"
              role="radio"
              aria-checked={formData.type === 'income'}
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center cursor-pointer select-none font-body-sm-strong transition-all ${
                formData.type === 'income'
                  ? 'bg-income text-on-income'
                  : 'bg-transparent text-secondary hover:bg-outline/50'
              }`}
              data-testid="type-toggle-income"
            >
              INCOME
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={formData.type === 'expense'}
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center cursor-pointer select-none font-body-sm-strong transition-all ${
                formData.type === 'expense'
                  ? 'bg-expense text-on-expense'
                  : 'bg-transparent text-secondary hover:bg-outline/50'
              }`}
              data-testid="type-toggle-expense"
            >
              EXPENSE
            </button>
          </div>
        </fieldset>
        {validationErrors.type && (
          <span className="font-caption text-caption text-error" data-testid="error-type">
            {validationErrors.type}
          </span>
        )}
      </div>

      {/* Field: Description */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="description" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Description
        </label>
        <input
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={handleChange}
          className={`input-underline ${validationErrors.description ? 'input-underline-error' : ''}`}
          placeholder="e.g. Acquaintance Party Ticket Sales"
          data-testid="description-input"
        />
        {validationErrors.description && (
          <span className="font-caption text-caption text-error" data-testid="error-description">
            {validationErrors.description}
          </span>
        )}
      </div>

      {/* Field: Category */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="category" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          value={formData.category}
          onChange={handleChange}
          className={`input-underline ${validationErrors.category ? 'input-underline-error' : ''}`}
          placeholder="e.g. Ticket Sales"
          data-testid="category-input"
        />
        {validationErrors.category && (
          <span className="font-caption text-caption text-error" data-testid="error-category">
            {validationErrors.category}
          </span>
        )}
      </div>

      {/* Field: Amount */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="amount" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Amount (PHP)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.amount}
          onChange={handleChange}
          className={`input-underline ${validationErrors.amount ? 'input-underline-error' : ''}`}
          placeholder="e.g. 1500.50"
          data-testid="amount-input"
        />
        {validationErrors.amount && (
          <span className="font-caption text-caption text-error" data-testid="error-amount">
            {validationErrors.amount}
          </span>
        )}
      </div>

      {/* Field: Date */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="date" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Transaction Date
        </label>
        <input
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          className={`input-underline ${validationErrors.date ? 'input-underline-error' : ''}`}
          data-testid="date-input"
        />
        {validationErrors.date && (
          <span className="font-caption text-caption text-error" data-testid="error-date">
            {validationErrors.date}
          </span>
        )}
      </div>

      {/* Grid: Semester & Academic Year */}
      <div className="grid grid-cols-2 gap-md">
        <div className="flex flex-col gap-xs">
          <label htmlFor="semester" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
            Semester
          </label>
          <select
            id="semester"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className={`input-underline bg-transparent outline-none ${validationErrors.semester ? 'input-underline-error' : ''}`}
            data-testid="semester-input"
          >
            <option value="1st Sem">1st Sem</option>
            <option value="2nd Sem">2nd Sem</option>
            <option value="Summer">Summer</option>
          </select>
          {validationErrors.semester && (
            <span className="font-caption text-caption text-error" data-testid="error-semester">
              {validationErrors.semester}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-xs">
          <label htmlFor="academic_year" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
            Academic Year
          </label>
          <input
            id="academic_year"
            name="academic_year"
            type="text"
            value={formData.academic_year}
            onChange={handleChange}
            className={`input-underline ${validationErrors.academic_year ? 'input-underline-error' : ''}`}
            placeholder="e.g. 2025-2026"
            data-testid="academic-year-input"
          />
          {validationErrors.academic_year && (
            <span className="font-caption text-caption text-error" data-testid="error-academic-year">
              {validationErrors.academic_year}
            </span>
          )}
        </div>
      </div>

      {/* Field: Notes */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="notes" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Notes / Remarks
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="input-underline min-h-20 max-h-40 resize-y"
          placeholder="Enter any additional details..."
          data-testid="notes-input"
        />
      </div>

      {/* Field: Status */}
      <div className="flex flex-col gap-xs">
        <label htmlFor="status" className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
          Status Code
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="input-underline bg-transparent outline-none"
          data-testid="status-input"
        >
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Submit & Cancel Actions */}
      <div className="flex items-center justify-end gap-sm mt-md">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="btn-ghost flex items-center justify-center cursor-pointer select-none text-body-sm h-12"
          data-testid="cancel-form-button"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center justify-center cursor-pointer select-none h-12 px-lg"
          data-testid="submit-form-button"
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Record' : 'Create Record'}
        </button>
      </div>
    </form>
  );
}
