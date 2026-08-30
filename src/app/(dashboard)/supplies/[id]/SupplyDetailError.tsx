'use client'

/**
 * Error state component for the Supply Detail Page
 * Extracted from page.tsx for file size compliance (Epic 74)
 *
 * Handles 404 (not found), 403 (forbidden), and generic errors.
 */

import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/product/states/PageState'

interface SupplyDetailErrorProps {
  error: Error
  onRetry: () => void
}

export function SupplyDetailError({ error, onRetry }: SupplyDetailErrorProps) {
  const is404 = error.message?.includes('404') || error.message?.includes('not found')
  const is403 = error.message?.includes('403') || error.message?.includes('forbidden')

  if (is404) {
    return (
      <PageState
        state="not-found"
        title="Поставка не найдена"
        explanation="Поставка не существует или больше недоступна."
        trust="Данные других поставок не затронуты."
        action={
          <Button asChild variant="outline">
            <Link href="/supplies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку
            </Link>
          </Button>
        }
      />
    )
  }

  if (is403) {
    return (
      <PageState
        state="restricted"
        title="Нет доступа"
        explanation="Нет доступа к этой поставке."
        trust="Права доступа и данные поставки не изменялись."
        action={
          <Button asChild variant="outline">
            <Link href="/supplies">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться к списку
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <PageState
      state="error"
      title="Ошибка загрузки"
      explanation="Не удалось загрузить данные поставки."
      trust="Изменения не выполнялись; запрос можно безопасно повторить."
      recovery={
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      }
    />
  )
}
