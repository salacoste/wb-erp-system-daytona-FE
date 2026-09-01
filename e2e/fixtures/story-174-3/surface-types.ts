import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'

import {
  indexStory1743ExecutionManifest,
  type Story1743ExecutionManifest,
  type Story1743RequiredExecution,
} from './execution-manifest'

export const TABLE_FEATURES = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'sorting',
  'selection-and-actions',
  'pagination',
  'virtualization',
  'narrow-width-strategy',
] as const

export const CHART_FEATURES = [
  'title',
  'period-and-units',
  'series-or-legend-meaning',
  'tooltip-precision',
  'responsive-containment',
  'reduced-motion',
  'exact-data-alternative',
] as const

type TableFeature = (typeof TABLE_FEATURES)[number]
type ChartFeature = (typeof CHART_FEATURES)[number]
export type SurfaceFeatureDisposition =
  | {
      assertion: `canonical-runner:${string}` | `owner-test:${string}`
      disposition: 'executed'
      rationale: string
    }
  | {
      disposition: 'not-applicable'
      rationale: string
    }
export type SurfaceEvidence = { source: string; anchor: string }
export type Story1743OwnerTestBinding = {
  execution: 'owner-test'
  runner: 'vitest' | 'playwright'
  source: string
  scenarioId: string
}

export type Story1743ConditionalVerification =
  | Story1743OwnerTestBinding
  | {
      execution: 'canonical-trigger'
      role: 'button' | 'tab'
      name: string
      restoreName: string
      activationKey: 'Enter'
    }

export type Story1743OverlayInventoryItem = {
  id: string
  archetype:
    'modal-dialog' | 'modal-alert-dialog' | 'modal-sheet' | 'non-modal-popover' | 'non-modal-menu'
  defaultState: 'closed'
  trigger: {
    role: 'button' | 'combobox' | 'link'
    name: string
    match?: 'exact' | 'prefix' | 'contains'
    cardinality?: 'exactly-one' | 'one-or-more'
  }
  behavior: {
    closeKey: 'Escape'
    execution: 'canonical-runner'
    openKey: 'Enter'
  }
  evidence: SurfaceEvidence
}

export type Story1743OverlayContract = {
  disposition: 'executed'
  expectedCount: number
  inventory: readonly Story1743OverlayInventoryItem[]
  conditionalInventory: readonly Story1743ConditionalInventoryItem<Story1743OverlayInventoryItem>[]
  evidenceSource: string
  rationale: string
}

export type Story1743ConditionalInventoryItem<TItem> = {
  disposition: 'not-applicable-in-canonical-default'
  item: TItem
  rationale: string
  verification: Story1743ConditionalVerification
}

export type Story1743TableSurface = {
  id: string
  selector: string
  accessibleName: string
  evidence: SurfaceEvidence
  features: Readonly<Record<TableFeature, SurfaceFeatureDisposition>>
  narrowWidthDisposition: SurfaceFeatureDisposition
  pagination?: {
    nextName: string
    previousName: string
    evidence: SurfaceEvidence
  }
  interaction?: Story1743OwnerTestBinding
  ownerFeatureExecution?: {
    features: readonly TableFeature[]
    verification: Story1743OwnerTestBinding
  }
}

export type Story1743ChartSurface = {
  id: string
  selector: string
  accessibleName: string
  evidence: SurfaceEvidence
  alternative: {
    association: 'explicit-accessible-name' | 'shared-complete-data-table'
    selector: string
    accessibleName: string
    requiredPeriodUnitTokens: readonly string[]
    requiredSeriesTokens: readonly string[]
    sharedSurfaceIds?: readonly string[]
  }
  tooltip: Story1743OwnerTestBinding
  features: Readonly<Record<ChartFeature, SurfaceFeatureDisposition>>
}

export type Story1743DataSurfaceContract<TSurface> = {
  disposition: 'executed'
  expectedCount: number
  surfaces: readonly TSurface[]
  conditionalSurfaces: readonly Story1743ConditionalInventoryItem<TSurface>[]
  evidenceSource: string
  emptyRationale: string
}

export type Story1743RouteSurfaceContract = {
  route: string
  keyboard: {
    disposition: 'executed' | 'not-applicable'
    rationale: string
    surface: 'main-or-route-body'
  }
  overlay: Story1743OverlayContract
  table: Story1743DataSurfaceContract<Story1743TableSurface>
  chart: Story1743DataSurfaceContract<Story1743ChartSurface>
}

export function evidence(source: string, anchor: string): SurfaceEvidence {
  if (!existsSync(source)) throw new Error(`Story 174.3 surface evidence is missing: ${source}`)
  if (!readFileSync(source, 'utf8').includes(anchor)) {
    throw new Error(`Story 174.3 surface evidence anchor is missing: ${source} :: ${anchor}`)
  }
  return { source, anchor }
}

function featureDispositions<TFeature extends string>(
  route: string,
  surfaceId: string,
  allFeatures: readonly TFeature[],
  executedFeatures: readonly TFeature[],
  notApplicableFeatures: readonly TFeature[],
  notApplicableRationales: Partial<Record<TFeature, string>> = {}
): Readonly<Record<TFeature, SurfaceFeatureDisposition>> {
  const executed = new Set(executedFeatures)
  const notApplicable = new Set(notApplicableFeatures)
  if (
    executed.size !== executedFeatures.length ||
    notApplicable.size !== notApplicableFeatures.length
  ) {
    throw new Error(`${route}/${surfaceId} has duplicate feature dispositions`)
  }
  for (const feature of allFeatures) {
    const count = Number(executed.has(feature)) + Number(notApplicable.has(feature))
    if (count !== 1) {
      throw new Error(`${route}/${surfaceId}/${feature} must have exactly one disposition`)
    }
  }
  return Object.freeze(
    Object.fromEntries(
      allFeatures.map(feature => [
        feature,
        executed.has(feature)
          ? {
              assertion: `canonical-runner:${surfaceId}:${feature}` as const,
              disposition: 'executed' as const,
              rationale: `${route}: ${surfaceId} feature ${feature} is behaviorally executed by the consolidated live-surface runner`,
            }
          : {
              disposition: 'not-applicable' as const,
              rationale:
                notApplicableRationales[feature] ??
                `${route}: ${surfaceId} feature ${feature} is not claimed without a surface-specific executable expectation`,
            },
      ])
    ) as Record<TFeature, SurfaceFeatureDisposition>
  )
}

export function ownerTestBinding(
  binding: Omit<Story1743OwnerTestBinding, 'execution'>
): Story1743OwnerTestBinding {
  evidence(binding.source, binding.scenarioId)
  const required: Story1743RequiredExecution = {
    ...binding,
    sourceSha256: createHash('sha256').update(readFileSync(binding.source)).digest('hex'),
  }
  const manifest = JSON.parse(
    readFileSync('e2e/fixtures/story-174-3/execution-manifest.json', 'utf8')
  ) as Story1743ExecutionManifest
  indexStory1743ExecutionManifest(manifest, [required])
  return Object.freeze({ ...binding, execution: 'owner-test' as const })
}

const BASE_TABLE_EXECUTED: readonly TableFeature[] = [
  'caption-or-name',
  'primary-identity-column',
  'numeric-alignment-and-precision',
  'narrow-width-strategy',
]
const OPTIONAL_TABLE_FEATURES: readonly TableFeature[] = [
  'sorting',
  'selection-and-actions',
  'pagination',
  'virtualization',
]
export function tableSurface(
  route: string,
  definition: {
    id: string
    accessibleName: string
    source: string
    anchor: string
    executedFeatures?: readonly Extract<
      TableFeature,
      'pagination' | 'selection-and-actions' | 'sorting' | 'virtualization'
    >[]
    notApplicableRationales?: Partial<Record<TableFeature, string>>
    narrowWidthRationale?: string
    pagination?: {
      nextName: string
      previousName: string
      source: string
      anchor: string
    }
    interactionOwnerTest?: Omit<Story1743OwnerTestBinding, 'execution'>
    ownerExecutedFeatures?: readonly Extract<TableFeature, 'selection-and-actions' | 'sorting'>[]
  }
): Story1743TableSurface {
  const optionalExecuted = new Set<TableFeature>(definition.executedFeatures ?? [])
  const ownerExecuted = new Set<TableFeature>(definition.ownerExecutedFeatures ?? [])
  const executedFeatures = [...BASE_TABLE_EXECUTED, ...optionalExecuted]
  const notApplicableFeatures = OPTIONAL_TABLE_FEATURES.filter(
    feature => !optionalExecuted.has(feature)
  )
  if (optionalExecuted.has('pagination') !== Boolean(definition.pagination)) {
    throw new Error(
      `${route}/${definition.id} pagination execution and controls must be declared together`
    )
  }
  if (optionalExecuted.has('selection-and-actions') !== Boolean(definition.interactionOwnerTest)) {
    throw new Error(
      `${route}/${definition.id} selection/action execution and an exact owner test must be declared together`
    )
  }
  if (
    ownerExecuted.size !== (definition.ownerExecutedFeatures?.length ?? 0) ||
    [...ownerExecuted].some(feature => !optionalExecuted.has(feature)) ||
    (ownerExecuted.size > 0 && !definition.interactionOwnerTest)
  ) {
    throw new Error(
      `${route}/${definition.id} owner-executed features must be unique executed features with an exact owner test`
    )
  }
  const interaction = definition.interactionOwnerTest
    ? ownerTestBinding(definition.interactionOwnerTest)
    : undefined
  const defaultNotApplicableRationales: Partial<Record<TableFeature, string>> = {
    sorting: `${route}: ${definition.id} in ${definition.source} declares no interactive sorting or aria-sort contract`,
    'selection-and-actions': `${route}: ${definition.id} in ${definition.source} declares selection-and-actions not applicable because it is a read-only semantic data surface with no row selection or action contract`,
    pagination: `${route}: ${definition.id} in ${definition.source} renders its complete response without pagination controls`,
    virtualization: `${route}: ${definition.id} virtualization is not applicable because ${definition.source} renders full semantic DOM rows and declares neither aria-rowcount nor data-virtualized`,
    ...(definition.narrowWidthRationale
      ? {
          'narrow-width-strategy': `${route}: ${definition.id} feature narrow-width-strategy is not applicable because ${definition.narrowWidthRationale}`,
        }
      : {}),
    ...definition.notApplicableRationales,
  }
  return {
    id: definition.id,
    selector: `role=table[name^=${JSON.stringify(definition.accessibleName)}]`,
    accessibleName: definition.accessibleName,
    evidence: evidence(definition.source, definition.anchor),
    features: featureDispositions(
      route,
      definition.id,
      TABLE_FEATURES,
      definition.narrowWidthRationale
        ? executedFeatures.filter(feature => feature !== 'narrow-width-strategy')
        : executedFeatures,
      definition.narrowWidthRationale
        ? [...notApplicableFeatures, 'narrow-width-strategy']
        : notApplicableFeatures,
      defaultNotApplicableRationales
    ),
    pagination: definition.pagination
      ? {
          nextName: definition.pagination.nextName,
          previousName: definition.pagination.previousName,
          evidence: evidence(definition.pagination.source, definition.pagination.anchor),
        }
      : undefined,
    interaction,
    ownerFeatureExecution:
      ownerExecuted.size > 0 && interaction
        ? {
            features: Object.freeze([...ownerExecuted]),
            verification: interaction,
          }
        : undefined,
    narrowWidthDisposition: definition.narrowWidthRationale
      ? {
          disposition: 'not-applicable',
          rationale: `${route}: ${definition.id} is not rendered as a semantic table at 390px because ${definition.narrowWidthRationale}`,
        }
      : {
          assertion: `canonical-runner:${definition.id}:narrow-width-strategy`,
          disposition: 'executed',
          rationale: `${route}: ${definition.id} remains a live semantic table at 390px`,
        },
  }
}

export function chartSurface(
  route: string,
  definition: {
    id: string
    accessibleName: string
    alternativeAccessibleName: string
    alternativeSelector?: string
    source: string
    anchor: string
    alternativeSource: string
    alternativeAnchor: string
    requiredPeriodUnitTokens?: readonly string[]
    requiredSeriesTokens: readonly string[]
    sharedAlternativeSurfaceIds?: readonly string[]
    tooltipOwnerTest: Omit<Story1743OwnerTestBinding, 'execution'>
    notApplicableRationales?: Partial<Record<ChartFeature, string>>
  }
): Story1743ChartSurface {
  evidence(definition.alternativeSource, definition.alternativeAnchor)
  if (
    definition.sharedAlternativeSurfaceIds &&
    (!definition.sharedAlternativeSurfaceIds.includes(definition.id) ||
      definition.sharedAlternativeSurfaceIds.length < 2)
  ) {
    throw new Error(
      `${route}/${definition.id} shared chart alternative must name this chart and at least one peer surface`
    )
  }
  const executedFeatures: readonly ChartFeature[] = [
    'title',
    ...(definition.requiredPeriodUnitTokens?.length ? (['period-and-units'] as const) : []),
    'series-or-legend-meaning',
    'tooltip-precision',
    'responsive-containment',
    'reduced-motion',
    'exact-data-alternative',
  ]
  return {
    id: definition.id,
    selector: `[role="img"][aria-label^=${JSON.stringify(definition.accessibleName)}]`,
    accessibleName: definition.accessibleName,
    evidence: evidence(definition.source, definition.anchor),
    alternative: {
      association: definition.sharedAlternativeSurfaceIds
        ? 'shared-complete-data-table'
        : 'explicit-accessible-name',
      selector:
        definition.alternativeSelector ??
        'table:has(> caption), [role="region"][data-chart-alternative]',
      accessibleName: definition.alternativeAccessibleName,
      requiredPeriodUnitTokens: Object.freeze(definition.requiredPeriodUnitTokens ?? []),
      requiredSeriesTokens: Object.freeze(definition.requiredSeriesTokens),
      sharedSurfaceIds: definition.sharedAlternativeSurfaceIds
        ? Object.freeze(definition.sharedAlternativeSurfaceIds)
        : undefined,
    },
    tooltip: ownerTestBinding(definition.tooltipOwnerTest),
    features: featureDispositions(
      route,
      definition.id,
      CHART_FEATURES,
      executedFeatures,
      CHART_FEATURES.filter(feature => !executedFeatures.includes(feature)),
      definition.notApplicableRationales
    ),
  }
}
