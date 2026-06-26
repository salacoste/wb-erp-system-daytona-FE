'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'

/**
 * Redirect already-onboarded users (those with ≥1 cabinet) away from
 * onboarding pages to the dashboard. Mirrors `/register` & `/processing`.
 *
 * Flow-safe: `CabinetCreationForm` navigates to the next step via
 * `router.push` and does NOT refresh `authStore.cabinet_ids` after create,
 * so a first-time user (cabinet_ids = [] at login) is NOT redirected
 * mid-flow — only users who logged in with an existing cabinet are.
 *
 * FE-14 (UX validation) — `/cabinet` & `/wb-token` were accessible to
 * already-onboarded users, unlike `/register`/`/processing`.
 */
export function useOnboardingGuard(): void {
  const router = useRouter()
  const cabinetIds = useAuthStore(state => state.user?.cabinet_ids)

  useEffect(() => {
    if ((cabinetIds?.length ?? 0) > 0) {
      router.replace(ROUTES.DASHBOARD)
    }
  }, [cabinetIds, router])
}
