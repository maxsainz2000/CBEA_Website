import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './page';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const mockSignInWithPassword = vi.fn();
const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form properly', () => {
    render(<LoginPage />);

    expect(screen.getByText('Authorized Personnel Only')).toBeDefined();
    expect(screen.getByText('Officer Sign In')).toBeDefined();
    expect(screen.getByTestId('email-input')).toBeDefined();
    expect(screen.getByTestId('password-input')).toBeDefined();
    expect(screen.getByTestId('login-submit-button')).toBeDefined();
  });

  it('shows error message if form is submitted with empty fields', async () => {
    render(<LoginPage />);

    const form = screen.getByTestId('email-input').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('login-error-message').textContent).toContain('Please fill in all fields.');
    });
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('performs login successfully and redirects to /admin', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'treasurer@csu.edu.ph' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'correct-password' } });
    
    const form = screen.getByTestId('email-input').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'treasurer@csu.edu.ph',
        password: 'correct-password',
      });
      expect(mockPush).toHaveBeenCalledWith('/admin');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('displays error message when authentication fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials. Please try again.' },
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'wrong@csu.edu.ph' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrong-password' } });
    
    const form = screen.getByTestId('email-input').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
      expect(screen.getByTestId('login-error-message').textContent).toContain('Invalid credentials. Please try again.');
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles unexpected exceptions during login gracefully', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Network failure'));

    render(<LoginPage />);

    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'treasurer@csu.edu.ph' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password' } });
    
    const form = screen.getByTestId('email-input').closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('login-error-message').textContent).toContain('Network failure');
    });
  });
});
