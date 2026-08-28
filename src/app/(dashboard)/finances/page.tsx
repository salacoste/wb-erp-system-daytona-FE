'use client'

/**
 * Finances page — NEW-7 Account Balance + Financial Documents.
 *
 * Top-level account-level page (not weekly analytics). Two independent sources
 * (AC4 multi-source): BalanceCard + DocumentsTable each own their loading/
 * empty/error state machines — one failing never blanks the other.
 *
 * Both hooks are gated on `cabinetReady` (cabinet selected) so they don't fire
 * before a cabinet is available. RU locale by default for the documents API.
 */

import { useAuthStore } from '@/stores/authStore'
import { BalanceCard } from './components/BalanceCard'
import { DocumentsTable } from './components/DocumentsTable'

export default function FinancesPage() {
  // Gate hooks on cabinet selection — apiClient injects X-Cabinet-Id at request
  // time; we avoid firing before a cabinet is chosen (would 403).
  const cabinetId = useAuthStore(s => s.cabinetId)
  const cabinetReady = !!cabinetId

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Финансы</h1>
        <p className="text-sm text-muted-foreground">
          Баланс кабинета и финансовые документы Wildberries
        </p>
      </header>

      {/* AC4: independent sources — balance failure never blanks documents. */}
      <BalanceCard enabled={cabinetReady} />
      {/* Story 172.10: caption names the documents source (RTC contract). */}
      <DocumentsTable
        enabled={cabinetReady}
        locale="ru"
        captionText="Финансовые документы Wildberries"
      />
    </div>
  )
}
