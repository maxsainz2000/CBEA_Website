'use client';

import { useState } from 'react';
import Header from '../components/Header';
import SummaryStats from '../components/SummaryStats';
import PivotTabs from '../components/PivotTabs';
import BudgetEntryList from '../components/BudgetEntryList';
import SearchFilter from '../components/SearchFilter';
import { BudgetEntry } from '../../lib/types';

export default function SandboxPage() {
  const [activeTab, setActiveTab] = useState('1');
  const [activeFilter, setActiveFilter] = useState<'collected' | 'spent' | 'remaining' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const tabs = [
    { id: '1', label: '1st Semester' },
    { id: '2', label: '2nd Semester' },
    { id: '3', label: 'Summer' }
  ];

  const manyTabs = [
    { id: '1', label: '1st Semester' },
    { id: '2', label: '2nd Semester' },
    { id: '3', label: 'Summer' },
    { id: '4', label: 'Fall' },
    { id: '5', label: 'Winter' },
    { id: '6', label: 'Spring' },
    { id: '7', label: 'Special' },
    { id: '8', label: 'Extra' },
  ];

  const entries = [
    {
      id: '1',
      description: 'Membership Fee Collection',
      amount: 15000,
      date: '2026-07-10T00:00:00Z',
      type: 'income',
      category: 'Fees',
      status: 'paid'
    },
    {
      id: '2',
      description: 'Office Supplies',
      amount: -5000,
      date: '2026-07-11T00:00:00Z',
      type: 'expense',
      category: 'Supplies',
      status: 'pending'
    }
  ];

  const categories = ['All', 'Fees', 'Supplies', 'Events'];

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} onLogout={() => alert('Logout clicked')} />
      
      <main className="p-margin md:p-margin-mobile flex flex-col gap-lg mt-8 max-w-4xl mx-auto">
        <h1 className="text-headline-md font-headline-md mb-4">Component Sandbox</h1>

        <section>
          <h2 className="text-title-lg font-title-lg mb-2">SummaryStats</h2>
          <SummaryStats
            totalCollected={15000}
            totalSpent={5000}
            remainingBalance={10000}
            activeFilter={activeFilter}
            onFilterChange={(filter) => setActiveFilter(filter)}
            asOfDate="Jul 11, 2026"
          />
          
          <h3 className="text-title-md font-title-md mt-4 mb-2">Negative Balance Example</h3>
          <SummaryStats
            totalCollected={5000}
            totalSpent={15000}
            remainingBalance={-10000}
            asOfDate="Jul 11, 2026"
          />
        </section>

        <section>
          <h2 className="text-title-lg font-title-lg mb-2">PivotTabs (≤ 7 items)</h2>
          <PivotTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <h2 className="text-title-lg font-title-lg mt-4 mb-2">PivotTabs (&gt; 7 items - Select Box)</h2>
          <PivotTabs
            tabs={manyTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </section>

        <section>
          <h2 className="text-title-lg font-title-lg mb-2">SearchFilter</h2>
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </section>

        <section>
          <h2 className="text-title-lg font-title-lg mb-2">BudgetEntryList</h2>
          <BudgetEntryList entries={entries as unknown as BudgetEntry[]} onEntryClick={(entry) => alert(`Clicked ${entry.description}`)} />
          
          <h3 className="text-title-md font-title-md mt-4 mb-2">Empty State</h3>
          <BudgetEntryList entries={[]} />
        </section>
      </main>
    </div>
  );
}
