'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { useAuthStore } from '@/stores/authStore'

const HYDRATION_TIMEOUT_MS = 5_000

type EntryPhase = 'hydrating' | 'redirecting' | 'error'

function getPersistRuntime(): typeof useAuthStore.persist | undefined {
  return useAuthStore.persist
}

export default function HomePage() {
  const router = useRouter()
  const [phase, setPhase] = useState<EntryPhase>('hydrating')
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (phase !== 'hydrating') return

    let cancelled = false
    let resolved = false
    let failureTimer: ReturnType<typeof setTimeout> | undefined
    let unsubscribe: (() => void) | undefined

    const failHydration = () => {
      if (cancelled || resolved) return

      resolved = true
      if (failureTimer !== undefined) clearTimeout(failureTimer)
      setPhase('error')
    }

    const finishHydration = () => {
      if (cancelled || resolved) return

      resolved = true
      if (failureTimer !== undefined) clearTimeout(failureTimer)
      setPhase('redirecting')
    }

    try {
      const persist = getPersistRuntime()

      if (!persist) {
        failHydration()
        return
      }

      unsubscribe = persist.onFinishHydration(finishHydration)

      if (persist.hasHydrated()) {
        finishHydration()
      }

      if (!resolved) {
        failureTimer = setTimeout(failHydration, HYDRATION_TIMEOUT_MS)
      }
    } catch {
      unsubscribe?.()
      unsubscribe = undefined
      failHydration()
    }

    return () => {
      cancelled = true
      unsubscribe?.()
      if (failureTimer !== undefined) clearTimeout(failureTimer)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'redirecting' || hasRedirectedRef.current) return

    const { isAuthenticated, token } = useAuthStore.getState()
    const destination = isAuthenticated && token ? ROUTES.DASHBOARD : ROUTES.LOGIN

    hasRedirectedRef.current = true
    router.replace(destination)
  }, [phase, router])

  const reloadRootEntry = useCallback(() => {
    location.reload()
  }, [])

  return (
    <main className="flex min-h-screen w-full items-center justify-center overflow-x-hidden p-4 sm:p-6">
      {phase === 'error' ? (
        <PageState
          state="error"
          headingLevel={1}
          title="Не удалось проверить сессию"
          explanation="Локальное состояние входа не удалось прочитать."
          trust="Переход не выполнен, защищённые данные не раскрыты."
          recovery={
            <Button type="button" className="min-h-11" onClick={reloadRootEntry}>
              Перезагрузить страницу
            </Button>
          }
          className="w-full max-w-lg"
        />
      ) : (
        <PageState
          state={phase === 'hydrating' ? 'loading' : 'processing'}
          headingLevel={1}
          title={phase === 'hydrating' ? 'Проверяем сессию' : 'Переходим в приложение'}
          explanation={
            phase === 'hydrating'
              ? 'Определяем безопасное направление входа.'
              : 'Сессия проверена. Открываем подходящий раздел.'
          }
          trust={
            phase === 'hydrating'
              ? 'Защищённые данные не отображаются до завершения проверки.'
              : 'Защищённые данные не отображаются на странице входа.'
          }
          className="w-full max-w-lg"
        />
      )}
    </main>
  )
}
