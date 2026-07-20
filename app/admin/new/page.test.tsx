import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NewEntryPage from './page';
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

describe('NewEntryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when unauthenticated', async () => {
    mockGetOfficer.mockResolvedValue(null);

    await expect(NewEntryPage()).rejects.toThrow('Redirect to /login');
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders creation page with EntryForm when authenticated', async () => {
    mockGetOfficer.mockResolvedValue({
      id: 'o1',
      email: 'treasurer@csu.edu.ph',
      role: 'Treasurer',
      full_name: 'Jane Doe',
    });

    const jsx = await NewEntryPage();
    render(jsx);

    expect(screen.getByText('Create Entry')).toBeDefined();
    expect(screen.getByText('Add New Budget Record')).toBeDefined();
    expect(screen.getByTestId('description-input')).toBeDefined();
    expect(screen.getByTestId('submit-form-button')).toBeDefined();
  });
});
