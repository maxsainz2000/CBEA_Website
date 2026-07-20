'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { BudgetEntry } from '@/lib/types';
import { deleteEntry, fetchEntriesAction } from '@/app/actions/entries';
import { formatCentavos } from '@/lib/format/currency';
import { formatISODate } from '@/lib/format/date';

interface EntryTableProps {
  entries: BudgetEntry[];
  hasMoreInitial?: boolean;
  semester?: string;
  initialPage?: number;
}

export default function EntryTable({
  entries,
  hasMoreInitial = false,
  semester,
  initialPage = 1,
}: EntryTableProps) {
  const [displayedEntries, setDisplayedEntries] = useState<BudgetEntry[]>(entries);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (deletingId) {
      confirmBtnRef.current?.focus();
    }
  }, [deletingId]);

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
      page: nextPage,
    });
    if (result.status === 'ok') {
      setDisplayedEntries((prev) => [...prev, ...result.data.entries]);
      setCurrentPage(nextPage);
      setHasMore(result.data.hasMore);
    }
    setIsLoadingMore(false);
  };

  const handleDelete = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteEntry(id);
      if (result.success) {
        setDeletingId(null);
        setDisplayedEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        setError(result.error || 'Failed to delete the entry.');
      }
    });
  };

  return (
    <div className="w-full flex flex-col gap-sm">
      {error && (
        <div role="alert" className="p-sm bg-error/10 border-l-4 border-error text-error font-body-sm text-body-sm select-none" data-testid="table-error-message">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-outline">
        <table className="data-table" data-testid="admin-entry-table">
          <thead>
            <tr>
              <th className="select-none">Date</th>
              <th className="select-none">Type</th>
              <th className="select-none">Description</th>
              <th className="select-none">Category</th>
              <th className="select-none amount-col text-right">Amount</th>
              <th className="select-none">Status</th>
              <th className="select-none text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-lg">
                  No records found in the database.
                </td>
              </tr>
            ) : (
              displayedEntries.map((entry) => {
                const isIncome = entry.type === 'income';
                const statusBadgeClass =
                  entry.status === 'paid'
                    ? 'status-badge-paid'
                    : entry.status === 'pending'
                    ? 'status-badge-pending'
                    : 'status-badge-flagged';

                const isConfirming = deletingId === entry.id;

                return (
                  <tr key={entry.id} data-testid={`entry-row-${entry.id}`}>
                    <td className="whitespace-nowrap">{formatISODate(entry.date)}</td>
                    <td className="whitespace-nowrap font-body-sm-strong select-none">
                      <span className={isIncome ? 'text-income' : 'text-expense'}>
                        {isIncome ? 'Income' : 'Expense'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="whitespace-nowrap">{entry.category}</td>
                    <td className={`amount-col tabular-nums whitespace-nowrap font-body-sm-strong ${isIncome ? 'text-income' : 'text-expense'}`}>
                      {formatCentavos(isIncome ? entry.amount : -entry.amount, { sign: true })}
                    </td>
                    <td className="whitespace-nowrap select-none">
                      <span className={`status-badge ${statusBadgeClass}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {isConfirming ? (
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            ref={confirmBtnRef}
                            onClick={() => handleDelete(entry.id)}
                            disabled={isPending}
                            className="btn-danger flex items-center justify-center cursor-pointer select-none text-body-sm h-12 px-sm"
                            type="button"
                            data-testid={`confirm-delete-${entry.id}`}
                          >
                            {isPending ? 'Deleting...' : 'Confirm Delete?'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            disabled={isPending}
                            className="btn-ghost flex items-center justify-center cursor-pointer select-none text-body-sm h-12 px-sm"
                            type="button"
                            data-testid={`cancel-delete-${entry.id}`}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-xs">
                          <Link
                            href={`/admin/edit/${entry.id}`}
                            className="btn-ghost flex items-center justify-center text-body-sm h-12 px-sm select-none"
                            data-testid={`edit-btn-${entry.id}`}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setError(null);
                              setDeletingId(entry.id);
                            }}
                            className="btn-ghost-danger flex items-center justify-center cursor-pointer text-body-sm h-12 px-sm select-none"
                            type="button"
                            data-testid={`delete-btn-${entry.id}`}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="flex justify-center p-md border border-t-0 border-outline bg-surface/50">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="btn-ghost uppercase tracking-wider font-body-sm-strong select-none"
            data-testid="admin-load-more-btn"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
