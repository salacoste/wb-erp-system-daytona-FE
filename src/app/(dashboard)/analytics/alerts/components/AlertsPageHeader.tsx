'use client'

/**
 * Alerts page header with title, description, and create-rule button
 */

import { Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlertsPageHeaderProps {
  onCreateRule: () => void
  canCreateRule?: boolean
}

export function AlertsPageHeader({ onCreateRule, canCreateRule = true }: AlertsPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Центр уведомлений</h1>
          <p className="text-sm text-muted-foreground">
            Управление правилами оповещений и просмотр истории уведомлений
          </p>
        </div>
      </div>
      {canCreateRule && (
        <Button onClick={onCreateRule}>
          <Plus className="mr-2 h-4 w-4" />
          Создать правило
        </Button>
      )}
    </div>
  )
}
