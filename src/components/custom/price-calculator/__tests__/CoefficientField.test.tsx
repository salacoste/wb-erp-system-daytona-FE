/**
 * CoefficientField Component Tests
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 *
 * Unit tests for coefficient input field with auto-fill badge and restore functionality
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CoefficientField } from '../CoefficientField'
import type { FieldSource } from '../AutoFillBadge'

// Wrapper for TooltipProvider
function renderWithProviders(ui: React.ReactElement) {
  return render(ui)
}

describe('CoefficientField', () => {
  const defaultProps = {
    label: 'Коэффициент логистики',
    value: 1.5,
    source: 'auto' as FieldSource,
    onChange: vi.fn(),
    onSourceChange: vi.fn(),
  }

  it('renders label and value correctly', () => {
    renderWithProviders(<CoefficientField {...defaultProps} />)

    expect(screen.getByText('Коэффициент логистики')).toBeInTheDocument()

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue(1.5)
  })

  it('shows "Автозаполнено" badge when source is auto', () => {
    renderWithProviders(<CoefficientField {...defaultProps} source="auto" />)

    expect(screen.getByText('Автозаполнено')).toBeInTheDocument()
  })

  it('shows "Вручную" badge when source is manual', () => {
    renderWithProviders(<CoefficientField {...defaultProps} source="manual" />)

    expect(screen.getByText('Вручную')).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const onChange = vi.fn()
    renderWithProviders(<CoefficientField {...defaultProps} onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '2.0' } })

    expect(onChange).toHaveBeenCalledWith(2.0)
  })

  it('calls onSourceChange when auto value is edited', () => {
    const onSourceChange = vi.fn()
    renderWithProviders(
      <CoefficientField {...defaultProps} source="auto" onSourceChange={onSourceChange} />,
    )

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '2.0' } })

    expect(onSourceChange).toHaveBeenCalledWith('manual')
  })

  it('does not call onSourceChange when already manual', () => {
    const onSourceChange = vi.fn()
    renderWithProviders(
      <CoefficientField {...defaultProps} source="manual" onSourceChange={onSourceChange} />,
    )

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: '2.0' } })

    expect(onSourceChange).not.toHaveBeenCalled()
  })

  it('shows restore button when manual with originalValue', () => {
    const onRestore = vi.fn()
    renderWithProviders(
      <CoefficientField
        {...defaultProps}
        source="manual"
        originalValue={1.0}
        onRestore={onRestore}
      />,
    )

    const restoreButton = screen.getByRole('button', { name: /восстановить/i })
    expect(restoreButton).toBeInTheDocument()
  })

  it('does not show restore button when auto', () => {
    renderWithProviders(
      <CoefficientField {...defaultProps} source="auto" originalValue={1.0} onRestore={vi.fn()} />,
    )

    expect(screen.queryByRole('button', { name: /восстановить/i })).not.toBeInTheDocument()
  })

  it('does not show restore button when manual but no originalValue', () => {
    renderWithProviders(
      <CoefficientField {...defaultProps} source="manual" onRestore={vi.fn()} />,
    )

    expect(screen.queryByRole('button', { name: /восстановить/i })).not.toBeInTheDocument()
  })

  it('calls onRestore when restore button clicked', () => {
    const onRestore = vi.fn()
    renderWithProviders(
      <CoefficientField
        {...defaultProps}
        source="manual"
        originalValue={1.0}
        onRestore={onRestore}
      />,
    )

    const restoreButton = screen.getByRole('button', { name: /восстановить/i })
    fireEvent.click(restoreButton)

    expect(onRestore).toHaveBeenCalledTimes(1)
  })

  it('shows original value hint when manual with originalValue', () => {
    renderWithProviders(
      <CoefficientField {...defaultProps} source="manual" originalValue={1.0} />,
    )

    expect(screen.getByText('Тарифное значение: 1.00')).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    renderWithProviders(<CoefficientField {...defaultProps} disabled />)

    const input = screen.getByRole('spinbutton')
    expect(input).toBeDisabled()
  })

  it('renders tooltip when provided', () => {
    renderWithProviders(
      <CoefficientField {...defaultProps} tooltip="Коэффициент увеличения стоимости" />,
    )

    // Info icon (tooltip trigger) should be present
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('respects min and max props', () => {
    renderWithProviders(<CoefficientField {...defaultProps} min={0.5} max={5.0} />)

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('min', '0.5')
    expect(input).toHaveAttribute('max', '5')
  })

  it('handles invalid input gracefully', () => {
    const onChange = vi.fn()
    renderWithProviders(<CoefficientField {...defaultProps} onChange={onChange} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.change(input, { target: { value: 'invalid' } })

    expect(onChange).toHaveBeenCalledWith(0) // parseFloat returns NaN, fallback to 0
  })
})
