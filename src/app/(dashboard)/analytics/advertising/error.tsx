'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * Error boundary for Advertising Analytics page
 * Story 33.2-FE: Advertising Analytics Page Layout
 * Epic 33: Advertising Analytics (Frontend)
 */
export default function AdvertisingAnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring
    console.error('Advertising analytics error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Рекламная аналитика</h1>
      </div>

      {/* Error Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Произошла ошибка
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Не удалось загрузить страницу рекламной аналитики.
            Попробуйте обновить страницу.
          </p>
          <Button onClick={reset} variant="outline">
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
