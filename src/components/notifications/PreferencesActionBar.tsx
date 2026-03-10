// ============================================================================
// Preferences Action Bar - Save/Cancel buttons
// Epic 34-FE: Story 34.3-FE (extracted from NotificationPreferencesPanel.tsx)
// ============================================================================

'use client'

import { Button } from '@/components/ui/button'

// ============================================================================
// Component Props
// ============================================================================

interface PreferencesActionBarProps {
  hasUnsavedChanges: boolean
  isUpdating: boolean
  onSave: () => void
  onCancel: () => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * AC5: Action bar with manual Save and Cancel buttons.
 * Save is only enabled when there are unsaved changes.
 */
export function PreferencesActionBar({
  hasUnsavedChanges,
  isUpdating,
  onSave,
  onCancel,
}: PreferencesActionBarProps) {
  return (
    <div className="pt-6 border-t border-gray-200">
      <div className="flex justify-between items-center gap-4">
        <Button variant="outline" onClick={onCancel} disabled={!hasUnsavedChanges || isUpdating}>
          Отменить
        </Button>

        <Button
          variant="default"
          onClick={onSave}
          disabled={!hasUnsavedChanges || isUpdating}
          className="bg-primary hover:bg-primary-dark disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <>
              <span className="mr-2 inline-block animate-spin">&#9203;</span>
              Сохранение...
            </>
          ) : (
            <>
              <span className="mr-2">&#10003;</span>
              Сохранить настройки
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
