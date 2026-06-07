/**
 * Unit Tests for Analytics Summary Page (redirect)
 * D-15: /analytics/summary redirects to cabinet summary dashboard
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Read the source file to verify the redirect logic
const pageSource = fs.readFileSync(path.join(__dirname, '..', 'page.tsx'), 'utf-8')

describe('AnalyticsSummaryPage (redirect)', () => {
  it('imports redirect from next/navigation', () => {
    expect(pageSource).toContain("import { redirect } from 'next/navigation'")
  })

  it('redirects to ROUTES.ANALYTICS.DASHBOARD', () => {
    expect(pageSource).toContain('ROUTES.ANALYTICS.DASHBOARD')
  })

  it('calls redirect() in the default export', () => {
    expect(pageSource).toMatch(/redirect\(ROUTES\.ANALYTICS\.DASHBOARD\)/)
  })

  it('imports ROUTES from lib/routes', () => {
    expect(pageSource).toContain("import { ROUTES } from '@/lib/routes'")
  })

  it('has a default export function', () => {
    expect(pageSource).toMatch(/export default function/)
  })

  it('uses the correct redirect target path', () => {
    // ROUTES.ANALYTICS.DASHBOARD = '/analytics/dashboard'
    expect(pageSource).toContain('ROUTES.ANALYTICS.DASHBOARD')
  })
})
