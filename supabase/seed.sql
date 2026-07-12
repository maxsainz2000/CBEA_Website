-- Seed profiles
INSERT INTO public.profiles (id, full_name, role, created_at) VALUES
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001', 'Jane Doe', 'Treasurer', '2026-01-01T00:00:00Z'),
  ('d0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002', 'John Smith', 'Auditor', '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed budget entries
-- Amounts stored in centavos (cents) -> 1 Peso = 100 centavos
-- e.g. ₱15,000.00 = 1500000
INSERT INTO public.budget_entries (
  id, type, description, category, amount, date, semester, academic_year, notes, status, entered_by
) VALUES
  -- Income: collections, fundraisers
  ('b0000000-0000-0000-0000-000000000001', 'income', 'Student Council Membership Fees - 1st Sem', 'Membership Fee', 4500000, '2025-09-05', '1st Sem', '2025-2026', '₱50 per student for 900 students', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000002', 'income', 'Acquaintance Party Ticket Sales', 'Ticket Sales', 3500000, '2025-09-12', '1st Sem', '2025-2026', '₱100 per ticket for 350 attendees', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000003', 'income', 'Laro ng Lahi Registration Fees', 'Sports Fest', 1200000, '2025-10-10', '1st Sem', '2025-2026', '₱300 per team for 40 teams', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  
  -- Expenses: rentals, printing, supplies
  ('b0000000-0000-0000-0000-000000000004', 'expense', 'CSU Gym Rental for Acquaintance Party', 'Rental', 800000, '2025-09-10', '1st Sem', '2025-2026', 'Paid to CSU administration', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000005', 'expense', 'Sound System and Lights Rental', 'Rental', 1500000, '2025-09-15', '1st Sem', '2025-2026', 'Acquaintance party suppliers', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002'),
  ('b0000000-0000-0000-0000-000000000006', 'expense', 'Sound System Rental - Sports Fest', 'Rental', 500000, '2025-10-12', '1st Sem', '2025-2026', 'Laro ng Lahi events', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000007', 'expense', 'Prizes for sports events', 'Prizes', 1000000, '2025-10-15', '1st Sem', '2025-2026', 'Cash prizes and medals', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000008', 'expense', 'Office Supplies and Printing Flyers', 'Supplies', 250000, '2025-09-08', '1st Sem', '2025-2026', 'Paper, ink, folders', 'paid', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  
  -- Pending and Flagged for testing admin visual representation
  ('b0000000-0000-0000-0000-000000000009', 'expense', 'Purchase of new printer (Pending approval)', 'Supplies', 1250000, '2025-11-20', '1st Sem', '2025-2026', 'Pending dean approval', 'pending', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d001'),
  ('b0000000-0000-0000-0000-000000000010', 'expense', 'Snacks for General Assembly (Discrepancy)', 'Meeting Expense', 180000, '2025-10-25', '1st Sem', '2025-2026', 'Flagged for missing receipt copy', 'flagged', 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d002')
ON CONFLICT (id) DO NOTHING;
