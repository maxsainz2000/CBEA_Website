/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { changePassword } from './auth';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('@/lib/auth/session', () => ({
  getOfficerAndClient: vi.fn(),
}));

import { getOfficerAndClient } from '@/lib/auth/session';

describe('changePassword Server Action', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return unauthorized error if user is unauthenticated', async () => {
    vi.mocked(getOfficerAndClient).mockResolvedValue({
      officer: null,
      supabase: {} as unknown as SupabaseClient,
    });

    const result = await changePassword({
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });

    expect(result).toEqual({
      success: false,
      error: 'Unauthorized: You must be signed in to perform this action.',
    });
  });

  it('should fail validation if new password is too short (< 8 chars)', async () => {
    vi.mocked(getOfficerAndClient).mockResolvedValue({
      officer: { id: 'u1', email: 'test@example.com', role: 'Governor', full_name: 'Test' },
      supabase: {} as unknown as SupabaseClient,
    });

    const result = await changePassword({
      newPassword: 'short',
      confirmPassword: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors?.newPassword).toContain('Password must be at least 8 characters long');
    }
  });

  it('should fail validation if passwords do not match', async () => {
    vi.mocked(getOfficerAndClient).mockResolvedValue({
      officer: { id: 'u1', email: 'test@example.com', role: 'Governor', full_name: 'Test' },
      supabase: {} as unknown as SupabaseClient,
    });

    const result = await changePassword({
      newPassword: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Validation failed');
      expect(result.validationErrors?.confirmPassword).toContain('Passwords do not match');
    }
  });

  it('should handle Supabase updateUser error', async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({
      error: { message: 'Password is weak' },
    });

    const mockSupabase = {
      auth: {
        updateUser: mockUpdateUser,
      },
    } as unknown as SupabaseClient;

    vi.mocked(getOfficerAndClient).mockResolvedValue({
      officer: { id: 'u1', email: 'test@example.com', role: 'Governor', full_name: 'Test' },
      supabase: mockSupabase,
    });

    const result = await changePassword({
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });

    expect(result).toEqual({
      success: false,
      error: 'Password is weak',
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'NewPassword123!' });
  });

  it('should successfully update password on valid input', async () => {
    const mockUpdateUser = vi.fn().mockResolvedValue({
      error: null,
    });

    const mockSupabase = {
      auth: {
        updateUser: mockUpdateUser,
      },
    } as unknown as SupabaseClient;

    vi.mocked(getOfficerAndClient).mockResolvedValue({
      officer: { id: 'u1', email: 'test@example.com', role: 'Governor', full_name: 'Test' },
      supabase: mockSupabase,
    });

    const result = await changePassword({
      newPassword: 'ValidNewPassword123!',
      confirmPassword: 'ValidNewPassword123!',
    });

    expect(result).toEqual({
      success: true,
      data: { message: 'Password updated successfully.' },
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'ValidNewPassword123!' });
  });
});

