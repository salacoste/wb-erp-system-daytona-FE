/**
 * Test Fixtures for Order History Timeline Components
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Fixtures for testing OrderHistoryTimeline, WbHistoryTimeline, LocalHistoryTimeline,
 * StatusBadge, DurationDisplay, and related components.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md
 */

import type { WbStatusCategory } from '@/lib/wb-status-mapping'

// =============================================================================
// TypeScript Interfaces (Story 40.1-FE compatibility)
// =============================================================================

export interface FullHistoryEntry {
  source: 'local' | 'wb_native'
  timestamp: string // ISO 8601

  // For wb_native source
  wbStatusCode?: string

  // For local source
  oldSupplierStatus?: string | null
  newSupplierStatus?: string | null
  oldWbStatus?: string | null
  newWbStatus?: string | null
}

export interface WbStatusHistoryEntry {
  id: string
  wbStatusCode: string
  wbStatusChangedAt: string // ISO 8601
  durationMinutes: number | null
}

export interface OrderStatusHistoryEntry {
  id: string
  oldSupplierStatus: string | null
  newSupplierStatus: string | null
  oldWbStatus: string | null
  newWbStatus: string | null
  changedAt: string // ISO 8601
  changedBy: string | null
  durationMinutes: number | null
}

export interface FullHistorySummary {
  localEntriesCount: number
  wbNativeEntriesCount: number
  totalEntriesCount: number
  firstTimestamp?: string
  lastTimestamp?: string
}

export interface WbHistorySummary {
  totalTransitions: number
  totalDurationMinutes: number | null
  currentWbStatus: string | null
  createdAt: string
  lastUpdatedAt: string | null
}

export interface LocalHistorySummary {
  totalTransitions: number
  totalDurationMinutes: number | null
  createdAt: string
  completedAt: string | null
}

// =============================================================================
// Full History Fixtures (Merged WB + Local)
// =============================================================================

/**
 * Standard full history with mixed WB and local entries
 * 8 entries covering typical order lifecycle
 */
export const mockFullHistoryStandard: FullHistoryEntry[] = [
  {
    source: 'wb_native',
    wbStatusCode: 'created',
    timestamp: '2026-01-04T10:00:00.000Z',
  },
  {
    source: 'local',
    oldSupplierStatus: null,
    newSupplierStatus: 'new',
    oldWbStatus: null,
    newWbStatus: 'waiting',
    timestamp: '2026-01-04T10:05:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'assembling',
    timestamp: '2026-01-04T10:30:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'assembled',
    timestamp: '2026-01-04T11:15:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'sorted_by_wh',
    timestamp: '2026-01-04T14:00:00.000Z',
  },
  {
    source: 'local',
    oldSupplierStatus: 'new',
    newSupplierStatus: 'confirm',
    oldWbStatus: 'waiting',
    newWbStatus: 'sorted',
    timestamp: '2026-01-05T09:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'on_way_to_client',
    timestamp: '2026-01-05T12:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'received_by_client',
    timestamp: '2026-01-05T15:30:00.000Z',
  },
]

/**
 * Full history with WB-only entries (no local tracking)
 */
export const mockFullHistoryWbOnly: FullHistoryEntry[] = [
  {
    source: 'wb_native',
    wbStatusCode: 'created',
    timestamp: '2026-01-04T10:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'assembling',
    timestamp: '2026-01-04T10:30:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'assembled',
    timestamp: '2026-01-04T11:15:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'sorted_by_wh',
    timestamp: '2026-01-04T14:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'received_by_client',
    timestamp: '2026-01-05T15:30:00.000Z',
  },
]

/**
 * Full history with unknown WB status codes
 */
export const mockFullHistoryWithUnknownStatus: FullHistoryEntry[] = [
  {
    source: 'wb_native',
    wbStatusCode: 'created',
    timestamp: '2026-01-04T10:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'new_unknown_status_2026',
    timestamp: '2026-01-04T11:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'another_unknown_code',
    timestamp: '2026-01-04T12:00:00.000Z',
  },
]

/**
 * Full history with cancellation flow
 */
export const mockFullHistoryCanceled: FullHistoryEntry[] = [
  {
    source: 'wb_native',
    wbStatusCode: 'created',
    timestamp: '2026-01-04T10:00:00.000Z',
  },
  {
    source: 'local',
    oldSupplierStatus: null,
    newSupplierStatus: 'new',
    oldWbStatus: null,
    newWbStatus: 'waiting',
    timestamp: '2026-01-04T10:05:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'canceled_by_client',
    timestamp: '2026-01-04T11:30:00.000Z',
  },
  {
    source: 'local',
    oldSupplierStatus: 'new',
    newSupplierStatus: 'cancel',
    oldWbStatus: 'waiting',
    newWbStatus: 'canceled',
    timestamp: '2026-01-04T11:35:00.000Z',
  },
]

/**
 * Full history with return flow
 */
export const mockFullHistoryReturn: FullHistoryEntry[] = [
  {
    source: 'wb_native',
    wbStatusCode: 'created',
    timestamp: '2026-01-04T10:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'received_by_client',
    timestamp: '2026-01-05T15:30:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'return_requested',
    timestamp: '2026-01-06T10:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'return_in_transit',
    timestamp: '2026-01-06T14:00:00.000Z',
  },
  {
    source: 'wb_native',
    wbStatusCode: 'return_received',
    timestamp: '2026-01-07T16:00:00.000Z',
  },
]

// =============================================================================
// WB Native History Fixtures
// =============================================================================

/**
 * Standard WB history with 6 transitions
 */
export const mockWbHistoryStandard: WbStatusHistoryEntry[] = [
  {
    id: 'wb-001',
    wbStatusCode: 'created',
    wbStatusChangedAt: '2026-01-04T10:00:00.000Z',
    durationMinutes: null,
  },
  {
    id: 'wb-002',
    wbStatusCode: 'assembling',
    wbStatusChangedAt: '2026-01-04T10:30:00.000Z',
    durationMinutes: 30,
  },
  {
    id: 'wb-003',
    wbStatusCode: 'assembled',
    wbStatusChangedAt: '2026-01-04T11:15:00.000Z',
    durationMinutes: 45,
  },
  {
    id: 'wb-004',
    wbStatusCode: 'sorted_by_wh',
    wbStatusChangedAt: '2026-01-04T14:00:00.000Z',
    durationMinutes: 165,
  },
  {
    id: 'wb-005',
    wbStatusCode: 'on_way_to_client',
    wbStatusChangedAt: '2026-01-05T09:00:00.000Z',
    durationMinutes: 1140,
  },
  {
    id: 'wb-006',
    wbStatusCode: 'received_by_client',
    wbStatusChangedAt: '2026-01-05T15:30:00.000Z',
    durationMinutes: 390,
  },
]

/**
 * WB history with all categories represented
 */
export const mockWbHistoryAllCategories: WbStatusHistoryEntry[] = [
  // creation
  {
    id: 'wb-cat-001',
    wbStatusCode: 'created',
    wbStatusChangedAt: '2026-01-04T10:00:00.000Z',
    durationMinutes: null,
  },
  // seller_processing
  {
    id: 'wb-cat-002',
    wbStatusCode: 'waiting',
    wbStatusChangedAt: '2026-01-04T10:05:00.000Z',
    durationMinutes: 5,
  },
  {
    id: 'wb-cat-003',
    wbStatusCode: 'assembling',
    wbStatusChangedAt: '2026-01-04T10:30:00.000Z',
    durationMinutes: 25,
  },
  // warehouse
  {
    id: 'wb-cat-004',
    wbStatusCode: 'sorted_by_wh',
    wbStatusChangedAt: '2026-01-04T14:00:00.000Z',
    durationMinutes: 210,
  },
  // logistics
  {
    id: 'wb-cat-005',
    wbStatusCode: 'on_way_to_pvz',
    wbStatusChangedAt: '2026-01-05T08:00:00.000Z',
    durationMinutes: 1080,
  },
  {
    id: 'wb-cat-006',
    wbStatusCode: 'arrived_at_pvz',
    wbStatusChangedAt: '2026-01-05T12:00:00.000Z',
    durationMinutes: 240,
  },
  // delivery
  {
    id: 'wb-cat-007',
    wbStatusCode: 'received_by_client',
    wbStatusChangedAt: '2026-01-05T15:30:00.000Z',
    durationMinutes: 210,
  },
]

/**
 * WB history with unknown status codes
 */
export const mockWbHistoryWithUnknown: WbStatusHistoryEntry[] = [
  {
    id: 'wb-unk-001',
    wbStatusCode: 'created',
    wbStatusChangedAt: '2026-01-04T10:00:00.000Z',
    durationMinutes: null,
  },
  {
    id: 'wb-unk-002',
    wbStatusCode: 'future_wb_status_v2',
    wbStatusChangedAt: '2026-01-04T11:00:00.000Z',
    durationMinutes: 60,
  },
  {
    id: 'wb-unk-003',
    wbStatusCode: 'received_by_client',
    wbStatusChangedAt: '2026-01-05T15:30:00.000Z',
    durationMinutes: 1710,
  },
]

/**
 * WB history with long duration (multi-day)
 */
export const mockWbHistoryLongDuration: WbStatusHistoryEntry[] = [
  {
    id: 'wb-long-001',
    wbStatusCode: 'created',
    wbStatusChangedAt: '2026-01-01T10:00:00.000Z',
    durationMinutes: null,
  },
  {
    id: 'wb-long-002',
    wbStatusCode: 'assembling',
    wbStatusChangedAt: '2026-01-01T10:30:00.000Z',
    durationMinutes: 30,
  },
  {
    id: 'wb-long-003',
    wbStatusCode: 'on_way_to_client',
    wbStatusChangedAt: '2026-01-03T14:00:00.000Z',
    durationMinutes: 3090, // ~2.1 days
  },
  {
    id: 'wb-long-004',
    wbStatusCode: 'received_by_client',
    wbStatusChangedAt: '2026-01-10T16:00:00.000Z',
    durationMinutes: 10200, // ~7 days
  },
]

// =============================================================================
// Local History Fixtures
// =============================================================================

/**
 * Standard local history with 3 transitions
 */
export const mockLocalHistoryStandard: OrderStatusHistoryEntry[] = [
  {
    id: 'local-001',
    oldSupplierStatus: null,
    newSupplierStatus: 'new',
    oldWbStatus: null,
    newWbStatus: 'waiting',
    changedAt: '2026-01-04T10:05:00.000Z',
    changedBy: 'system',
    durationMinutes: null,
  },
  {
    id: 'local-002',
    oldSupplierStatus: 'new',
    newSupplierStatus: 'confirm',
    oldWbStatus: 'waiting',
    newWbStatus: 'sorted',
    changedAt: '2026-01-05T09:00:00.000Z',
    changedBy: 'user@example.com',
    durationMinutes: 1375,
  },
  {
    id: 'local-003',
    oldSupplierStatus: 'confirm',
    newSupplierStatus: 'complete',
    oldWbStatus: 'sorted',
    newWbStatus: 'sold',
    changedAt: '2026-01-05T16:00:00.000Z',
    changedBy: 'system',
    durationMinutes: 420,
  },
]

/**
 * Local history with cancellation
 */
export const mockLocalHistoryCanceled: OrderStatusHistoryEntry[] = [
  {
    id: 'local-can-001',
    oldSupplierStatus: null,
    newSupplierStatus: 'new',
    oldWbStatus: null,
    newWbStatus: 'waiting',
    changedAt: '2026-01-04T10:05:00.000Z',
    changedBy: 'system',
    durationMinutes: null,
  },
  {
    id: 'local-can-002',
    oldSupplierStatus: 'new',
    newSupplierStatus: 'cancel',
    oldWbStatus: 'waiting',
    newWbStatus: 'canceled',
    changedAt: '2026-01-04T11:35:00.000Z',
    changedBy: 'user@example.com',
    durationMinutes: 90,
  },
]

/**
 * Local history with partial status changes
 * (only supplier_status changes, wb_status stays same)
 */
export const mockLocalHistoryPartialChange: OrderStatusHistoryEntry[] = [
  {
    id: 'local-part-001',
    oldSupplierStatus: null,
    newSupplierStatus: 'new',
    oldWbStatus: null,
    newWbStatus: 'waiting',
    changedAt: '2026-01-04T10:05:00.000Z',
    changedBy: 'system',
    durationMinutes: null,
  },
  {
    id: 'local-part-002',
    oldSupplierStatus: 'new',
    newSupplierStatus: 'confirm',
    oldWbStatus: 'waiting',
    newWbStatus: 'waiting', // wb_status didn't change
    changedAt: '2026-01-04T12:00:00.000Z',
    changedBy: 'user@example.com',
    durationMinutes: 115,
  },
]

// =============================================================================
// Duration Test Cases
// =============================================================================

/**
 * Duration test cases for formatDuration function
 * Input: minutes, Expected output: Russian formatted string
 */
export const durationTestCases: Array<{
  minutes: number | null
  expected: string
  description: string
}> = [
  { minutes: null, expected: '—', description: 'null returns em-dash' },
  { minutes: 0, expected: '< 1 мин', description: 'zero returns < 1 minute' },
  { minutes: 0.5, expected: '< 1 мин', description: 'half minute returns < 1' },
  { minutes: 1, expected: '1 мин', description: 'single minute' },
  { minutes: 5, expected: '5 мин', description: '5 minutes' },
  { minutes: 30, expected: '30 мин', description: '30 minutes' },
  { minutes: 59, expected: '59 мин', description: '59 minutes' },
  { minutes: 60, expected: '1 ч', description: 'exactly 1 hour' },
  { minutes: 90, expected: '1 ч 30 мин', description: '1.5 hours' },
  { minutes: 120, expected: '2 ч', description: 'exactly 2 hours' },
  { minutes: 165, expected: '2 ч 45 мин', description: '2h 45m' },
  { minutes: 1380, expected: '23 ч', description: '23 hours' },
  { minutes: 1410, expected: '23 ч 30 мин', description: '23h 30m' },
  { minutes: 1440, expected: '1 д', description: 'exactly 1 day' },
  { minutes: 1500, expected: '1 д 1 ч', description: '1d 1h' },
  { minutes: 2880, expected: '2 д', description: 'exactly 2 days' },
  { minutes: 4320, expected: '3 д', description: '3 days' },
  { minutes: 5760, expected: '4 д', description: '4 days' },
  { minutes: 8640, expected: '6 д', description: '6 days' },
  { minutes: 10080, expected: '7 дней', description: 'exactly 7 days' },
  { minutes: 14400, expected: '10 дней', description: '10 days' },
  { minutes: 20160, expected: '14 дней', description: '14 days' },
  { minutes: 43200, expected: '30 дней', description: '30 days' },
]

// =============================================================================
// Summary Fixtures
// =============================================================================

export const mockFullHistorySummary: FullHistorySummary = {
  localEntriesCount: 2,
  wbNativeEntriesCount: 6,
  totalEntriesCount: 8,
  firstTimestamp: '2026-01-04T10:00:00.000Z',
  lastTimestamp: '2026-01-05T15:30:00.000Z',
}

export const mockWbHistorySummary: WbHistorySummary = {
  totalTransitions: 6,
  totalDurationMinutes: 1770,
  currentWbStatus: 'received_by_client',
  createdAt: '2026-01-04T10:00:00.000Z',
  lastUpdatedAt: '2026-01-05T15:30:00.000Z',
}

export const mockLocalHistorySummary: LocalHistorySummary = {
  totalTransitions: 3,
  totalDurationMinutes: 1795,
  createdAt: '2026-01-04T10:05:00.000Z',
  completedAt: '2026-01-05T16:00:00.000Z',
}

// =============================================================================
// Empty State Fixtures
// =============================================================================

export const mockEmptyFullHistory: FullHistoryEntry[] = []

export const mockEmptyWbHistory: WbStatusHistoryEntry[] = []

export const mockEmptyLocalHistory: OrderStatusHistoryEntry[] = []

// =============================================================================
// Category Groups for Testing
// =============================================================================

export const wbStatusesByCategory: Record<WbStatusCategory, string[]> = {
  creation: ['created'],
  seller_processing: ['waiting', 'assembling', 'assembled', 'ready_for_supply'],
  warehouse: ['sorted', 'sorted_by_wh', 'accepted_by_wh'],
  logistics: [
    'on_way_to_storage',
    'accepted_at_storage',
    'sorted_by_wb',
    'on_way_to_pvz',
    'arrived_at_pvz',
    'on_way_to_client',
  ],
  delivery: ['received_by_client', 'sold', 'delivering'],
  cancellation: [
    'canceled',
    'canceled_by_seller',
    'canceled_by_wh',
    'canceled_by_client',
    'canceled_by_wb',
    'cancel',
  ],
  return: ['return_requested', 'return_at_pvz', 'return_in_transit', 'return_received', 'refunded'],
  other: ['defect', 'lost', 'damaged', 'expired'],
}

/**
 * All final (terminal) status codes
 */
export const finalStatusCodes: string[] = [
  'received_by_client',
  'sold',
  'canceled',
  'canceled_by_seller',
  'canceled_by_wh',
  'canceled_by_client',
  'canceled_by_wb',
  'cancel',
  'return_received',
  'refunded',
  'defect',
  'lost',
  'damaged',
  'expired',
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate expected duration between two ISO timestamps
 */
export function calculateDurationMinutes(from: string, to: string): number {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(diff / 60000)
}

/**
 * Create a custom full history entry for testing
 */
export function createWbNativeEntry(wbStatusCode: string, timestamp: string): FullHistoryEntry {
  return {
    source: 'wb_native',
    wbStatusCode,
    timestamp,
  }
}

/**
 * Create a custom local history entry for testing
 */
export function createLocalEntry(
  oldSupplier: string | null,
  newSupplier: string,
  oldWb: string | null,
  newWb: string,
  timestamp: string
): FullHistoryEntry {
  return {
    source: 'local',
    oldSupplierStatus: oldSupplier,
    newSupplierStatus: newSupplier,
    oldWbStatus: oldWb,
    newWbStatus: newWb,
    timestamp,
  }
}
