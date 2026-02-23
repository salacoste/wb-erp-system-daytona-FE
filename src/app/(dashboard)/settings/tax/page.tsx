/**
 * Tax & VAT Settings Page
 * Story 66.3-FE: Tax & VAT Settings Page
 * Epic 66-FE: Tax & Accounting Frontend
 */

'use client'

import { TaxSettingsForm } from '@/components/custom/settings/TaxSettingsForm'
import { useAuthStore } from '@/stores/authStore'

export default function TaxSettingsPage() {
  const cabinetId = useAuthStore(state => state.cabinetId)
  if (!cabinetId) return null

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <h1 className="mb-6 text-2xl font-bold">Налоговые настройки</h1>
      <TaxSettingsForm cabinetId={cabinetId} />
    </div>
  )
}
