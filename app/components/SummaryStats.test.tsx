import { render, screen } from '@testing-library/react';
import { expect, test, describe } from 'vitest';
import SummaryStats from './SummaryStats';

describe('SummaryStats Component', () => {
  test('converts currency correctly from centavos to decimals', () => {
    render(
      <SummaryStats
        totalCollected={15000} // 150.00
        totalSpent={5000} // 50.00
        remainingBalance={10000} // 100.00
        asOfDate="Jul 11, 2026"
      />
    );

    const collectedValue = screen.getByTestId('stat-collected-value');
    const spentValue = screen.getByTestId('stat-spent-value');
    const remainingValue = screen.getByTestId('stat-remaining-value');

    expect(collectedValue.textContent).toBe('₱150.00');
    expect(spentValue.textContent).toBe('₱50.00');
    expect(remainingValue.textContent).toBe('₱100.00');
  });

  test('renders positive remaining balance with neutral text style', () => {
    render(
      <SummaryStats
        totalCollected={15000}
        totalSpent={5000}
        remainingBalance={10000}
        asOfDate="Jul 11, 2026"
      />
    );

    const remainingValue = screen.getByTestId('stat-remaining-value');
    expect(remainingValue.className).toContain('stat-value-neutral');
    expect(remainingValue.className).not.toContain('stat-value-negative');
    expect(remainingValue.textContent).toBe('₱100.00');
  });

  test('renders negative remaining balance with negative text style and a negative sign', () => {
    render(
      <SummaryStats
        totalCollected={5000}
        totalSpent={15000}
        remainingBalance={-10000} // -100.00
        asOfDate="Jul 11, 2026"
      />
    );

    const remainingValue = screen.getByTestId('stat-remaining-value');
    expect(remainingValue.className).toContain('stat-value-negative');
    expect(remainingValue.className).not.toContain('stat-value-neutral');
    expect(remainingValue.textContent).toBe('-₱100.00');
  });
});
