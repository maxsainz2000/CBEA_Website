'use client';

import { useEffect, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Header from '../components/Header';

interface Profile {
  full_name: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchUserData() {
      try {
        const isE2e = process.env.NEXT_PUBLIC_IS_E2E === 'true';
        const hasMockAuth = document.cookie.split('; ').some(row => row.startsWith('sb-mock-auth=true'));

        if (isE2e && hasMockAuth) {
          setUserEmail('jane.doe@csu.edu.ph');
          setProfile({
            full_name: 'Jane Doe',
            role: 'Treasurer',
          });
          setIsLoading(false);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          // If no user, redirect to login (middleware should catch this, but safeguard here)
          router.push('/login');
          return;
        }

        setUserEmail(user.email || null);

        // Fetch user profile from the public.profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profileData) {
          setProfile(profileData as Profile);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [router, supabase]);

  const handleLogout = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isLoggedIn={true} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col items-center justify-center text-secondary select-none">
          <div className="w-8 h-8 border-4 border-outline border-t-primary rounded-full animate-spin mb-sm" />
          <span className="font-caption text-caption">Loading session...</span>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with active logged in state */}
      <Header isLoggedIn={true} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg animate-slide-in-fade">
        <header className="flex flex-col gap-xs mb-sm">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
            Administrative Access
          </span>
          <h1 className="font-headline-display text-headline-display font-weight-headline-display text-on-background leading-headline-display tracking-tight">
            Officer Dashboard
          </h1>
        </header>

        {/* Dashboard Placeholder Panel */}
        <section className="bg-surface p-lg border-l-4 border-primary flex flex-col gap-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-background mb-xs">
              Welcome, {profile?.full_name || userEmail || 'Officer'}
            </h2>
            {profile?.role && (
              <span className="status-badge status-badge-paid">
                {profile.role}
              </span>
            )}
          </div>

          <p className="font-body-md text-on-background max-w-2xl">
            You are successfully authenticated. This is the protected administration dashboard where budget records can be managed.
          </p>

          <p className="font-body-sm text-secondary">
            Note: The full budget CRUD interface (adding, editing, and deleting records) will be fully integrated and implemented in Task 8.
          </p>

          <div className="mt-sm">
            <button
              onClick={handleLogout}
              className="btn-primary flex items-center justify-center cursor-pointer select-none"
              type="button"
            >
              Logout Session
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
