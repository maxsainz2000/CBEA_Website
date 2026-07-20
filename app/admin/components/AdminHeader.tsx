'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/app/components/Header';
import { logger } from '@/lib/log';

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    } catch {
      logger.error('Error signing out');
    }
  };

  return <Header isLoggedIn={true} onLogout={handleLogout} />;
}
