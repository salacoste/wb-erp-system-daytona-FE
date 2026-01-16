/**
 * Unit tests for ProductNameCell component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductNameCell } from '../ProductNameCell'

describe('ProductNameCell', () => {
  it('shows dash for null name', () => {
    render(<ProductNameCell name={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows full name when under default max length (45 chars)', () => {
    const shortName = 'Короткое название товара'
    render(<ProductNameCell name={shortName} />)
    expect(screen.getByText(shortName)).toBeInTheDocument()
  })

  it('shows full name when exactly 45 characters', () => {
    const exactName = 'A'.repeat(45) // Exactly 45 characters
    render(<ProductNameCell name={exactName} />)
    expect(screen.getByText(exactName)).toBeInTheDocument()
  })

  it('truncates with ellipsis at 45 chars by default', () => {
    const longName = 'A'.repeat(60) // 60 characters
    render(<ProductNameCell name={longName} />)

    const truncated = 'A'.repeat(45) + '...'
    expect(screen.getByText(truncated)).toBeInTheDocument()
  })

  it('respects custom maxLength prop', () => {
    const longName = 'Очень длинное название товара для теста'
    render(<ProductNameCell name={longName} maxLength={20} />)

    const truncated = longName.slice(0, 20) + '...'
    expect(screen.getByText(truncated)).toBeInTheDocument()
  })

  it('applies cursor-help class to truncated names', () => {
    const longName = 'A'.repeat(60)
    render(<ProductNameCell name={longName} />)

    const element = screen.getByText('A'.repeat(45) + '...')
    expect(element).toHaveClass('cursor-help')
  })

  it('does not apply cursor-help to short names', () => {
    const shortName = 'Короткое'
    render(<ProductNameCell name={shortName} />)

    const element = screen.getByText(shortName)
    expect(element).not.toHaveClass('cursor-help')
  })

  it('handles empty string as name', () => {
    render(<ProductNameCell name="" />)
    // Empty string is falsy, should show dash
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('handles name with special characters', () => {
    const specialName = 'Товар "Премиум" & другие <товары>'
    render(<ProductNameCell name={specialName} />)
    expect(screen.getByText(specialName)).toBeInTheDocument()
  })

  it('handles Russian characters correctly', () => {
    // Use a short Russian name that won't be truncated (< 45 chars)
    const russianName = 'Жидкая кожа черная для ремонта'
    render(<ProductNameCell name={russianName} />)
    expect(screen.getByText(russianName)).toBeInTheDocument()
  })
})
