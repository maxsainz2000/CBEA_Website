import { render, screen } from '@testing-library/react';
import { expect, test, describe, vi, beforeEach } from 'vitest';
import AdminSemesterSelector from './AdminSemesterSelector';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/admin',
  useSearchParams: () => new URLSearchParams(),
}));

let mockIsPending = false;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useTransition: () => [mockIsPending, (cb: () => void) => cb()],
  };
});

describe('AdminSemesterSelector', () => {
  beforeEach(() => {
    mockIsPending = false;
  });

  test('renders semesters and does not show switching indicator by default', () => {
    render(
      <AdminSemesterSelector
        semesters={['1st Sem', '2nd Sem']}
        activeSemester="1st Sem"
      />
    );
    expect(screen.getByText('1st Sem')).toBeInTheDocument();
    expect(screen.getByText('2nd Sem')).toBeInTheDocument();
    expect(screen.queryByTestId('switching-indicator')).not.toBeInTheDocument();
  });

  test('shows switching indicator when isPending is true', () => {
    mockIsPending = true;

    render(
      <AdminSemesterSelector
        semesters={['1st Sem', '2nd Sem']}
        activeSemester="1st Sem"
      />
    );
    expect(screen.getByTestId('switching-indicator')).toBeInTheDocument();
    expect(screen.getByText('Switching...')).toBeInTheDocument();
  });
});
