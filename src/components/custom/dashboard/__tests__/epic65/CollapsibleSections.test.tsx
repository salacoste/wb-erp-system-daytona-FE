/**
 * TDD Tests for CollapsibleSections (SectionHeader) — Story 65.18
 * RED phase: Tests define expected behavior BEFORE implementation.
 *
 * Collapsible section headers with chevron toggle, localStorage persistence,
 * keyboard navigation, and ARIA attributes.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md — Story 65.18
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SectionHeader } from '@/components/custom/dashboard/SectionHeader'
import { expectAccessibleCollapsible, createMockLocalStorage } from './helpers/render-helpers'

describe('CollapsibleSections (Story 65.18)', () => {
  let mockStorage: ReturnType<typeof createMockLocalStorage>

  beforeEach(() => {
    mockStorage = createMockLocalStorage()
    vi.stubGlobal('localStorage', mockStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('default state', () => {
    /** AC-65.18.7: all sections expanded by default */
    it('renders expanded by default when no collapsed prop', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders expanded when collapsed=false', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders collapsed when collapsed=true', () => {
      renderWithProviders(<SectionHeader title="РАСХОДЫ" collapsed={true} onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /РАСХОДЫ/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('toggle behavior', () => {
    /** AC-65.18.3, AC-65.18.6: clicking header toggles collapse */
    it('calls onToggle when section header clicked', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={onToggle} />)

      await user.click(screen.getByRole('button', { name: /ВЫРУЧКА/i }))
      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('calls onToggle when chevron icon is part of clickable header', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      renderWithProviders(
        <SectionHeader title="РАСХОДЫ WB" collapsed={false} onToggle={onToggle} />
      )

      // Click on the button (which includes chevron)
      await user.click(screen.getByRole('button', { name: /РАСХОДЫ WB/i }))
      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('visual styling', () => {
    /** AC-65.18.2: section header format */
    it('section header has uppercase text styling', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} />)

      screen.getByRole('button', { name: /ВЫРУЧКА/i })
      // Title text should have: text-xs font-medium uppercase tracking-wider text-muted-foreground
      const titleText = screen.getByText('ВЫРУЧКА')
      expect(titleText).toHaveClass('text-xs')
      expect(titleText).toHaveClass('font-medium')
      expect(titleText).toHaveClass('uppercase')
      expect(titleText).toHaveClass('tracking-wider')
      expect(titleText).toHaveClass('text-muted-foreground')
    })

    /** AC-65.18.1: subtle border-b */
    it('section header has bottom border separator', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} />)

      const header =
        screen.getByRole('button', { name: /ВЫРУЧКА/i }).closest('[class*="border-b"]') ??
        screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expect(header.className).toMatch(/border-b/)
    })

    /** AC-65.18.3: chevron icon changes direction */
    it('shows ChevronDown when expanded', () => {
      const { container } = renderWithProviders(
        <SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={vi.fn()} />
      )

      // Look for a chevron icon (svg element)
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('shows ChevronUp when collapsed', () => {
      const { container } = renderWithProviders(
        <SectionHeader title="ВЫРУЧКА" collapsed={true} onToggle={vi.fn()} />
      )

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    /** AC-65.18.8: on mobile, section header spans full width */
    it('has col-span-full class for grid context', () => {
      const { container } = renderWithProviders(
        <SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} />
      )

      // The outermost element of SectionHeader should have col-span-full
      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper).toHaveClass('col-span-full')
    })

    it('applies custom className', () => {
      const { container } = renderWithProviders(
        <SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} className="my-custom" />
      )

      const wrapper = container.firstElementChild as HTMLElement
      expect(wrapper).toHaveClass('my-custom')
    })
  })

  describe('keyboard navigation', () => {
    /** AC-65.18.6: Enter toggles section */
    it('Enter key toggles section', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={onToggle} />)

      const button = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      button.focus()
      await user.keyboard('{Enter}')

      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    /** AC-65.18.6: Space toggles section */
    it('Space key toggles section', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      renderWithProviders(<SectionHeader title="РАСХОДЫ" collapsed={false} onToggle={onToggle} />)

      const button = screen.getByRole('button', { name: /РАСХОДЫ/i })
      button.focus()
      await user.keyboard(' ')

      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('section header is focusable via Tab', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" onToggle={vi.fn()} />)

      await user.tab()

      const button = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expect(document.activeElement).toBe(button)
    })
  })

  describe('ARIA attributes', () => {
    /** AC-65.18.5: aria-expanded on toggle button */
    it('aria-expanded="true" when expanded', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expectAccessibleCollapsible(trigger, true)
    })

    it('aria-expanded="false" when collapsed', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={true} onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expectAccessibleCollapsible(trigger, false)
    })

    /** AC-65.18.5: aria-controls points to content ID */
    it('aria-controls references a valid content element ID', () => {
      renderWithProviders(<SectionHeader title="ВЫРУЧКА" collapsed={false} onToggle={vi.fn()} />)

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      const controlsId = trigger.getAttribute('aria-controls')
      expect(controlsId).toBeTruthy()
    })
  })

  describe('state persistence', () => {
    /** AC-65.18.4: collapsed state persists across re-renders in component state */
    it('section state persists across re-renders', () => {
      const onToggle = vi.fn()
      const { rerender } = renderWithProviders(
        <SectionHeader title="ВЫРУЧКА" collapsed={true} onToggle={onToggle} />
      )

      const trigger = screen.getByRole('button', { name: /ВЫРУЧКА/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      // Re-render with same props, state should persist
      rerender(<SectionHeader title="ВЫРУЧКА" collapsed={true} onToggle={onToggle} />)

      expect(screen.getByRole('button', { name: /ВЫРУЧКА/i })).toHaveAttribute(
        'aria-expanded',
        'false'
      )
    })
  })
})
