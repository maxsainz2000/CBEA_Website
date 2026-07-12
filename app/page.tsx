import { Suspense } from 'react';
import Header from './components/Header';
import SummaryStats from './components/SummaryStats';
import ClientFilters from './components/ClientFilters';
import BudgetEntryList from './components/BudgetEntryList';
import { getEntries, getSummaryStats, getSemesters, getCategories } from '../lib/data/entries';

// Force dynamic rendering since we are reading searchParams
export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  semester?: string;
  category?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

async function HomepageContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search || '';
  const semester = params.semester || '';
  const category = params.category || '';

  // Fetch semesters and categories list to populate the filters
  const semestersList = await getSemesters();
  
  // Default to the first semester if none is specified in the URL
  const activeSemester = semester || semestersList[0] || '1st Sem';

  // Fetch entries and summary statistics based on active filters
  const [entries, stats, categoriesList] = await Promise.all([
    getEntries({
      semester: activeSemester,
      category: category && category !== 'All' ? category : undefined,
      search: search || undefined,
    }),
    getSummaryStats(activeSemester),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-lg">
      {/* Summary Stats Cards */}
      <section aria-label="Financial Summary Stats">
        <SummaryStats
          totalCollected={stats.totalCollected}
          totalSpent={stats.totalSpent}
          remainingBalance={stats.remainingBalance}
        />
      </section>

      {/* Interactive Filters (Semesters & Categories & Search) */}
      <section aria-label="Filters">
        <ClientFilters
          semesters={semestersList}
          categories={categoriesList}
          initialSemester={activeSemester}
          initialCategory={category}
          initialSearch={search}
        />
      </section>

      {/* Budget Entries List with Slide-in Fade Animation */}
      <section aria-label="Budget Entries" className="animate-slide-in-fade" key={`${activeSemester}-${category}-${search}`}>
        <h2 className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps mb-sm select-none">
          Budget Entries for {activeSemester}
        </h2>
        <BudgetEntryList
          entries={entries}
          emptyMessage={`No budget entries found for ${activeSemester}${category && category !== 'All' ? ` in category "${category}"` : ''}${search ? ` matching "${search}"` : ''}.`}
        />
      </section>
    </div>
  );
}

export default function Homepage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Shared Portal Header */}
      <Header isLoggedIn={false} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg">
        {/* Page Title Header */}
        <header className="flex flex-col gap-xs mb-sm">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
            Public Transparency Portal
          </span>
          <h1 className="font-headline-display text-headline-display font-light text-on-background leading-headline-display tracking-tight">
            CBEA Student Council Budget Transparency
          </h1>
        </header>

        {/* Suspense Wrapper to handle loading states cleanly */}
        <Suspense
          fallback={
            <div className="flex flex-col gap-lg w-full py-xl items-center justify-center text-secondary select-none" data-testid="fallback-loader">
              <div className="w-8 h-8 border-4 border-outline border-t-primary rounded-full animate-spin mb-sm" />
              <span className="font-caption text-caption">Loading database records...</span>
            </div>
          }
        >
          <HomepageContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
