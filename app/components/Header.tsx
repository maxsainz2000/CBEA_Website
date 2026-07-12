'use client';

import Link from 'next/link';

interface HeaderProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export default function Header({ isLoggedIn = false, onLogout }: HeaderProps) {
  return (
    <header className="w-full h-12 flex items-center justify-between border-b border-outline bg-background px-margin-mobile md:px-margin">
      <span className="font-headline-sm text-headline-sm text-on-background select-none">
        CBEA Student Council
      </span>
      <nav className="flex items-center gap-sm">
        {isLoggedIn ? (
          <>
            <Link href="/admin" className="btn-ghost flex items-center justify-center">
              Dashboard
            </Link>
            <button
              onClick={onLogout}
              className="btn-ghost flex items-center justify-center cursor-pointer"
              type="button"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/admin" className="btn-ghost flex items-center justify-center">
            Admin
          </Link>
        )}
      </nav>
    </header>
  );
}
