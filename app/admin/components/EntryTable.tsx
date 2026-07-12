'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { BudgetEntry } from '@/lib/types';
import { deleteEntry } from '@/app/actions/entries';

interface EntryTableProps {
  entries: BudgetEntry[];
}

export default function EntryTable({ entries }: EntryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (centavos: number) => {
    const absValue = Math.abs(centavos) / 100;
    return absValue.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleDelete = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteEntry(id);
      if (result.success) {
        setDeletingId(null);
      } else {
        setError(result.error || 'Failed to delete the entry.');
      }
    });
  };

  return (
    <div className="w-full flex flex-col gap-sm">
      {error && (
        <div className="p-sm bg-accent-red/10 border-l-4 border-accent-red text-accent-red font-body-sm text-body-sm select-none" data-testid="table-error-message">
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
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary py-lg">
                  No records found in the database.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
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
                    <td className="whitespace-nowrap">{formatDate(entry.date)}</td>
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
                      {isIncome ? '+' : '-'}₱{formatAmount(entry.amount)}
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
                            onClick={() => handleDelete(entry.id)}
                            disabled={isPending}
                            className="btn-danger flex items-center justify-center cursor-pointer select-none text-body-sm h-10 px-sm"
                            type="button"
                            data-testid={`confirm-delete-${entry.id}`}
                          >
                            {isPending ? 'Deleting...' : 'Confirm Delete?'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            disabled={isPending}
                            className="btn-ghost flex items-center justify-center cursor-pointer select-none text-body-sm h-10 px-sm"
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
                            className="btn-ghost flex items-center justify-center text-body-sm h-10 px-sm select-none"
                            data-testid={`edit-btn-${entry.id}`}
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setError(null);
                              setDeletingId(entry.id);
                            }}
                            className="btn-ghost flex items-center justify-center cursor-pointer text-body-sm h-10 px-sm select-none text-expense!"
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
    </div>
  );
}
