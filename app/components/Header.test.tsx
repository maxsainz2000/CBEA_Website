import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';

describe('Header Component', () => {
  it('renders branding title', () => {
    render(<Header />);
    expect(screen.getByText('CBEA Student Council')).toBeDefined();
  });

  it('renders Admin link when logged out', () => {
    render(<Header isLoggedIn={false} />);
    const adminLink = screen.getByRole('link', { name: /admin/i });
    expect(adminLink).toBeDefined();
    expect(adminLink.getAttribute('href')).toBe('/admin');
    expect(screen.queryByRole('link', { name: /dashboard/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /logout/i })).toBeNull();
  });

  it('renders Dashboard link and Logout button when logged in', () => {
    const handleLogout = vi.fn();
    render(<Header isLoggedIn={true} onLogout={handleLogout} />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    const logoutBtn = screen.getByRole('button', { name: /logout/i });

    expect(dashboardLink).toBeDefined();
    expect(dashboardLink.getAttribute('href')).toBe('/admin');
    expect(logoutBtn).toBeDefined();
    expect(screen.queryByRole('link', { name: /admin/i })).toBeNull();

    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });
});
