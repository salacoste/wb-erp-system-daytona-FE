'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'

interface StateCardProps {
  title: string
  description: string
  className?: string
}

interface LoadingStateProps extends StateCardProps {
  height: number
}

export function MarginTrendLoading({ title, description, className, height }: LoadingStateProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  )
}

interface ErrorStateProps extends Omit<StateCardProps, 'description'> {
  onRetry: () => void
}

export function MarginTrendError({ title, className, onRetry }: ErrorStateProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Не удалось загрузить данные трендов маржи. Пожалуйста, попробуйте еще раз.</span>
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

export function MarginTrendEmpty({ title, description, className }: StateCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Данные о трендах маржи пока недоступны. Тренды появятся после загрузки финансовых
            отчетов и назначения COGS для товаров.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
