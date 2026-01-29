/**
 * Orders Page Error Handler
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Next.js error page for route-level errors in Orders section.
 * Displays Russian error message with retry and dashboard link.
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/lib/routes'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function OrdersError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error in development mode
    if (process.env.NODE_ENV === 'development') {
      console.error('[Orders] Route error:', error)
    }
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center" data-testid="orders-error-state">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Произошла ошибка</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Не удалось загрузить страницу заказов. Попробуйте обновить или вернитесь на главную.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={reset} variant="outline">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Повторить
            </Button>
            <Button asChild>
              <Link href={ROUTES.DASHBOARD}>
                <Home className="mr-2 h-4 w-4" />
                На главную
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
