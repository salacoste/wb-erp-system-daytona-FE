/**
 * Debug logging helpers for API client COGS responses
 * Extracted from api-client.ts for file size compliance (Epic 74).
 * All output gated behind NODE_ENV === 'development' (tree-shaken in production).
 */

const isDev = process.env.NODE_ENV === 'development'

function isCogsEndpoint(endpoint: string): boolean {
  return endpoint.includes('/products/') && endpoint.includes('/cogs')
}

/** Log raw COGS assignment API response for debugging */
export function logCogsRawResponse(endpoint: string, rawData: unknown): void {
  if (!isCogsEndpoint(endpoint) || !isDev) return
  console.group('🔍 [API Client DEBUG] COGS Assignment Response')
  console.log('Endpoint:', endpoint)
  console.log('Raw response:', JSON.stringify(rawData, null, 2))
  console.log('Response structure:', {
    hasDataField: typeof rawData === 'object' && rawData !== null && 'data' in rawData,
    dataFieldType: typeof (rawData as Record<string, unknown>).data,
    directFields: Object.keys((rawData as Record<string, unknown>) ?? {}),
  })
  console.groupEnd()
}

/** Log processed COGS assignment response for debugging */
export function logCogsProcessedResponse(endpoint: string, data: unknown): void {
  if (!isCogsEndpoint(endpoint) || !isDev) return
  console.group('🔍 [API Client DEBUG] Processed COGS Response')
  console.log('Processed data:', JSON.stringify(data, null, 2))
  if (typeof data === 'object' && data !== null) {
    const productData = data as Record<string, unknown>
    console.log('Key fields:', {
      nm_id: productData.nm_id,
      has_cogs: productData.has_cogs,
      current_margin_pct: productData.current_margin_pct,
      current_margin_pct_type: typeof productData.current_margin_pct,
      missing_data_reason: productData.missing_data_reason,
      cogs: productData.cogs,
    })
  }
  console.groupEnd()
}
