'use client';

import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import Header from '@/app/components/Header';

export default function AdminHeader() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      // Clear mock auth cookie
      document.cookie = 'sb-mock-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      
      await supabase.auth.signOut();
      startTransition(() => {
        router.push('/login');
        router.refresh();
      });
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return <Header isLoggedIn={true} onLogout={handleLogout} />;
}
