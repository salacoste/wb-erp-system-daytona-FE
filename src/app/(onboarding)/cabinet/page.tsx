'use client'

import { CabinetCreationForm } from '@/components/custom/CabinetCreationForm'

/**
 * Cabinet creation page for onboarding flow
 * Story 2.1: Cabinet Creation Interface
 */
export default function CabinetCreationPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Создание кабинета</h1>
          <p className="text-muted-foreground">
            Шаг 1 из 3: Создайте кабинет для организации ваших данных
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <CabinetCreationForm />
        </div>
      </div>
    </div>
  )
}

