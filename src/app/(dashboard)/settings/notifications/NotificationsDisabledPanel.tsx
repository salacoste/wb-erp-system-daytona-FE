'use client'

// ============================================================================
// Disabled panel overlay for unbound Telegram state
// Extracted from notifications/page.tsx (Epic 34-FE: Story 34.5-FE)
// ============================================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="relative">
      {/* Disabled Overlay */}
      <div className="absolute inset-0 bg-card/60 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <div className="text-center px-6">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground mb-1">Подключите Telegram</p>
          <p className="text-sm text-muted-foreground">{lockMessage}</p>
        </div>
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 opacity-40">
        <Alert>
          <AlertDescription className="text-sm">{description}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
