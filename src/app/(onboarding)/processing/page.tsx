'use client'

import { ProcessingStatus } from '@/components/custom/ProcessingStatus'

/**
 * Processing status page for onboarding flow
 * Story 2.3: Data Processing Status Indicators
 */
export default function ProcessingPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Обработка данных</h1>
          <p className="text-muted-foreground">
            Шаг 3 из 3: Система обрабатывает ваши данные Wildberries
          </p>
        </div>

        <ProcessingStatus />
      </div>
    </div>
  )
}

