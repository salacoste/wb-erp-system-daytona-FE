'use client'

/**
 * Error state component for the Supply Detail Page
 * Extracted from page.tsx for file size compliance (Epic 74)
 *
 * Handles 404 (not found), 403 (forbidden), and generic errors.
 */

import Link from 'next/link'
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface SupplyDetailErrorProps {
  error: Error
  onRetry: () => void
}

export function SupplyDetailError({ error, onRetry }: SupplyDetailErrorProps) {
  const is404 = error.message?.includes('404') || error.message?.includes('not found')
  const is403 = error.message?.includes('403') || error.message?.includes('forbidden')

  if (is404) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Поставка не найдена</h1>
        <p className="mb-6 text-muted-foreground">Поставка не существует или была удалена</p>
        <Link href="/supplies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </Link>
      </div>
    )
  }

  if (is403) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Нет доступа</h1>
        <p className="mb-6 text-muted-foreground">Нет доступа к этой поставке</p>
        <Link href="/supplies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Ошибка загрузки</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Не удалось загрузить данные поставки</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}
