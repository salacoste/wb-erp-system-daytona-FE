# P2 /80-sweep: repo-wide `text-*/80` WCAG-аудит — 9 ремедиаций + слоистые замеры + 1 owner-exception

**Status**: done (2026-09-05, сессия-6; PR #410, merged)
**Branch**: `debt/p2-80-sweep` (worktree `/private/tmp/p2-80-sweep`, base main `54df6b86`)
**Owner-track**: P2 качество; реестр §3.4 + APPEND #2 (repo-wide text-/80 family, scanner-extension candidate)

## Дефект → скоуп волны

Зарегистрированное семейство `text-*/80` (исторические 3.2-3.45:1 light). Живой grep-инвентарь: **16 prod-сайтов, 4 уникальных класса** — 5 статических (A1-A5) + 11 hover-затемнений (B1-B11, паттерн `text-X hover:text-X/80` — hover СНИЖАЕТ контраст). Канон замера = волна-3 (слоистый композитинг над фактическим стеком монтирования, worst-end градиентов, hover-слои включая row-hover `muted/50` и hover:bg-тинты, обе темы; текст ≥4.5:1, иконки/non-text ≥3:1 WCAG 1.4.11).

## Исход (16 = 9 + 6 + 1)

- **9 remediated**: A1 WritebackSafetyAcknowledgement (3.04→fg 14.18; full warn 4.24 тоже FAIL на warn/10>bg) · A5 ProfitBreakdownPopover (3.33→full 4.81 на opaque popover) · B1/B3 primary-линки (hover 4.01→убран дим; base 5.39) · B4 CalculationInProgressDisplay (hover 2.95→ghost accent-pair 14.77) · B5 AutoFillBadge (hover 3.04→ghost pair) · B6 AutoFillWarning X-icon (hover 2.78→hover:full 3.76 ≥3) · B9 NetProfitCard (hover 2.96 на grad error-end→убран дим; base 4.09) · B10 OrdersEmptyState (hover 4.13→variant-link default hover:underline; base 5.62/8.67).
- **6 PASS-as-is** (аттестованы инлайн-комментариями с числами): A3 RateLimitWarning destructive/80 текст 4.58 (маржа 0.08 — «flip on next touch») · A4 RankIndicator Medal 3.33/8.80 на card (row-hover worst 3.22) · B2 MarginAggregatedTableRow 4.01 · B7 TaxWarningBanner hover 3.04 (маржа 0.04) · B8 TokenHealthBanner hover 3.13 (скрытый ghost hover:bg-accent слой замерен) · B11 PnLSectionHeader 4.13 — иконки ≥3.
- **1 documented-exception → owner-ledger**: A2 OrganicTab:28 `text-financial-positive/80` = 3.51 light FAIL — делибератная идиома тиров iROAS (168.3/168.6, запинена OrganicTab.test.tsx). Альфа-альтернативы НЕпроходны: /90=4.23, /85=3.85 — между full (5.13) и /80 нет проходного интервала. Варианты: структурное различение тиров (full + opacity на иконке/бейдже — рекомендовано) / accept-exception. До решения owner — консервативно сохранена.

## Изменения (24 src-файла: 19 M + 5 новых тест-файлов; +3 closeout-дока + артефакт)

9 prod-ремедиаций + 6 PASS-as-is аттестаций-комментариев + докблок-фикс OrdersEmptyState (поверхность = page bg, не Card; dark 8.67 не 8.27) + prettier-нормализация HistoricalMarginContext.test.tsx. Тесты: 5 новых style-pin файлов + 4 дополненных (RED 9 failed → GREEN 50 passed; OrganicTab 8/8 и PricingTable 17/17 consumer-пины целы).

## Dev Agent Record (3 прохода, Trigger 2+3)

### Post-1st-pass-review fixes (2026-09-05)
Findings (1M+5L; APPROVE-with-riders, все числа воспроизведены Δ≤0.06): канон-пробел selected-row стеков (`ProductTableRow.tsx:58` info/10-20: primary 4.18 / warn 4.19-3.58 <4.5 текст — full-token pre-existing класс, волна его УЛУЧШИЛА 3.37→4.18); аттестация A4 (3.23 dark не воспроизводится; card = 3.33/8.80); A3 маржа 0.08; residual full-warn-on-warn/10 кластер (4.24); B10 меняет интент 172.14-FE (color-shift → underline — нарушение и был аффорданс). **APPLIED**: A4-числа в артефакт; остальное — DISPOSITIONED (accepted-deviation + registry follow-ups + раскрытие).
### Post-2nd-pass-review fixes (2026-09-05)
Findings (1H+1M+3L; APPROVE-with-riders, 24 аттестации Δ≤0.01): OrganicTab-exception требует формальной регистрации; 4.24-кластер в реестр; докблок OrdersEmptyState (Card → page-bg); PASS-as-is сайты без обоснований; атрибуция 168.3 (класс старше — origin 120.7-FE, токенизация 168.7). **APPLIED**: докблок-фикс + 6 комментариев-аттестаций; A2 → owner-ledger; атрибуция NOTED.
### Post-3rd-pass-review fixes (2026-09-05, convergence — Trigger 2: кумулятив 15>12; Trigger 3: проход-1 6>5)
Findings (2M+2L; APPROVE-with-riders, 33/34 числа Δ=0.00): R1 комментарий в CalculationInProgressDisplay; R2 ledger-запись A2 + артефакт; NetProfitCard dark 11.14 = sibling-стек (консервативное направление, вердикт не меняет); docs-дрейф сдвига строк (гейт перепрогнан — 0). **APPLIED**: R1-комментарий; R2 = этот closeout; L-ноты в артефакт.

**Trigger-4-квалификатор**: числовые аттестации этого артефакта — unaudited meta-claims по Trigger 4 RECOMMENDED-ветке (сторя не codification); независимая верификация = 3 ревью-калькулятора (Δ≤0.06 / ≤0.01 / =0.00).

## Evidence

vitest полный **19448/0** (первый прогон 19447/1 — флейк `useStorageAnalytics` timer-race под нагрузкой, соло 33/33, финальный полный 19448/0; логи `/tmp/80-sweep-vitest-full{,2}.log`) · lint 0/0 · tsc 0 · build --webpack 0 · boundary **118 = baseline** ×2 (семантические токены, /80 вне LEGACY_PALETTE) · docs 0 · locale 4 · lessons 0 · privacy 3 pre-existing · prettier на изменённых чисто · diff-check 0 · SANITY харнесса: 7.81/10.05 · 5.13/9.38 · 4.78/8.77 · ANCHOR-2 4.34/10.89 (воспроизведены до замеров; харнесс `/tmp/p2-80-contrast.mjs`).

## Follow-ups (зарегистрированы реестром §9)

1. **Full-warn-on-warn/10 кластер** (4.24 <4.5 текст): WritebackSafetyAcknowledgement:42-55, AutoFillWarning:49, TaxWarningBanner:46, TokenHealthBanner:86-91, AutoFillBadge:97 — отдельная волна (не /80-семья).
2. **Selected-row стеки** (ProductTableRow info/10-20): primary-текст 4.18, warn 4.19/3.58 — full-token pre-existing класс; канон-расширение + fg-on-tint при следующей волне.
3. **A3 RateLimitWarning** маржа 0.08 — full destructive при следующем касании.
4. **B10-интент 172.14-FE** раскрыт: color-shift заменён underline (color-shift и был /80-нарушением).
5. **A2 OrganicTab** — owner-decision (структурное различение рекомендовано).

## Change Log

- 2026-09-05: Волна исполнена; PR #410. (executor opus + 3 doc-фикс-волны оркестратора; 3 ревью-прохода opus свежим контекстом, каждый с независимым контраст-калькулятором).
  **Lessons:** (1) Hover-затемнение — системный паттерн-нарушитель: 11/16 /80-сайтов были hover-димами, понижавшими контраст (worst 2.78). (2) Порог зависит от канала: 3.33 = FAIL как текст (popover), PASS как иконка (Medal) — классифицируй до вердикта. (3) Альфа-тюнинг не спасает: /85=3.85, /90=4.23 — между full и /80 нет проходного интервала, только структурные ремедии.
