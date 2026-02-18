// ============================================================================
// Notification Preferences Panel Component
// Epic 34-FE: Story 34.3-FE - Notification Preferences Panel
// ============================================================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import { EventTypeCard } from './EventTypeCard'
import { LanguageRadio } from './LanguageRadio'
import type { NotificationPreferencesResponseDto } from '@/types/notifications'

/**
 * Props for NotificationPreferencesPanel component
 * Story 34.3-FE: Main preferences panel
 */
interface NotificationPreferencesPanelProps {
  disabled?: boolean // Disable when Telegram not bound
}

/**
 * NotificationPreferencesPanel - Main preferences panel
 *
 * Features:
 * - 4 event type cards: task_completed, task_failed, task_stalled, daily_digest (AC1)
 * - Language switcher: ru/en (AC3)
 * - Daily digest with conditional time picker (AC4)
 * - Manual save button with dirty state detection (AC5) ⭐ CRITICAL
 * - Unsaved changes warning banner
 * - Navigation prevention when unsaved changes exist
 * - Success/error toast messages
 *
 * UX Decisions (Q6-Q10):
 * - Q6: Border highlight for enabled states (2px Telegram Blue)
 * - Q7: Description text always visible (2-line truncation)
 * - Q8: Radio buttons for language selection (horizontal layout)
 * - Q9: Conditional time picker (slide-down animation when digest enabled)
 * - Q10: Manual save button (NOT auto-save) ⭐
 *
 * Reference: docs/stories/epic-34/story-34.3-fe-notification-preferences-panel.md
 */
export function NotificationPreferencesPanel({
  disabled = false,
}: NotificationPreferencesPanelProps) {
  const { preferences, updatePreferences, isUpdating } = useNotificationPreferences()

  // Local state for form (AC5: Manual save strategy)
  const [localPreferences, setLocalPreferences] =
    useState<NotificationPreferencesResponseDto | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Track previous values for analytics (to detect what changed)
  const previousPreferencesRef = useRef<NotificationPreferencesResponseDto | null>(null)

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences)
      setHasUnsavedChanges(false)
      // Initialize previous ref for change detection
      previousPreferencesRef.current = { ...preferences }
    }
  }, [preferences])

  // AC5: Dirty state detection (JSON comparison)
  useEffect(() => {
    if (preferences && localPreferences) {
      const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences)
      setHasUnsavedChanges(hasChanges)
    }
  }, [localPreferences, preferences])

  // AC1: Event type toggle handler
  const toggleEventType = (eventType: keyof NotificationPreferencesResponseDto['preferences']) => {
    if (!localPreferences) return

    const newValue = !localPreferences.preferences[eventType]

    setLocalPreferences({
      ...localPreferences,
      preferences: {
        ...localPreferences.preferences,
        [eventType]: newValue,
      },
    })

    // Track event type toggle
    TelegramMetrics.eventTypeToggled(eventType, newValue)

    // Track daily digest enable
    if (eventType === 'daily_digest' && newValue) {
      TelegramMetrics.dailyDigestEnabled()
    }
  }

  // AC3: Language change handler
  const changeLanguage = (lang: 'ru' | 'en') => {
    if (!localPreferences) return

    const previousLang = localPreferences.language

    setLocalPreferences({
      ...localPreferences,
      language: lang,
    })

    // Track language change
    if (previousLang !== lang) {
      TelegramMetrics.languageChanged(previousLang, lang)
    }
  }

  // AC4: Digest time change handler
  const changeDigestTime = (time: string) => {
    if (!localPreferences) return

    setLocalPreferences({
      ...localPreferences,
      preferences: {
        ...localPreferences.preferences,
        digest_time: time,
      },
    })
  }

  // AC5: Save handler (Manual save button)
  const handleSave = () => {
    if (!localPreferences) return

    // Track what changed for analytics
    const changes: {
      event_types?: NotificationPreferencesResponseDto['preferences']
      language?: string
      daily_digest?: boolean
      quiet_hours_enabled?: boolean
    } = {}

    if (previousPreferencesRef.current) {
      const prev = previousPreferencesRef.current

      // Check event types changes
      const eventTypesChanged = Object.keys(localPreferences.preferences).some(
        key =>
          localPreferences.preferences[key as keyof typeof localPreferences.preferences] !==
          prev.preferences[key as keyof typeof prev.preferences]
      )

      if (eventTypesChanged) {
        changes.event_types = localPreferences.preferences
      }

      // Check language change
      if (localPreferences.language !== prev.language) {
        changes.language = localPreferences.language
      }

      // Check daily digest change
      if (localPreferences.preferences.daily_digest !== prev.preferences.daily_digest) {
        changes.daily_digest = localPreferences.preferences.daily_digest
      }

      // Check quiet hours change
      if (localPreferences.quiet_hours.enabled !== prev.quiet_hours.enabled) {
        changes.quiet_hours_enabled = localPreferences.quiet_hours.enabled
      }
    }

    // Track preferences update
    TelegramMetrics.preferencesUpdated(changes)

    // Update previous ref for next comparison
    previousPreferencesRef.current = { ...localPreferences }

    updatePreferences(
      {
        preferences: localPreferences.preferences,
        language: localPreferences.language,
        quiet_hours: localPreferences.quiet_hours,
      },
      {
        onSuccess: () => {
          toast.success('Настройки сохранены', { duration: 3000 })
        },
        onError: () => {
          toast.error('Не удалось сохранить настройки. Попробуйте ещё раз.')
        },
      }
    )
  }

  // AC5: Cancel handler (reset to last saved)
  const handleCancel = () => {
    if (preferences) {
      setLocalPreferences(preferences)
      setHasUnsavedChanges(false)
    }
  }

  // AC5: Navigation prevention when unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Loading state
  if (!localPreferences) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="h-16 bg-gray-100" />
        <CardContent className="space-y-4 pt-6">
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
          <div className="h-24 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-2xl font-semibold">Настройки уведомлений</h3>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AC1: Event Type Cards */}
        <div className="space-y-3">
          <EventTypeCard
            title="Задача выполнена успешно"
            description="Уведомления при завершении импорта, синхронизации, расчёта маржи"
            enabled={localPreferences.preferences.task_completed}
            onToggle={() => toggleEventType('task_completed')}
          />

          <EventTypeCard
            title="Задача завершилась с ошибкой"
            description="Уведомления при ошибках после всех попыток retry"
            enabled={localPreferences.preferences.task_failed}
            onToggle={() => toggleEventType('task_failed')}
          />

          <EventTypeCard
            title="Задача зависла"
            description="Уведомления когда задача выполняется более 30 минут"
            enabled={localPreferences.preferences.task_stalled}
            onToggle={() => toggleEventType('task_stalled')}
          />

          {/* AC4: Daily Digest with Conditional Time Picker (Q9) */}
          <EventTypeCard
            title="Ежедневный дайджест"
            description="Сводка за день: успешные задачи, ошибки, задачи в очереди"
            enabled={localPreferences.preferences.daily_digest}
            onToggle={() => toggleEventType('daily_digest')}
          >
            {/* AC4: Conditional Time Picker (slide-down animation 200ms) */}
            {localPreferences.preferences.daily_digest && (
              <div className="mt-3 animate-slide-down">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <span>🕐</span>
                  Время отправки:
                  <input
                    type="time"
                    value={localPreferences.preferences.digest_time}
                    onChange={e => changeDigestTime(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telegram-blue"
                    aria-label="Время отправки ежедневного дайджеста"
                  />
                </label>
              </div>
            )}
          </EventTypeCard>
        </div>

        {/* AC3: Language Switcher (Q8 - Radio Buttons) */}
        <div className="pt-4">
          <label className="block text-base font-medium text-gray-700 mb-3">
            Язык уведомлений:
          </label>
          <div className="flex gap-4">
            <LanguageRadio
              value="ru"
              label="🇷🇺 Русский"
              selected={localPreferences.language === 'ru'}
              onSelect={() => changeLanguage('ru')}
            />
            <LanguageRadio
              value="en"
              label="🇬🇧 English"
              selected={localPreferences.language === 'en'}
              onSelect={() => changeLanguage('en')}
            />
          </div>
        </div>

        {/* AC5: Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert variant="default" className="bg-orange-50 border-orange-500 text-orange-700">
            ⚠️ У вас есть несохранённые изменения
          </Alert>
        )}

        {/* AC5: Action Bar (Manual Save Button) ⭐ CRITICAL */}
        <div className="pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!hasUnsavedChanges || isUpdating}
            >
              Отменить
            </Button>

            <Button
              variant="default"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isUpdating}
              className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <span className="mr-2 inline-block animate-spin">⏳</span>
                  Сохранение...
                </>
              ) : (
                <>
                  <span className="mr-2">✓</span>
                  Сохранить настройки
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
