import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'

describe('MetricCard', () => {
  it('renders title and formatted value', { timeout: 5000 }, async () => {
    render(<MetricCard title="Total Payable" value={1234567.89} />)
    
    expect(screen.getByText('Total Payable')).toBeInTheDocument()
    // formatCurrency formats as Russian Ruble, so we check for the formatted value
    const valueElement = screen.getByText(/1[\s\u00A0]234[\s\u00A0]567/)
    expect(valueElement).toBeInTheDocument()
  })

  it('displays loading skeleton when isLoading is true', { timeout: 5000 }, async () => {
    render(<MetricCard title="Revenue" value={1000} isLoading={true} />)
    
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    // Skeleton component should be rendered
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('displays error message when error is provided', { timeout: 5000 }, async () => {
    render(
      <MetricCard
        title="Total Payable"
        value={1000}
        error="Ошибка загрузки"
      />
    )
    
    expect(screen.getByText('Total Payable')).toBeInTheDocument()
    expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
  })

  it('displays "Нет данных" when value is undefined', { timeout: 5000 }, async () => {
    render(<MetricCard title="Revenue" value={undefined} />)
    
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('Нет данных')).toBeInTheDocument()
  })

  it('applies custom className', { timeout: 5000 }, async () => {
    const { container } = render(
      <MetricCard title="Test" value={1000} className="custom-class" />
    )
    
    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })

  it('formats currency correctly for large numbers', { timeout: 5000 }, async () => {
    render(<MetricCard title="Total Payable" value={1234567890.12} />)
    
    // Check that the formatted value is displayed (Russian format with spaces)
    const valueElement = screen.getByText(/1[\s\u00A0]234[\s\u00A0]567[\s\u00A0]890/)
    expect(valueElement).toBeInTheDocument()
  })

  it('formats currency correctly for zero', { timeout: 5000 }, async () => {
    render(<MetricCard title="Revenue" value={0} />)
    
    // Zero should be formatted as currency
    const valueElement = screen.getByText(/0/)
    expect(valueElement).toBeInTheDocument()
  })

  it('prioritizes error over loading state', { timeout: 5000 }, async () => {
    render(
      <MetricCard
        title="Test"
        value={1000}
        isLoading={true}
        error="Error message"
      />
    )
    
    // Error should be displayed, not loading skeleton
    expect(screen.getByText('Error message')).toBeInTheDocument()
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).not.toBeInTheDocument()
  })

  it('prioritizes loading over undefined value', { timeout: 5000 }, async () => {
    render(<MetricCard title="Test" value={undefined} isLoading={true} />)
    
    // Loading skeleton should be displayed, not "Нет данных"
    expect(screen.queryByText('Нет данных')).not.toBeInTheDocument()
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})

