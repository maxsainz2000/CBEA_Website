'use client';

import React, { useRef, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface PivotTabsProps {
  tabs: (string | TabItem)[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function PivotTabs({ tabs, activeTab, onTabChange }: PivotTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Normalize tabs to TabItem interface
  const normalizedTabs: TabItem[] = tabs.map((tab) => {
    if (typeof tab === 'string') {
      return { id: tab, label: tab };
    }
    return tab;
  });

  const shouldRenderDropdown = normalizedTabs.length > 7;

  // Sync ref array length
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, normalizedTabs.length);
  }, [normalizedTabs]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = normalizedTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % normalizedTabs.length;
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + normalizedTabs.length) % normalizedTabs.length;
        e.preventDefault();
        break;
      case 'Home':
        nextIndex = 0;
        e.preventDefault();
        break;
      case 'End':
        nextIndex = normalizedTabs.length - 1;
        e.preventDefault();
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      const nextTab = normalizedTabs[nextIndex];
      onTabChange(nextTab.id);
      
      // Focus the newly active tab before the next paint
      const elementToFocus = tabRefs.current[nextIndex];
      if (elementToFocus) {
        requestAnimationFrame(() => elementToFocus.focus());
      }
    }
  };

  if (shouldRenderDropdown) {
    return (
      <div className="w-full">
        <select
          className="input-underline cursor-pointer py-xs"
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          aria-label="Navigation Pivot Select"
          data-testid="pivot-select"
        >
          {normalizedTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-md border-b border-outline overflow-x-auto w-full"
      role="tablist"
      aria-label="Navigation Pivots"
      onKeyDown={handleKeyDown}
      data-testid="pivot-tabs-container"
    >
      {normalizedTabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            onClick={() => onTabChange(tab.id)}
            className={`pivot-tab focus:outline-none ${isActive ? 'pivot-tab-active' : ''}`}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            type="button"
            data-testid={`pivot-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
