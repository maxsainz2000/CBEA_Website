import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders children inside the HTML shell with correct lang attribute', () => {
    render(
      <RootLayout>
        <span>Test Child</span>
      </RootLayout>,
      { container: document.documentElement }
    )

    // In JSDOM, React mounts to the document element directly when specified as the container.
    const html = document.documentElement
    const body = document.body

    expect(html.lang).toBe('en')
    expect(body.classList.contains('bg-background')).toBe(true)
    expect(body.classList.contains('text-on-background')).toBe(true)

    // Assert children are rendered inside <body>
    expect(body.textContent).toContain('Test Child')
  })
})
