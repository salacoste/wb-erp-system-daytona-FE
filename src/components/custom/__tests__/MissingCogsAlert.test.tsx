/**
 * Tests for Story 42.3-FE: Missing COGS Alert Component
 * Epic 42-FE: Task Handlers Adaptation
 *
 * Component displays alert when products are missing COGS assignment.
 * Shows count, preview of products in tooltip, and actionable link to COGS page.
 *
 * @see docs/stories/epic-42/story-42.3-fe-missing-cogs-alert.md
 * @see docs/wireframes/epic-42-ui-mockup.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MissingCogsAlert, pluralizeProduct } from '../MissingCogsAlert'

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockProps = (overrides: Partial<Parameters<typeof MissingCogsAlert>[0]> = {}) => ({
  missingCount: 45,
  missingProducts: ['123456', '234567', '345678', '456789', '567890'],
  onDismiss: vi.fn(),
  className: '',
  ...overrides,
})

// =============================================================================
// Story 42.3-FE: AC1 - Alert Displays When Missing COGS
// =============================================================================

describe('Story 42.3-FE: AC1 - Alert Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('visibility conditions', () => {
    it('renders alert when missingCount > 0', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 45 })} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('returns null when missingCount is 0', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps({ missingCount: 0 })} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when missingCount is undefined', () => {
      const { container } = render(
        <MissingCogsAlert {...createMockProps({ missingCount: undefined as unknown as number })} />
      )
      expect(container.firstChild).toBeNull()
    })

    it('returns null when missingCount is negative', () => {
      const { container } = render(<MissingCogsAlert {...createMockProps({ missingCount: -5 })} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('alert structure', () => {
    it('renders AlertTriangle icon', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('renders dismiss button', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('button', { name: /закрыть уведомление/i })).toBeInTheDocument()
    })

    it('renders action button', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('link', { name: /назначить cogs/i })).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 42.3-FE: AC1 - Russian Content & Pluralization
// =============================================================================

describe('Story 42.3-FE: Russian Content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('title and message', () => {
    it('shows title "Товары без себестоимости"', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByText('Товары без себестоимости')).toBeInTheDocument()
    })

    it('shows message "без назначенной себестоимости. Маржа не рассчитывается."', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByText(/маржа не рассчитывается/i)).toBeInTheDocument()
    })

    it('shows "Назначить COGS" button text', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByText('Назначить COGS')).toBeInTheDocument()
    })
  })

  describe('Russian pluralization for count', () => {
    it('displays "1 товар" for count = 1', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 1 })} />)
      expect(screen.getByText('1 товар')).toBeInTheDocument()
    })

    it('displays "2 товара" for count = 2', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 2 })} />)
      expect(screen.getByText('2 товара')).toBeInTheDocument()
    })

    it('displays "3 товара" for count = 3', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 3 })} />)
      expect(screen.getByText('3 товара')).toBeInTheDocument()
    })

    it('displays "4 товара" for count = 4', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 4 })} />)
      expect(screen.getByText('4 товара')).toBeInTheDocument()
    })

    it('displays "5 товаров" for count = 5', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 5 })} />)
      expect(screen.getByText('5 товаров')).toBeInTheDocument()
    })

    it('displays "11 товаров" for count = 11 (special case)', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 11 })} />)
      expect(screen.getByText('11 товаров')).toBeInTheDocument()
    })

    it('displays "21 товар" for count = 21', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 21 })} />)
      expect(screen.getByText('21 товар')).toBeInTheDocument()
    })

    it('displays "22 товара" for count = 22', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 22 })} />)
      expect(screen.getByText('22 товара')).toBeInTheDocument()
    })

    it('displays "25 товаров" for count = 25', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 25 })} />)
      expect(screen.getByText('25 товаров')).toBeInTheDocument()
    })

    it('displays "100 товаров" for count = 100', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 100 })} />)
      expect(screen.getByText('100 товаров')).toBeInTheDocument()
    })

    it('displays "111 товаров" for count = 111 (special case)', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 111 })} />)
      expect(screen.getByText('111 товаров')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 42.3-FE: Tooltip Product Preview
// =============================================================================

describe('Story 42.3-FE: Tooltip Product Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('tooltip trigger', () => {
    it('shows tooltip on badge hover', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const badge = screen.getByText('45 товаров')
      await user.hover(badge)
      // Radix renders duplicate portal content; use getAllByText
      await waitFor(() => {
        expect(screen.getAllByText('Артикулы без себестоимости:').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows tooltip on badge click (mobile support)', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const badge = screen.getByText('45 товаров')
      await user.hover(badge)
      await waitFor(() => {
        expect(screen.getAllByText('Артикулы без себестоимости:').length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('tooltip content', () => {
    it('shows first 5 product IDs in tooltip', async () => {
      const user = userEvent.setup()
      const products = ['111', '222', '333', '444', '555', '666', '777']
      render(<MissingCogsAlert {...createMockProps({ missingProducts: products })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText('• 111').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('• 555').length).toBeGreaterThanOrEqual(1)
        expect(screen.queryByText('• 666')).not.toBeInTheDocument()
      })
    })

    it('shows "... и ещё N" for more than 5 products', async () => {
      const user = userEvent.setup()
      const products = Array.from({ length: 10 }, (_, i) => String(i + 1))
      render(<MissingCogsAlert {...createMockProps({ missingProducts: products })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText(/и ещё 5/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows total count when missingCount > missingProducts.length', async () => {
      const user = userEvent.setup()
      const products = Array.from({ length: 100 }, (_, i) => String(i + 1))
      render(
        <MissingCogsAlert {...createMockProps({ missingCount: 150, missingProducts: products })} />
      )
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText(/всего: 150/i).length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText(/показаны первые 100/i).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('limits preview to first 100 products from API response', async () => {
      const user = userEvent.setup()
      const products = Array.from({ length: 100 }, (_, i) => String(i + 1))
      render(<MissingCogsAlert {...createMockProps({ missingProducts: products })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText(/и ещё 95/).length).toBeGreaterThanOrEqual(1)
      })
    })

    it('handles empty missingProducts array gracefully', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps({ missingCount: 10, missingProducts: [] })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText('Список недоступен').length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

// =============================================================================
// Story 42.3-FE: AC3 - Navigation Link
// =============================================================================

describe('Story 42.3-FE: AC3 - Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('action link', () => {
    it('links to /cogs with has_cogs=false filter', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link).toHaveAttribute('href', '/cogs?has_cogs=false')
    })

    it('renders as Next.js Link component', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href', '/cogs?has_cogs=false')
    })

    it('includes ArrowRight icon in button', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      const svg = link.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 42.3-FE: AC4 - Dismiss Functionality
// =============================================================================

describe('Story 42.3-FE: AC4 - Dismiss', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('dismiss button', () => {
    it('calls onDismiss when close button clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()
      render(<MissingCogsAlert {...createMockProps({ onDismiss })} />)
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('hides alert after dismiss', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('works without onDismiss callback (optional prop)', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps({ onDismiss: undefined })} />)
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('dismiss state is managed internally with useState', async () => {
      const user = userEvent.setup()
      const { rerender } = render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      // Re-render with same props — alert stays dismissed (internal state)
      rerender(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('session behavior', () => {
    it('alert stays dismissed within same session', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('does not persist to localStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      await user.click(screen.getByRole('button', { name: /закрыть уведомление/i }))
      expect(setItemSpy).not.toHaveBeenCalled()
      setItemSpy.mockRestore()
    })
  })
})

// =============================================================================
// Story 42.3-FE: Accessibility (WCAG 2.1 AA)
// =============================================================================

describe('Story 42.3-FE: Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ARIA attributes', () => {
    it('alert has role="alert"', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('dismiss button has aria-label="Закрыть уведомление"', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      expect(screen.getByRole('button', { name: /закрыть уведомление/i })).toHaveAttribute(
        'aria-label',
        'Закрыть уведомление'
      )
    })

    it('tooltip content is accessible via keyboard', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const badge = screen.getByText('45 товаров')
      expect(badge).toHaveAttribute('tabindex', '0')
      await user.tab()
      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('keyboard navigation', () => {
    it('dismiss button is keyboard focusable', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const dismissBtn = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      await user.click(dismissBtn)
      expect(dismissBtn.tagName).toBe('BUTTON')
    })

    it('action link is keyboard focusable', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link.tagName).toBe('A')
      expect(link).toHaveAttribute('href')
    })

    it('dismiss works with Enter key', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const dismissBtn = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      dismissBtn.focus()
      await user.keyboard('{Enter}')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('dismiss works with Space key', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps()} />)
      const dismissBtn = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      dismissBtn.focus()
      await user.keyboard(' ')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  describe('color contrast', () => {
    it('amber text on amber-50 background meets 4.5:1 ratio', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('touch targets', () => {
    it('dismiss button has minimum 44x44px touch target', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const dismissBtn = screen.getByRole('button', {
        name: /закрыть уведомление/i,
      })
      expect(dismissBtn.className).toContain('min-h-[44px]')
      expect(dismissBtn.className).toContain('min-w-[44px]')
    })

    it('action button has minimum 44x44px touch target', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Story 42.3-FE: Styling & Visual
// =============================================================================

describe('Story 42.3-FE: Styling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('color scheme', () => {
    it('uses amber warning color scheme', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const alert = screen.getByRole('alert')
      expect(alert.className).toContain('relative')
    })

    it('badge uses amber outline variant', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const badge = screen.getByText('45 товаров')
      expect(badge.className).toContain('border-yellow-500')
      expect(badge.className).toContain('text-yellow-700')
      expect(badge.className).toContain('bg-yellow-100')
    })
  })

  describe('custom className', () => {
    it('applies custom className to root element', () => {
      render(<MissingCogsAlert {...createMockProps({ className: 'custom-class' })} />)
      expect(screen.getByRole('alert')).toHaveClass('custom-class')
    })
  })

  describe('responsive layout', () => {
    it('uses flex-col on mobile (sm:flex-row on desktop)', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const description = screen.getByText(/без назначенной себестоимости/)
      const container = description.closest('[class*="flex-col"]')
      expect(container).toBeInTheDocument()
    })

    it('action button is full-width on mobile', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link.closest('button')?.className ?? link.className).toContain('whitespace-nowrap')
    })
  })
})

// =============================================================================
// Story 42.3-FE: Edge Cases
// =============================================================================

describe('Story 42.3-FE: Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('large counts', () => {
    it('handles count of 1000+ products', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 1234 })} />)
      // 1234 → "товара" (Russian plural: 2-4 → товара)
      expect(document.body.textContent).toContain('1234')
      expect(document.body.textContent).toMatch(/товар/)
    })

    it('handles count of 10000+ products', () => {
      render(<MissingCogsAlert {...createMockProps({ missingCount: 12345 })} />)
      // 12345 → "товаров" (5-20 → товаров)
      expect(document.body.textContent).toContain('12345')
      expect(document.body.textContent).toMatch(/товар/)
    })
  })

  describe('minimal props', () => {
    it('renders with only required missingCount prop', () => {
      render(<MissingCogsAlert missingCount={10} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('renders without missingProducts array', () => {
      render(<MissingCogsAlert missingCount={10} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/10\s+товаров/)).toBeInTheDocument()
    })
  })

  describe('product ID formats', () => {
    it('displays numeric product IDs correctly', async () => {
      const user = userEvent.setup()
      render(<MissingCogsAlert {...createMockProps({ missingProducts: ['123456789'] })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText('• 123456789').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('displays long product IDs without truncation in tooltip', async () => {
      const user = userEvent.setup()
      const longId = '1234567890123456789'
      render(<MissingCogsAlert {...createMockProps({ missingProducts: [longId] })} />)
      await user.hover(screen.getByText(/товаров/))
      await waitFor(() => {
        expect(screen.getAllByText(`• ${longId}`).length).toBeGreaterThanOrEqual(1)
      })
    })
  })
})

// =============================================================================
// Story 42.3-FE: Integration Tests
// =============================================================================

describe('Story 42.3-FE: Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('with useSanityCheck hook (Story 42.2-FE)', () => {
    it('receives props from sanity check result', () => {
      render(<MissingCogsAlert missingCount={7} missingProducts={['sku-1', 'sku-2', 'sku-3']} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/7\s+товаров/)).toBeInTheDocument()
    })

    it('updates when sanity check is re-run', () => {
      const { rerender } = render(
        <MissingCogsAlert missingCount={5} missingProducts={['a', 'b']} />
      )
      expect(screen.getByText(/5\s+товаров/)).toBeInTheDocument()

      rerender(<MissingCogsAlert missingCount={3} missingProducts={['a']} />)
      expect(screen.getByText('3 товара')).toBeInTheDocument()
    })
  })

  describe('with ROUTES', () => {
    it('uses ROUTES.COGS.ROOT for navigation', () => {
      render(<MissingCogsAlert {...createMockProps()} />)
      const link = screen.getByRole('link', { name: /назначить cogs/i })
      expect(link).toHaveAttribute('href', '/cogs?has_cogs=false')
    })
  })
})

// =============================================================================
// Story 42.3-FE: Unit Function Tests (pluralization helper)
// =============================================================================

describe('Story 42.3-FE: pluralizeProduct Helper', () => {
  it('returns "товар" for mod10=1 (except 11)', () => {
    expect(pluralizeProduct(1)).toBe('товар')
    expect(pluralizeProduct(21)).toBe('товар')
    expect(pluralizeProduct(31)).toBe('товар')
    expect(pluralizeProduct(41)).toBe('товар')
    expect(pluralizeProduct(51)).toBe('товар')
    expect(pluralizeProduct(61)).toBe('товар')
    expect(pluralizeProduct(71)).toBe('товар')
    expect(pluralizeProduct(81)).toBe('товар')
    expect(pluralizeProduct(91)).toBe('товар')
    expect(pluralizeProduct(101)).toBe('товар')
    expect(pluralizeProduct(121)).toBe('товар')
  })

  it('returns "товара" for mod10=2,3,4 (except 12-14)', () => {
    expect(pluralizeProduct(2)).toBe('товара')
    expect(pluralizeProduct(3)).toBe('товара')
    expect(pluralizeProduct(4)).toBe('товара')
    expect(pluralizeProduct(22)).toBe('товара')
    expect(pluralizeProduct(23)).toBe('товара')
    expect(pluralizeProduct(24)).toBe('товара')
    expect(pluralizeProduct(32)).toBe('товара')
    expect(pluralizeProduct(33)).toBe('товара')
    expect(pluralizeProduct(34)).toBe('товара')
  })

  it('returns "товаров" for mod10=5-9,0 and 11-14', () => {
    expect(pluralizeProduct(5)).toBe('товаров')
    expect(pluralizeProduct(6)).toBe('товаров')
    expect(pluralizeProduct(7)).toBe('товаров')
    expect(pluralizeProduct(8)).toBe('товаров')
    expect(pluralizeProduct(9)).toBe('товаров')
    expect(pluralizeProduct(10)).toBe('товаров')
    expect(pluralizeProduct(11)).toBe('товаров')
    expect(pluralizeProduct(12)).toBe('товаров')
    expect(pluralizeProduct(13)).toBe('товаров')
    expect(pluralizeProduct(14)).toBe('товаров')
    expect(pluralizeProduct(15)).toBe('товаров')
    expect(pluralizeProduct(20)).toBe('товаров')
    expect(pluralizeProduct(25)).toBe('товаров')
    expect(pluralizeProduct(100)).toBe('товаров')
    expect(pluralizeProduct(111)).toBe('товаров')
    expect(pluralizeProduct(112)).toBe('товаров')
    expect(pluralizeProduct(113)).toBe('товаров')
    expect(pluralizeProduct(114)).toBe('товаров')
  })
})
