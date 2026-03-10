// ============================================================================
// Notification Preferences Panel - State & Handlers Hook
// Epic 34-FE: Story 34.3-FE (extracted from NotificationPreferencesPanel.tsx)
// ============================================================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences'
import { TelegramMetrics } from '@/lib/analytics/telegram-metrics'
import type { NotificationPreferencesResponseDto } from '@/types/notifications'

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages local state, dirty detection, analytics tracking,
 * and save/cancel handlers for the preferences panel.
 */
export function usePreferencesPanelState() {
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

    TelegramMetrics.eventTypeToggled(eventType, newValue)

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

    const changes: {
      event_types?: NotificationPreferencesResponseDto['preferences']
      language?: string
      daily_digest?: boolean
      quiet_hours_enabled?: boolean
    } = {}

    if (previousPreferencesRef.current) {
      const prev = previousPreferencesRef.current

      const eventTypesChanged = Object.keys(localPreferences.preferences).some(
        key =>
          localPreferences.preferences[key as keyof typeof localPreferences.preferences] !==
          prev.preferences[key as keyof typeof prev.preferences]
      )

      if (eventTypesChanged) {
        changes.event_types = localPreferences.preferences
      }
      if (localPreferences.language !== prev.language) {
        changes.language = localPreferences.language
      }
      if (localPreferences.preferences.daily_digest !== prev.preferences.daily_digest) {
        changes.daily_digest = localPreferences.preferences.daily_digest
      }
      if (localPreferences.quiet_hours.enabled !== prev.quiet_hours.enabled) {
        changes.quiet_hours_enabled = localPreferences.quiet_hours.enabled
      }
    }

    TelegramMetrics.preferencesUpdated(changes)
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

  return {
    localPreferences,
    hasUnsavedChanges,
    isUpdating,
    toggleEventType,
    changeLanguage,
    changeDigestTime,
    handleSave,
    handleCancel,
  }
}
