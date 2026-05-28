/**
 * Tests for SearchSellerBadge
 * Story 117.3-FE: Seller profile badge in Search Analytics page header
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { SellerInfoResponse } from '@/types/cabinet'
import type { UseQueryResult } from '@tanstack/react-query'

// The warning uses a Radix Tooltip, which requires a TooltipProvider (supplied
// app-wide by the dashboard layout; SidebarCabinetInfo relies on the same).
// delayDuration={0} so focus/hover opens the tooltip content immediately in tests.
function renderBadge(ui: ReactElement) {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>)
}

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: vi.fn(),
}))

import { useAuthStore } from '@/stores/authStore'
import { useSellerInfo } from '@/hooks/useSellerInfo'
import { resolveSellerDisplayName, SearchSellerBadge } from '../components/SearchSellerBadge'

const mockedAuth = vi.mocked(useAuthStore)
const mockedSeller = vi.mocked(useSellerInfo)

// Selector-respecting auth mock: honours both bare `useAuthStore()` and
// `useAuthStore(auth => auth.cabinetId)` (resilient if a 2nd selector is added later).
// `as never` on mockImplementation bypasses zustand's strict `(state: AuthState) => U`
// overload — this mock only needs to handle the cabinetId selector. AP#4 spirit:
// bridge complex library types with a localized cast.
function setCabinet(cabinetId: string | null) {
  const impl = (selector?: (s: { cabinetId: string | null }) => unknown) => {
    const state = { cabinetId }
    return selector ? selector(state) : state
  }
  mockedAuth.mockImplementation(impl as never)
}

// Build a minimal UseQueryResult whose only consumed field is `data`.
function sellerResult(data: SellerInfoResponse | undefined) {
  return { data } as unknown as UseQueryResult<SellerInfoResponse, Error>
}

const available: SellerInfoResponse = {
  name: 'My Shop',
  sid: 'sid-1',
  tradeMark: 'MyBrand',
  available: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  setCabinet('cab-1')
  mockedSeller.mockReturnValue(sellerResult(undefined))
})

describe('resolveSellerDisplayName (pure)', () => {
  it('returns "" while loading (seller undefined) → caller shows skeleton', () => {
    expect(resolveSellerDisplayName(undefined)).toBe('')
  })

  it('prefers tradeMark when available', () => {
    expect(resolveSellerDisplayName(available)).toBe('MyBrand')
  })

  it('falls back to name when tradeMark empty', () => {
    expect(resolveSellerDisplayName({ ...available, tradeMark: '' })).toBe('My Shop')
  })

  it('falls back to "Кабинет" when available but no trademark/name', () => {
    expect(resolveSellerDisplayName({ ...available, tradeMark: '', name: '' })).toBe('Кабинет')
  })

  it('returns "Кабинет" when unavailable', () => {
    expect(resolveSellerDisplayName({ name: '', sid: '', tradeMark: '', available: false })).toBe(
      'Кабинет'
    )
  })
})

describe('SearchSellerBadge (component)', () => {
  it('renders nothing when no cabinetId', () => {
    setCabinet(null)
    const { container } = renderBadge(<SearchSellerBadge />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a skeleton while loading (seller undefined)', () => {
    mockedSeller.mockReturnValue(sellerResult(undefined))
    const { container } = renderBadge(<SearchSellerBadge />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
    expect(screen.queryByText(/MyBrand/)).toBeNull()
  })

  it('shows the trademark when available', () => {
    mockedSeller.mockReturnValue(sellerResult(available))
    renderBadge(<SearchSellerBadge />)
    expect(screen.getByText('MyBrand')).toBeInTheDocument()
    // no warning when available
    expect(screen.queryByRole('button', { name: /Предупреждение/ })).toBeNull()
  })

  it('shows fallback name + keyboard-accessible warning when unavailable', async () => {
    mockedSeller.mockReturnValue(
      sellerResult({ name: '', sid: '', tradeMark: '', available: false, reason: 'token_error' })
    )
    renderBadge(<SearchSellerBadge />)

    expect(screen.getByText('Кабинет')).toBeInTheDocument()
    const warning = screen.getByRole('button', { name: /Предупреждение/ })
    expect(warning).toBeInTheDocument()
    // tooltip trigger must be reachable by keyboard
    await userEvent.tab()
    expect(warning).toHaveFocus()
    // focus opens the tooltip → reason label (SELLER_INFO_REASON_LABELS.token_error) is shown
    const labels = await screen.findAllByText('Токен невалидный')
    expect(labels.length).toBeGreaterThan(0)
  })
})
