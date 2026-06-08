/**
 * MSW Handlers for Advertising Campaigns API
 * Epic 33 - Advertising Analytics
 *
 * Campaign and sync-status handlers + their mock data
 */

import { http, HttpResponse } from 'msw'
import type { Campaign, CampaignsResponse, SyncStatusResponse } from '@/types/advertising-analytics'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// ============================================================================
// Mock Campaign Data
// ============================================================================

/**
 * Mock campaigns data
 */
export const mockCampaigns: Campaign[] = [
  {
    campaign_id: 1001,
    name: 'Осенняя распродажа',
    type: 8,
    type_name: 'Авто',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-09-01T10:00:00Z',
    start_time: '2025-09-01T10:00:00Z',
    end_time: null,
    daily_budget: 5000,
    nm_ids: ['123456', '234567'],
    sku_count: 2,
    placements: null, // Legacy campaign (type 8) - no placement data
  },
  {
    campaign_id: 1002,
    name: 'Зимние товары',
    type: 9,
    type_name: 'Аукцион',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-11-15T10:00:00Z',
    start_time: '2025-11-15T10:00:00Z',
    end_time: null,
    daily_budget: 3000,
    nm_ids: ['345678'],
    sku_count: 1,
    placements: {
      search: true,
      recommendations: false,
    }, // Type 9 campaign - search only
  },
  {
    campaign_id: 1003,
    name: 'Старая кампания',
    type: 8,
    type_name: 'Авто',
    status: 11,
    status_name: 'На паузе',
    created_at: '2025-06-01T10:00:00Z',
    start_time: '2025-06-01T10:00:00Z',
    end_time: null,
    daily_budget: 2000,
    nm_ids: ['456789', '567890'],
    sku_count: 2,
    placements: null, // Legacy campaign (type 8) - no placement data
  },
  {
    campaign_id: 1004,
    name: 'Новогодняя витрина + карусель',
    type: 9,
    type_name: 'Аукцион',
    status: 9,
    status_name: 'Активна',
    created_at: '2025-12-01T10:00:00Z',
    start_time: '2025-12-01T10:00:00Z',
    end_time: null,
    daily_budget: 10000,
    nm_ids: ['789012', '890123', '901234'],
    sku_count: 3,
    placements: {
      search: false,
      recommendations: true,
      carousel: true,
    }, // Type 9 campaign - recommendations + carousel (showcase focus)
  },
]

/**
 * Mock campaigns response
 */
export const mockCampaignsResponse: CampaignsResponse = {
  meta: {
    total_count: 4,
    active_count: 3, // campaigns 1001, 1002, 1004 are active (status 9)
  },
  data: mockCampaigns,
}

/**
 * Mock sync status response
 * Updated to match actual backend response format (Request #72)
 */
export const mockSyncStatusResponse: SyncStatusResponse = {
  lastSyncAt: '2025-12-21T06:00:00Z',
  nextScheduledSync: '2025-12-22T04:00:00Z',
  status: 'completed',
  lastTask: {
    taskUuid: 'adv-sync-test-123',
    status: 'completed',
    startedAt: '2025-12-21T05:55:00Z',
    finishedAt: '2025-12-21T06:00:00Z',
    error: null,
  },
  campaignsSynced: 10,
  dataAvailableFrom: '2025-11-01',
  dataAvailableTo: '2025-12-21',
}

// ============================================================================
// MSW Campaign Handlers
// ============================================================================

export const advertisingCampaignHandlers = [
  // GET /v1/analytics/advertising/campaigns
  // Returns backend format (campaigns array) to test adapter
  http.get(`${API_BASE_URL}/v1/analytics/advertising/campaigns`, () => {
    // Backend format (matching real WB API response)
    const backendResponse = {
      campaigns: mockCampaigns.map(campaign => ({
        id: `campaign-${campaign.campaign_id}`,
        advertId: campaign.campaign_id,
        name: campaign.name || '',
        type: campaign.type,
        typeLabel: campaign.type_name?.toLowerCase() || 'unknown',
        status: campaign.status,
        statusLabel: campaign.status_name?.toLowerCase() || 'unknown',
        nmIds: campaign.nm_ids?.map(id => parseInt(id)) || [],
        productsCount: campaign.sku_count || campaign.nm_ids?.length || 0,
        budget: null,
        dailyBudget: campaign.daily_budget || 0,
        startDate: campaign.start_time?.split('T')[0] || '2025-01-01',
        endDate: campaign.end_time?.split('T')[0] || '2025-12-31',
        createdAt: campaign.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      total: mockCampaigns.length,
      limit: 50,
      offset: 0,
    }
    return HttpResponse.json(backendResponse)
  }),

  // GET /v1/analytics/advertising/sync-status
  http.get(`${API_BASE_URL}/v1/analytics/advertising/sync-status`, () => {
    return HttpResponse.json(mockSyncStatusResponse)
  }),
]
