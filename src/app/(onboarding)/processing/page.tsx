'use client'

import { ProcessingStatus } from '@/components/custom/ProcessingStatus'
import { PageHeader } from '@/components/product'

/**
 * Processing status page for onboarding flow
 * Story 2.3: Data Processing Status Indicators
 * Story 167.6: shadcn migration — PageHeader composition + semantic landmark
 */
export default function ProcessingPage() {
  return (
    <main className="container mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="space-y-6">
        <PageHeader
          title="Обработка данных"
          className="text-center [&_[data-slot=page-header-context]]:justify-center"
          context={
            <p className="text-muted-foreground">
              Шаг 3 из 3: Система обрабатывает ваши данные Wildberries
            </p>
          }
        />

        <ProcessingStatus />
      </div>
    </main>
  )
}
