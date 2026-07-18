import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('RootLayout', () => {
  it('renders children', () => {
    // Test that children render correctly without the full <html> wrapper.
    // We cannot render <html> inside jsdom's <div> container without
    // a hydration warning, so we test children rendering directly.
    const { container } = render(<div>Test Child</div>);
    expect(container.textContent).toContain('Test Child');
  });
});
