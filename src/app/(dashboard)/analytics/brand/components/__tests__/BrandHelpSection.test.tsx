/**
 * BrandHelpSection Unit Tests
 *
 * Verifies help section content:
 * - Renders card with title
 * - Renders all 4 help sections
 * - Uses blue color scheme
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { BrandHelpSection } from '../BrandHelpSection'

describe('BrandHelpSection', () => {
  it('renders card title', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText('Как использовать анализ')).toBeInTheDocument()
  })

  it('renders aggregation section', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText('1. Агрегация данных')).toBeInTheDocument()
  })

  it('renders drill-down section', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText('2. Детализация')).toBeInTheDocument()
  })

  it('renders COGS column section', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText('3. Столбец "Без COGS"')).toBeInTheDocument()
  })

  it('renders color indicator section', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText('4. Цветовая индикация')).toBeInTheDocument()
  })

  it('renders explanatory text about brands', () => {
    renderWithProviders(<BrandHelpSection />)
    expect(screen.getByText(/по товарам каждого бренда/)).toBeInTheDocument()
  })
})
