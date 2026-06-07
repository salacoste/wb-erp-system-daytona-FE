/**
 * Tests for ExportDialogForm
 * Story 6.5-FE: Export Analytics UI
 *
 * Tests rendering and user interactions for the export configuration form.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, fireEvent } from '@/test/utils/test-utils'
import { ExportDialogForm } from '../ExportDialogForm'
import type { ExportType, ExportFormat } from '@/types/analytics'

describe('ExportDialogForm', () => {
  const defaultProps = {
    type: 'by-sku' as ExportType,
    onTypeChange: vi.fn(),
    weekStart: '2025-W10',
    weekEnd: '2025-W12',
    onRangeChange: vi.fn(),
    format: 'xlsx' as ExportFormat,
    onFormatChange: vi.fn(),
    includeCogs: true,
    onIncludeCogsChange: vi.fn(),
    createError: null,
  }

  it('renders the data type label', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    expect(screen.getByText('Тип данных')).toBeInTheDocument()
  })

  it('renders the file format buttons with Excel selected by default', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  it('renders the COGS checkbox label', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    expect(screen.getByText('Включить данные COGS (себестоимость)')).toBeInTheDocument()
  })

  it('calls onFormatChange when CSV button is clicked', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    fireEvent.click(screen.getByText('CSV'))
    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('csv')
  })

  it('calls onFormatChange when Excel button is clicked', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} format="csv" />)
    fireEvent.click(screen.getByText(/Excel/))
    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('xlsx')
  })

  it('displays error message when createError is provided', () => {
    const error = new Error('Сервер недоступен')
    renderWithProviders(<ExportDialogForm {...defaultProps} createError={error} />)
    expect(screen.getByText('Сервер недоступен')).toBeInTheDocument()
  })

  it('displays fallback error message when error has no message', () => {
    const error = new Error()
    renderWithProviders(<ExportDialogForm {...defaultProps} createError={error} />)
    expect(screen.getByText('Ошибка при создании экспорта')).toBeInTheDocument()
  })

  it('does not display error block when createError is null', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    expect(screen.queryByText('Ошибка при создании экспорта')).not.toBeInTheDocument()
  })

  it('renders file format label', () => {
    renderWithProviders(<ExportDialogForm {...defaultProps} />)
    expect(screen.getByText('Формат файла')).toBeInTheDocument()
  })
})
