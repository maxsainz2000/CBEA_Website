import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders children inside the HTML shell with correct lang attribute', () => {
    const { container } = render(
      <RootLayout>
        <span>Test Child</span>
      </RootLayout>
    )

    // In JSDOM, React hoists <html> and <body> elements to the document root rather than nesting them inside the container div.
    // We check both the document element / body and the container's queries for compatibility.
    const html = container.querySelector('html') || document.documentElement
    const body = container.querySelector('body') || document.body

    expect(html?.lang || container.querySelector('html')?.lang).toBe('en')
    expect(body?.classList.contains('bg-background') || container.querySelector('body')?.classList.contains('bg-background')).toBe(true)
    expect(body?.classList.contains('text-on-background') || container.querySelector('body')?.classList.contains('text-on-background')).toBe(true)

    // Assert children are rendered inside <body> (the body contains the container which contains the children)
    expect(body?.contains(container)).toBe(true)
    expect(container.textContent).toContain('Test Child')
  })
})
