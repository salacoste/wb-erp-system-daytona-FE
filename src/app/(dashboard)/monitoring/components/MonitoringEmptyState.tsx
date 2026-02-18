/**
 * MonitoringEmptyState — Shown for new cabinets with no data yet
 * Epic 68-FE (Story 68.1)
 * UX Review: illustration + timeline explanation
 */

import { Activity } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function MonitoringEmptyState() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Activity className="h-8 w-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Данные ещё не загружены</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Синхронизация начнётся автоматически. Первые данные появятся в течение 15–30 минут, полный
          отчёт будет доступен через 24 часа.
        </p>
      </CardContent>
    </Card>
  )
}
