'use client';

import { useState, useEffect } from 'react';
import { BudgetEntry } from '../../lib/types';
import { formatCentavos } from '@/lib/format/currency';
import { formatISODate } from '@/lib/format/date';
import { fetchEntriesAction } from '@/app/actions/entries';

interface BudgetEntryListProps {
  entries: BudgetEntry[];
  emptyMessage?: string;
  onEntryClick?: (entry: BudgetEntry) => void;
  hasMoreInitial?: boolean;
  semester?: string;
  category?: string;
  search?: string;
  initialPage?: number;
}

export default function BudgetEntryList({
  entries,
  emptyMessage = 'No budget entries found.',
  onEntryClick,
  hasMoreInitial = false,
  semester,
  category,
  search,
  initialPage = 1,
}: BudgetEntryListProps) {
  const [displayedEntries, setDisplayedEntries] = useState<BudgetEntry[]>(entries);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setDisplayedEntries(entries);
    setCurrentPage(initialPage);
    setHasMore(hasMoreInitial);
  }, [entries, hasMoreInitial, initialPage]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const result = await fetchEntriesAction({
      semester,
      category,
      search,
      page: nextPage,
    });
    if (result.status === 'ok') {
      setDisplayedEntries((prev) => [...prev, ...result.data.entries]);
      setCurrentPage(nextPage);
      setHasMore(result.data.hasMore);
    }
    setIsLoadingMore(false);
  };

  if (displayedEntries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-xl border border-outline text-secondary bg-surface text-center"
        data-testid="budget-empty-state"
      >
        <span className="font-body-md text-body-md text-secondary select-none">
          {emptyMessage}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col border border-outline" data-testid="budget-entry-list">
      {displayedEntries.map((entry) => {
        const isIncome = entry.type === 'income';
        const indicatorClass = isIncome
          ? 'budget-entry-indicator-income'
          : 'budget-entry-indicator-expense';
        const amountClass = isIncome
          ? 'budget-entry-amount-income'
          : 'budget-entry-amount-expense';
        const statusBadgeClass =
          entry.status === 'paid'
            ? 'status-badge-paid'
            : entry.status === 'pending'
            ? 'status-badge-pending'
            : 'status-badge-flagged';

        return (
          <div
            key={entry.id}
            onClick={() => onEntryClick?.(entry)}
            className="budget-entry select-none cursor-pointer focus-visible:bg-surface focus-visible:outline-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEntryClick?.(entry);
              }
            }}
            data-testid={`budget-entry-row-${entry.id}`}
          >
            {/* Column 1: Left indicator strip */}
            <div className={`budget-entry-indicator ${indicatorClass}`} />

            {/* Column 2: Left main column (Description and Metadata) */}
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm-strong text-body-sm-strong text-on-background truncate">
                {entry.description}
              </span>
              <span className="font-caption text-caption text-secondary mt-xs select-none">
                {entry.category} • {formatISODate(entry.date)}
              </span>
            </div>

            {/* Column 3: Amount column */}
            <div className={`budget-entry-amount ${amountClass} tabular-nums`}>
              {formatCentavos(isIncome ? entry.amount : -entry.amount, { sign: true })}
            </div>

            {/* Column 4: Status badge */}
            <div className="flex justify-end select-none">
              <span className={`status-badge ${statusBadgeClass}`}>
                {entry.status}
              </span>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <div className="flex justify-center p-md border-t border-outline">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="btn-ghost uppercase tracking-wider font-body-sm-strong select-none"
            data-testid="load-more-btn"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
