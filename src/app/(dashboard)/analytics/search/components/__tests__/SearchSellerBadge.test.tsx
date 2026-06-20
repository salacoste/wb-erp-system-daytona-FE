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

type AuthCabinetSelectorState = Pick<ReturnType<typeof useAuthStore.getState>, 'cabinetId'>
type MockAuthImplementation = Parameters<typeof mockUseAuthStore.mockImplementation>[0]

/** Minimal store slice used by the selector in SearchSellerBadge */
function mockAuthSelector(cabinetId: string | null): MockAuthImplementation {
  return ((selector: (state: AuthCabinetSelectorState) => unknown) =>
    selector({ cabinetId })) as MockAuthImplementation
}

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
    mockUseAuthStore.mockImplementation(mockAuthSelector(null))
    mockUseSellerInfo.mockReturnValue({ data: undefined } as unknown as ReturnType<
      typeof useSellerInfo
    >)
    const { container } = render(<SearchSellerBadge />)
    expect(container.innerHTML).toBe('')
  })

  it('renders skeleton while loading', () => {
    mockUseAuthStore.mockImplementation(mockAuthSelector('cab-1'))
    mockUseSellerInfo.mockReturnValue({ data: undefined } as unknown as ReturnType<
      typeof useSellerInfo
    >)
    const { container } = render(<SearchSellerBadge />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders seller name when available', () => {
    mockUseAuthStore.mockImplementation(mockAuthSelector('cab-1'))
    mockUseSellerInfo.mockReturnValue({
      data: { name: 'Test Seller', sid: '123', tradeMark: 'Brand', available: true },
    } as unknown as ReturnType<typeof useSellerInfo>)
    render(<SearchSellerBadge />)
    expect(screen.getByText('Brand')).toBeInTheDocument()
  })

  it('renders warning icon when seller unavailable', () => {
    mockUseAuthStore.mockImplementation(mockAuthSelector('cab-1'))
    mockUseSellerInfo.mockReturnValue({
      data: {
        name: 'Test',
        sid: '123',
        tradeMark: '',
        available: false,
        reason: 'token_error',
      },
    } as unknown as ReturnType<typeof useSellerInfo>)
    render(<SearchSellerBadge />)
    expect(screen.getByText('Кабинет')).toBeInTheDocument()
    expect(screen.getByLabelText(/Предупреждение/)).toBeInTheDocument()
  })
})
