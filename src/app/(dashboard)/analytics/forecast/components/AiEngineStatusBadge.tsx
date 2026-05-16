'use client'

/**
 * AI Engine Status Badge — shows engine connectivity in the forecast page header.
 * Follows Pure-functions-over-hook-mocking pattern (CLAUDE.md):
 * AiEngineStatusBadgeView is a pure presentational component (testable without mocks).
 * AiEngineStatusBadge is the container that reads useAiHealth.
 * Story 108.2-FE.
 */
import { AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAiHealth } from '@/hooks/useAiHealth'
import type { AiHealthResponse } from '@/types/ai/system'

// ── View ────────────────────────────────────────────────────────────────────

export type AiEngineStatusBadgeState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'connected'; health: AiHealthResponse }
  | { kind: 'offline-cache' }
  | { kind: 'offline' }

function StatusDot({ color }: { color: 'green' | 'amber' | 'red' }) {
  const colorClass =
    color === 'green' ? 'bg-green-500' : color === 'amber' ? 'bg-amber-500' : 'bg-red-500'
  return <span className={`inline-block h-2 w-2 rounded-full ${colorClass}`} />
}

export function AiEngineStatusBadgeView({ state }: { state: AiEngineStatusBadgeState }) {
  if (state.kind === 'loading') {
    return <Skeleton className="h-5 w-32" />
  }

  if (state.kind === 'error') {
    return (
      <span className="flex items-center gap-1 text-xs text-amber-600">
        <AlertTriangle className="h-3 w-3" />
        Не удалось получить статус движка
      </span>
    )
  }

  if (state.kind === 'connected') {
    const { health } = state
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex cursor-default items-center gap-1.5 text-xs text-green-700">
              <StatusDot color="green" />
              Движок: подключён
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Движок: {health.engine}</p>
            <p>Задержка: {health.latencyMs} мс</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (state.kind === 'offline-cache') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <StatusDot color="amber" />
        Движок: офлайн (кэш доступен)
      </span>
    )
  }

  // offline-no-cache
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-600">
      <StatusDot color="red" />
      Движок: офлайн
    </span>
  )
}

export function resolveAiEngineState(
  isLoading: boolean,
  isError: boolean,
  data: AiHealthResponse | undefined
): AiEngineStatusBadgeState {
  if (isLoading) return { kind: 'loading' }
  if (isError || !data) return { kind: 'error' }
  if (data.engineConnected) return { kind: 'connected', health: data }
  if (data.cachedPredictionsAvailable) return { kind: 'offline-cache' }
  return { kind: 'offline' }
}

// ── Container ───────────────────────────────────────────────────────────────

export function AiEngineStatusBadge() {
  const { data, isLoading, isError } = useAiHealth()
  const state = resolveAiEngineState(isLoading, isError, data)
  return <AiEngineStatusBadgeView state={state} />
}
