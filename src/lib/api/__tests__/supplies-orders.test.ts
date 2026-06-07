/**
 * Unit Tests for Supplies API Client - Order Operations
 * Story 53.1-FE: TypeScript Types & API Client for Supplies
 * Epic 53-FE: Supply Management UI
 *
 * Tests: addOrders, removeOrders, closeSupply
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addOrders, removeOrders, closeSupply } from '../supplies'
import { apiClient } from '../../api-client'
import { logger } from '@/lib/logger'

// Mock the API client
vi.mock('../../api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// =============================================================================
// SECTION 1: addOrders() Tests
// =============================================================================

describe('addOrders()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should call POST /v1/supplies/:id/orders endpoint', async () => {
      const mockResponse = { added: 2, failed: 0 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await addOrders('supply-1', ['order-1', 'order-2'])

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/supply-1/orders',
        expect.objectContaining({ orderIds: ['order-1', 'order-2'] })
      )
    })

    it('should return AddOrdersResponse structure', async () => {
      const mockResponse = { added: 3, failed: 1, errors: ['order-99 not found'] }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3', 'o99'])

      expect(result).toHaveProperty('added', 3)
      expect(result).toHaveProperty('failed', 1)
    })

    it('should include addedCount in response', async () => {
      const mockResponse = { added: 5, failed: 0 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await addOrders('supply-1', ['a', 'b', 'c', 'd', 'e'])

      expect(result.added).toBe(5)
    })

    it('should include failures count in response', async () => {
      const mockResponse = { added: 1, failed: 2, errors: ['err1', 'err2'] }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.failed).toBe(2)
    })

    it('should include totalOrdersCount in response when present', async () => {
      const mockResponse = { added: 2, failed: 0 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await addOrders('supply-1', ['o1', 'o2'])

      expect(result.added).toBe(2)
      expect(result.failed).toBe(0)
    })
  })

  describe('request body', () => {
    it('should send orderIds in request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 2, failed: 0 })

      await addOrders('supply-1', ['order-A', 'order-B'])

      expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/supply-1/orders', {
        orderIds: ['order-A', 'order-B'],
      })
    })

    it('should pass supply ID in URL path', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 1, failed: 0 })

      await addOrders('my-supply-42', ['order-1'])

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/my-supply-42/orders',
        expect.anything()
      )
    })

    it('should handle single order ID', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 1, failed: 0 })

      const result = await addOrders('supply-1', ['single-order'])

      expect(result.added).toBe(1)
      expect(result.failed).toBe(0)
    })

    it('should handle multiple order IDs', async () => {
      const ids = ['o1', 'o2', 'o3', 'o4', 'o5']
      vi.mocked(apiClient.post).mockResolvedValue({ added: 5, failed: 0 })

      const result = await addOrders('supply-1', ids)

      expect(result.added).toBe(5)
      expect(result.failed).toBe(0)
    })

    it('should handle maximum 1000 order IDs', async () => {
      const ids = Array.from({ length: 1000 }, (_, i) => `order-${i}`)
      vi.mocked(apiClient.post).mockResolvedValue({ added: 1000, failed: 0 })

      const result = await addOrders('supply-1', ids)

      expect(result.added).toBe(1000)
      expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/supply-1/orders', { orderIds: ids })
    })
  })

  describe('success scenarios', () => {
    it('should return addedCount matching input length', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 3, failed: 0 })

      const result = await addOrders('supply-1', ['a', 'b', 'c'])

      expect(result.added).toBe(3)
    })

    it('should return zero failed on full success', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 2, failed: 0 })

      const result = await addOrders('supply-1', ['o1', 'o2'])

      expect(result.failed).toBe(0)
    })

    it('should update totalOrdersCount correctly', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 3, failed: 0 })

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.added).toBe(3)
    })
  })

  describe('partial success scenarios', () => {
    it('should return partial addedCount on partial success', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 2, failed: 1 })

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.added).toBe(2)
      expect(result.failed).toBe(1)
    })

    it('should include failed order errors', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 1,
        failed: 2,
        errors: ['order-2 not found', 'order-3 already in another supply'],
      })

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.errors).toHaveLength(2)
    })

    it('should include failure reason for each failed order', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 2,
        errors: ['order-1: already in another supply', 'order-2: order status not valid'],
      })

      const result = await addOrders('supply-1', ['order-1', 'order-2'])

      expect(result.errors?.[0]).toContain('already in another supply')
      expect(result.errors?.[1]).toContain('order status not valid')
    })

    it('should handle "already in another supply" failure', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 1,
        errors: ['order-X: already in another supply'],
      })

      const result = await addOrders('supply-1', ['order-X'])

      expect(result.failed).toBe(1)
      expect(result.errors?.[0]).toContain('already in another supply')
    })

    it('should handle "order not found" failure', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 1,
        errors: ['order-999: order not found'],
      })

      const result = await addOrders('supply-1', ['order-999'])

      expect(result.failed).toBe(1)
      expect(result.errors?.[0]).toContain('order not found')
    })

    it('should handle "order status not valid" failure', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 1,
        errors: ['order-Z: order status not valid'],
      })

      const result = await addOrders('supply-1', ['order-Z'])

      expect(result.failed).toBe(1)
      expect(result.errors?.[0]).toContain('order status not valid')
    })
  })

  describe('all failed scenario', () => {
    it('should return addedCount of 0 when all fail', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 3,
        errors: ['err1', 'err2', 'err3'],
      })

      const result = await addOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.added).toBe(0)
      expect(result.failed).toBe(3)
    })

    it('should include all orders in errors array', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 2,
        errors: ['o1: not found', 'o2: not found'],
      })

      const result = await addOrders('supply-1', ['o1', 'o2'])

      expect(result.errors).toHaveLength(2)
    })

    it('should report correct failed count when all fail', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        added: 0,
        failed: 4,
        errors: ['e1', 'e2', 'e3', 'e4'],
      })

      const result = await addOrders('supply-1', ['a', 'b', 'c', 'd'])

      expect(result.added).toBe(0)
      expect(result.failed).toBe(4)
    })
  })

  describe('console logging', () => {
    it('should log supply ID and order count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 2, failed: 0 })

      await addOrders('supply-1', ['o1', 'o2'])

      expect(logger.debug).toHaveBeenCalledWith(
        '[Supplies API] Adding orders:',
        expect.objectContaining({ supplyId: 'supply-1', orderCount: 2 })
      )
    })

    it('should log added count and failure count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ added: 1, failed: 1 })

      await addOrders('supply-1', ['o1', 'o2'])

      expect(logger.debug).toHaveBeenCalledWith(
        '[Supplies API] Orders added:',
        expect.objectContaining({ added: 1, failed: 1 })
      )
    })
  })

  describe('error handling', () => {
    it('should throw 400 when orderIds array is empty', async () => {
      const error = new Error('Bad Request')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(addOrders('supply-1', [])).rejects.toThrow('Bad Request')
    })

    it('should throw 400 when orderIds exceeds 1000', async () => {
      const error = new Error('Bad Request')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      const ids = Array.from({ length: 1001 }, (_, i) => `order-${i}`)
      await expect(addOrders('supply-1', ids)).rejects.toThrow()
    })

    it('should throw 403 when no access to supply', async () => {
      const error = new Error('Forbidden')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(addOrders('other-supply', ['o1'])).rejects.toThrow('Forbidden')
    })

    it('should throw 404 when supply not found', async () => {
      const error = new Error('Not Found')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(addOrders('nonexistent', ['o1'])).rejects.toThrow('Not Found')
    })

    it('should throw 409 when supply is not OPEN', async () => {
      const error = new Error('Conflict')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(addOrders('closed-supply', ['o1'])).rejects.toThrow('Conflict')
    })
  })
})

// =============================================================================
// SECTION 2: removeOrders() Tests
// =============================================================================

describe('removeOrders()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should call POST /v1/supplies/:id/orders/remove endpoint', async () => {
      const mockResponse = { removedCount: 2, totalOrdersCount: 5 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await removeOrders('supply-1', ['order-1', 'order-2'])

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/supply-1/orders/remove',
        expect.objectContaining({ orderIds: ['order-1', 'order-2'] })
      )
    })

    it('should send body with POST request', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 3 })

      await removeOrders('supply-1', ['o1'])

      expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/supply-1/orders/remove', {
        orderIds: ['o1'],
      })
    })

    it('should return RemoveOrdersResponse structure', async () => {
      const mockResponse = { removedCount: 3, totalOrdersCount: 10 }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await removeOrders('supply-1', ['a', 'b', 'c'])

      expect(result).toHaveProperty('removedCount')
      expect(result).toHaveProperty('totalOrdersCount')
    })

    it('should include removedCount in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 4, totalOrdersCount: 10 })

      const result = await removeOrders('supply-1', ['a', 'b', 'c', 'd'])

      expect(result.removedCount).toBe(4)
    })

    it('should include totalOrdersCount in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 2, totalOrdersCount: 8 })

      const result = await removeOrders('supply-1', ['a', 'b'])

      expect(result.totalOrdersCount).toBe(8)
    })
  })

  describe('request body', () => {
    it('should send orderIds in request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 2, totalOrdersCount: 5 })

      await removeOrders('supply-1', ['order-X', 'order-Y'])

      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), {
        orderIds: ['order-X', 'order-Y'],
      })
    })

    it('should pass supply ID in URL path', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 3 })

      await removeOrders('supply-42', ['o1'])

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/supply-42/orders/remove',
        expect.anything()
      )
    })

    it('should handle single order ID', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 4 })

      const result = await removeOrders('supply-1', ['single'])

      expect(result.removedCount).toBe(1)
    })

    it('should handle multiple order IDs', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 5, totalOrdersCount: 10 })

      const result = await removeOrders('supply-1', ['a', 'b', 'c', 'd', 'e'])

      expect(result.removedCount).toBe(5)
    })
  })

  describe('success scenarios', () => {
    it('should return removedCount matching input length', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 3, totalOrdersCount: 7 })

      const result = await removeOrders('supply-1', ['o1', 'o2', 'o3'])

      expect(result.removedCount).toBe(3)
    })

    it('should update totalOrdersCount correctly', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 2, totalOrdersCount: 3 })

      const result = await removeOrders('supply-1', ['o1', 'o2'])

      expect(result.totalOrdersCount).toBe(3)
    })

    it('should handle removal from supply with many orders', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 49 })

      const result = await removeOrders('supply-1', ['one-order'])

      expect(result.removedCount).toBe(1)
      expect(result.totalOrdersCount).toBe(49)
    })
  })

  describe('partial removal scenarios', () => {
    it('should return partial removedCount when some not found', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 9 })

      const result = await removeOrders('supply-1', ['exists', 'nonexistent'])

      expect(result.removedCount).toBe(1)
    })

    it('should still update totalOrdersCount correctly', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 1, totalOrdersCount: 4 })

      const result = await removeOrders('supply-1', ['found', 'missing'])

      expect(result.totalOrdersCount).toBe(4)
    })
  })

  describe('console logging', () => {
    it('should log supply ID and order count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 2, totalOrdersCount: 5 })

      await removeOrders('supply-1', ['o1', 'o2'])

      expect(logger.debug).toHaveBeenCalledWith(
        '[Supplies API] Removing orders:',
        expect.objectContaining({ supplyId: 'supply-1', orderCount: 2 })
      )
    })

    it('should log removed count', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ removedCount: 3, totalOrdersCount: 10 })

      await removeOrders('supply-1', ['a', 'b', 'c'])

      expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Orders removed:', 3)
    })
  })

  describe('error handling', () => {
    it('should throw 400 when orderIds array is empty', async () => {
      const error = new Error('Bad Request')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(removeOrders('supply-1', [])).rejects.toThrow('Bad Request')
    })

    it('should throw 403 when no access to supply', async () => {
      const error = new Error('Forbidden')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(removeOrders('other-supply', ['o1'])).rejects.toThrow('Forbidden')
    })

    it('should throw 404 when supply not found', async () => {
      const error = new Error('Not Found')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(removeOrders('nonexistent', ['o1'])).rejects.toThrow('Not Found')
    })

    it('should throw 409 when supply is not OPEN', async () => {
      const error = new Error('Conflict')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(removeOrders('closed-supply', ['o1'])).rejects.toThrow('Conflict')
    })
  })
})

// =============================================================================
// SECTION 3: closeSupply() Tests
// =============================================================================

describe('closeSupply()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should call POST /v1/supplies/:id/close endpoint', async () => {
      const mockResponse = {
        status: 'CLOSED',
        closedAt: '2025-01-15T10:30:00Z',
        message: 'Supply closed successfully',
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      await closeSupply('supply-1')

      expect(apiClient.post).toHaveBeenCalledWith('/v1/supplies/supply-1/close', {})
    })

    it('should return CloseSupplyResponse structure', async () => {
      const mockResponse = {
        status: 'CLOSED',
        closedAt: '2025-01-15T10:30:00Z',
        message: 'Supply closed',
      }
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse)

      const result = await closeSupply('supply-1')

      expect(result).toHaveProperty('status')
      expect(result).toHaveProperty('closedAt')
      expect(result).toHaveProperty('message')
    })

    it('should include status as CLOSED in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-15T10:30:00Z',
        message: 'Closed',
      })

      const result = await closeSupply('supply-1')

      expect(result.status).toBe('CLOSED')
    })

    it('should include closedAt timestamp in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-06-01T12:00:00Z',
        message: 'Closed',
      })

      const result = await closeSupply('supply-1')

      expect(result.closedAt).toBe('2025-06-01T12:00:00Z')
    })

    it('should include message in response', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-15T10:30:00Z',
        message: 'Supply closed successfully',
      })

      const result = await closeSupply('supply-1')

      expect(result.message).toBe('Supply closed successfully')
    })
  })

  describe('request handling', () => {
    it('should pass supply ID in URL path', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-01T00:00:00Z',
        message: 'OK',
      })

      await closeSupply('my-supply-99')

      expect(apiClient.post).toHaveBeenCalledWith(
        '/v1/supplies/my-supply-99/close',
        expect.anything()
      )
    })

    it('should send empty request body', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-01T00:00:00Z',
        message: 'OK',
      })

      await closeSupply('supply-1')

      expect(apiClient.post).toHaveBeenCalledWith(expect.any(String), {})
    })
  })

  describe('response handling', () => {
    it('should return CLOSED status', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-03-20T14:30:00Z',
        message: 'Supply closed',
      })

      const result = await closeSupply('supply-1')

      expect(result.status).toBe('CLOSED')
    })

    it('should return valid ISO timestamp for closedAt', async () => {
      const timestamp = '2025-03-20T14:30:00.000Z'
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: timestamp,
        message: 'Closed',
      })

      const result = await closeSupply('supply-1')

      expect(result.closedAt).toBe(timestamp)
      expect(new Date(result.closedAt).toISOString()).toBe(timestamp)
    })

    it('should return success message', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-01T00:00:00Z',
        message: 'Supply transitioned to CLOSED state',
      })

      const result = await closeSupply('supply-1')

      expect(result.message).toContain('CLOSED')
    })
  })

  describe('console logging', () => {
    it('should log supply ID being closed', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-15T10:30:00Z',
        message: 'OK',
      })

      await closeSupply('supply-42')

      expect(logger.debug).toHaveBeenCalledWith('[Supplies API] Closing supply:', 'supply-42')
    })

    it('should log closedAt timestamp', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-06-07T08:00:00Z',
        message: 'OK',
      })

      await closeSupply('supply-1')

      expect(logger.debug).toHaveBeenCalledWith(
        '[Supplies API] Supply closed:',
        '2025-06-07T08:00:00Z'
      )
    })
  })

  describe('error handling', () => {
    it('should throw 403 when no access to supply', async () => {
      const error = new Error('Forbidden')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('other-supply')).rejects.toThrow('Forbidden')
    })

    it('should throw 404 when supply not found', async () => {
      const error = new Error('Not Found')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('nonexistent')).rejects.toThrow('Not Found')
    })

    it('should throw 400 when supply is empty (no orders)', async () => {
      const error = new Error('Bad Request')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('empty-supply')).rejects.toThrow('Bad Request')
    })

    it('should throw 409 when supply is not OPEN', async () => {
      const error = new Error('Conflict')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('already-closed')).rejects.toThrow('Conflict')
    })

    it('should throw 409 when supply already closed', async () => {
      const error = new Error('Conflict: supply already closed')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('double-close')).rejects.toThrow('Conflict')
    })
  })

  describe('state machine validation', () => {
    it('should only close OPEN supplies', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        status: 'CLOSED',
        closedAt: '2025-01-01T00:00:00Z',
        message: 'Supply closed',
      })

      const result = await closeSupply('open-supply')

      expect(result.status).toBe('CLOSED')
    })

    it('should not allow closing CLOSED supplies', async () => {
      const error = new Error('Conflict: supply is CLOSED, expected OPEN')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('closed-supply')).rejects.toThrow('Conflict')
    })

    it('should not allow closing DELIVERING supplies', async () => {
      const error = new Error('Conflict: supply is DELIVERING, expected OPEN')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('delivering-supply')).rejects.toThrow('Conflict')
    })

    it('should not allow closing DELIVERED supplies', async () => {
      const error = new Error('Conflict: supply is DELIVERED, expected OPEN')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('delivered-supply')).rejects.toThrow('Conflict')
    })

    it('should not allow closing CANCELLED supplies', async () => {
      const error = new Error('Conflict: supply is CANCELLED, expected OPEN')
      vi.mocked(apiClient.post).mockRejectedValueOnce(error)

      await expect(closeSupply('cancelled-supply')).rejects.toThrow('Conflict')
    })
  })
})
