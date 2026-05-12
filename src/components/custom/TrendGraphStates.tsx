'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { EmptyStateIllustration } from './EmptyStateIllustration'

export function TrendGraphSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренды ключевых метрик</CardTitle>
        <CardDescription>Изменение метрик по неделям</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

export function TrendGraphError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренды ключевых метрик</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные трендов.</span>
            <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
              <RefreshCw className="mr-2 h-4 w-4" />
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

export function TrendGraphEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Тренды ключевых метрик</CardTitle>
        <CardDescription>Изменение метрик по неделям</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyStateIllustration type="trends" />
      </CardContent>
    </Card>
  )
}
