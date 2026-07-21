'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import PivotTabs from '@/app/components/PivotTabs';

interface AdminSemesterSelectorProps {
  semesters: string[];
  activeSemester: string;
}

export default function AdminSemesterSelector({
  semesters,
  activeSemester,
}: AdminSemesterSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (semester: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('semester', semester);
    params.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-sm">
      <PivotTabs
        tabs={semesters}
        activeTab={activeSemester}
        onTabChange={handleTabChange}
      />
      {isPending && (
        <span className="text-body-sm text-secondary animate-pulse ml-2" data-testid="switching-indicator">
          Switching...
        </span>
      )}
    </div>
  );
}
