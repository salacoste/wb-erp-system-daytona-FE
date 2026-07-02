/**
 * FboAggregateCards Unit Tests
 *
 * Verifies aggregate metric cards render correctly:
 * - All five metric cards render with labels
 * - Numeric values formatted in Russian locale
 * - cancelRate null renders em-dash
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { FboAggregateCards } from '../FboAggregateCards'

const defaultProps = {
  count: 150,
  totalPrice: 500000,
  totalFinishedPrice: 450000,
  cancelledCount: 12,
  cancelRate: 8.0 as number | null,
}

describe('FboAggregateCards', () => {
  it('renders all five metric card labels', () => {
    renderWithProviders(<FboAggregateCards {...defaultProps} />)
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Сумма заказов')).toBeInTheDocument()
    expect(screen.getByText('Итого со скидкой')).toBeInTheDocument()
    expect(screen.getByText('Отмены')).toBeInTheDocument()
    expect(screen.getByText('% отмен')).toBeInTheDocument()
  })

  it('renders numeric values correctly', () => {
    renderWithProviders(<FboAggregateCards {...defaultProps} />)
    // count uses toLocaleString('ru-RU') — in jsdom this may render differently
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    // cancelRate 8.0 → "8,0 %" (Russian locale via formatPercentage)
    expect(screen.getByText(/8,0\s%/)).toBeInTheDocument()
  })

  it('renders em-dash when cancelRate is null', () => {
    renderWithProviders(<FboAggregateCards {...defaultProps} cancelRate={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
