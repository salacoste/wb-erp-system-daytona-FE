import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from './proxy'

const VALID_TOKEN = [
  'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0',
  'eyJleHAiOjQxMDI0NDQ4MDB9',
  'proxy-redirect-safety',
].join('.')

function authenticatedRequest(path: string) {
  return new NextRequest(`https://app.example.test${path}`, {
    headers: { cookie: `auth-token=${VALID_TOKEN}` },
  })
}

describe('authenticated auth-page redirect safety', () => {
  it('falls back to dashboard for a protocol-relative redirect', async () => {
    const response = await proxy(authenticatedRequest('/login?redirect=%2F%2Fevil.example%2Fphish'))

    expect(response.headers.get('location')).toBe('https://app.example.test/dashboard')
  })

  it('preserves a same-origin absolute-path redirect', async () => {
    const response = await proxy(
      authenticatedRequest('/login?redirect=%2Forders%3Fweek%3D2026-W32%23row-1')
    )

    expect(response.headers.get('location')).toBe(
      'https://app.example.test/orders?week=2026-W32#row-1'
    )
  })
})
