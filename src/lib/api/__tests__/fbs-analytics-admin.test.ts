/**
 * Tests for FBS Analytics Admin API Client (Backfill operations)
 * Story 51.1-FE: FBS Analytics Types & API Module
 * Epic 51-FE: FBS Historical Analytics UI (365 Days)
 *
 * Covers: startBackfill, getBackfillStatus, pauseBackfill, resumeBackfill,
 * backfillQueryKeys, role-based access, error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError } from '@/types/api'

// Mock API client
vi.mock('../../api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

// Mock logger to avoid console noise
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock normalizer (unit-tested separately)
vi.mock('../fbs-backfill-normalizer', () => ({
  normalizeBackfillStatusResponse: vi.fn((raw: unknown) => {
    if (!Array.isArray(raw)) return []
    return raw.map((item: Record<string, unknown>) => ({
      cabinetId: String(item.cabinetId ?? item.cabinet_id ?? ''),
      cabinetName: String(item.cabinetName ?? item.cabinet_name ?? ''),
      reportsStatus: String(item.reportsStatus ?? item.reports_status ?? 'pending'),
      analyticsStatus: String(item.analyticsStatus ?? item.analytics_status ?? 'pending'),
      overallProgress: Number(item.overallProgress ?? item.overall_progress ?? 0),
      estimatedEta: (item.estimatedEta ?? item.estimated_eta ?? null) as string | null,
      errors: Array.isArray(item.errors) ? item.errors.map(String) : [],
    }))
  }),
}))

import { apiClient } from '../../api-client'
import {
  startBackfill,
  getBackfillStatus,
  pauseBackfill,
  resumeBackfill,
  backfillQueryKeys,
} from '../fbs-analytics-backfill'

// =============================================================================
// Mock Fixtures
// =============================================================================

const mockStartResponse = {
  success: true,
  message: 'Backfill started',
  jobCount: 3,
  jobIds: ['job-1', 'job-2', 'job-3'],
}

const mockBackfillStatusRaw = [
  {
    cabinetId: 'cab-1',
    cabinetName: 'Test Cabinet',
    reportsStatus: 'in_progress',
    analyticsStatus: 'pending',
    overallProgress: 45,
    estimatedEta: '2026-06-07T12:00:00Z',
    errors: [],
  },
]

const mockActionResponse = {
  success: true,
  message: 'Action completed',
}

// =============================================================================
// Tests
// =============================================================================

describe('FBS Analytics Admin API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // startBackfill Tests
  // ===========================================================================

  describe('startBackfill', () => {
    it('calls POST /v1/admin/backfill/start', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'reports' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ dataSource: 'reports' })
      )
    })

    it('sends cabinetId in request body when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ cabinetId: 'cab-1', dataSource: 'reports' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ cabinetId: 'cab-1' })
      )
    })

    it('sends dataSource in request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'analytics' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ dataSource: 'analytics' })
      )
    })

    it('sends dateFrom in request body when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'both', dateFrom: '2025-01-01' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ dateFrom: '2025-01-01' })
      )
    })

    it('sends dateTo in request body when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'reports', dateTo: '2026-01-01' })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ dateTo: '2026-01-01' })
      )
    })

    it('sends priority in request body when provided', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'reports', priority: 5 })
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/start',
        expect.objectContaining({ priority: 5 })
      )
    })

    it('omits cabinetId for all-cabinets backfill', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      await startBackfill({ dataSource: 'reports' })
      const body = vi.mocked(apiClient.post).mock.calls[0][1] as Record<string, unknown>
      expect(body).not.toHaveProperty('cabinetId')
    })

    it('returns success boolean', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      const result = await startBackfill({ dataSource: 'reports' })
      expect(result.success).toBe(true)
    })

    it('returns message string', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      const result = await startBackfill({ dataSource: 'reports' })
      expect(result.message).toBe('Backfill started')
    })

    it('returns jobCount number', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      const result = await startBackfill({ dataSource: 'reports' })
      expect(result.jobCount).toBe(3)
    })

    it('returns jobIds array', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      const result = await startBackfill({ dataSource: 'reports' })
      expect(result.jobIds).toEqual(['job-1', 'job-2', 'job-3'])
    })

    it('logs backfill start info', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockStartResponse)
      const { logger } = await import('@/lib/logger')
      await startBackfill({ dataSource: 'reports' })
      expect(logger.debug).toHaveBeenCalledWith(
        '[FBS Analytics] Starting backfill:',
        expect.objectContaining({ dataSource: 'reports' })
      )
    })
  })

  // ===========================================================================
  // getBackfillStatus Tests
  // ===========================================================================

  describe('getBackfillStatus', () => {
    it('calls GET /v1/admin/backfill/status', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      await getBackfillStatus()
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/v1/admin/backfill/status'),
        expect.anything()
      )
    })

    it('includes cabinetId query param when provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      await getBackfillStatus('cab-1')
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).toContain('?cabinetId=cab-1')
    })

    it('omits cabinetId param for all cabinets', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      await getBackfillStatus()
      const url = vi.mocked(apiClient.get).mock.calls[0][0] as string
      expect(url).not.toContain('cabinetId')
    })

    it('uses skipDataUnwrap option', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      await getBackfillStatus()
      const options = vi.mocked(apiClient.get).mock.calls[0][1]
      expect(options).toEqual({ skipDataUnwrap: true })
    })

    it('returns array of BackfillCabinetStatus', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const result = await getBackfillStatus()
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
    })

    it('returns cabinet progress percentage', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const result = await getBackfillStatus()
      expect(result[0].overallProgress).toBe(45)
    })

    it('returns estimatedEta as string or null', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const result = await getBackfillStatus()
      expect(result[0].estimatedEta).toBe('2026-06-07T12:00:00Z')
    })

    it('returns errors array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const result = await getBackfillStatus()
      expect(result[0].errors).toEqual([])
    })

    it('handles empty status array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue([])
      const result = await getBackfillStatus()
      expect(result).toEqual([])
    })

    it('logs status fetch info', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const { logger } = await import('@/lib/logger')
      await getBackfillStatus()
      expect(logger.debug).toHaveBeenCalledWith(
        '[FBS Analytics] Fetching backfill status:',
        expect.objectContaining({ cabinetId: 'all' })
      )
    })
  })

  // ===========================================================================
  // pauseBackfill Tests
  // ===========================================================================

  describe('pauseBackfill', () => {
    it('calls POST /v1/admin/backfill/pause', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      await pauseBackfill('cab-1')
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/pause',
        expect.objectContaining({ cabinetId: 'cab-1' })
      )
    })

    it('sends cabinetId in request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      await pauseBackfill('cab-42')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/pause', {
        cabinetId: 'cab-42',
      })
    })

    it('returns success boolean', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const result = await pauseBackfill('cab-1')
      expect(result.success).toBe(true)
    })

    it('returns message string', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const result = await pauseBackfill('cab-1')
      expect(result.message).toBe('Action completed')
    })

    it('logs pause action', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const { logger } = await import('@/lib/logger')
      await pauseBackfill('cab-1')
      expect(logger.debug).toHaveBeenCalledWith('[FBS Analytics] Pausing backfill:', {
        cabinetId: 'cab-1',
      })
    })
  })

  // ===========================================================================
  // resumeBackfill Tests
  // ===========================================================================

  describe('resumeBackfill', () => {
    it('calls POST /v1/admin/backfill/resume', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      await resumeBackfill('cab-1')
      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/admin/backfill/resume',
        expect.objectContaining({ cabinetId: 'cab-1' })
      )
    })

    it('sends cabinetId in request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      await resumeBackfill('cab-99')
      expect(apiClient.post).toHaveBeenCalledWith('/v1/admin/backfill/resume', {
        cabinetId: 'cab-99',
      })
    })

    it('returns success boolean', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const result = await resumeBackfill('cab-1')
      expect(result.success).toBe(true)
    })

    it('returns message string', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const result = await resumeBackfill('cab-1')
      expect(result.message).toBe('Action completed')
    })

    it('logs resume action', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(mockActionResponse)
      const { logger } = await import('@/lib/logger')
      await resumeBackfill('cab-1')
      expect(logger.debug).toHaveBeenCalledWith('[FBS Analytics] Resuming backfill:', {
        cabinetId: 'cab-1',
      })
    })
  })

  // ===========================================================================
  // Query Keys Factory Tests
  // ===========================================================================

  describe('backfillQueryKeys', () => {
    it('has all base key as ["backfill"]', () => {
      expect(backfillQueryKeys.all).toEqual(['backfill'])
    })

    it('status key includes cabinetId for specific cabinet', () => {
      const key = backfillQueryKeys.status('cab-1')
      expect(key).toEqual(['backfill', 'status', 'cab-1'])
    })

    it('status key uses "all" when cabinetId not provided', () => {
      const key = backfillQueryKeys.status()
      expect(key).toEqual(['backfill', 'status', 'all'])
    })
  })

  // ===========================================================================
  // Role-Based Access Tests
  // ===========================================================================

  describe('Role-Based Access', () => {
    it('Owner role can access all admin endpoints', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockBackfillStatusRaw)
      const result = await getBackfillStatus('cab-1')
      expect(result).toBeDefined()
    })

    it('Manager role receives 403 FORBIDDEN', async () => {
      const error = new ApiError('Forbidden', 403, { error: { code: 'FORBIDDEN' } })
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus()).rejects.toThrow('Forbidden')
    })

    it('Analyst role receives 403 FORBIDDEN', async () => {
      const error = new ApiError('Forbidden', 403, { error: { code: 'FORBIDDEN' } })
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(startBackfill({ dataSource: 'reports' })).rejects.toThrow('Forbidden')
    })

    it('Service role receives 403 FORBIDDEN', async () => {
      const error = new ApiError('Forbidden', 403, { error: { code: 'FORBIDDEN' } })
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(pauseBackfill('cab-1')).rejects.toThrow('Forbidden')
    })

    it('returns appropriate error message for 403', async () => {
      const error = new ApiError('Insufficient permissions: Owner role required', 403)
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus()).rejects.toThrow('Insufficient permissions')
    })
  })

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('throws ApiError on 400 validation error', async () => {
      const error = new ApiError('Bad Request', 400, { error: { code: 'VALIDATION_ERROR' } })
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(startBackfill({ dataSource: 'reports' })).rejects.toThrow('Bad Request')
    })

    it('throws ApiError on 401 UNAUTHORIZED', async () => {
      const error = new ApiError('Unauthorized', 401)
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus()).rejects.toThrow('Unauthorized')
    })

    it('throws ApiError on 403 FORBIDDEN with role info', async () => {
      const error = new ApiError('Forbidden: Owner role required', 403)
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(resumeBackfill('cab-1')).rejects.toThrow('Forbidden')
    })

    it('throws ApiError on 404 cabinet not found', async () => {
      const error = new ApiError('Cabinet not found', 404)
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus('nonexistent')).rejects.toThrow('Cabinet not found')
    })

    it('throws ApiError on 409 backfill already running', async () => {
      const error = new ApiError('Conflict: Backfill already running', 409)
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)
      await expect(startBackfill({ dataSource: 'reports' })).rejects.toThrow('Conflict')
    })

    it('throws ApiError on 500 server error', async () => {
      const error = new ApiError('Internal Server Error', 500)
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus()).rejects.toThrow('Internal Server Error')
    })

    it('handles network timeout gracefully', async () => {
      const error = new Error('Network Error')
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)
      await expect(getBackfillStatus()).rejects.toThrow('Network Error')
    })
  })
})
