/**
 * Unit tests for sync-status-config (Story 63.3-FE) — regression coverage added iter-140.
 *
 * Pure config map + getter for the advertising sync-status badge. Covers the 5-status set,
 * concrete display values, the syncing-only `animate` flag, and getSyncStatusConfig wiring.
 * (The `?? idle` fallback is defensive/unreachable via the type — not force-tested with an `as` cast.)
 */

import { describe, it, expect } from 'vitest'
import type { ExtendedSyncTaskStatus } from '@/types/advertising-sync-status'
import { syncStatusConfig, getSyncStatusConfig } from '@/lib/sync-status-config'

const STATUSES: ExtendedSyncTaskStatus[] = [
  'idle',
  'syncing',
  'completed',
  'partial_success',
  'failed',
]

describe('syncStatusConfig', () => {
  it('defines exactly the 5 statuses', () => {
    expect(Object.keys(syncStatusConfig).sort()).toEqual([...STATUSES].sort())
  })

  it('has concrete label/color for each status', () => {
    expect(syncStatusConfig.idle.label).toBe('Ожидание')
    expect(syncStatusConfig.idle.color).toBe('text-muted-foreground')
    expect(syncStatusConfig.syncing.label).toBe('Синхронизация...')
    expect(syncStatusConfig.completed.color).toBe('text-status-success')
    expect(syncStatusConfig.partial_success.label).toBe('Частично')
    expect(syncStatusConfig.failed.label).toBe('Ошибка')
    expect(syncStatusConfig.failed.color).toBe('text-status-error-foreground')
  })

  it('every status carries label/color/bgColor/description', () => {
    for (const s of STATUSES) {
      const cfg = syncStatusConfig[s]
      expect(cfg.label).toBeTruthy()
      expect(cfg.color).toBeTruthy()
      expect(cfg.bgColor).toBeTruthy()
      expect(cfg.description).toBeTruthy()
    }
  })

  it('only "syncing" is animated', () => {
    expect(syncStatusConfig.syncing.animate).toBe(true)
    for (const s of STATUSES.filter(x => x !== 'syncing')) {
      expect(syncStatusConfig[s].animate).toBeUndefined()
    }
  })
})

describe('getSyncStatusConfig', () => {
  it('returns the matching config for every valid status', () => {
    for (const s of STATUSES) {
      expect(getSyncStatusConfig(s)).toBe(syncStatusConfig[s])
    }
  })
})
