import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

// Mock dependencies
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

// Mock useSupplyPlanning to avoid API calls (Story 6.2)
vi.mock('@/hooks/useSupplyPlanning', () => ({
  useSupplyPlanning: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}))

// Helper to render with QueryClient (required for useSupplyPlanning hook)
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      logout: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
  })

  it(
    'renders navigation items',
    () => {
      renderWithQueryClient(<Sidebar />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('COGS Management')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'highlights active navigation item',
    () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')
      renderWithQueryClient(<Sidebar />)

      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveClass('bg-[#C62828]', 'text-white')
    },
    { timeout: 5000 },
  )

  it(
    'highlights active section for nested routes',
    () => {
      vi.mocked(usePathname).mockReturnValue('/cogs/single')
      renderWithQueryClient(<Sidebar />)

      const cogsLink = screen.getByText('COGS Management').closest('a')
      expect(cogsLink).toHaveClass('bg-[#C62828]', 'text-white')
    },
    { timeout: 5000 },
  )

  it(
    'renders logout button',
    () => {
      renderWithQueryClient(<Sidebar />)

      expect(screen.getByText('Logout')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'has keyboard accessible navigation items',
    () => {
      renderWithQueryClient(<Sidebar />)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link).toHaveAttribute('href')
        // Links are keyboard accessible by default in Next.js
        expect(link).toBeInTheDocument()
      })
    },
    { timeout: 5000 },
  )
})
