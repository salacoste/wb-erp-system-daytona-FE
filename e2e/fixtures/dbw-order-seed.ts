/**
 * DBW Order Test Seeding — Story 86.2
 *
 * Seeds a fake DBW order with client info (PII) via the backend's
 * `POST /v1/test/seed/dbw-order` endpoint (dev-only, 404 in production).
 *
 * Uses native fetch (Node 18+) so it works in Playwright's
 * `test.beforeAll` without requiring Playwright fixtures.
 *
 * @see docs/request-backend/163-DBW-ORDER-TEST-SEEDING-ENDPOINT.md
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json')
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000'

export interface DbwSeedData {
  orderId: string
  clientName: string
  clientPhone: string
}

/** Fixed test PII — intentionally short + masked to avoid real data exposure. */
export const SEED_CLIENT = {
  clientName: 'Иван И.',
  clientPhone: '+7999***1234',
  nmId: 906010371,
} as const

/**
 * Extract token and cabinetId from the auth storage state written by auth.setup.ts.
 */
export function getAuthFromStorageState(): { token: string; cabinetId: string } | null {
  if (!fs.existsSync(AUTH_FILE)) return null
  try {
    const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
    const baseUrl = process.env.E2E_BASE_URL ?? 'http://localhost:3100'
    const origin = state.origins?.find((o: { origin: string }) => o.origin === baseUrl)
    const authEntry = origin?.localStorage?.find((e: { name: string }) => e.name === 'auth-storage')
    if (!authEntry) return null
    const parsed = JSON.parse(authEntry.value)
    return {
      token: parsed.state?.token ?? '',
      cabinetId: parsed.state?.cabinetId ?? '',
    }
  } catch {
    return null
  }
}

/**
 * Seed a DBW order via the backend dev-only endpoint.
 * Returns null when the endpoint is unavailable (production) or auth is missing.
 */
export async function seedDbwOrder(): Promise<DbwSeedData | null> {
  const auth = getAuthFromStorageState()
  if (!auth || !auth.token || !auth.cabinetId) return null

  try {
    const response = await fetch(`${API_URL}/v1/test/seed/dbw-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
        'X-Cabinet-Id': auth.cabinetId,
      },
      body: JSON.stringify({
        clientName: SEED_CLIENT.clientName,
        clientPhone: SEED_CLIENT.clientPhone,
        nmId: SEED_CLIENT.nmId,
      }),
    })

    if (!response.ok) return null

    const body = (await response.json()) as {
      orderId?: number | string
      data?: { orderId?: number | string }
    }
    // Handle both wrapped { data: { orderId } } and unwrapped { orderId } responses
    const inner = body.data ?? body
    return {
      orderId: String(inner.orderId),
      clientName: SEED_CLIENT.clientName,
      clientPhone: SEED_CLIENT.clientPhone,
    }
  } catch {
    return null
  }
}

/**
 * Delete the seeded DBW order. Silently ignores errors (best-effort cleanup).
 */
export async function cleanupDbwOrder(orderId: string): Promise<void> {
  const auth = getAuthFromStorageState()
  if (!auth || !auth.token || !auth.cabinetId) return

  try {
    await fetch(`${API_URL}/v1/test/seed/dbw-order/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${auth.token}`,
        'X-Cabinet-Id': auth.cabinetId,
      },
    })
  } catch {
    // Best-effort cleanup — don't fail the test suite
  }
}
