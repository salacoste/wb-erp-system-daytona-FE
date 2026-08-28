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
        <div className="mb-4 rounded-full bg-muted p-4">
          <Activity className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Данные ещё не загружены</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Синхронизация начнётся автоматически. Первые данные появятся в течение 15–30 минут, полный
          отчёт будет доступен через 24 часа.
        </p>
      </CardContent>
    </Card>
  )
}
