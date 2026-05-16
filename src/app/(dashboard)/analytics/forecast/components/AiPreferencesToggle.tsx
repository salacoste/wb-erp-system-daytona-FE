'use client'

/**
 * AI Preferences Toggle — on/off switch for AI forecast features.
 * Follows Pure-functions-over-hook-mocking pattern (CLAUDE.md):
 * AiPreferencesToggleView is testable without mocks.
 * AiPreferencesToggle is the container reading hooks.
 * Story 108.2-FE.
 */
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiPreferences, useUpdateAiPreferences } from '@/hooks/useAiPreferences'

// ── View ────────────────────────────────────────────────────────────────────

export interface AiPreferencesToggleViewProps {
  /** Default-true while loading (undefined means not yet fetched). */
  aiEnabled: boolean
  isPending: boolean
  isLoading: boolean
  isError: boolean
  hasData: boolean
  onToggle: (enabled: boolean) => void
}

export function AiPreferencesToggleView({
  aiEnabled,
  isPending,
  isLoading,
  isError,
  hasData,
  onToggle,
}: AiPreferencesToggleViewProps) {
  if (isLoading) {
    return <Skeleton className="h-6 w-36" />
  }

  // Defensive Frontend Principle: if GET failed and no cached data, indicate — don't silently show "off".
  if (isError && !hasData) {
    return (
      <div className="flex items-center gap-1 text-amber-600 text-sm">
        <AlertTriangle className="h-4 w-4" />
        <span>Не удалось загрузить настройку</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="ai-preferences-toggle"
        checked={aiEnabled}
        onCheckedChange={onToggle}
        disabled={isPending}
        aria-label="Переключить AI прогнозы"
      />
      <Label htmlFor="ai-preferences-toggle" className="cursor-pointer text-sm">
        {aiEnabled ? 'AI прогнозы включены' : 'AI прогнозы отключены'}
      </Label>
    </div>
  )
}

// ── Container ───────────────────────────────────────────────────────────────

export function AiPreferencesToggle() {
  const { data, isLoading, isError } = useAiPreferences()
  const { mutate, isPending } = useUpdateAiPreferences()

  // Default true while loading — consistent with ForecastPageContent's aiEnabled derivation.
  const aiEnabled = data?.aiEnabled !== false

  function handleToggle(enabled: boolean) {
    mutate(
      { aiEnabled: enabled },
      {
        onError: () => {
          toast.error('Не удалось изменить настройку')
        },
      }
    )
  }

  return (
    <AiPreferencesToggleView
      aiEnabled={aiEnabled}
      isPending={isPending}
      isLoading={isLoading}
      isError={isError}
      hasData={!!data}
      onToggle={handleToggle}
    />
  )
}
