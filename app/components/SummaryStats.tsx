'use client';

import { useState, useEffect } from 'react';
import { formatCentavos } from '@/lib/format/currency';

interface SummaryStatsProps {
  totalCollected: number; // in centavos
  totalSpent: number; // in centavos
  remainingBalance: number; // in centavos
  activeFilter?: 'collected' | 'spent' | 'remaining' | string | null;
  onFilterChange?: (filter: 'collected' | 'spent' | 'remaining') => void;
  asOfDate?: string;
}

export default function SummaryStats({
  totalCollected,
  totalSpent,
  remainingBalance,
  activeFilter,
  onFilterChange,
  asOfDate,
}: SummaryStatsProps) {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Safely format date on the client to avoid hydration mismatch
    const formatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  const metaText = asOfDate || (currentDate ? `as of ${currentDate}` : 'loading...');

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    filter: 'collected' | 'spent' | 'remaining'
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFilterChange?.(filter);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
      {/* Collected Card */}
      <div
        className={`stat-card select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
          activeFilter === 'collected' ? 'stat-card-active' : ''
        }`}
        onClick={() => onFilterChange?.('collected')}
        onKeyDown={(e) => handleKeyDown(e, 'collected')}
        role="button"
        tabIndex={0}
        aria-label={`Total collected: ${formatCentavos(totalCollected)}`}
      >
        <div className="stat-label">TOTAL COLLECTED</div>
        <div className="stat-value stat-value-positive tabular-nums" data-testid="stat-collected-value">
          {formatCentavos(totalCollected)}
        </div>
        <div className="stat-meta">{metaText}</div>
      </div>

      {/* Spent Card */}
      <div
        className={`stat-card select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
          activeFilter === 'spent' ? 'stat-card-active' : ''
        }`}
        onClick={() => onFilterChange?.('spent')}
        onKeyDown={(e) => handleKeyDown(e, 'spent')}
        role="button"
        tabIndex={0}
        aria-label={`Total spent: ${formatCentavos(totalSpent)}`}
      >
        <div className="stat-label">TOTAL SPENT</div>
        <div className="stat-value stat-value-negative tabular-nums" data-testid="stat-spent-value">
          {formatCentavos(totalSpent)}
        </div>
        <div className="stat-meta">{metaText}</div>
      </div>

      {/* Remaining Card */}
      <div
        className={`stat-card select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
          activeFilter === 'remaining' ? 'stat-card-active' : ''
        }`}
        onClick={() => onFilterChange?.('remaining')}
        onKeyDown={(e) => handleKeyDown(e, 'remaining')}
        role="button"
        tabIndex={0}
        aria-label={`Remaining balance: ${formatCentavos(remainingBalance)}`}
      >
        <div className="stat-label">REMAINING BALANCE</div>
        <div
          className={`stat-value tabular-nums ${
            remainingBalance < 0 ? 'stat-value-negative' : 'stat-value-neutral'
          }`}
          data-testid="stat-remaining-value"
        >
          {formatCentavos(remainingBalance)}
        </div>
        <div className="stat-meta">{metaText}</div>
      </div>
    </div>
  );
}
