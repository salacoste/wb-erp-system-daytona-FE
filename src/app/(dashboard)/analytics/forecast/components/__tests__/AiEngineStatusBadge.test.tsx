/**
 * AiEngineStatusBadgeView Tests — Story 108.2-FE.
 * Tests the pure presentational view directly (pure-functions-over-hook-mocking pattern).
 */
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AiEngineStatusBadgeView, resolveAiEngineState } from '../AiEngineStatusBadge'
import type { AiHealthResponse } from '@/types/ai/system'

const connectedHealth: AiHealthResponse = {
  status: 'ok',
  engineConnected: true,
  engine: 'mindsdb',
  latencyMs: 42,
  cachedPredictionsAvailable: false,
}

const offlineCachedHealth: AiHealthResponse = {
  status: 'degraded',
  engineConnected: false,
  engine: 'prophet',
  latencyMs: 0,
  cachedPredictionsAvailable: true,
}

const offlineNoCacheHealth: AiHealthResponse = {
  status: 'degraded',
  engineConnected: false,
  engine: 'prophet',
  latencyMs: 0,
  cachedPredictionsAvailable: false,
}

describe('resolveAiEngineState', () => {
  it('returns loading when isLoading=true', () => {
    expect(resolveAiEngineState(true, false, undefined)).toEqual({ kind: 'loading' })
  })

  it('returns error when isError=true', () => {
    expect(resolveAiEngineState(false, true, undefined)).toEqual({ kind: 'error' })
  })

  it('returns error when data is undefined and not loading', () => {
    expect(resolveAiEngineState(false, false, undefined)).toEqual({ kind: 'error' })
  })

  it('returns connected when engineConnected=true', () => {
    const state = resolveAiEngineState(false, false, connectedHealth)
    expect(state).toEqual({ kind: 'connected', health: connectedHealth })
  })

  it('returns offline-cache when engine disconnected but cache available', () => {
    expect(resolveAiEngineState(false, false, offlineCachedHealth)).toEqual({
      kind: 'offline-cache',
    })
  })

  it('returns offline when engine disconnected and no cache', () => {
    expect(resolveAiEngineState(false, false, offlineNoCacheHealth)).toEqual({ kind: 'offline' })
  })
})

describe('AiEngineStatusBadgeView', () => {
  it('renders skeleton on loading state', () => {
    const { container } = render(
      React.createElement(AiEngineStatusBadgeView, { state: { kind: 'loading' } })
    )
    // Skeleton renders an element, no text content
    expect(container.firstChild).toBeTruthy()
  })

  it('renders error message on error state', () => {
    render(React.createElement(AiEngineStatusBadgeView, { state: { kind: 'error' } }))
    expect(screen.getByText(/Не удалось получить статус движка/)).toBeTruthy()
  })

  it('renders "Движок: подключён" on connected state', () => {
    render(
      React.createElement(AiEngineStatusBadgeView, {
        state: { kind: 'connected', health: connectedHealth },
      })
    )
    expect(screen.getByText(/Движок: подключён/)).toBeTruthy()
  })

  it('renders "Движок: офлайн (кэш доступен)" on offline-cache state', () => {
    render(React.createElement(AiEngineStatusBadgeView, { state: { kind: 'offline-cache' } }))
    expect(screen.getByText(/Движок: офлайн \(кэш доступен\)/)).toBeTruthy()
  })

  it('renders "Движок: офлайн" on offline state', () => {
    render(React.createElement(AiEngineStatusBadgeView, { state: { kind: 'offline' } }))
    expect(screen.getByText(/Движок: офлайн/)).toBeTruthy()
  })
})
