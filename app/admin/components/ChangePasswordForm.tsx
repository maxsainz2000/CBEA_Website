'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword } from '@/app/actions/auth';
import { ChangePasswordSchema } from '@/lib/types';
import ErrorBanner from '@/app/components/ErrorBanner';

export default function ChangePasswordForm() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);
    setValidationErrors({});

    const clientValidation = ChangePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!clientValidation.success) {
      const fieldErrors: Record<string, string> = {};
      clientValidation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await changePassword({ newPassword, confirmPassword });
      if (!response.success) {
        setServerError(response.error);
        if (response.validationErrors) {
          const map: Record<string, string> = {};
          for (const [k, v] of Object.entries(response.validationErrors)) {
            if (v && v.length > 0) map[k] = v[0];
          }
          setValidationErrors(map);
        }
      } else {
        setSuccessMessage('Password changed successfully! You will use this password on your next login.');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card max-w-md w-full mx-auto p-lg flex flex-col gap-md">
      <h2 className="font-headline-md text-headline-md text-on-surface">Change Password</h2>

      {serverError && <ErrorBanner message={serverError} />}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-md rounded-container border border-success text-success bg-surface flex items-center gap-sm text-body-sm font-medium"
        >
          <span>✓</span> {successMessage}
        </div>
      )}

      <div className="flex flex-col gap-xs">
        <label htmlFor="newPassword" className="font-title-sm text-title-sm text-on-surface">
          New Password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          data-testid="new-password-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            if (validationErrors.newPassword) {
              setValidationErrors((prev) => ({ ...prev, newPassword: '' }));
            }
          }}
          disabled={isSubmitting}
          className="input-text w-full"
          placeholder="At least 8 characters"
          aria-describedby={validationErrors.newPassword ? 'newPassword-error' : undefined}
        />
        {validationErrors.newPassword && (
          <p id="newPassword-error" className="font-body-sm text-body-sm text-error">
            {validationErrors.newPassword}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="confirmPassword" className="font-title-sm text-title-sm text-on-surface">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          data-testid="confirm-password-input"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (validationErrors.confirmPassword) {
              setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }
          }}
          disabled={isSubmitting}
          className="input-text w-full"
          placeholder="Re-enter new password"
          aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        {validationErrors.confirmPassword && (
          <p id="confirmPassword-error" className="font-body-sm text-body-sm text-error">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-sm pt-sm">
        <button
          type="button"
          onClick={() => router.push('/admin')}
          disabled={isSubmitting}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
          data-testid="change-password-submit"
        >
          {isSubmitting ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
}
