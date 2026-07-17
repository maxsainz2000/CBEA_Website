import { formatCentavos } from '@/lib/format/currency';

interface SummaryStatsProps {
  totalCollected: number; // in centavos
  totalSpent: number; // in centavos
  remainingBalance: number; // in centavos
  asOfDate?: string;
}

export default function SummaryStats({
  totalCollected,
  totalSpent,
  remainingBalance,
  asOfDate,
}: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
      {/* Collected Card */}
      <div
        className="stat-card select-none"
        data-testid="stat-collected"
      >
        <div className="stat-label">TOTAL COLLECTED</div>
        <div className="stat-value stat-value-positive tabular-nums" data-testid="stat-collected-value">
          {formatCentavos(totalCollected)}
        </div>
        {asOfDate && <div className="stat-meta">{asOfDate}</div>}
      </div>

      {/* Spent Card */}
      <div
        className="stat-card select-none"
        data-testid="stat-spent"
      >
        <div className="stat-label">TOTAL SPENT</div>
        <div className="stat-value stat-value-negative tabular-nums" data-testid="stat-spent-value">
          {formatCentavos(totalSpent)}
        </div>
        {asOfDate && <div className="stat-meta">{asOfDate}</div>}
      </div>

      {/* Remaining Card */}
      <div
        className="stat-card select-none"
        data-testid="stat-remaining"
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
        {asOfDate && <div className="stat-meta">{asOfDate}</div>}
      </div>
    </div>
  );
}
