import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Navbar } from './Navbar'
import { useAuthStore } from '@/stores/authStore'

// Mock dependencies
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it(
    'renders dashboard title',
    () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
      } as any)

      render(<Navbar />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays user email when available',
    () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          email: 'user@example.com',
        },
      } as any)

      render(<Navbar />)

      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'displays user name when available',
    () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: {
          name: 'John Doe',
          email: 'user@example.com',
        },
      } as any)

      render(<Navbar />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
    },
    { timeout: 5000 },
  )

  it(
    'renders logout button',
    () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
      } as any)

      render(<Navbar />)

      expect(screen.getByText('Logout')).toBeInTheDocument()
    },
    { timeout: 5000 },
  )
})


