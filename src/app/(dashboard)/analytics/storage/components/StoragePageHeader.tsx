'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Warehouse, ChevronRight, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaidStorageImportDialog } from './PaidStorageImportDialog'

/**
 * Storage Analytics Page Header
 * Story 24.2-FE: Storage Analytics Page Layout
 * Story 24.6-FE: Manual Import UI
 *
 * Includes:
 * - Breadcrumbs: Главная > Аналитика > Хранение
 * - Title with Warehouse icon
 * - Import button with dialog
 */
export function StoragePageHeader() {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Главная
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/analytics" className="hover:text-foreground transition-colors">
          Аналитика
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Хранение</span>
      </nav>

      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Аналитика расходов на хранение
            </h1>
            <p className="text-sm text-muted-foreground">
              Анализ затрат на платное хранение по товарам
            </p>
          </div>
        </div>

        {/* Import Button - Story 24.6-fe */}
        <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4" />
          Импорт данных
        </Button>
      </div>

      {/* Import Dialog */}
      <PaidStorageImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  )
}
