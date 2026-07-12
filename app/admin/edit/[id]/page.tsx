import { redirect, notFound } from 'next/navigation';
import { getOfficer } from '@/lib/auth/session';
import AdminHeader from '../../components/AdminHeader';
import EntryForm from '../../components/EntryForm';
import { getEntry } from '@/lib/data/entries';

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

  // Fetch target budget entry
  const entry = await getEntry(id);
  if (!entry) {
    notFound();
  }

  // Rehydrate initialData: Convert amount from centavos (integer) back to decimal (pesos)
  const initialData = {
    ...entry,
    amount: entry.amount / 100,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs mb-sm w-full max-w-xl mx-auto">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
            Administrative Access
          </span>
          <h1 className="font-headline-display text-headline-display font-weight-headline-display text-on-background leading-headline-display tracking-tight">
            Modify Entry
          </h1>
        </header>

        <EntryForm initialData={initialData} />
      </main>
    </div>
  );
}
