/**
 * Boundary normalizer for Advertising Campaigns + Sync Status
 * GET /v1/analytics/advertising/campaigns
 * GET /v1/analytics/advertising/sync-status
 *
 * Campaigns: backend returns camelCase with campaigns array + total/limit/offset.
 * FE expects CampaignsResponse with meta (total_count, active_count) + data (Campaign[]).
 *
 * Sync status: backend returns camelCase shape; normalizer ensures field safety.
 */

import { asRecord, toStr, toCount, toStringOrNull } from '@/lib/api/normalizer-helpers'
import type { Campaign, CampaignsResponse, CampaignPlacements } from '@/types/advertising-analytics'
import type { SyncStatusResponse } from '@/types/advertising-analytics/sync-groups'

function normalizePlacements(raw: unknown): CampaignPlacements | null {
  if (raw == null || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  return {
    search: p.search === true,
    recommendations: p.recommendations === true,
    carousel: p.carousel === true ? true : undefined,
  }
}

/** Normalize a single campaign from backend camelCase → FE snake_case */
export function normalizeCampaign(raw: unknown): Campaign {
  const d = asRecord(raw)
  return {
    campaign_id: toCount(d.advertId),
    name: toStr(d.name),
    type: toCount(d.type),
    type_name: toStr(d.typeLabel) || 'Неизвестно',
    status: toCount(d.status),
    status_name: toStr(d.statusLabel) || 'Неизвестно',
    created_at: toStr(d.createdAt),
    start_time: toStr(d.startDate),
    end_time: toStringOrNull(d.endDate),
    daily_budget: toCount(d.dailyBudget),
    nm_ids: Array.isArray(d.nmIds) ? d.nmIds.map(String) : [],
    sku_count: toCount(d.productsCount),
    placements: normalizePlacements(d.placements),
  }
}

/** Normalize full campaigns response (backend → FE) */
export function normalizeCampaignsResponse(raw: unknown): CampaignsResponse {
  const d = asRecord(raw)
  const campaigns: unknown[] = Array.isArray(d.campaigns) ? d.campaigns : []
  return {
    meta: {
      total_count: toCount(d.total),
      active_count: campaigns.filter(c => {
        const rec = asRecord(c)
        return rec.status === 9
      }).length,
    },
    data: campaigns.map(normalizeCampaign),
  }
}

/** Normalize sync status response */
export function normalizeSyncStatusResponse(raw: unknown): SyncStatusResponse {
  const d = asRecord(raw)
  const lastTask =
    d.lastTask != null && typeof d.lastTask === 'object'
      ? (() => {
          const t = asRecord(d.lastTask)
          return {
            taskUuid: toStr(t.taskUuid),
            status: toStr(t.status),
            startedAt: toStr(t.startedAt),
            finishedAt: toStr(t.finishedAt),
            error: toStringOrNull(t.error),
          }
        })()
      : undefined

  return {
    lastSyncAt: toStringOrNull(d.lastSyncAt),
    nextScheduledSync: toStr(d.nextScheduledSync),
    status: toStr(d.status) as SyncStatusResponse['status'],
    lastTask,
    campaignsSynced: toCount(d.campaignsSynced),
    dataAvailableFrom: toStringOrNull(d.dataAvailableFrom),
    dataAvailableTo: toStringOrNull(d.dataAvailableTo),
  }
}
