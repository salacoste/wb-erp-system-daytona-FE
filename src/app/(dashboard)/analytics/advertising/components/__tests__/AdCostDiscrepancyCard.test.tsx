import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdCostDiscrepancyCard } from '../AdCostDiscrepancyCard'

describe('AdCostDiscrepancyCard', () => {
  it('renders loading skeleton', () => {
    render(<AdCostDiscrepancyCard platformSpend={null} actualDeduction={null} isLoading={true} />)
    const skeleton = document.querySelector('.h-40')
    expect(skeleton).toBeTruthy()
  })

  it('returns null when both values are null and not loading', () => {
    const { container } = render(
      <AdCostDiscrepancyCard platformSpend={null} actualDeduction={null} isLoading={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders card title', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={95_000} isLoading={false} />
    )
    expect(screen.getByText('Расхождение рекламных расходов')).toBeInTheDocument()
  })

  it('renders three layer columns', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={95_000} isLoading={false} />
    )
    expect(screen.getByText('Платформа')).toBeInTheDocument()
    expect(screen.getByText('Скорректированная')).toBeInTheDocument()
    expect(screen.getByText('Факт (отчёт WB)')).toBeInTheDocument()
  })

  it('shows "Скоро" for unavailable layer', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={95_000} isLoading={false} />
    )
    expect(screen.getByText('Скоро')).toBeInTheDocument()
  })

  it('renders delta row with severity for normal discrepancy (≤5%)', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={97_000} isLoading={false} />
    )
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status.textContent).toContain('Платформа → Факт')
  })

  it('renders delta with warning severity (>5%)', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={92_000} isLoading={false} />
    )
    const status = screen.getByRole('status')
    expect(status.className).toContain('yellow')
  })

  it('renders delta with danger severity (>10%)', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={85_000} isLoading={false} />
    )
    const status = screen.getByRole('status')
    expect(status.className).toContain('red')
  })

  it('shows info section on click', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={95_000} isLoading={false} />
    )
    const trigger = screen.getByText('Почему суммы различаются?')
    fireEvent.click(trigger)
    expect(screen.getByText(/Округление/)).toBeInTheDocument()
    expect(screen.getByText(/Таймлаг/)).toBeInTheDocument()
    expect(screen.getByText(/Корректировки/)).toBeInTheDocument()
  })

  it('shows week label for actual layer when provided', () => {
    render(
      <AdCostDiscrepancyCard
        platformSpend={100_000}
        actualDeduction={95_000}
        isLoading={false}
        weekLabel="2026-W10"
      />
    )
    expect(screen.getByText('(2026-W10)')).toBeInTheDocument()
  })

  it('renders formatted currency values', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={95_000} isLoading={false} />
    )
    const allText = document.body.textContent ?? ''
    expect(allText).toContain('100')
    expect(allText).toContain('95')
    expect(allText).toContain('₽')
  })

  it('renders card with only platformSpend (actualDeduction null)', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={100_000} actualDeduction={null} isLoading={false} />
    )
    expect(screen.getByText('Расхождение рекламных расходов')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('renders card with only actualDeduction (platformSpend null)', () => {
    render(
      <AdCostDiscrepancyCard platformSpend={null} actualDeduction={95_000} isLoading={false} />
    )
    expect(screen.getByText('Расхождение рекламных расходов')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
