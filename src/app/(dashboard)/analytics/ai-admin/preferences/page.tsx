/**
 * AI Admin Preferences page — Owner-role-gated master aiEnabled toggle.
 * Story 112.2-FE Task 4.
 * Server Component shell; role-gate and data fetch happen inside AiPreferencesForm (Client Component).
 */

import type { Metadata } from 'next'
import { AiPreferencesForm } from './components/AiPreferencesForm'

export const metadata: Metadata = {
  title: 'Настройки AI',
}

export default function AiPreferencesPage() {
  return (
    <main className="container mx-auto p-6">
      <AiPreferencesForm />
    </main>
  )
}
