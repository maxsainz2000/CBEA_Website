import { redirect, notFound } from 'next/navigation';
import { getOfficer } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import AdminHeader from '../../components/AdminHeader';
import EntryForm from '../../components/EntryForm';
import { BudgetEntry } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEntryPage({ params }: PageProps) {
  const { id } = await params;

  const officer = await getOfficer();
  if (!officer) {
    redirect('/login');
  }

  // Fetch target budget entry — filter by entered_by for ownership
  const supabase = await createClient();
  const { data: entry, error } = await supabase
    .from('budget_entries')
    .select('*')
    .eq('id', id)
    .eq('entered_by', officer.id)   // ← ownership filter: only show entries you own
    .maybeSingle();

  if (error || !entry) {
    notFound();   // 404 — don't reveal whether the entry exists
  }

  // Rehydrate initialData: Convert amount from centavos (integer) back to decimal (pesos)
  const initialData = {
    ...(entry as BudgetEntry),
    amount: (entry as BudgetEntry).amount / 100,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs mb-sm w-full max-w-xl mx-auto">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
            Administrative Access
          </span>
          <h1 className="font-headline-display text-headline-display font-light text-on-background leading-headline-display tracking-tight">
            Modify Entry
          </h1>
        </header>

        <EntryForm initialData={initialData} />
      </main>
    </div>
  );
}
