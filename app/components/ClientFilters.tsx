'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import PivotTabs from './PivotTabs';
import SearchFilter from './SearchFilter';

interface ClientFiltersProps {
  semesters: string[];
  categories: string[];
  initialSemester: string;
  initialCategory: string;
  initialSearch: string;
}

export default function ClientFilters({
  semesters,
  categories,
  initialSemester,
  initialCategory,
  initialSearch,
}: ClientFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchVal, setSearchVal] = useState(initialSearch);

  const updateUrl = useCallback((updates: { semester?: string; category?: string; search?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.semester !== undefined) {
      if (updates.semester) {
        params.set('semester', updates.semester);
      } else {
        params.delete('semester');
      }
    }

    if (updates.category !== undefined) {
      if (updates.category && updates.category !== 'All') {
        params.set('category', updates.category);
      } else {
        params.delete('category');
      }
    }

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set('search', updates.search);
      } else {
        params.delete('search');
      }
    }

    // Reset pagination to page 1 when filters are updated
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }, [searchParams, pathname, router]);

  // Sync state if initial value changes (e.g. from back button navigations)
  useEffect(() => {
    setSearchVal(initialSearch);
  }, [initialSearch]);

  // Debounce the search input to update the URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== initialSearch) {
        updateUrl({ search: searchVal });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchVal, initialSearch, updateUrl]);


  return (
    <div className="flex flex-col gap-lg w-full" data-testid="client-filters-container">
      {/* Semester Navigation */}
      <div>
        <PivotTabs
          tabs={semesters}
          activeTab={initialSemester}
          onTabChange={(semesterId) => updateUrl({ semester: semesterId })}
        />
      </div>

      {/* Search and Category Filters */}
      <div>
        <SearchFilter
          searchQuery={searchVal}
          onSearchChange={setSearchVal}
          categories={['All', ...categories]}
          selectedCategory={initialCategory || 'All'}
          onCategoryChange={(category) => updateUrl({ category })}
        />
      </div>

      {/* Visual cue during Next.js server transitions */}
      {isPending && (
        <div className="text-caption text-secondary select-none animate-pulse flex items-center gap-xs" data-testid="loading-indicator">
          <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
          Updating budget view...
        </div>
      )}
    </div>
  );
}
