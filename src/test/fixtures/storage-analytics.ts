/**
 * Test fixtures for Storage Analytics
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import type {
  StorageBySkuItem,
  StorageBySkuResponse,
  TopConsumerItem,
  TopConsumersResponse,
  StorageTrendPoint,
  StorageTrendsResponse,
  PaidStorageImportResponse,
  ImportStatusResponse,
} from '@/types/storage-analytics'

// ============================================================================
// Storage By SKU Fixtures
// ============================================================================

export const mockStorageBySkuItem: StorageBySkuItem = {
  nm_id: '147205694',
  vendor_code: 'SKU-001',
  product_name: 'Жидкая кожа черная для ремонта изделий из кожи и кожзама 50мл',
  brand: 'RepairPro',
  storage_cost_total: 1250.5,
  storage_cost_avg_daily: 178.64,
  volume_avg: 0.5,
  warehouses: ['Коледино', 'Подольск'],
  days_stored: 7,
}

export const mockStorageBySkuItems: StorageBySkuItem[] = [
  mockStorageBySkuItem,
  {
    nm_id: '321678606',
    vendor_code: 'SKU-002',
    product_name: 'Клей для ремонта обуви профессиональный 100мл',
    brand: 'ShoeFix',
    storage_cost_total: 890.25,
    storage_cost_avg_daily: 127.18,
    volume_avg: 0.3,
    warehouses: ['Коледино', 'Казань', 'Электросталь'],
    days_stored: 7,
  },
  {
    nm_id: '456789012',
    vendor_code: 'SKU-003',
    product_name: 'Набор для ухода за кожей премиум',
    brand: 'LeatherCare',
    storage_cost_total: 2100.0,
    storage_cost_avg_daily: 300.0,
    volume_avg: 1.2,
    warehouses: ['Подольск'],
    days_stored: 7,
  },
]

export const mockStorageBySkuResponse: StorageBySkuResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  data: mockStorageBySkuItems,
  summary: {
    total_storage_cost: 4240.75,
    products_count: 3,
    avg_cost_per_product: 1413.58,
  },
  pagination: {
    total: 3,
    cursor: null,
    has_more: false,
  },
  has_data: true,
}

export const mockEmptyStorageBySkuResponse: StorageBySkuResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  data: [],
  summary: {
    total_storage_cost: 0,
    products_count: 0,
    avg_cost_per_product: 0,
  },
  pagination: {
    total: 0,
    cursor: null,
    has_more: false,
  },
  has_data: false,
}

// ============================================================================
// Top Consumers Fixtures
// ============================================================================

export const mockTopConsumerItems: TopConsumerItem[] = [
  {
    rank: 1,
    nm_id: '456789012',
    vendor_code: 'SKU-003',
    product_name: 'Набор для ухода за кожей премиум',
    brand: 'LeatherCare',
    storage_cost: 2100.0,
    percent_of_total: 49.5,
    volume: 1.2,
    revenue_net: 8000.0,
    storage_to_revenue_ratio: 26.25, // > 20% = high
  },
  {
    rank: 2,
    nm_id: '147205694',
    vendor_code: 'SKU-001',
    product_name: 'Жидкая кожа черная для ремонта изделий из кожи и кожзама 50мл',
    brand: 'RepairPro',
    storage_cost: 1250.5,
    percent_of_total: 29.5,
    volume: 0.5,
    revenue_net: 10000.0,
    storage_to_revenue_ratio: 12.5, // 10-20% = medium
  },
  {
    rank: 3,
    nm_id: '321678606',
    vendor_code: 'SKU-002',
    product_name: 'Клей для ремонта обуви профессиональный 100мл',
    brand: 'ShoeFix',
    storage_cost: 890.25,
    percent_of_total: 21.0,
    volume: 0.3,
    revenue_net: 15000.0,
    storage_to_revenue_ratio: 5.94, // < 10% = low
  },
  {
    rank: 4,
    nm_id: '111222333',
    vendor_code: 'SKU-004',
    product_name: 'Краска для кожи коричневая',
    brand: 'ColorFix',
    storage_cost: 450.0,
    percent_of_total: 10.6,
    volume: 0.4,
    storage_to_revenue_ratio: null, // unknown
  },
  {
    rank: 5,
    nm_id: '444555666',
    vendor_code: 'SKU-005',
    product_name: 'Защитный спрей для обуви',
    brand: 'ShoeGuard',
    storage_cost: 200.0,
    percent_of_total: 4.7,
    volume: 0.2,
    storage_to_revenue_ratio: 8.5, // < 10% = low
  },
]

export const mockTopConsumersResponse: TopConsumersResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  top_consumers: mockTopConsumerItems,
  total_storage_cost: 4240.75,
  has_data: true,
}

export const mockEmptyTopConsumersResponse: TopConsumersResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  top_consumers: [],
  total_storage_cost: 0,
  has_data: false,
}

// ============================================================================
// Storage Trends Fixtures
// ============================================================================

export const mockTrendPoints: StorageTrendPoint[] = [
  { week: '2025-W44', storage_cost: 28000 },
  { week: '2025-W45', storage_cost: 30500 },
  { week: '2025-W46', storage_cost: null }, // Gap in data
  { week: '2025-W47', storage_cost: 32000 },
]

export const mockStorageTrendsResponse: StorageTrendsResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  nm_id: null,
  data: mockTrendPoints,
  summary: {
    storage_cost: {
      min: 28000,
      max: 32000,
      avg: 30166.67,
      trend: 14.3,
    },
  },
  has_data: true,
}

export const mockEmptyTrendsResponse: StorageTrendsResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  nm_id: null,
  data: [],
  has_data: false,
}

// ============================================================================
// Import Fixtures
// ============================================================================

export const mockPaidStorageImportResponse: PaidStorageImportResponse = {
  import_id: 'import-uuid-12345',
  status: 'pending',
  date_range: {
    from: '2025-11-18',
    to: '2025-11-24',
  },
  estimated_time_sec: 60,
  message: 'Import queued successfully',
}

export const mockImportStatusPending: ImportStatusResponse = {
  import_id: 'import-uuid-12345',
  status: 'pending',
}

export const mockImportStatusProcessing: ImportStatusResponse = {
  import_id: 'import-uuid-12345',
  status: 'processing',
}

export const mockImportStatusCompleted: ImportStatusResponse = {
  import_id: 'import-uuid-12345',
  status: 'completed',
  rows_imported: 3500,
  completed_at: '2025-11-24T10:30:00Z',
}

export const mockImportStatusFailed: ImportStatusResponse = {
  import_id: 'import-uuid-12345',
  status: 'failed',
  error_message: 'WB API timeout after 5 retries',
  completed_at: '2025-11-24T10:30:00Z',
}
