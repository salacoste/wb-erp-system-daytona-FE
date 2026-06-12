# Route Sweep Summary

Generated: 2026-06-12T12:58:43.277Z

| Route | Status | Final URL | main | h1 | Failed API | Console warn/error | Suspicious | Screenshot |
|---|---:|---|---:|---|---:|---:|---|---|
| /dashboard | problem | http://localhost:3100/dashboard?week=2026-W23&type=week | 1 | Dashboard<br>Главная страница | 1 | 16 |  | route-dashboard.png |
| /analytics/dashboard | problem | http://localhost:3100/analytics/dashboard?week=2026-W23&type=week | 1 | Dashboard<br>Сводка по кабинету | 0 | 0 |  | route-analytics_dashboard.png |
| /analytics/orders | problem | http://localhost:3100/analytics/orders?from=2026-05-14&to=2026-06-12&tab=overview | 1 | Dashboard<br>Аналитика заказов FBS | 0 | 0 |  | route-analytics_orders.png |
| /analytics/funnel | problem | http://localhost:3100/analytics/funnel | 1 | Dashboard<br>Воронка продаж | 2 | 4 |  | route-analytics_funnel.png |
| /analytics/advertising | problem | http://localhost:3100/analytics/advertising?from=2026-05-29&to=2026-06-11&view=sku&group_by=sku&sort=spend&order=desc | 1 | Dashboard<br>Рекламная аналитика | 0 | 4 |  | route-analytics_advertising.png |
| /analytics/buyout | problem | http://localhost:3100/analytics/buyout | 1 | Dashboard<br>Аналитика выкупов | 0 | 2 |  | route-analytics_buyout.png |
| /analytics/returns | problem | http://localhost:3100/analytics/returns | 1 | Dashboard<br>Аналитика возвратов | 0 | 2 |  | route-analytics_returns.png |
| /analytics/search | problem | http://localhost:3100/analytics/search | 1 | Dashboard<br>Поисковая аналитика | 0 | 0 |  | route-analytics_search.png |
| /analytics/sku | problem | http://localhost:3100/analytics/sku | 1 | Dashboard<br>Маржинальность по товарам | 0 | 0 |  | route-analytics_sku.png |
| /analytics/storage | problem | http://localhost:3100/analytics/storage?weekStart=2026-W20&weekEnd=2026-W23 | 1 | Dashboard<br>Аналитика расходов на хранение | 0 | 8 |  | route-analytics_storage.png |
| /analytics/unit-economics | problem | http://localhost:3100/analytics/unit-economics | 1 | Dashboard<br>Юнит-экономика | 0 | 2 |  | route-analytics_unit_economics.png |
| /analytics/supply-planning | problem | http://localhost:3100/analytics/supply-planning | 1 | Dashboard<br>Планирование поставок | 0 | 0 |  | route-analytics_supply_planning.png |
| /cogs | problem | http://localhost:3100/cogs | 1 | Dashboard<br>Управление себестоимостью | 0 | 0 |  | route-cogs.png |
| /cogs/price-calculator | problem | http://localhost:3100/cogs/price-calculator | 1 | Dashboard<br>Калькулятор цены | 0 | 200 |  | route-cogs_price_calculator.png |
| /cogs/bulk | problem | http://localhost:3100/cogs/bulk | 1 | Dashboard<br>Массовое назначение себестоимости | 0 | 0 |  | route-cogs_bulk.png |
| /orders/list | problem | http://localhost:3100/orders | 1 | Dashboard<br>Заказы FBS | 0 | 0 |  | route-orders_list.png |
| /orders/integrity | problem | http://localhost:3100/orders/integrity | 1 | Dashboard<br>Целостность заказов | 0 | 0 |  | route-orders_integrity.png |
| /supplies | problem | http://localhost:3100/supplies | 1 | Dashboard<br>Поставки FBS | 0 | 0 |  | route-supplies.png |
| /shipments | problem | http://localhost:3100/shipments | 1 | Dashboard<br>Отправки | 0 | 0 |  | route-shipments.png |
| /settings | problem | http://localhost:3100/settings/notifications | 2 | Dashboard<br>Telegram Уведомления | 0 | 0 |  | route-settings.png |
| /settings/notifications | problem | http://localhost:3100/settings/notifications | 2 | Dashboard<br>Telegram Уведомления | 0 | 0 |  | route-settings_notifications.png |
| /settings/backfill | problem | http://localhost:3100/settings/backfill | 2 | Dashboard<br>Управление бэкфиллом | 0 | 0 |  | route-settings_backfill.png |
| /settings/cabinet | problem | http://localhost:3100/settings/cabinet | 1 | Dashboard<br>Кабинет | 0 | 0 |  | route-settings_cabinet.png |
| /settings/expenses | problem | http://localhost:3100/settings/expenses | 1 | Dashboard<br>Операционные расходы | 0 | 0 |  | route-settings_expenses.png |
| /settings/tax | problem | http://localhost:3100/settings/tax | 1 | Dashboard<br>Налоговые настройки | 0 | 0 |  | route-settings_tax.png |
| /settings/tariffs | problem | http://localhost:3100/settings/tariffs | 2 | Dashboard<br>Управление тарифами | 0 | 0 |  | route-settings_tariffs.png |
| [unauth]/dashboard | ok | http://localhost:3100/login?redirect=%2Fdashboard |  |  | 0 | 0 |  |  |