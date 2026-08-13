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

  it('renders dashboard title', { timeout: 5000 }, () => {
    mockAuthStore({ user: null })

    render(<Navbar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('does not render the shell label as a page H1', () => {
    mockAuthStore({ user: null })

    render(<Navbar />)

    expect(screen.queryByRole('heading', { level: 1, name: 'Dashboard' })).not.toBeInTheDocument()
  })

  it('displays user email when available', { timeout: 5000 }, () => {
    mockAuthStore({ user: { email: 'user@example.com', role: 'Owner' } })

    render(<Navbar />)

    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('displays user name when available', { timeout: 5000 }, () => {
    mockAuthStore({
      user: { name: 'John Doe', email: 'user@example.com', role: 'Owner' },
    })

    render(<Navbar />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument()
  })

  it('renders logout button', { timeout: 5000 }, () => {
    mockAuthStore({ user: null })

    render(<Navbar />)

    const logout = screen.getByRole('button', { name: 'Logout' })

    expect(logout).toBeInTheDocument()
    expect(logout.parentElement).toHaveClass('[&_button]:min-h-11', '[&_button]:min-w-11')
  })

  it('uses semantic theme colors for the shell title and user identity', () => {
    mockAuthStore({ user: { email: 'user@example.com', role: 'Owner' } })

    render(<Navbar />)

    expect(screen.getByText('Dashboard')).toHaveClass('text-foreground')
    expect(screen.getByText('user@example.com')).toHaveClass('text-muted-foreground')
  })

  it('protects the narrow mobile header from a long user identity', () => {
    mockAuthStore({
      user: {
        name: 'Очень длинное имя пользователя для узкого мобильного заголовка',
        email: 'long@example.com',
        role: 'Owner',
      },
    })

    render(<Navbar />)

    expect(screen.getByText('Dashboard')).toHaveClass('hidden', 'min-[20rem]:block')
    expect(screen.getByText(/Очень длинное имя/)).toHaveClass(
      'hidden',
      'max-w-full',
      'truncate',
      'sm:block'
    )
    expect(screen.getByText('Logout')).toBeVisible()
  })
})
