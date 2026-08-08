/**
 * NEW-2 — Communications page integration test.
 *
 * Verifies the page renders the heading + UnreadBadge + tabbed sections, and
 * gates the ACTIVE tab on cabinet readiness (cabinetId from the auth store).
 * Radix Tabs mounts only the active TabsContent, so only the active tab's hook
 * fires on first render — the test asserts that active hook receives
 * { enabled: false } when no cabinet is selected. Mocks auth store + hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/ui/tooltip'
import CommunicationsPage from '../page'

// Mock the auth store BEFORE importing the page (it reads cabinetId at render).
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

// Mock the hooks so no real queries fire.
vi.mock('@/hooks/useCommunications', () => ({
  useFeedbacks: vi.fn(() => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  })),
  useQuestions: vi.fn(() => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  })),
  useChats: vi.fn(() => ({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })),
  useClaims: vi.fn(() => ({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })),
  useUnreadBadge: vi.fn(() => ({
    data: { hasNewFeedbacks: true, hasNewQuestions: false },
    isLoading: false,
    isError: false,
  })),
  usePinnedFeedbacks: vi.fn(() => ({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  })),
}))

import { useAuthStore } from '@/stores/authStore'
import {
  useFeedbacks,
  useQuestions,
  useChats,
  useClaims,
  usePinnedFeedbacks,
  useUnreadBadge,
} from '@/hooks/useCommunications'

const useAuthStoreMock = useAuthStore as unknown as ReturnType<typeof vi.fn>
const useFeedbacksMock = useFeedbacks as unknown as ReturnType<typeof vi.fn>
const useQuestionsMock = useQuestions as unknown as ReturnType<typeof vi.fn>
const useChatsMock = useChats as unknown as ReturnType<typeof vi.fn>
const useClaimsMock = useClaims as unknown as ReturnType<typeof vi.fn>
const usePinnedMock = usePinnedFeedbacks as unknown as ReturnType<typeof vi.fn>
const useUnreadBadgeMock = useUnreadBadge as unknown as ReturnType<typeof vi.fn>

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TooltipProvider>
        <CommunicationsPage />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

describe('CommunicationsPage — NEW-2 integration', () => {
  beforeEach(() => {
    useAuthStoreMock.mockReset()
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the page heading + tab triggers when a cabinet is selected', () => {
    useAuthStoreMock.mockImplementation((selector: (s: { cabinetId: string | null }) => unknown) =>
      selector({ cabinetId: 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e' })
    )
    renderPage()
    expect(screen.getByRole('heading', { name: /Сообщения/, level: 1 })).toBeInTheDocument()
    // Tabs (radix renders tablist; triggers have role=tab).
    expect(screen.getByRole('tab', { name: 'Отзывы' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Вопросы' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Чаты' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Претензии' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Закреплённые' })).toBeInTheDocument()
  })

  it('gates the active tab hook (enabled:false) when no cabinet is selected', () => {
    useAuthStoreMock.mockImplementation((selector: (s: { cabinetId: string | null }) => unknown) =>
      selector({ cabinetId: null })
    )
    useFeedbacksMock.mockClear()
    useUnreadBadgeMock.mockClear()
    renderPage()
    // The feedbacks tab is active by default → its hook is the one that mounts
    // with enabled:false. Radix mounts only the active TabsContent.
    expect(useFeedbacksMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )
    // The header UnreadBadge is also gated on cabinet readiness.
    expect(useUnreadBadgeMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('gates EACH tab section hook (enabled:false) after switching tabs, no cabinet', async () => {
    // Security-relevant invariant: firing a section before a cabinet is chosen
    // would 403 (apiClient injects X-Cabinet-Id at request time). Radix Tabs
    // mounts only the active tab, so we switch to each tab and re-assert the
    // freshly-mounted section hook received { enabled: false }. userEvent is
    // required — Radix Tabs changes value on pointer/keyboard events, not on
    // a bare fireEvent.click (precedent: settings/tariffs page test).
    const user = userEvent.setup()
    useAuthStoreMock.mockImplementation((selector: (s: { cabinetId: string | null }) => unknown) =>
      selector({ cabinetId: null })
    )
    renderPage()

    // Switch to the Questions tab.
    useQuestionsMock.mockClear()
    await user.click(screen.getByRole('tab', { name: 'Вопросы' }))
    expect(useQuestionsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )

    // Switch to the Chats tab.
    useChatsMock.mockClear()
    await user.click(screen.getByRole('tab', { name: 'Чаты' }))
    expect(useChatsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )

    // Switch to the Claims tab.
    useClaimsMock.mockClear()
    await user.click(screen.getByRole('tab', { name: 'Претензии' }))
    expect(useClaimsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )

    // Switch to the Pinned tab.
    usePinnedMock.mockClear()
    await user.click(screen.getByRole('tab', { name: 'Закреплённые' }))
    expect(usePinnedMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ enabled: false })
    )
  })
})
