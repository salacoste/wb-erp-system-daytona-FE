/**
 * CogsHistoryBreadcrumbs Unit Tests
 *
 * Verifies breadcrumb navigation:
 * - Renders breadcrumb with home, COGS, and History links
 * - Renders product name when provided
 * - Renders without product name
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { Breadcrumbs } from '../CogsHistoryBreadcrumbs'

describe('Breadcrumbs', () => {
  it('renders breadcrumb links without product name', () => {
    renderWithProviders(<Breadcrumbs />)
    expect(screen.getByText('COGS')).toBeInTheDocument()
    expect(screen.getByText('История')).toBeInTheDocument()
  })

  it('renders product name when provided', () => {
    renderWithProviders(<Breadcrumbs productName="Футболка мужская" />)
    expect(screen.getByText('Футболка мужская')).toBeInTheDocument()
  })

  it('renders home link', () => {
    renderWithProviders(<Breadcrumbs />)
    const homeLink = screen.getByRole('link', { name: 'Главная' })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders COGS link', () => {
    renderWithProviders(<Breadcrumbs />)
    const cogsLink = screen.getByText('COGS')
    expect(cogsLink).toBeInTheDocument()
    expect(cogsLink.closest('a')).toHaveAttribute('href', '/cogs')
  })

  it('does not show product name span when not provided', () => {
    renderWithProviders(<Breadcrumbs />)
    expect(screen.queryByText('Футболка мужская')).not.toBeInTheDocument()
  })
})
