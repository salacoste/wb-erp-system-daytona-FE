'use client'

import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FinancesErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function FinancesError({ reset }: FinancesErrorProps) {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      data-testid="finances-error-state"
    >
      <Card className="w-full max-w-md" role="alert" aria-labelledby="finances-error-title">
        <CardContent className="flex flex-col items-center pt-6 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" aria-hidden />
          <h1 id="finances-error-title" className="mb-2 text-xl font-semibold">
            Не удалось открыть финансы
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Произошла непредвиденная ошибка. Повторите загрузку страницы.
          </p>
          <Button type="button" variant="outline" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            Повторить
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
