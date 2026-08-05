import type { EventEmitter } from 'node:events'

export interface HistoricalSppChildProcess {
  exitCode: number | null
  kill(signal?: NodeJS.Signals | number): boolean
  off: EventEmitter['off']
  once: EventEmitter['once']
  pid?: number
  signalCode: NodeJS.Signals | null
}

type Sleep = (milliseconds: number) => Promise<void>

interface ReadinessOptions {
  canConnect: () => Promise<boolean>
  now?: () => number
  output: () => string
  pollIntervalMs?: number
  sleep?: Sleep
  timeoutMs: number
}

interface StopOptions {
  sendSignal?: (child: HistoricalSppChildProcess, signal: NodeJS.Signals) => void
  sleep?: Sleep
  timeoutMs: number
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, milliseconds)
    timer.unref()
  })
}

function hasExited(child: HistoricalSppChildProcess): boolean {
  return child.exitCode !== null || child.signalCode !== null
}

export function assertHistoricalSppPortUnoccupied(occupied: boolean, origin: string): void {
  if (!occupied) return
  throw new Error(
    `Historical SPP exact command requires an unoccupied local server port: ${origin}`
  )
}

function observeStartupFailure(
  child: HistoricalSppChildProcess,
  output: () => string
): { cleanup: () => void; failure: Promise<never> } {
  let rejectFailure!: (error: Error) => void
  const failure = new Promise<never>((_resolve, reject) => {
    rejectFailure = reject
  })
  const withOutput = (message: string) => `${message}:\n${output()}`
  const onError = (error: Error) => {
    rejectFailure(
      new Error(`Historical SPP local server failed to spawn: ${error.message}\n${output()}`)
    )
  }
  const onExit = () => {
    rejectFailure(new Error(withOutput('Historical SPP local server exited before readiness')))
  }

  child.once('error', onError)
  child.once('exit', onExit)
  child.once('close', onExit)

  if (hasExited(child)) onExit()

  return {
    cleanup: () => {
      child.off('error', onError)
      child.off('exit', onExit)
      child.off('close', onExit)
    },
    failure,
  }
}

export async function waitUntilHistoricalSppServerReady(
  child: HistoricalSppChildProcess,
  options: ReadinessOptions
): Promise<void> {
  const now = options.now ?? Date.now
  const sleep = options.sleep ?? delay
  const pollIntervalMs = options.pollIntervalMs ?? 250
  const deadline = now() + options.timeoutMs
  const startup = observeStartupFailure(child, options.output)

  try {
    while (now() < deadline) {
      if (await Promise.race([options.canConnect(), startup.failure])) return
      await Promise.race([sleep(pollIntervalMs), startup.failure])
    }
  } finally {
    startup.cleanup()
  }

  throw new Error(
    `Historical SPP local server did not become ready within ${options.timeoutMs}ms:\n${options.output()}`
  )
}

function observeProcessExit(child: HistoricalSppChildProcess): {
  cancel: () => void
  exited: Promise<void>
} {
  let resolveExit!: () => void
  const exited = new Promise<void>(resolve => {
    resolveExit = resolve
  })
  const onExit = () => resolveExit()

  child.once('error', onExit)
  child.once('exit', onExit)
  child.once('close', onExit)
  if (hasExited(child)) onExit()

  return {
    cancel: () => {
      child.off('error', onExit)
      child.off('exit', onExit)
      child.off('close', onExit)
    },
    exited,
  }
}

function signalProcessGroup(child: HistoricalSppChildProcess, signal: NodeJS.Signals): void {
  if (!child.pid || hasExited(child)) return
  try {
    if (process.platform === 'win32') child.kill(signal)
    else process.kill(-child.pid, signal)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}

async function signalAndWait(
  child: HistoricalSppChildProcess,
  signal: NodeJS.Signals,
  options: Required<StopOptions>
): Promise<boolean> {
  const exit = observeProcessExit(child)
  try {
    options.sendSignal(child, signal)
    return await Promise.race([
      exit.exited.then(() => true),
      options.sleep(options.timeoutMs).then(() => false),
    ])
  } finally {
    exit.cancel()
  }
}

export async function stopHistoricalSppServer(
  child: HistoricalSppChildProcess,
  options: StopOptions
): Promise<void> {
  if (!child.pid || hasExited(child)) return
  const resolvedOptions: Required<StopOptions> = {
    sendSignal: options.sendSignal ?? signalProcessGroup,
    sleep: options.sleep ?? delay,
    timeoutMs: options.timeoutMs,
  }

  if (await signalAndWait(child, 'SIGTERM', resolvedOptions)) return
  if (hasExited(child)) return
  if (await signalAndWait(child, 'SIGKILL', resolvedOptions)) return
  if (hasExited(child)) return

  throw new Error(
    `Historical SPP local server did not exit within ${options.timeoutMs}ms after SIGKILL`
  )
}
