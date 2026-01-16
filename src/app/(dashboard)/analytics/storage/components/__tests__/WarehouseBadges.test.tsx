/**
 * Unit tests for WarehouseBadges component
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WarehouseBadges } from '../WarehouseBadges'

describe('WarehouseBadges', () => {
  it('shows dash when warehouses array is empty', () => {
    render(<WarehouseBadges warehouses={[]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows dash when warehouses is undefined', () => {
    render(<WarehouseBadges warehouses={undefined as unknown as string[]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows all badges when 2 or fewer warehouses', () => {
    render(<WarehouseBadges warehouses={['Коледино', 'Подольск']} />)

    expect(screen.getByText('Коледино')).toBeInTheDocument()
    expect(screen.getByText('Подольск')).toBeInTheDocument()
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
  })

  it('shows single warehouse badge', () => {
    render(<WarehouseBadges warehouses={['Казань']} />)

    expect(screen.getByText('Казань')).toBeInTheDocument()
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument()
  })

  it('shows +N overflow for 3+ warehouses', () => {
    render(
      <WarehouseBadges
        warehouses={['Коледино', 'Подольск', 'Казань', 'Электросталь']}
      />
    )

    expect(screen.getByText('Коледино')).toBeInTheDocument()
    expect(screen.getByText('Подольск')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
    // Hidden warehouses should not be directly visible
    expect(screen.queryByText('Казань')).not.toBeInTheDocument()
    expect(screen.queryByText('Электросталь')).not.toBeInTheDocument()
  })

  it('shows +1 overflow for exactly 3 warehouses', () => {
    render(
      <WarehouseBadges
        warehouses={['Коледино', 'Подольск', 'Казань']}
        maxVisible={2}
      />
    )

    expect(screen.getByText('Коледино')).toBeInTheDocument()
    expect(screen.getByText('Подольск')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })

  it('respects custom maxVisible prop', () => {
    render(
      <WarehouseBadges
        warehouses={['W1', 'W2', 'W3', 'W4', 'W5']}
        maxVisible={3}
      />
    )

    expect(screen.getByText('W1')).toBeInTheDocument()
    expect(screen.getByText('W2')).toBeInTheDocument()
    expect(screen.getByText('W3')).toBeInTheDocument()
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('renders with default maxVisible of 2', () => {
    render(
      <WarehouseBadges
        warehouses={['W1', 'W2', 'W3']}
      />
    )

    expect(screen.getByText('W1')).toBeInTheDocument()
    expect(screen.getByText('W2')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
  })
})
