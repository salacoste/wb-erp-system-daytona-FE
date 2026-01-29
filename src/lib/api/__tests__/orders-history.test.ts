/**
 * TDD Tests for Orders History API Client
 * Story 40.1-FE: TypeScript Types & API Client Foundation
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Tests: getOrderHistory, getWbHistory, getFullHistory
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '../../api-client'
import { getOrderHistory, getWbHistory, getFullHistory } from '../orders'

vi.spyOn(console, 'info').mockImplementation(() => {})

// Fixtures - compact format for line limit compliance
const mockLocalHistory = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  currentStatus: { supplierStatus: 'complete' as const, wbStatus: 'sold' as const, isFinal: true },
  history: [
    {
      id: 'uuid-1',
      oldSupplierStatus: null,
      newSupplierStatus: 'new' as const,
      oldWbStatus: null,
      newWbStatus: 'waiting' as const,
      changedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2',
      oldSupplierStatus: 'new' as const,
      newSupplierStatus: 'confirm' as const,
      oldWbStatus: 'waiting' as const,
      newWbStatus: 'sorted' as const,
      changedAt: '2026-01-02T12:30:00.000Z',
      durationMinutes: 150,
    },
  ],
  summary: {
    totalTransitions: 2,
    totalDurationMinutes: 150,
    createdAt: '2026-01-02T10:00:00.000Z',
    completedAt: '2026-01-02T12:30:00.000Z',
  },
}

const mockWbHistory = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  wbHistory: [
    {
      id: 'uuid-1',
      wbStatusCode: 'created',
      wbStatusChangedAt: '2026-01-02T10:00:00.000Z',
      durationMinutes: null,
    },
    {
      id: 'uuid-2',
      wbStatusCode: 'assembling',
      wbStatusChangedAt: '2026-01-02T10:30:00.000Z',
      durationMinutes: 30,
    },
  ],
  summary: {
    totalTransitions: 2,
    totalDurationMinutes: 30,
    currentWbStatus: 'assembling',
    createdAt: '2026-01-02T10:00:00.000Z',
    lastUpdatedAt: '2026-01-02T10:30:00.000Z',
  },
}

const mockFullHistory = {
  orderId: '1234567890',
  orderUid: 'UID-123456',
  fullHistory: [
    {
      source: 'wb_native' as const,
      wbStatusCode: 'created',
      timestamp: '2026-01-02T10:00:00.000Z',
    },
    {
      source: 'local' as const,
      oldSupplierStatus: null,
      newSupplierStatus: 'new' as const,
      oldWbStatus: null,
      newWbStatus: 'waiting' as const,
      timestamp: '2026-01-02T10:05:00.000Z',
    },
    {
      source: 'wb_native' as const,
      wbStatusCode: 'assembling',
      timestamp: '2026-01-02T10:30:00.000Z',
    },
  ],
  summary: { localEntriesCount: 1, wbNativeEntriesCount: 2, totalEntriesCount: 3 },
}

describe('Orders History API Client', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getOrderHistory', () => {
    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockLocalHistory)
      await getOrderHistory('1234567890')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders/1234567890/history', {
        skipDataUnwrap: true,
      })
    })

    it('returns currentStatus with isFinal flag', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockLocalHistory)
      const result = await getOrderHistory('1234567890')
      expect(result.currentStatus.supplierStatus).toBe('complete')
      expect(result.currentStatus.isFinal).toBe(true)
    })

    it('returns history entries with duration', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockLocalHistory)
      const result = await getOrderHistory('1234567890')
      expect(result.history).toHaveLength(2)
      expect(result.history[0].durationMinutes).toBeNull()
      expect(result.history[1].durationMinutes).toBe(150)
    })

    it('returns summary with transitions count', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockLocalHistory)
      const result = await getOrderHistory('1234567890')
      expect(result.summary.totalTransitions).toBe(2)
      expect(result.summary.completedAt).toBeDefined()
    })
  })

  describe('getWbHistory', () => {
    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockWbHistory)
      await getWbHistory('1234567890')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders/1234567890/wb-history', {
        skipDataUnwrap: true,
      })
    })

    it('returns WB status codes as strings', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockWbHistory)
      const result = await getWbHistory('1234567890')
      result.wbHistory.forEach(entry => {
        expect(typeof entry.wbStatusCode).toBe('string')
      })
    })

    it('returns summary with currentWbStatus', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockWbHistory)
      const result = await getWbHistory('1234567890')
      expect(result.summary.currentWbStatus).toBe('assembling')
      expect(result.summary.totalTransitions).toBe(2)
    })
  })

  describe('getFullHistory', () => {
    it('calls API with correct endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFullHistory)
      await getFullHistory('1234567890')
      expect(apiClient.get).toHaveBeenCalledWith('/v1/orders/1234567890/full-history', {
        skipDataUnwrap: true,
      })
    })

    it('returns merged history with source discriminator', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFullHistory)
      const result = await getFullHistory('1234567890')
      expect(result.fullHistory).toHaveLength(3)
      expect(result.fullHistory[0].source).toBe('wb_native')
      expect(result.fullHistory[1].source).toBe('local')
    })

    it('validates wb_native entries have wbStatusCode', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFullHistory)
      const result = await getFullHistory('1234567890')
      const wbEntry = result.fullHistory.find(e => e.source === 'wb_native')
      if (wbEntry && wbEntry.source === 'wb_native') {
        expect(wbEntry.wbStatusCode).toBeDefined()
      }
    })

    it('validates local entries have status fields', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFullHistory)
      const result = await getFullHistory('1234567890')
      const localEntry = result.fullHistory.find(e => e.source === 'local')
      if (localEntry && localEntry.source === 'local') {
        expect(localEntry.newSupplierStatus).toBeDefined()
        expect(localEntry.newWbStatus).toBeDefined()
      }
    })

    it('returns correct summary counts', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFullHistory)
      const result = await getFullHistory('1234567890')
      expect(result.summary.localEntriesCount).toBe(1)
      expect(result.summary.wbNativeEntriesCount).toBe(2)
      expect(result.summary.totalEntriesCount).toBe(3)
    })
  })
})
