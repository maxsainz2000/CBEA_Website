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
  const [, startTransition] = useTransition();

  const handleTabChange = (semester: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('semester', semester);
    params.delete('page');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <PivotTabs
      tabs={semesters}
      activeTab={activeSemester}
      onTabChange={handleTabChange}
    />
  );
}
