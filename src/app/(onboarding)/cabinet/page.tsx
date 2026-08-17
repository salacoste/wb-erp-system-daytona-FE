'use client'

import { CabinetCreationForm } from '@/components/custom/CabinetCreationForm'
import { PageHeader } from '@/components/product'
import { Card, CardContent } from '@/components/ui/card'
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard'

/**
 * Cabinet creation page for onboarding flow
 * Story 2.1: Cabinet Creation Interface
 */
export default function CabinetCreationPage() {
  useOnboardingGuard()
  return (
    <main className="container mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <div className="space-y-6">
        <PageHeader
          title="Создание кабинета"
          className="text-center [&_[data-slot=page-header-context]]:justify-center"
          context={
            <p className="text-muted-foreground">
              Шаг 1 из 3: Создайте кабинет для организации ваших данных
            </p>
          }
        />

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <CabinetCreationForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
