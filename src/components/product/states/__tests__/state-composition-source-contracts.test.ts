import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const statesRoot = path.resolve(__dirname, '..')
const appRoot = path.resolve(process.cwd(), 'src/app')
const appTestsRoot = path.join(appRoot, '__tests__')

const productionManifest = [
  'AsyncOperationStatus.tsx',
  'BulkResultSummary.tsx',
  'ContextualSplitView.tsx',
  'PageState.tsx',
  'contracts.ts',
  'index.ts',
]

const testManifest = [
  'AsyncOperationStatus.test.tsx',
  'BulkResultSummary.test.tsx',
  'ContextualSplitView.test.tsx',
  'PageState.test.tsx',
  'StateContracts.test.ts',
  'state-composition-source-contracts.test.ts',
]

function filesIn(directory: string): string[] {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
    .sort()
}

describe('Story 166.8 source ownership', () => {
  it('locks the exact product-state production and test manifests', () => {
    expect(filesIn(statesRoot)).toEqual(productionManifest)
    expect(filesIn(path.join(statesRoot, '__tests__'))).toEqual(testManifest)
  })

  it('has exactly one root/global not-found owner', () => {
    const rootOwners = ['not-found.tsx', 'global-not-found.tsx'].filter(file =>
      fs.existsSync(path.join(appRoot, file))
    )
    expect(rootOwners).toEqual(['not-found.tsx'])
    expect(filesIn(appTestsRoot)).toEqual(['not-found.test.tsx'])
  })

  it('keeps production source presentation-only and token-safe', () => {
    const source = [...productionManifest, '../../../app/not-found.tsx']
      .map(file => {
        const resolved = file.startsWith('../')
          ? path.resolve(statesRoot, file)
          : path.join(statesRoot, file)
        return fs.readFileSync(resolved, 'utf8')
      })
      .join('\n')

    expect(source).not.toMatch(/@\/hooks|@\/lib\/api|@\/services|useQuery|useMutation/)
    expect(source).not.toMatch(/next\/navigation|useRouter|useSearchParams|router\./)
    expect(source).not.toMatch(/toast\.|setTimeout|setInterval|fetch\(|axios/)
    expect(source).not.toMatch(/useState|useReducer|createContext|zustand/)
    expect(source).not.toMatch(/retryFailed|polling|queryKey|invalidateQueries/)
    expect(source).not.toMatch(/Intl\.NumberFormat|toLocaleString|format(Currency|Money|Percent)/)
    expect(source).not.toMatch(/rawData|calculate|useSyncExternalStore|localStorage|sessionStorage/)
    expect(source).not.toMatch(
      /text-(red|green|blue|yellow|gray)-|bg-(red|green|blue|yellow|gray)-/
    )
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})
