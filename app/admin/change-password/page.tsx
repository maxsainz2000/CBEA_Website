import { redirect } from 'next/navigation';
import { getOfficer } from '@/lib/auth/session';
import AdminHeader from '../components/AdminHeader';
import ChangePasswordForm from '../components/ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const officer = await getOfficer();
  if (!officer) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AdminHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-margin-mobile md:px-margin py-lg md:py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs mb-sm w-full max-w-md mx-auto">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-label-caps select-none">
            Account Security
          </span>
          <h1 className="font-headline-display text-headline-display font-light text-on-background leading-headline-display tracking-tight">
            Update Password
          </h1>
        </header>

        <ChangePasswordForm />
      </main>
    </div>
  );
}
