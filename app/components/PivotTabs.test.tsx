import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi } from 'vitest';
import PivotTabs from './PivotTabs';

describe('PivotTabs Component', () => {
  const fiveTabs = [
    { id: '1', label: 'Tab 1' },
    { id: '2', label: 'Tab 2' },
    { id: '3', label: 'Tab 3' },
    { id: '4', label: 'Tab 4' },
    { id: '5', label: 'Tab 5' },
  ];

  const eightTabs = [
    { id: '1', label: 'Tab 1' },
    { id: '2', label: 'Tab 2' },
    { id: '3', label: 'Tab 3' },
    { id: '4', label: 'Tab 4' },
    { id: '5', label: 'Tab 5' },
    { id: '6', label: 'Tab 6' },
    { id: '7', label: 'Tab 7' },
    { id: '8', label: 'Tab 8' },
  ];

  test('renders flat buttons when <= 7 tabs are provided', () => {
    const handleTabChange = vi.fn();
    render(<PivotTabs tabs={fiveTabs} activeTab="1" onTabChange={handleTabChange} />);

    // Assert buttons render
    const buttons = screen.getAllByRole('tab');
    expect(buttons).toHaveLength(5);
    expect(screen.queryByTestId('pivot-select')).toBeNull();
  });

  test('renders select dropdown instead of buttons when > 7 tabs are provided', () => {
    const handleTabChange = vi.fn();
    render(<PivotTabs tabs={eightTabs} activeTab="1" onTabChange={handleTabChange} />);

    // Assert dropdown renders
    const select = screen.getByTestId('pivot-select');
    expect(select).not.toBeNull();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });

  test('applies .pivot-tab-active and aria-selected to the active tab button', () => {
    const handleTabChange = vi.fn();
    render(<PivotTabs tabs={fiveTabs} activeTab="3" onTabChange={handleTabChange} />);

    const buttons = screen.getAllByRole('tab');
    
    // Tab 3 is index 2
    const activeTabButton = buttons[2];
    expect(activeTabButton.className).toContain('pivot-tab-active');
    expect(activeTabButton.getAttribute('aria-selected')).toBe('true');

    // Other tabs should not be active
    const inactiveTabButton = buttons[0];
    expect(inactiveTabButton.className).not.toContain('pivot-tab-active');
    expect(inactiveTabButton.getAttribute('aria-selected')).toBe('false');
  });
});
