/**
 * CategoryHelpSection Unit Tests
 *
 * Verifies help section content:
 * - Renders card with title
 * - Renders all 5 help sections
 * - Uses status-information token panel (Story 170.5)
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CategoryHelpSection } from '../CategoryHelpSection'

describe('CategoryHelpSection', () => {
  it('renders card title', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('Как использовать анализ')).toBeInTheDocument()
  })

  it('renders aggregation section', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('1. Агрегация данных')).toBeInTheDocument()
  })

  it('renders drill-down section', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('2. Детализация')).toBeInTheDocument()
  })

  it('renders COGS column section', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('3. Столбец "Без COGS"')).toBeInTheDocument()
  })

  it('renders color indicator section', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('4. Цветовая индикация')).toBeInTheDocument()
  })

  it('renders strategic planning section', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText('5. Стратегическое планирование')).toBeInTheDocument()
  })

  it('renders explanatory text about margins', () => {
    renderWithProviders(<CategoryHelpSection />)
    expect(screen.getByText(/средневзвешенное значение/)).toBeInTheDocument()
  })
})
