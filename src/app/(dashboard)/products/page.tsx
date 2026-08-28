'use client'

/**
 * Assortment management page — manage "Снят с продажи" (discontinued) products.
 * Shows discontinued SKUs (with reactivate) and system suggestions (no sales ≥90d)
 * with a confirm/dismiss action. Backed by /v1/products/discontinued(-suggestions)
 * + PATCH /v1/products/:nmId/lifecycle. See plan: declarative-herding-kahn.md (Phase 6).
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDate } from '@/lib/utils'
import {
  useDiscontinuedProducts,
  useDiscontinuedSuggestions,
  useUpdateProductLifecycle,
} from '@/hooks/useProductLifecycle'
import type { LifecycleProduct } from '@/types/product-lifecycle'

/** Label block for a product row (the <li> wrapper owns the row layout). */
function ProductRow({ p }: { p: LifecycleProduct }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="font-medium truncate">
        {p.vendorCode ?? '—'} <span className="text-muted-foreground">· артикул {p.nmId}</span>
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {p.brand ?? '—'} · {p.subject ?? '—'}
      </div>
    </div>
  )
}

function DiscontinuedSection() {
  const { data, isLoading, isError } = useDiscontinuedProducts()
  const toggle = useUpdateProductLifecycle()
  if (isLoading) return <p className="text-muted-foreground">Загрузка…</p>
  if (isError) return <p className="text-status-error">Ошибка загрузки списка.</p>
  if (!data || data.length === 0)
    return <p className="text-muted-foreground">Нет снятых товаров.</p>
  return (
    <ul className="space-y-1">
      {data.map(p => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
        >
          <ProductRow p={p} />
          <div className="flex items-center gap-2 shrink-0">
            {p.discontinuedAt && (
              <Badge variant="secondary" className="whitespace-nowrap">
                с {formatDate(p.discontinuedAt)}
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate({ nmId: p.nmId, status: 'active' })}
            >
              Вернуть в ассортимент
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function SuggestionsSection() {
  const { data, isLoading, isError } = useDiscontinuedSuggestions()
  const toggle = useUpdateProductLifecycle()
  // Confirm before the destructive "discontinue" mutation (reactivate is undo,
  // but it lives on the other card — guard the one-click assortment change).
  const [pending, setPending] = useState<LifecycleProduct | null>(null)
  if (isLoading) return <p className="text-muted-foreground">Загрузка…</p>
  if (isError) return <p className="text-status-error">Ошибка загрузки подсказок.</p>
  if (!data || data.length === 0)
    return <p className="text-muted-foreground">Подсказок нет — все товары активны.</p>
  return (
    <>
      <ul className="space-y-1">
        {data.map(p => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
          >
            <ProductRow p={p} />
            <Button
              size="sm"
              variant="destructive"
              disabled={toggle.isPending}
              onClick={() => setPending(p)}
            >
              Снять с продажи
            </Button>
          </li>
        ))}
      </ul>
      <AlertDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) setPending(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снять товар с продажи?</AlertDialogTitle>
            <AlertDialogDescription>
              {pending
                ? `«${pending.vendorCode ?? String(pending.nmId)}» будет исключён из текущей аналитики, прогнозов и рекомендаций. Действие можно отменить позже в блоке «Снятые с продажи».`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggle.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={toggle.isPending}
              onClick={() => {
                if (pending) {
                  toggle.mutate({ nmId: pending.nmId, status: 'discontinued' })
                  setPending(null)
                }
              }}
            >
              Снять с продажи
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function ProductsAssortmentPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Ассортимент</h1>
        {/* Backend-enforced: discontinued SKUs are excluded by DiscontinuedSkuProvider
            (see backend src/products/services/product-lifecycle.service.ts). */}
        <p className="text-muted-foreground">
          Управление статусом «Снят с продажи». Снятые товары сохраняются в исторических отчётах, но
          исключаются из текущей аналитики, прогнозов и рекомендаций.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Снятые с продажи</CardTitle>
        </CardHeader>
        <CardContent>
          <DiscontinuedSection />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Подсказки системы</CardTitle>
          <p className="text-xs text-muted-foreground">
            Товары без продаж ≥90 дней. Подтвердите, чтобы снять с продажи.
          </p>
        </CardHeader>
        <CardContent>
          <SuggestionsSection />
        </CardContent>
      </Card>
    </div>
  )
}
