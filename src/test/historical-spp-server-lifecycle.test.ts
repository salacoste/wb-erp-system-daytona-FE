import { EventEmitter } from 'node:events'
import net from 'node:net'

import { describe, expect, it, vi } from 'vitest'

import historicalSppGlobalSetup from '../../e2e/historical-spp-global-setup'
import {
  assertHistoricalSppPortUnoccupied,
  stopHistoricalSppServer,
  waitUntilHistoricalSppServerReady,
  type HistoricalSppChildProcess,
} from './historical-spp-server-lifecycle'

class FakeChildProcess extends EventEmitter implements HistoricalSppChildProcess {
  pid: number | undefined = 4321
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null

  kill(): boolean {
    return true
  }
}

describe('historical-spp exact-command server lifecycle', () => {
  it('allows the exact command to create its own server when the port is free', () => {
    expect(() => assertHistoricalSppPortUnoccupied(false, 'http://localhost:3100')).not.toThrow()
  })

  it('fails closed instead of reusing an unidentified listener', () => {
    expect(() => assertHistoricalSppPortUnoccupied(true, 'http://localhost:3100')).toThrow(
      'Historical SPP exact command requires an unoccupied local server port: http://localhost:3100'
    )
  })

  it('preserves an existing listener after rejecting an occupied port', async () => {
    const listener = net.createServer(socket => socket.end())
    const previousBaseUrl = process.env.E2E_BASE_URL
    await new Promise<void>((resolve, reject) => {
      listener.once('error', reject)
      listener.listen(0, resolve)
    })

    try {
      const address = listener.address()
      if (!address || typeof address === 'string') throw new Error('Expected a TCP listener')
      process.env.E2E_BASE_URL = `http://127.0.0.1:${address.port}`

      await expect(historicalSppGlobalSetup()).rejects.toThrow(
        'Historical SPP exact command requires an unoccupied local server port'
      )
      await expect(
        new Promise<void>((resolve, reject) => {
          const socket = net.createConnection({ host: '127.0.0.1', port: address.port })
          socket.once('connect', () => {
            socket.destroy()
            resolve()
          })
          socket.once('error', reject)
        })
      ).resolves.toBeUndefined()
    } finally {
      if (previousBaseUrl === undefined) delete process.env.E2E_BASE_URL
      else process.env.E2E_BASE_URL = previousBaseUrl
      await new Promise<void>((resolve, reject) =>
        listener.close(error => (error ? reject(error) : resolve()))
      )
    }
  })

  it('rejects a spawn error instead of waiting for the readiness timeout', async () => {
    const child = new FakeChildProcess()
    const readiness = waitUntilHistoricalSppServerReady(child, {
      canConnect: vi.fn().mockResolvedValue(false),
      output: () => 'spawn output',
      sleep: () => new Promise(() => undefined),
      timeoutMs: 120_000,
    })

    child.emit('error', Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }))

    await expect(readiness).rejects.toThrow(
      'Historical SPP local server failed to spawn: spawn ENOENT\nspawn output'
    )
  })

  it('rejects when the server exits before becoming ready', async () => {
    const child = new FakeChildProcess()
    const readiness = waitUntilHistoricalSppServerReady(child, {
      canConnect: vi.fn().mockResolvedValue(false),
      output: () => 'early exit output',
      sleep: () => new Promise(() => undefined),
      timeoutMs: 120_000,
    })

    child.exitCode = 1
    child.emit('exit', 1, null)

    await expect(readiness).rejects.toThrow(
      'Historical SPP local server exited before readiness:\nearly exit output'
    )
  })

  it('rejects when the readiness deadline expires', async () => {
    const child = new FakeChildProcess()
    let now = 0

    await expect(
      waitUntilHistoricalSppServerReady(child, {
        canConnect: vi.fn().mockResolvedValue(false),
        now: () => now,
        output: () => 'timeout output',
        pollIntervalMs: 25,
        sleep: async milliseconds => {
          now += milliseconds
        },
        timeoutMs: 50,
      })
    ).rejects.toThrow(
      'Historical SPP local server did not become ready within 50ms:\ntimeout output'
    )
  })

  it('sends SIGTERM and stops when the process exits gracefully', async () => {
    const child = new FakeChildProcess()
    const sendSignal = vi.fn((_child: HistoricalSppChildProcess, signal: NodeJS.Signals) => {
      child.signalCode = signal
      child.emit('exit', null, signal)
    })

    await stopHistoricalSppServer(child, {
      sendSignal,
      sleep: () => new Promise(() => undefined),
      timeoutMs: 5_000,
    })

    expect(sendSignal).toHaveBeenCalledTimes(1)
    expect(sendSignal).toHaveBeenCalledWith(child, 'SIGTERM')
  })

  it('sends SIGKILL after the graceful shutdown timeout', async () => {
    const child = new FakeChildProcess()
    const sendSignal = vi.fn((_child: HistoricalSppChildProcess, signal: NodeJS.Signals) => {
      if (signal === 'SIGKILL') {
        child.signalCode = signal
        child.emit('exit', null, signal)
      }
    })

    await stopHistoricalSppServer(child, {
      sendSignal,
      sleep: vi.fn().mockResolvedValue(undefined),
      timeoutMs: 5_000,
    })

    expect(sendSignal.mock.calls).toEqual([
      [child, 'SIGTERM'],
      [child, 'SIGKILL'],
    ])
  })

  it('does not hang when exit is emitted synchronously while sending SIGTERM', async () => {
    const child = new FakeChildProcess()

    await expect(
      stopHistoricalSppServer(child, {
        sendSignal: (_child, signal) => {
          child.signalCode = signal
          child.emit('exit', null, signal)
        },
        sleep: () => new Promise(() => undefined),
        timeoutMs: 5_000,
      })
    ).resolves.toBeUndefined()
  })

  it('does not wait or signal when spawn failed before assigning a pid', async () => {
    const child = new FakeChildProcess()
    child.pid = undefined
    const sendSignal = vi.fn()

    await stopHistoricalSppServer(child, {
      sendSignal,
      sleep: () => new Promise(() => undefined),
      timeoutMs: 5_000,
    })

    expect(sendSignal).not.toHaveBeenCalled()
  })

  it('rejects within a bounded timeout when the process ignores SIGKILL', async () => {
    const child = new FakeChildProcess()
    const sendSignal = vi.fn()

    await expect(
      stopHistoricalSppServer(child, {
        sendSignal,
        sleep: vi.fn().mockResolvedValue(undefined),
        timeoutMs: 5_000,
      })
    ).rejects.toThrow('Historical SPP local server did not exit within 5000ms after SIGKILL')
    expect(sendSignal.mock.calls).toEqual([
      [child, 'SIGTERM'],
      [child, 'SIGKILL'],
    ])
  })
})
