const exact = (
  source: string,
  scenarioId: string,
  supportingScenarios: readonly { source: string; scenarioId: string }[] = []
) => ({
  source,
  scenarioId,
  ...(supportingScenarios.length > 0 ? { supportingScenarios } : {}),
})

export const STORY_174_3_ADDITIONAL_STATE_SCENARIOS = {
  '/analytics/pricing': {
    loading: exact(
      'src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx',
      'renders page header during loading'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx',
      'renders empty table message'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/pricing/__tests__/page.test.tsx',
      'displays error alert in Russian'
    ),
  },
  '/analytics/product/[nmId]': {
    loading: exact(
      'src/app/(dashboard)/analytics/product/[nmId]/components/__tests__/ProductAnalyticsContent.test.tsx',
      'shows skeleton while loading'
    ),
  },
  '/analytics/search': {
    loading: exact(
      'src/app/(dashboard)/analytics/search/__tests__/SearchByProductTab.test.tsx',
      'shows skeletons when loading after product selection'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/search/__tests__/SearchByProductTab.test.tsx',
      'shows empty message when no queries found'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/search/__tests__/SearchByProductTab.test.tsx',
      'shows destructive alert on error after product selection'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx',
      'keeps the overview table when the CHART fetch fails (Pattern 1 graceful degradation)',
      [
        exact(
          'src/app/(dashboard)/analytics/search/__tests__/SearchOrdersTab.test.tsx',
          'keeps the chart + shows widget error chrome when the OVERVIEW fetch fails (reverse direction)'
        ),
      ]
    ),
  },
  '/analytics/ai-admin/models': {
    loading: exact(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      'shows loading skeletons when isLoading=true'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      'shows empty state message when no models'
    ),
    'filtered-empty': exact(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      'F-8: filter-empty shows reset button when statusFilter is active'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      'shows error Alert when error is present'
    ),
    permission: exact(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      'shows access denied Alert for non-Owner user'
    ),
  },
  '/analytics/ai-admin/preferences': {
    loading: exact(
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
      'shows loading skeleton when isLoading=true (inside Owner branch)'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
      'shows fetch error Alert when isError=true (inside Owner branch)'
    ),
    permission: exact(
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
      'non-Owner sees denied Alert and back-link'
    ),
    pending: exact(
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
      'pending state disables switch'
    ),
  },
  '/analytics/models': {
    loading: exact(
      'src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx',
      'renders Skeletons (positive + negative) when isLoading=true (post-2nd-pass F-2)'
    ),
    empty: exact(
      'src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx',
      'renders non-destructive Alert with link to Forecast page'
    ),
    error: exact(
      'src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx',
      'renders destructive Alert with error message'
    ),
  },
  '/analytics/cross-reference': {
    error: exact(
      'src/app/(dashboard)/analytics/cross-reference/components/__tests__/CrossReferencePageContent.partial-source.test.tsx',
      'both product-level sources fail → FULL ErrorState with the exact e2e-pinned texts'
    ),
    partial: exact(
      'src/app/(dashboard)/analytics/cross-reference/components/__tests__/CrossReferencePageContent.partial-source.test.tsx',
      'ad fails + search ok → destructive banner names реклама, search rows REMAIN, no full ErrorState',
      [
        exact(
          'src/app/(dashboard)/analytics/cross-reference/components/__tests__/CrossReferencePageContent.partial-source.test.tsx',
          'search fails + ad ok → banner names органический поиск, ad rows REMAIN'
        ),
        exact(
          'src/app/(dashboard)/analytics/cross-reference/components/__tests__/CrossReferencePageContent.partial-source.test.tsx',
          'third query (groupBy=query) fails while product-level ok → section banner, page data intact'
        ),
      ]
    ),
  },
  '/cogs/history': {
    loading: exact(
      'src/app/(dashboard)/cogs/history/__tests__/CogsHistoryPageStates.test.tsx',
      'renders a page-level h1 in loading state'
    ),
    empty: exact(
      'src/app/(dashboard)/cogs/history/__tests__/CogsHistoryPageStates.test.tsx',
      'renders a generic h1 for empty state without product metadata'
    ),
    error: exact(
      'src/app/(dashboard)/cogs/history/__tests__/CogsHistoryPageStates.test.tsx',
      'renders a page-level h1 in error state'
    ),
  },
  '/monitoring': {
    loading: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'renders the monitoring dashboard skeleton while the route query is loading'
    ),
    empty: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'renders the new-cabinet empty state when health is zero and every pipeline has no data'
    ),
    error: exact(
      'src/app/(dashboard)/monitoring/components/__tests__/MonitoringPageContent.test.tsx',
      'renders a recoverable monitoring error and retries the dashboard query'
    ),
  },
  '/orders/integrity': {
    loading: exact(
      'src/app/(dashboard)/orders/integrity/components/__tests__/OrdersIntegrityPageContent.test.tsx',
      'shows skeleton when loading with no cached data'
    ),
    error: exact(
      'src/app/(dashboard)/orders/integrity/components/__tests__/OrdersIntegrityPageContent.test.tsx',
      'shows error alert when fetch fails'
    ),
  },
  '/products': {
    empty: exact(
      'src/app/(dashboard)/products/__tests__/page.test.tsx',
      'shows empty-state messages when there are no discontinued SKUs / suggestions'
    ),
  },
} as const
