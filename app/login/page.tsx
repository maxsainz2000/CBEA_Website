'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Header from '../components/Header';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim();

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
      } else {
        // Successful login, redirect to /admin
        startTransition(() => {
          router.push('/admin');
          router.refresh();
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <Header isLoggedIn={false} />

      {/* Main Content Area: Centered Login Panel */}
      <main className="flex-1 flex items-center justify-center px-margin-mobile md:px-margin py-lg">
        <div className="w-full max-w-[360px] flex flex-col gap-lg animate-slide-in-fade">
          <header className="flex flex-col gap-xs mb-sm">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
              Authorized Personnel Only
            </span>
            <h1 className="font-headline-lg text-headline-lg font-light text-on-background leading-headline-lg">
              Officer Sign In
            </h1>
          </header>

          <form onSubmit={handleLogin} className="flex flex-col gap-md">
            {error && (
              <div
                role="alert"
                className="text-error font-body-sm leading-body-sm p-sm bg-surface select-none border-l-4 border-error"
                data-testid="login-error-message"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="email"
                className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input-underline"
                placeholder="email@csu.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="email-input"
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label
                htmlFor="password"
                className="font-label-caps text-label-caps text-secondary uppercase tracking-label-caps select-none"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input-underline"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="password-input"
                required
              />
            </div>

            <div className="mt-md flex flex-col gap-sm">
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center cursor-pointer select-none"
                disabled={isLoading}
                data-testid="login-submit-button"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>
              
              <Link
                href="/"
                className="btn-ghost w-full flex items-center justify-center text-center select-none"
              >
                Back to Public Portal
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
