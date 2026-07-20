import { redirect } from 'next/navigation';
import { getOfficer } from '@/lib/auth/session';
import AdminHeader from './components/AdminHeader';
import SummaryStats from '../components/SummaryStats';
import EntryTable from './components/EntryTable';
import AdminSemesterSelector from './components/AdminSemesterSelector';
import ErrorBanner from '../components/ErrorBanner';
import { getEntries, getSummaryStats, getSemesters } from '@/lib/data/entries';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface SearchParams {
  semester?: string;
  page?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const officer = await getOfficer();
  if (!officer) {
    redirect('/login');
  }

  const params = await searchParams;
  const semestersResult = await getSemesters();
  if (semestersResult.status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AdminHeader />
        <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg animate-slide-in-fade">
          <ErrorBanner message={semestersResult.message} />
        </main>
      </div>
    );
  }
  const semestersList = semestersResult.data;
  const activeSemester = params.semester || semestersList[0] || '1st Sem';
  const page = Number(params.page) || 1;

  // Fetch entries and statistics filtered by semester
  const [entriesResult, statsResult] = await Promise.all([
    getEntries({ semester: activeSemester, page }),
    getSummaryStats(activeSemester),
  ]);

  if (entriesResult.status === 'error' || statsResult.status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AdminHeader />
        <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg animate-slide-in-fade">
          <ErrorBanner message="We couldn't load budget data. Please try again later." />
        </main>
      </div>
    );
  }

  const entries = entriesResult.data.entries;
  const hasMore = entriesResult.data.hasMore;
  const stats = statsResult.data;

  const asOfDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with active logged in state managed by client component wrapper */}
      <AdminHeader />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg animate-slide-in-fade">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-md mb-sm">
          <div className="flex flex-col gap-xs">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
              Administrative Access
            </span>
            <h1 className="font-headline-display text-headline-display font-light text-on-background leading-headline-display tracking-tight">
              Officer Dashboard
            </h1>
            <div className="flex items-center gap-sm mt-xs">
              <span className="font-body-md text-on-background font-bold">
                {officer.full_name || officer.email}
              </span>
              <span className="status-badge status-badge-paid">
                {officer.role}
              </span>
            </div>
          </div>
          <div>
            <Link
              href="/admin/new"
              className="btn-primary flex items-center justify-center select-none"
              data-testid="add-entry-cta"
            >
              Add New Entry
            </Link>
          </div>
        </header>

        {/* Semester Selection Tab/Dropdown Filter */}
        <section aria-label="Semester Filter">
          <AdminSemesterSelector
            semesters={semestersList}
            activeSemester={activeSemester}
          />
        </section>

        {/* Aggregate statistics */}
        <section aria-label="Semester Financial Aggregate Stats">
          <h2 className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps mb-sm select-none">
            Financial Aggregates for {activeSemester}
          </h2>
          <SummaryStats
            totalCollected={stats.totalCollected}
            totalSpent={stats.totalSpent}
            remainingBalance={stats.remainingBalance}
            asOfDate={`as of ${asOfDate}`}
          />
        </section>

        {/* Data Table */}
        <section aria-label="Administrative Entry Management" className="flex flex-col gap-sm">
          <h2 className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none">
            Manage Budget Records
          </h2>
          <EntryTable
            entries={entries}
            hasMoreInitial={hasMore}
            semester={activeSemester}
            initialPage={page}
            key={`${activeSemester}-${page}`}
          />
        </section>
      </main>
    </div>
  );
}
