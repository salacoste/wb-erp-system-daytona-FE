import { describe, expect, it } from 'vitest'
import { controlTier0RequestURL } from '../../e2e/fixtures/tier0-runtime'

describe('Tier-0 shared request URL control', () => {
  const allowed = ['https://api.sandbox.example.test']

  it('accepts only an exact allowlisted origin and expected method', () => {
    expect(
      controlTier0RequestURL('https://api.sandbox.example.test/orders?page=2', allowed, 'GET', [
        'GET',
      ]).pathname
    ).toBe('/orders')
    expect(() =>
      controlTier0RequestURL('https://evil.invalid/orders', allowed, 'GET', ['GET'])
    ).toThrow()
    expect(() =>
      controlTier0RequestURL('https://api.sandbox.example.test/orders', allowed, 'POST', ['GET'])
    ).toThrow()
  })

  it('rejects userinfo, fragments, and sensitive query keys before API use', () => {
    for (const destination of [
      'https://user:pass@api.sandbox.example.test/orders',
      'https://api.sandbox.example.test/orders#fragment',
      'https://api.sandbox.example.test/orders?api_key=unsafe',
    ]) {
      expect(() => controlTier0RequestURL(destination, allowed, 'GET', ['GET'])).toThrow()
    }
  })
})
