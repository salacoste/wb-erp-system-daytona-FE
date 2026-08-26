# Recon 2026-08-26 — Story 172.1-FE (Business Dashboard): комплаенс-разведка

> Разведка снята сессией, закрывшей эпик 171 (main `3992f195`), чтобы следующая сессия НЕ тратила контекст на повторный подсчёт. Цифры валидны для этого SHA; перед работой пересчитать дёшево одной командой (внизу).
> План стори: [`.omx/plans/172.1-migrate-the-business-dashboard.md`](../.omx/plans/172.1-migrate-the-business-dashboard.md) — authoritative (branch `cdx/epic-172-story-1-dashboard`, worktree `/private/tmp/wb-repricer-fe-172-1-dashboard`).

## Вердикт: FULL-цикл (крупнейшая стори миграции)

| Метрика | Значение |
|---|---|
| Owned surface | `src/app/(dashboard)/dashboard/**` (25 файлов: 15 prod + 10 тестов, ~3 100 строк) + `src/components/custom/dashboard/**` (146 prod + ~60 тестов) |
| **Palette-сайты** | **339 строк в 92 файлах** (route-tree: 3 файла / 19 строк — DashboardAlerts 6, DashboardStatusStrip 8, ReportPendingBanner 5; custom: 89 файлов / 320 строк) |
| **Hex-сайты** | **78 строк в 31 файле** custom/dashboard (концентрация: `chart-config.ts`, `trends-config.ts`, `expense-chart-config.ts`, `index-metrics.ts`, `sales-price-level.ts` + карточки-графики; в route-tree 0) |
| Топ по палитре | DataAvailabilityBadge 13, GrossMarginCard 12, MarginCard 12, SeasonalInsightsCard 12, NetProfitCard 9, ProfitBreakdownPopover 8, DashboardStatusStrip 8, SalesCogsMetricCard 7, TheoreticalProfitCard 7 |
| Полный список файлов | `rg -l '<PALETTE-REGEX>' src/app/\(dashboard\)/dashboard src/components/custom/dashboard --glob '!**/__tests__/**' --glob '!**/*.test.*'` (см. регекс внизу) |

## Канон соответствий (171.4-171.9, hue-preserving)

1. **Валентные текст-цвета** (`text-green-600`/`text-red-600` в DeltaIndicator/TrendBadge/RankIndicator и т.п.) → `text-status-success` / `text-status-error` (171.9 valence канон).
2. **Бейджи/плашки** (`bg-X-100 text-X-800 border-X-200`) → `border-X/40 bg-X/10 text-X` где X = status-success/status-information/status-warning/status-error; серые → `border-border bg-muted text-muted-foreground` (171.6 badge-канон).
3. **Chart hex** → CSS-переменные 171.4-канона (parity по живому `analytics/forecast/components/ForecastChart.tsx`): grid/axisLine/tickLine → `var(--color-border)`; tick fill → `var(--color-chart-axis)`; серии/линии → `var(--color-chart-1..N)` категорийные; alert-заливки → status vars с альфой.
4. **Прочие** (`bg-gray-50` и т.п.) → muted/secondary token по смыслу; светло-жёлтые warnings → status-warning.
5. НЕ трогать: поведение/контракты/локаль/запросы; тест-пины на palette-подстроки обновлять на token-подстроки (re-pin, не weakening — 171.9 урок).

## Рекомендации следующей сессии

- **Волновое делегирование** (§10 контекст-менеджмент): 3 волны executor-сабагентов по ~30 файлов (route-tree + custom в 2 волны), каждая волна → targeted vitest; затем гарды + полная валидация.
- Гарды: 2 шт. (route-tree каталог 15 файлов; custom-tree каталог — pinned-count на 146, слишком хрупко → пин self-check файлов + полный no-palette/no-hex scan каталога без pinned-count; при необходимости закрепить канон исключений).
- Ревью: дифф ~>1 000 строк → гарантированные Trigger-эскалации (кумулятивные находки >12) — закладывать ≥3 прохода (§6.2).
- Baseline targeted: `npm test -- --run 'src/app/(dashboard)/dashboard' 'src/components/custom/dashboard'` (снять N/M до правок).
- E2E: 3 спеки (`dashboard-metrics`, `dashboard-period`, `dashboard-session-fixes`) — прогон на ветке через npm-обёртку.
- Тесты с palette-пинами: grep `__tests__` на `green-|red-|blue-|gray-|amber-|yellow-` перед правками (как в 171.9: 6 пинов).

## Быстрая перепроверка (одной командой)

```bash
rg -c '\b(?:text|bg|border|ring|fill|stroke)-(?:gray|grey|blue|green|red|amber|orange|yellow|purple|lime|rose|sky|slate|zinc|neutral|stone)-(?:50|100|200|300|400|500|600|700|800|900|950)\b' src/app/\(dashboard\)/dashboard src/components/custom/dashboard --glob '!**/__tests__/**' --glob '!**/*.test.*' | awk -F: '{s+=$2; f++} END {print f" files, "s" lines"}'
```

Ожидание на `3992f195`: 92 файла / 339 строк (+ 78 hex в 31 файле).
