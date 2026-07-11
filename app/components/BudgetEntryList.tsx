'use client';

import { BudgetEntry } from '../../lib/types';

interface BudgetEntryListProps {
  entries: BudgetEntry[];
  emptyMessage?: string;
  onEntryClick?: (entry: BudgetEntry) => void;
}

export default function BudgetEntryList({
  entries,
  emptyMessage = 'No budget entries found.',
  onEntryClick,
}: BudgetEntryListProps) {
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

  if (entries.length === 0) {
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
      {entries.map((entry) => {
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
                {entry.category} • {formatDate(entry.date)}
              </span>
            </div>

            {/* Column 3: Amount column */}
            <div className={`budget-entry-amount ${amountClass} tabular-nums`}>
              {isIncome ? '+' : '-'}₱{formatAmount(entry.amount)}
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
    </div>
  );
}
