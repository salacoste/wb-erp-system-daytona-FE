/**
 * Monitoring Page — Epic 68-FE (Story 68.1)
 * Route: /monitoring
 * Dashboard layout group: (dashboard)
 */

import { MonitoringPageContent } from './components/MonitoringPageContent'

export const metadata = {
  title: 'Мониторинг — WB Repricer',
  description: 'Мониторинг здоровья системы и статус парсинга данных',
}

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Мониторинг</h1>
        <p className="text-sm text-muted-foreground">
          Состояние системы, полнота данных и статус синхронизации
        </p>
      </div>
      <MonitoringPageContent />
    </div>
  )
}
