import { act, renderHook } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnboardingGuard } from '../useOnboardingGuard'
import { useAuthStore } from '@/stores/authStore'

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useRouter: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: navigationMocks.useRouter,
}))

const userWithCabinetIds = (cabinetIds?: string[]) => ({
  id: 'synthetic-owner',
  email: 'owner@example.test',
  role: 'Owner' as const,
  cabinet_ids: cabinetIds,
})

describe('useOnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    navigationMocks.useRouter.mockReturnValue({ replace: navigationMocks.replace })
    useAuthStore.setState({
      user: null,
      token: null,
      cabinetId: null,
      isAuthenticated: false,
    })
  })

  it('[ONBOARDING-GUARD-01] redirects an existing-cabinet user to the dashboard exactly once', () => {
    useAuthStore.setState({ user: userWithCabinetIds(['cabinet-1']) })

    renderHook(() => useOnboardingGuard())

    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    expect(navigationMocks.replace).toHaveBeenCalledWith('/dashboard')
  })

  it.each([
    ['an empty cabinet ID list', []],
    ['undefined cabinet IDs', undefined],
  ])('[ONBOARDING-GUARD-02] does not redirect for %s', (_label, cabinetIds) => {
    useAuthStore.setState({ user: userWithCabinetIds(cabinetIds) })

    renderHook(() => useOnboardingGuard())

    expect(navigationMocks.replace).not.toHaveBeenCalled()
  })

  it('[ONBOARDING-GUARD-03] redirects once when cabinet IDs transition from empty to populated', () => {
    useAuthStore.setState({ user: userWithCabinetIds([]) })
    const { rerender } = renderHook(() => useOnboardingGuard())

    expect(navigationMocks.replace).not.toHaveBeenCalled()

    act(() => {
      useAuthStore.setState({ user: userWithCabinetIds(['cabinet-1']) })
    })
    rerender()

    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    expect(navigationMocks.replace).toHaveBeenCalledWith('/dashboard')

    act(() => {
      useAuthStore.setState({ token: 'refreshed-token' })
    })
    rerender()

    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
  })

  it('[ONBOARDING-GUARD-04] reruns the redirect effect when the router dependency changes', () => {
    const replacementRouter = { replace: vi.fn() }
    useAuthStore.setState({ user: userWithCabinetIds(['cabinet-1']) })
    const { rerender } = renderHook(() => useOnboardingGuard())

    navigationMocks.useRouter.mockReturnValue(replacementRouter)
    rerender()

    expect(navigationMocks.replace).toHaveBeenCalledTimes(1)
    expect(replacementRouter.replace).toHaveBeenCalledTimes(1)
    expect(replacementRouter.replace).toHaveBeenCalledWith('/dashboard')
  })
})

describe('onboarding guard consumer contract', () => {
  it('[ONBOARDING-GUARD-CONSUMERS-01] keeps /cabinet and unchanged /wb-token on the same guard', () => {
    const consumers = [
      'src/app/(onboarding)/cabinet/page.tsx',
      'src/app/(onboarding)/wb-token/page.tsx',
    ]

    for (const consumer of consumers) {
      const source = readFileSync(consumer, 'utf8')
      expect(source).toContain("import { useOnboardingGuard } from '@/hooks/useOnboardingGuard'")
      expect(source.match(/\buseOnboardingGuard\(\)/g)).toHaveLength(1)
    }
  })
})
