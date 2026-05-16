'use client'

/**
 * AI Preferences Toggle — on/off switch for AI forecast features.
 * Follows Pure-functions-over-hook-mocking pattern (CLAUDE.md):
 * AiPreferencesToggleView is testable without mocks.
 * AiPreferencesToggle is the container reading hooks.
 * Story 108.2-FE.
 */
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiPreferences, useUpdateAiPreferences } from '@/hooks/useAiPreferences'

// ── View ────────────────────────────────────────────────────────────────────

export interface AiPreferencesToggleViewProps {
  aiEnabled: boolean
  isPending: boolean
  isLoading: boolean
  onToggle: (enabled: boolean) => void
}

export function AiPreferencesToggleView({
  aiEnabled,
  isPending,
  isLoading,
  onToggle,
}: AiPreferencesToggleViewProps) {
  if (isLoading) {
    return <Skeleton className="h-6 w-36" />
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
  const { data, isLoading } = useAiPreferences()
  const { mutate, isPending } = useUpdateAiPreferences()

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
      aiEnabled={data?.aiEnabled ?? false}
      isPending={isPending}
      isLoading={isLoading}
      onToggle={handleToggle}
    />
  )
}
