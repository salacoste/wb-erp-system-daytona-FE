import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

import { assertAllowedTestUrl } from '../test-utils/outbound-network-policy'
import {
  assertHistoricalSppPortUnoccupied,
  stopHistoricalSppServer,
  waitUntilHistoricalSppServerReady,
} from '../src/test/historical-spp-server-lifecycle'

const START_TIMEOUT_MS = 120_000
const STOP_TIMEOUT_MS = 5_000

function portFor(url: URL): number {
  if (url.protocol !== 'http:') {
    throw new Error('Historical SPP local server requires an http:// E2E_BASE_URL')
  }
  return Number(url.port || '80')
}

function canConnect(url: URL): Promise<boolean> {
  return new Promise(resolve => {
    const socketHost = url.hostname === 'localhost' ? '127.0.0.1' : url.hostname
    const socket = net.createConnection({ host: socketHost, port: portFor(url) })
    const finish = (connected: boolean) => {
      socket.destroy()
      resolve(connected)
    }
    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(750, () => finish(false))
  })
}

export default async function historicalSppGlobalSetup(): Promise<
  (() => Promise<void>) | undefined
> {
  const root = process.cwd()
  const baseUrl = assertAllowedTestUrl(process.env.E2E_BASE_URL || 'http://localhost:3100')
  assertHistoricalSppPortUnoccupied(await canConnect(baseUrl), baseUrl.origin)

  const outputChunks: string[] = []
  const child = spawn(
    process.execPath,
    [
      path.join(root, 'scripts/start-fresh-next-dev.mjs'),
      '--hostname',
      '127.0.0.1',
      '--port',
      String(portFor(baseUrl)),
    ],
    {
      cwd: root,
      detached: process.platform !== 'win32',
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )
  const capture = (chunk: Buffer) => {
    outputChunks.push(chunk.toString('utf8'))
    if (outputChunks.length > 200) outputChunks.shift()
  }
  child.stdout?.on('data', capture)
  child.stderr?.on('data', capture)

  try {
    await waitUntilHistoricalSppServerReady(child, {
      canConnect: () => canConnect(baseUrl),
      output: () => outputChunks.join('').slice(-20_000),
      timeoutMs: START_TIMEOUT_MS,
    })
  } catch (error) {
    await stopHistoricalSppServer(child, { timeoutMs: STOP_TIMEOUT_MS })
    throw error
  }

  return async () => stopHistoricalSppServer(child, { timeoutMs: STOP_TIMEOUT_MS })
}
