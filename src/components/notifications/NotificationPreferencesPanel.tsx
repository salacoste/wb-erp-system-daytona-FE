// ============================================================================
// Notification Preferences Panel Component
// Epic 34-FE: Story 34.3-FE - Notification Preferences Panel
// ============================================================================

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { EventTypeCard } from './EventTypeCard'
import { LanguageRadio } from './LanguageRadio'
import { PreferencesActionBar } from './PreferencesActionBar'
import { usePreferencesPanelState } from './usePreferencesPanelState'

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
 * - Manual save button with dirty state detection (AC5)
 * - Unsaved changes warning banner
 * - Navigation prevention when unsaved changes exist
 *
 * Reference: docs/stories/epic-34/story-34.3-fe-notification-preferences-panel.md
 */
export function NotificationPreferencesPanel({
  disabled = false,
}: NotificationPreferencesPanelProps) {
  const {
    localPreferences,
    hasUnsavedChanges,
    isUpdating,
    toggleEventType,
    changeLanguage,
    changeDigestTime,
    handleSave,
    handleCancel,
  } = usePreferencesPanelState()

  // Loading state
  if (!localPreferences) {
    return (
      <Card role="status" aria-label="Загружаем настройки уведомлений">
        <span className="sr-only">Загружаем настройки уведомлений</span>
        <CardHeader className="h-16 animate-pulse bg-muted motion-reduce:animate-none" />
        <CardContent className="space-y-4 pt-6">
          <div className="h-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-2xl">&#9881;&#65039;</span>
          <h2 className="text-2xl font-semibold">Настройки уведомлений</h2>
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
                <label className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                  <span>&#128336;</span>
                  Время отправки:
                  <input
                    type="time"
                    value={localPreferences.preferences.digest_time}
                    onChange={e => changeDigestTime(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Время отправки ежедневного дайджеста"
                  />
                </label>
              </div>
            )}
          </EventTypeCard>
        </div>

        {/* AC3: Language Switcher (Q8 - Radio Buttons) */}
        <div className="pt-4">
          <p className="mb-3 block text-base font-medium text-foreground">Язык уведомлений:</p>
          <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Язык уведомлений">
            <LanguageRadio
              value="ru"
              label="&#127479;&#127482; Русский"
              selected={localPreferences.language === 'ru'}
              onSelect={() => changeLanguage('ru')}
            />
            <LanguageRadio
              value="en"
              label="&#127468;&#127463; English"
              selected={localPreferences.language === 'en'}
              onSelect={() => changeLanguage('en')}
            />
          </div>
        </div>

        {/* AC5: Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <Alert className="border-status-warning/40 bg-status-warning/10 text-foreground">
            &#9888;&#65039; У вас есть несохранённые изменения
          </Alert>
        )}

        {/* AC5: Action Bar (Manual Save Button) */}
        <PreferencesActionBar
          hasUnsavedChanges={hasUnsavedChanges}
          isUpdating={isUpdating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  )
}
