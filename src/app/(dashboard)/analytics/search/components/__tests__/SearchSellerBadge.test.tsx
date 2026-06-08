import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SearchSellerBadge, resolveSellerDisplayName } from '../SearchSellerBadge'
import type { SellerInfoResponse } from '@/types/cabinet'

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: vi.fn(),
}))

import { useAuthStore } from '@/stores/authStore'
import { useSellerInfo } from '@/hooks/useSellerInfo'

const mockUseAuthStore = vi.mocked(useAuthStore)
const mockUseSellerInfo = vi.mocked(useSellerInfo)

describe('resolveSellerDisplayName', () => {
  it('returns empty string when seller is undefined (loading)', () => {
    expect(resolveSellerDisplayName(undefined)).toBe('')
  })

  it('returns trademark when available', () => {
    const seller: SellerInfoResponse = {
      name: 'Test Name',
      sid: '123',
      tradeMark: 'My Brand',
      available: true,
    }
    expect(resolveSellerDisplayName(seller)).toBe('My Brand')
  })

  it('falls back to name when no trademark', () => {
    const seller: SellerInfoResponse = {
      name: 'Test Name',
      sid: '123',
      tradeMark: '',
      available: true,
    }
    expect(resolveSellerDisplayName(seller)).toBe('Test Name')
  })

  it('falls back to "Кабинет" when available is false', () => {
    const seller: SellerInfoResponse = {
      name: 'Test',
      sid: '123',
      tradeMark: 'Brand',
      available: false,
    }
    expect(resolveSellerDisplayName(seller)).toBe('Кабинет')
  })
})

describe('SearchSellerBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no cabinetId', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: null }))
    mockUseSellerInfo.mockReturnValue({} as any)
    const { container } = render(<SearchSellerBadge />)
    expect(container.innerHTML).toBe('')
  })

  it('renders skeleton while loading', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
    mockUseSellerInfo.mockReturnValue({ data: undefined } as any)
    const { container } = render(<SearchSellerBadge />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders seller name when available', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
    mockUseSellerInfo.mockReturnValue({
      data: { name: 'Test Seller', sid: '123', tradeMark: 'Brand', available: true },
    } as any)
    render(<SearchSellerBadge />)
    expect(screen.getByText('Brand')).toBeInTheDocument()
  })

  it('renders warning icon when seller unavailable', () => {
    mockUseAuthStore.mockImplementation((selector: any) => selector({ cabinetId: 'cab-1' }))
    mockUseSellerInfo.mockReturnValue({
      data: {
        name: 'Test',
        sid: '123',
        tradeMark: '',
        available: false,
        reason: 'token_error',
      },
    } as any)
    render(<SearchSellerBadge />)
    expect(screen.getByText('Кабинет')).toBeInTheDocument()
    expect(screen.getByLabelText(/Предупреждение/)).toBeInTheDocument()
  })
})
