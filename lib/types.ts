import { z } from 'zod'

export type BudgetEntry = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number; // Stored as integer centavos
  date: string; // ISO date string (YYYY-MM-DD)
  semester: string;
  academic_year: string;
  notes: string | null;
  status: 'paid' | 'pending' | 'flagged';
  entered_by: string | null;
  created_at: string;
  updated_at: string;
};

export const BudgetEntrySchema = z.object({
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: "Type must be either 'income' or 'expense'" }),
  }),
  description: z.string().min(1, "Description is required").max(255, "Description must be 255 characters or less"),
  category: z.string().min(1, "Category is required").max(100, "Category must be 100 characters or less"),
  amount: z.number({ required_error: "Amount is required" })
    .min(0.01, "Amount must be greater than zero")
    .refine(
      (n) => Number.isFinite(n) && Math.abs(n * 100 - Math.round(n * 100)) < 0.001,
      { message: "Amount must have at most 2 decimal places" }
    ),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  semester: z.enum(['1st Sem', '2nd Sem', 'Summer'], {
    errorMap: () => ({ message: 'Semester must be 1st Sem, 2nd Sem, or Summer' }),
  }),
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, 'Academic year must be YYYY-YYYY format'),
  notes: z.string().nullable().optional(),
  status: z.enum(['paid', 'pending', 'flagged']).default('paid'),
})

export const BudgetEntryRecordSchema = BudgetEntrySchema.extend({
  id: z.string().uuid(),
  entered_by: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
}).transform((data) => ({
  ...data,
  notes: data.notes ?? null,
}));
