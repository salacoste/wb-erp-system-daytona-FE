/**
 * Tests for AdvertisingPageHeader component
 * Tests breadcrumbs, title, icon, and sync status indicator rendering.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { AdvertisingPageHeader } from '../AdvertisingPageHeader'

// SyncStatusIndicator fetches data — mock the hook it uses
vi.mock('@/hooks/useSyncStatus', () => ({
  useSyncStatus: vi.fn(() => ({
    data: undefined,
    isLoading: true,
    error: null,
    refetch: vi.fn(),
  })),
}))

describe('AdvertisingPageHeader', () => {
  it('renders breadcrumbs with correct links', () => {
    render(<AdvertisingPageHeader />)
    expect(screen.getByText('Главная').closest('a')).toHaveAttribute('href', '/dashboard')
    expect(screen.getByText('Аналитика').closest('a')).toHaveAttribute('href', '/analytics')
    expect(screen.getByText('Реклама')).toBeInTheDocument()
  })

  it('renders breadcrumb navigation with aria-label', () => {
    render(<AdvertisingPageHeader />)
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument()
  })

  it('renders page title and subtitle', () => {
    render(<AdvertisingPageHeader />)
    expect(screen.getByText('Рекламная аналитика')).toBeInTheDocument()
    expect(screen.getByText('Анализ эффективности рекламных кампаний')).toBeInTheDocument()
  })

  it('renders Megaphone icon (hidden from screen readers)', () => {
    render(<AdvertisingPageHeader />)
    const icon = document.querySelector('[aria-hidden="true"].lucide-megaphone')
    expect(icon).toBeInTheDocument()
  })

  it('renders chevron separators as aria-hidden', () => {
    render(<AdvertisingPageHeader />)
    const chevrons = document.querySelectorAll('.lucide-chevron-right')
    expect(chevrons.length).toBe(2)
    chevrons.forEach(c => expect(c).toHaveAttribute('aria-hidden', 'true'))
  })

  it('renders SyncStatusIndicator without crashing', () => {
    render(<AdvertisingPageHeader />)
    // SyncStatusIndicator renders alongside the title; verify header still renders
    expect(screen.getByText('Рекламная аналитика')).toBeInTheDocument()
  })
})
