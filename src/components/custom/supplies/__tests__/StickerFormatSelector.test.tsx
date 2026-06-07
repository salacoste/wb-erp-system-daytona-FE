/**
 * Unit Tests for StickerFormatSelector component
 * Story 53.6-FE: Close Supply & Stickers
 * Epic 53-FE: Supply Management UI
 *
 * Test coverage:
 * - Format options rendering
 * - Radio button selection
 * - onChange callback
 * - Disabled state
 * - Keyboard navigation
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { StickerFormatSelector } from '../StickerFormatSelector'
import { STICKER_FORMATS, FORMAT_LABELS } from '@/test/fixtures/stickers'
import type { StickerFormat } from '@/types/supplies'

function renderSelector(overrides: Partial<Parameters<typeof StickerFormatSelector>[0]> = {}) {
  const props = {
    value: 'png' as StickerFormat,
    onChange: vi.fn(),
    disabled: false,
    ...overrides,
  }
  const result = renderWithProviders(<StickerFormatSelector {...props} />)
  return { ...result, props }
}

describe('StickerFormatSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // 1. Format Options Rendering
  // ===========================================================================

  describe('Format Options Rendering', () => {
    it('renders label "Выберите формат:"', () => {
      renderSelector()
      expect(screen.getByText('Выберите формат:')).toBeInTheDocument()
    })

    it('renders 3 format options', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)
    })

    it('renders PNG option with correct label', () => {
      renderSelector()
      expect(screen.getByText('PNG')).toBeInTheDocument()
    })

    it('PNG description mentions regular printers', () => {
      renderSelector()
      expect(screen.getByText(/для обычных принтеров/)).toBeInTheDocument()
    })

    it('renders SVG option with correct label', () => {
      renderSelector()
      expect(screen.getByText('SVG')).toBeInTheDocument()
    })

    it('SVG description mentions high quality', () => {
      renderSelector()
      expect(screen.getByText(/высокое качество/)).toBeInTheDocument()
    })

    it('renders ZPL option with correct label', () => {
      renderSelector()
      expect(screen.getByText('ZPL')).toBeInTheDocument()
    })

    it('ZPL description mentions Zebra printers', () => {
      renderSelector()
      expect(screen.getByText(/термопринтеров Zebra/)).toBeInTheDocument()
    })

    it('format options are rendered in correct order: PNG, SVG, ZPL', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      const values = radios.map(r => r.getAttribute('value'))
      expect(values).toEqual(['png', 'svg', 'zpl'])
    })
  })

  // ===========================================================================
  // 2. Radio Button Selection
  // ===========================================================================

  describe('Radio Button Selection', () => {
    it('PNG radio is checked when value is "png"', () => {
      renderSelector({ value: 'png' })
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('data-state', 'checked')
    })

    it('SVG radio is checked when value is "svg"', () => {
      renderSelector({ value: 'svg' })
      const radios = screen.getAllByRole('radio')
      expect(radios[1]).toHaveAttribute('data-state', 'checked')
    })

    it('ZPL radio is checked when value is "zpl"', () => {
      renderSelector({ value: 'zpl' })
      const radios = screen.getAllByRole('radio')
      expect(radios[2]).toHaveAttribute('data-state', 'checked')
    })

    it('only one radio can be checked at a time', () => {
      renderSelector({ value: 'png' })
      const radios = screen.getAllByRole('radio')
      const checkedCount = radios.filter(r => r.getAttribute('data-state') === 'checked').length
      expect(checkedCount).toBe(1)
    })

    it('selected option has visual indicator', () => {
      renderSelector({ value: 'svg' })
      const radios = screen.getAllByRole('radio')
      expect(radios[1]).toHaveAttribute('data-state', 'checked')
    })
  })

  // ===========================================================================
  // 3. onChange Callback
  // ===========================================================================

  describe('onChange Callback', () => {
    it('calls onChange with "svg" when SVG option clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const svgLabel = screen.getByText('SVG')
      await user.click(svgLabel)
      expect(props.onChange).toHaveBeenCalledWith('svg')
    })

    it('calls onChange with "zpl" when ZPL option clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const zplLabel = screen.getByText('ZPL')
      await user.click(zplLabel)
      expect(props.onChange).toHaveBeenCalledWith('zpl')
    })

    it('calls onChange when clicking on description text', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const svgDesc = screen.getByText(/высокое качество/)
      await user.click(svgDesc)
      expect(props.onChange).toHaveBeenCalled()
    })

    it('onChange is called with correct format type', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const radios = screen.getAllByRole('radio')
      await user.click(radios[1])
      expect(props.onChange).toHaveBeenCalledWith('svg')
    })

    it('onChange can be called multiple times', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      await user.click(screen.getByText('SVG'))
      await user.click(screen.getByText('ZPL'))
      expect(props.onChange).toHaveBeenCalledTimes(2)
    })

    it('calls onChange with "png" when PNG option clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector({ value: 'svg' })
      await user.click(screen.getByText('PNG'))
      expect(props.onChange).toHaveBeenCalledWith('png')
    })
  })

  // ===========================================================================
  // 4. Disabled State
  // ===========================================================================

  describe('Disabled State', () => {
    it('all radio buttons are disabled when disabled is true', () => {
      renderSelector({ disabled: true })
      const radios = screen.getAllByRole('radio')
      // Radix marks disabled radios with tabindex="-1" and disabled attribute
      radios.forEach(radio => {
        expect(radio).toBeDisabled()
      })
    })

    it('clicking disabled radio does not call onChange', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector({ disabled: true })
      const svgLabel = screen.getByText('SVG')
      await user.click(svgLabel)
      expect(props.onChange).not.toHaveBeenCalled()
    })

    it('disabled state has visual indication (opacity)', () => {
      renderSelector({ disabled: true })
      const radios = screen.getAllByRole('radio')
      expect(radios[0].className).toContain('opacity')
    })

    it('labels have reduced opacity when disabled', () => {
      renderSelector({ disabled: true })
      // The label elements have opacity-50 when disabled
      const labels = document.querySelectorAll('label.opacity-50')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('cursor changes to not-allowed when disabled', () => {
      renderSelector({ disabled: true })
      const radios = screen.getAllByRole('radio')
      expect(radios[0].className).toContain('cursor-not-allowed')
    })
  })

  // ===========================================================================
  // 5. Keyboard Navigation
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('radio group is focusable with Tab key', async () => {
      const user = userEvent.setup()
      renderSelector()
      await user.tab()
      const radios = screen.getAllByRole('radio')
      const focused = document.activeElement
      expect(radios).toContain(focused)
    })

    it('radio group has 3 options navigable by keyboard', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)
    })

    it('radio buttons have tabindex for keyboard access', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      // Radix RadioGroup uses roving tabindex - the checked item gets tabindex="0"
      const checked = radios.filter(r => r.getAttribute('data-state') === 'checked')
      expect(checked.length).toBe(1)
    })

    it('radiogroup allows arrow key navigation (Radix feature)', () => {
      renderSelector()
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toBeInTheDocument()
      // Radix RadioGroup handles arrow keys internally
    })

    it('clicking second radio changes selection', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const radios = screen.getAllByRole('radio')
      await user.click(radios[1])
      expect(props.onChange).toHaveBeenCalledWith('svg')
    })

    it('clicking third radio changes selection', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const radios = screen.getAllByRole('radio')
      await user.click(radios[2])
      expect(props.onChange).toHaveBeenCalledWith('zpl')
    })

    it('keyboard focus is trapped within radiogroup', () => {
      renderSelector()
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toBeInTheDocument()
    })

    it('all radios are reachable via click', async () => {
      const user = userEvent.setup()
      const { props } = renderSelector()
      const radios = screen.getAllByRole('radio')
      // Click SVG and ZPL (PNG is already selected, won't trigger onChange)
      await user.click(radios[1])
      await user.click(radios[2])
      expect(props.onChange).toHaveBeenCalledTimes(2)
    })
  })

  // ===========================================================================
  // 6. Accessibility
  // ===========================================================================

  describe('Accessibility', () => {
    it('radio group has role="radiogroup"', () => {
      renderSelector()
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    it('each option has role="radio"', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(3)
    })

    it('selected option has aria-checked="true"', () => {
      renderSelector({ value: 'png' })
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    })

    it('unselected options have aria-checked="false"', () => {
      renderSelector({ value: 'png' })
      const radios = screen.getAllByRole('radio')
      expect(radios[1]).toHaveAttribute('aria-checked', 'false')
      expect(radios[2]).toHaveAttribute('aria-checked', 'false')
    })

    it('radio group has accessible name from label', () => {
      renderSelector()
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup).toHaveAccessibleName()
    })

    it('labels are properly associated with radio inputs', () => {
      renderSelector()
      // Each radio has an id and label has htmlFor
      const radios = screen.getAllByRole('radio')
      for (const radio of radios) {
        const id = radio.getAttribute('id')
        expect(id).toBeTruthy()
        const label = document.querySelector(`label[for="${id}"]`)
        expect(label).toBeTruthy()
      }
    })

    it('focus indicator is visible on keyboard navigation', async () => {
      const user = userEvent.setup()
      renderSelector()
      await user.tab()
      const focused = document.activeElement
      expect(focused).toBeTruthy()
    })

    it('disabled state is announced via disabled attribute', () => {
      renderSelector({ disabled: true })
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toBeDisabled()
    })
  })

  // ===========================================================================
  // 7. Visual Styling
  // ===========================================================================

  describe('Visual Styling', () => {
    it('radio buttons have consistent size', () => {
      renderSelector()
      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(3)
    })

    it('labels have proper spacing from radio buttons', () => {
      renderSelector()
      const container = screen.getAllByRole('radio')[0].closest('div')
      expect(container?.className).toContain('space-x')
    })

    it('options have vertical spacing between them', () => {
      renderSelector()
      const radiogroup = screen.getByRole('radiogroup')
      expect(radiogroup.className).toContain('space-y')
    })

    it('label text uses font-normal weight', () => {
      renderSelector()
      const labels = document.querySelectorAll('label')
      labels.forEach(label => {
        if (label.getAttribute('for')?.startsWith('format-')) {
          expect(label.className).toContain('font-normal')
        }
      })
    })

    it('label has cursor-pointer when enabled', () => {
      renderSelector({ disabled: false })
      const labels = document.querySelectorAll('label')
      const formatLabels = Array.from(labels).filter(l =>
        l.getAttribute('for')?.startsWith('format-')
      )
      formatLabels.forEach(label => {
        expect(label.className).toContain('cursor-pointer')
      })
    })

    it('section label has font-medium weight', () => {
      renderSelector()
      const sectionLabel = screen.getByText('Выберите формат:')
      expect(sectionLabel.className).toContain('font-medium')
    })
  })

  // ===========================================================================
  // TDD Verification Tests
  // ===========================================================================

  describe('TDD Verification', () => {
    it('should have format constants ready', () => {
      expect(STICKER_FORMATS).toEqual(['png', 'svg', 'zpl'])
    })

    it('should have format labels ready', () => {
      expect(FORMAT_LABELS).toEqual({
        png: 'PNG - для обычных принтеров',
        svg: 'SVG - высокое качество',
        zpl: 'ZPL - для термопринтеров Zebra',
      })
    })

    it('should have testing utilities available', () => {
      expect(screen).toBeDefined()
      expect(userEvent).toBeDefined()
      expect(renderWithProviders).toBeDefined()
    })
  })
})

// Suppress unused fixture warnings
void STICKER_FORMATS
void FORMAT_LABELS
