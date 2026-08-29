'use client'

// ============================================================================
// Disabled panel overlay for unbound Telegram state
// Extracted from notifications/page.tsx (Epic 34-FE: Story 34.5-FE)
// ============================================================================

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Lock } from 'lucide-react'

interface NotificationsDisabledPanelProps {
  icon: string
  title: string
  description: string
  lockMessage: string
}

/**
 * Reusable disabled panel with lock overlay
 * Used for Notification Preferences and Quiet Hours when Telegram is not bound
 */
export function NotificationsDisabledPanel({
  icon,
  title,
  description,
  lockMessage,
}: NotificationsDisabledPanelProps) {
  return (
    <Card aria-disabled="true" className="border-dashed bg-muted/20">
      <CardHeader>
        <h2 className="flex items-center gap-3 font-semibold leading-none tracking-tight">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <Alert className="border-telegram/30 bg-telegram/5">
          <Lock aria-hidden="true" className="size-4 text-telegram" />
          <AlertDescription className="space-y-1 text-sm">
            <span className="block font-medium text-foreground">Подключите Telegram</span>
            <span className="block text-muted-foreground">{lockMessage}</span>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
