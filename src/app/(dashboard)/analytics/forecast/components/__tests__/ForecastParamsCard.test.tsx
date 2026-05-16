/**
 * ForecastParamsCard Tests — Story 108.2-FE (Fix 9: 2-pass review addition).
 * Story 109.1-FE: extended with modelType selector assertions.
 * Tests the pure presentational component directly.
 */
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastParamsCard } from '../ForecastParamsCard'

/** Shared no-op handlers + default modelType. */
const noop = {
  modelType: 'sales_forecast' as const,
  onLevelChange: vi.fn(),
  onNmIdChange: vi.fn(),
  onHorizonChange: vi.fn(),
  onModelTypeChange: vi.fn(),
}

describe('ForecastParamsCard', () => {
  it('SKU level + enabled=false: shows "Введите артикул" alert', () => {
    render(
      React.createElement(ForecastParamsCard, {
        level: 'sku',
        nmIdInput: '',
        horizonDays: 7,
        parsedNmId: null,
        enabled: false,
        ...noop,
      })
    )
    expect(screen.getByText(/Введите артикул WB/)).toBeTruthy()
  })

  it('SKU level + parsedNmId=123 + enabled=true: hides missing-nmId alert', () => {
    render(
      React.createElement(ForecastParamsCard, {
        level: 'sku',
        nmIdInput: '123',
        horizonDays: 7,
        parsedNmId: 123,
        enabled: true,
        ...noop,
      })
    )
    expect(screen.queryByText(/Введите артикул WB/)).toBeNull()
    // nmId input is visible for SKU level
    expect(screen.getByLabelText(/Артикул WB/)).toBeTruthy()
  })

  it('cabinet level: hides nmId input and missing-nmId alert entirely', () => {
    render(
      React.createElement(ForecastParamsCard, {
        level: 'cabinet',
        nmIdInput: '',
        horizonDays: 7,
        parsedNmId: null,
        enabled: true,
        ...noop,
      })
    )
    expect(screen.queryByLabelText(/Артикул WB/)).toBeNull()
    expect(screen.queryByText(/Введите артикул WB/)).toBeNull()
  })

  // Story 109.1-FE: ModelTypeSelector integration tests
  it('renders "Тип модели" selector label for SKU level', () => {
    render(
      React.createElement(ForecastParamsCard, {
        level: 'sku',
        nmIdInput: '',
        horizonDays: 7,
        parsedNmId: null,
        enabled: true,
        ...noop,
      })
    )
    expect(screen.getByText('Тип модели')).toBeTruthy()
  })

  it('renders "Тип модели" selector label for cabinet level (not gated by level)', () => {
    render(
      React.createElement(ForecastParamsCard, {
        level: 'cabinet',
        nmIdInput: '',
        horizonDays: 7,
        parsedNmId: null,
        enabled: true,
        ...noop,
      })
    )
    expect(screen.getByText('Тип модели')).toBeTruthy()
  })
})
