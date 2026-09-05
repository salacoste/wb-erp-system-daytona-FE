/**
 * Campaign Utilities
 * Story 33.5-FE: Campaign List & Filtering
 * Epic 33: Advertising Analytics (Frontend)
 *
 * Status and type mappings for WB advertising campaigns.
 */

// ============================================================================
// Campaign Status Configuration
// ============================================================================

/**
 * Campaign status configuration.
 *
 * WB status codes:
 * - 4: Ready to launch
 * - 7: Ended
 * - 8: Declined
 * - 9: Active
 * - 11: Paused
 */
export interface CampaignStatusConfig {
  /** Russian label for the status */
  label: string
  /** Dot color class (Tailwind) */
  dotColor: string
  /** Text color class (Tailwind) */
  textColor: string
}

// P2 wave-5: dot/text channels → semantic tokens, mirroring the route-local
// twin CAMPAIGN_STATUS_DOT_TOKENS in advertising-tokens.ts (Story 170.1) so
// the production-dead lib map stays coherent with the live consumer.
export const campaignStatusConfig: Record<number, CampaignStatusConfig> = {
  4: {
    label: 'Готова к запуску',
    dotColor: 'bg-status-information',
    textColor: 'text-status-information',
  },
  7: {
    label: 'Завершена',
    dotColor: 'bg-muted-foreground',
    textColor: 'text-muted-foreground',
  },
  8: {
    label: 'Отклонена',
    dotColor: 'bg-status-error',
    textColor: 'text-status-error',
  },
  9: {
    label: 'Активна',
    dotColor: 'bg-status-success',
    textColor: 'text-status-success',
  },
  11: {
    label: 'На паузе',
    dotColor: 'bg-status-warning',
    textColor: 'text-status-warning',
  },
}

/**
 * Get campaign status label.
 * Falls back to status_name from API if unknown code.
 */
export function getCampaignStatusLabel(status: number, fallback?: string): string {
  return campaignStatusConfig[status]?.label || fallback || 'Неизвестно'
}

/**
 * Get campaign status dot color class.
 * Fallback = muted-foreground, mirroring getCampaignStatusDotToken (170.1).
 */
export function getCampaignStatusDotColor(status: number): string {
  return campaignStatusConfig[status]?.dotColor || 'bg-muted-foreground'
}

// ============================================================================
// Campaign Type Configuration
// ============================================================================

/**
 * Campaign type labels.
 *
 * WB type codes:
 * - 4: Carousel
 * - 5: Product card
 * - 6: Catalog
 * - 7: Search
 * - 8: Auto
 * - 9: Auction (unified)
 */
export const campaignTypeLabels: Record<number, string> = {
  4: 'Карусель',
  5: 'Карточка товара',
  6: 'Каталог',
  7: 'Поиск',
  8: 'Авто',
  9: 'Аукцион',
}

/**
 * Get campaign type label.
 * Falls back to type_name from API if unknown code.
 */
export function getCampaignTypeLabel(type: number, fallback?: string): string {
  return campaignTypeLabels[type] || fallback || 'Другой'
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if campaign is active.
 */
export function isCampaignActive(status: number): boolean {
  return status === 9
}

/**
 * Check if campaign is paused.
 */
export function isCampaignPaused(status: number): boolean {
  return status === 11
}

/**
 * Check if campaign can be resumed (paused or ready).
 */
export function canResumeCampaign(status: number): boolean {
  return status === 11 || status === 4
}

/**
 * Sort campaigns: by creation date (newest first), then by status (active > paused), then by name.
 */
export function sortCampaignsByStatus<
  T extends { status: number; name: string; created_at: string },
>(campaigns: T[]): T[] {
  return [...campaigns].sort((a, b) => {
    // First: Sort by creation date (newest first)
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    if (dateA !== dateB) {
      return dateB - dateA // DESC (newest first)
    }

    // Second: Active (9) before others
    if (a.status === 9 && b.status !== 9) return -1
    if (b.status === 9 && a.status !== 9) return 1

    // Third: Paused (11) before others
    if (a.status === 11 && b.status !== 11) return -1
    if (b.status === 11 && a.status !== 11) return 1

    // Last: By name
    return a.name.localeCompare(b.name, 'ru')
  })
}
