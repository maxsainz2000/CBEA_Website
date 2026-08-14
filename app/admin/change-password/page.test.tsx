import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChangePasswordPage from './page';
import { getOfficer } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`Redirect to ${url}`);
  }),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/auth/session', () => ({
  getOfficer: vi.fn(),
}));

const mockGetOfficer = vi.mocked(getOfficer);

describe('ChangePasswordPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);

    await expect(ChangePasswordPage()).rejects.toThrow('Redirect to /login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders change password page with form when authenticated', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'talosigjohnlester@gmail.com',
      role: 'Governor',
      full_name: 'John Lester Talosig',
    });

    const jsx = await ChangePasswordPage();
    render(jsx);

    expect(screen.getByRole('heading', { name: 'Update Password' })).toBeDefined();
    expect(screen.getByTestId('new-password-input')).toBeDefined();
    expect(screen.getByTestId('confirm-password-input')).toBeDefined();
    expect(screen.getByTestId('change-password-submit')).toBeDefined();
  });
});
