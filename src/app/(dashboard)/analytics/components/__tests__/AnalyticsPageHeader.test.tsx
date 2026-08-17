/**
 * Story 168.1 behavior lock — analytics hub page header.
 * Pins h1 copy, per-viewMode subtitle, and view-mode toggle button labels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsPageHeader } from '../AnalyticsPageHeader'

describe('AnalyticsPageHeader', () => {
  it('renders the single h1 «Аналитика» with the default subtitle', () => {
    render(<AnalyticsPageHeader viewMode="single" weekCount={1} onCycleViewMode={() => {}} />)
    const h1 = screen.getByRole('heading', { level: 1, name: 'Аналитика' })
    expect(h1.className).toContain('text-foreground')
    expect(
      screen.getByText('Выберите раздел аналитики или просмотрите финансовую сводку ниже')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Несколько периодов/ })).toBeInTheDocument()
  })

  it('renders the aggregated-weeks subtitle only in multi mode with 2+ weeks', () => {
    render(<AnalyticsPageHeader viewMode="multi" weekCount={3} onCycleViewMode={() => {}} />)
    expect(screen.getByText('Агрегированные данные за 3 недели')).toBeInTheDocument()
    // multi → comparison toggle label
    expect(screen.getByRole('button', { name: /Сравнить периоды/ })).toBeInTheDocument()
  })

  it('uses the week plural for 2–4 weeks and «недель» beyond', () => {
    const { rerender } = render(
      <AnalyticsPageHeader viewMode="multi" weekCount={2} onCycleViewMode={() => {}} />
    )
    expect(screen.getByText('Агрегированные данные за 2 недели')).toBeInTheDocument()
    rerender(<AnalyticsPageHeader viewMode="multi" weekCount={5} onCycleViewMode={() => {}} />)
    expect(screen.getByText('Агрегированные данные за 5 недель')).toBeInTheDocument()
  })

  it('multi with a single week falls back to the default subtitle', () => {
    render(<AnalyticsPageHeader viewMode="multi" weekCount={1} onCycleViewMode={() => {}} />)
    expect(
      screen.getByText('Выберите раздел аналитики или просмотрите финансовую сводку ниже')
    ).toBeInTheDocument()
  })

  it('comparison mode offers «Один период»', () => {
    render(<AnalyticsPageHeader viewMode="comparison" weekCount={1} onCycleViewMode={() => {}} />)
    expect(screen.getByRole('button', { name: /^Один период$/ })).toBeInTheDocument()
  })
})
