import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import RootLayout from './layout';

test('renders root layout with children', () => {
  render(
    <RootLayout>
      <div data-testid="test-child">Hello World</div>
    </RootLayout>
  );

  const child = screen.getByTestId('test-child');
  expect(child).not.toBeNull();
  expect(child.textContent).toBe('Hello World');
});
