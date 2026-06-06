import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Navbar } from './Navbar'
import { useAuthStore } from '@/stores/authStore'

interface MockAuthState {
  user: {
    email: string
    name?: string
    role: string
  } | null
}

// Mock dependencies
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./LogoutButton', () => ({
  LogoutButton: () => <button>Logout</button>,
}))

function mockAuthStore(state: MockAuthState): void {
  vi.mocked(useAuthStore).mockReturnValue(state as ReturnType<typeof useAuthStore>)
}

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
      mockAuthStore({ user: null })

      render(<Navbar />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    },
    { timeout: 5000 }
  )

  it(
    'displays user email when available',
    () => {
      mockAuthStore({ user: { email: 'user@example.com', role: 'Owner' } })

      render(<Navbar />)

      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    },
    { timeout: 5000 }
  )

  it(
    'displays user name when available',
    () => {
      mockAuthStore({
        user: { name: 'John Doe', email: 'user@example.com', role: 'Owner' },
      })

      render(<Navbar />)

      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
    },
    { timeout: 5000 }
  )

  it(
    'renders logout button',
    () => {
      mockAuthStore({ user: null })

      render(<Navbar />)

      expect(screen.getByText('Logout')).toBeInTheDocument()
    },
    { timeout: 5000 }
  )
})
