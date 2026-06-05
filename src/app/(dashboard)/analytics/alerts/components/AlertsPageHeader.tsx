'use client'

/**
 * Alerts page header with title and description
 */

import { Bell } from 'lucide-react'

export function AlertsPageHeader() {
  return (
    <div className="flex items-center gap-3">
      <Bell className="h-6 w-6 text-primary" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Центр уведомлений</h1>
        <p className="text-sm text-muted-foreground">
          Управление правилами оповещений и просмотр истории уведомлений
        </p>
      </div>
    </div>
  )
}
