import type { Story1743OverlayInventoryItem } from './surface-types'
import { evidence } from './surface-types'

function overlayItem(
  definition: Omit<Story1743OverlayInventoryItem, 'behavior'>
): Story1743OverlayInventoryItem {
  evidence(definition.evidence.source, definition.evidence.anchor)
  return Object.freeze({
    ...definition,
    behavior: {
      closeKey: 'Escape' as const,
      execution: 'canonical-runner' as const,
      openKey: 'Enter' as const,
    },
  })
}

export const MOBILE_NAVIGATION: Story1743OverlayInventoryItem = overlayItem({
  id: 'mobile-navigation',
  archetype: 'modal-sheet',
  defaultState: 'closed',
  trigger: { role: 'button', name: 'Open menu' },
  evidence: evidence('src/app/(dashboard)/layout/MobileSidebarSheet.tsx', 'aria-label="Open menu"'),
})
export const PRODUCT_FILTER: Story1743OverlayInventoryItem = overlayItem({
  id: 'product-filter',
  archetype: 'non-modal-popover',
  defaultState: 'closed',
  trigger: { role: 'combobox', name: 'Фильтр по товарам' },
  evidence: evidence(
    'src/app/(dashboard)/analytics/funnel/components/FunnelProductFilter.tsx',
    'aria-label="Фильтр по товарам"'
  ),
})

export const ROUTE_OVERLAY_INVENTORY: Readonly<
  Record<string, readonly Story1743OverlayInventoryItem[]>
> = Object.freeze({
  '/analytics/advertising': [
    overlayItem({
      id: 'campaign-filter',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'combobox', name: 'Выбрать кампании' },
      evidence: {
        source: 'src/app/(dashboard)/analytics/advertising/components/CampaignSelector.tsx',
        anchor: 'aria-label="Выбрать кампании"',
      },
    }),
    overlayItem({
      id: 'efficiency-filter',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: {
        role: 'combobox',
        name: 'Фильтр по статусу эффективности',
      },
      evidence: {
        source: 'src/app/(dashboard)/analytics/advertising/components/EfficiencyFilterDropdown.tsx',
        anchor: 'aria-label="Фильтр по статусу эффективности"',
      },
    }),
  ],
  '/analytics/search': [
    overlayItem({
      id: 'product-search',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Поиск товара' },
      evidence: {
        source: 'src/app/(dashboard)/analytics/search/components/ProductCombobox.tsx',
        anchor: 'aria-label="Поиск товара"',
      },
    }),
  ],
  '/analytics/ai-admin/anomalies': [
    overlayItem({
      id: 'resolve-anomaly',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: {
        role: 'button',
        name: 'Разрешить аномалию #',
        match: 'prefix',
        cardinality: 'one-or-more',
      },
      evidence: {
        source:
          'src/app/(dashboard)/analytics/ai-admin/anomalies/components/ResolveAnomalyDialog.tsx',
        anchor: '<DialogTitle>',
      },
    }),
  ],
  '/analytics/ai-admin/models': [
    overlayItem({
      id: 'model-rollback',
      archetype: 'modal-alert-dialog',
      defaultState: 'closed',
      trigger: {
        role: 'button',
        name: 'Откатить модель v',
        match: 'prefix',
        cardinality: 'one-or-more',
      },
      evidence: {
        source: 'src/app/(dashboard)/analytics/ai-admin/models/components/RollbackDialog.tsx',
        anchor: '<AlertDialogTitle>',
      },
    }),
  ],
  '/analytics/liquidity': [
    overlayItem({
      id: 'liquidation-planner',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: {
        role: 'button',
        name: 'Ликвидировать',
        cardinality: 'one-or-more',
      },
      evidence: {
        source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidationPlannerModal.tsx',
        anchor: '<DialogTitle',
      },
    }),
  ],
  '/analytics/pricing': [
    overlayItem({
      id: 'price-history',
      archetype: 'modal-sheet',
      defaultState: 'closed',
      trigger: {
        role: 'button',
        name: 'Открыть рекомендации для SKU ',
        match: 'prefix',
        cardinality: 'one-or-more',
      },
      evidence: {
        source: 'src/app/(dashboard)/analytics/pricing/components/PriceHistorySheet.tsx',
        anchor: '<SheetTitle>',
      },
    }),
  ],
  '/dashboard': [
    overlayItem({
      id: 'widget-settings',
      archetype: 'modal-sheet',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Настройка виджетов' },
      evidence: {
        source: 'src/components/custom/dashboard/WidgetSettingsSheet.tsx',
        anchor: 'Настройка виджетов',
      },
    }),
    overlayItem({
      id: 'commission-breakdown',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'категории комиссий', match: 'contains' },
      evidence: {
        source: 'src/components/custom/dashboard/CommissionBreakdownPopover.tsx',
        anchor: 'категории комиссий',
      },
    }),
    overlayItem({
      id: 'logistics-breakdown',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'категории логистики', match: 'contains' },
      evidence: {
        source: 'src/components/custom/dashboard/LogisticsBreakdownPopover.tsx',
        anchor: 'категории логистики',
      },
    }),
  ],
  '/cogs/history': [
    overlayItem({
      id: 'cogs-row-actions',
      archetype: 'non-modal-menu',
      defaultState: 'closed',
      trigger: {
        role: 'button',
        name: 'Открыть меню',
        cardinality: 'one-or-more',
      },
      evidence: {
        source: 'src/components/custom/CogsHistoryTableCells.tsx',
        anchor: '<span className="sr-only">Открыть меню</span>',
      },
    }),
  ],
  '/cogs/price-calculator': [
    overlayItem({
      id: 'product-search',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'combobox', name: 'Поиск товара' },
      evidence: {
        source: 'src/components/custom/price-calculator/ProductSearchPopover.tsx',
        anchor: 'aria-label="Поиск товара"',
      },
    }),
    overlayItem({
      id: 'warehouse-select',
      archetype: 'non-modal-popover',
      defaultState: 'closed',
      trigger: { role: 'combobox', name: 'Выберите склад' },
      evidence: {
        source: 'src/components/custom/price-calculator/WarehouseSelect.tsx',
        anchor: 'aria-label="Выберите склад"',
      },
    }),
    overlayItem({
      id: 'reset-confirmation',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Сбросить', match: 'prefix' },
      evidence: {
        source: 'src/components/custom/price-calculator/ResetConfirmDialog.tsx',
        anchor: '<DialogTitle>Подтверждение сброса</DialogTitle>',
      },
    }),
  ],
  '/settings/backfill': [
    overlayItem({
      id: 'start-backfill',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Запустить бэкфилл' },
      evidence: {
        source: 'src/app/(dashboard)/settings/backfill/page.tsx',
        anchor: 'Запустить бэкфилл',
      },
    }),
    overlayItem({
      id: 'backfill-error-log',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Показать ошибку для ', match: 'prefix' },
      evidence: {
        source: 'src/app/(dashboard)/settings/backfill/components/BackfillErrorLog.tsx',
        anchor: 'aria-label={`Показать ошибку для',
      },
    }),
  ],
  '/settings/expenses': [
    overlayItem({
      id: 'expense-form',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Добавить расход' },
      evidence: {
        source: 'src/app/(dashboard)/settings/expenses/page.tsx',
        anchor: 'Добавить расход',
      },
    }),
    overlayItem({
      id: 'expense-delete',
      archetype: 'modal-alert-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Удалить расход ', match: 'prefix' },
      evidence: {
        source: 'src/app/(dashboard)/settings/expenses/components/ExpenseTable.tsx',
        anchor: 'aria-label={`Удалить расход',
      },
    }),
  ],
  '/settings/notifications': [
    overlayItem({
      id: 'telegram-binding',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Подключить Telegram' },
      evidence: {
        source: 'src/app/(dashboard)/settings/notifications/NotificationsHeroBanner.tsx',
        anchor: 'aria-label="Подключить Telegram"',
      },
    }),
    overlayItem({
      id: 'telegram-unbind',
      archetype: 'modal-alert-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Отключить Telegram' },
      evidence: {
        source: 'src/components/notifications/TelegramBindingCard.tsx',
        anchor: 'aria-label="Отключить Telegram"',
      },
    }),
  ],
  '/shipments': [
    overlayItem({
      id: 'create-shipment',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Создать отправку' },
      evidence: {
        source: 'src/app/(dashboard)/shipments/page.tsx',
        anchor: 'Создать отправку',
      },
    }),
  ],
  '/shipments/[id]': [
    overlayItem({
      id: 'box-line-form',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Добавить товар' },
      evidence: {
        source: 'src/components/custom/shipments/BoxLineForm.tsx',
        anchor: '<DialogTitle>',
      },
    }),
  ],
  '/monitoring': [
    overlayItem({
      id: 'health-report',
      archetype: 'modal-sheet',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Открыть отчёт', match: 'prefix' },
      evidence: {
        source: 'src/app/(dashboard)/monitoring/components/HealthReportSheet.tsx',
        anchor: 'aria-label="Отчёт о здоровье системы"',
      },
    }),
    overlayItem({
      id: 'recovery-confirmation',
      archetype: 'modal-alert-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Восстановить', match: 'prefix' },
      evidence: {
        source: 'src/app/(dashboard)/monitoring/components/RecoveryPanelSubcomponents.tsx',
        anchor: '<AlertDialogTrigger asChild>',
      },
    }),
  ],
  '/supplies': [
    overlayItem({
      id: 'create-supply',
      archetype: 'modal-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Создать поставку', match: 'prefix' },
      evidence: {
        source: 'src/components/custom/supplies/CreateSupplyModal.tsx',
        anchor: '<DialogTitle>Новая поставка</DialogTitle>',
      },
    }),
  ],
  '/supplies/[id]': [
    overlayItem({
      id: 'order-picker',
      archetype: 'modal-sheet',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Добавить заказы', match: 'prefix' },
      evidence: {
        source: 'src/components/custom/supplies/OrderPickerDrawer.tsx',
        anchor: '<SheetTitle>Добавить заказы в поставку</SheetTitle>',
      },
    }),
    overlayItem({
      id: 'close-supply',
      archetype: 'modal-alert-dialog',
      defaultState: 'closed',
      trigger: { role: 'button', name: 'Закрыть поставку', match: 'prefix' },
      evidence: {
        source: 'src/components/custom/supplies/CloseSupplyDialog.tsx',
        anchor: 'Закрыть поставку',
      },
    }),
  ],
})

const PROTECTED_ROUTE_PREFIXES = [
  '/analytics',
  '/dashboard',
  '/automation',
  '/cogs',
  '/communications',
  '/finances',
  '/monitor',
  '/monitoring',
  '/moysklad',
  '/orders',
  '/products',
  '/settings',
  '/shipments',
  '/supplies',
] as const

export function isProtectedRoute(route: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(prefix => route === prefix || route.startsWith(`${prefix}/`))
}
