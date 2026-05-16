/**
 * SneakPreviewSection placeholder tests
 * Story 108.3-FE: Minimal scaffold; Story 108.5 will expand with forecast table, trend arrows.
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SneakPreviewSection } from '../SneakPreviewSection'
import type { AiStatusResponse } from '@/types/ai/status'

const mockStatus: AiStatusResponse = {
  readinessLevel: 'sneak_preview',
  weeksCollected: 8,
  weeksRequired: 12,
  progressPct: 67,
  missingRequirements: [],
  estimatedActivationDate: '2026-07-01',
  cogsCoveragePct: 80,
  skuCount: 25,
  orderCount: 800,
}

describe('SneakPreviewSection', () => {
  it('renders sneak-preview disclaimer heading', () => {
    render(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText('AI Sneak Preview — низкая уверенность')).toBeInTheDocument()
  })

  it('renders collected weeks and required weeks from status', () => {
    render(<SneakPreviewSection status={mockStatus} />)
    expect(screen.getByText(/Собрано 8 недель/)).toBeInTheDocument()
    expect(screen.getByText(/12 недель/)).toBeInTheDocument()
  })
})
