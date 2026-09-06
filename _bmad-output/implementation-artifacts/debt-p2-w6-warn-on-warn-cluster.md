# P2 Wave-6: full-warn-on-warn/10 cluster + selected-row stacks (WCAG AA)

**Status**: done (2026-09-06, сессия-8; PR #417)
**Branch**: `fix/wcag-warn-on-warn-cluster` (worktree `/private/tmp/wcag-warn-wave`, base main `d8743fd5`)
**Owner-track**: реестр §9 follow-up (1)+(2); handoff SESSION6 §3.0 items 4-5

## Дефект (замер канона волны-3/6, харнесс `/tmp/w6-contrast.mjs`, sanity 4/4)

12 текст-FAIL пар в 6 файлах (реестр знал 5 компонентов; замер вскрыл 4 НОВЫХ, включая катастрофу **1.41 dark**: TaxWarningBanner Link `text-white` на solid warn):
- **A1** WritebackSafetyAcknowledgement: body 3.99/9.18; вложенный code-chip warn/20-on-warn/10 **3.15** (худший класс репо).
- **A2** AutoFillWarning: body 4.24/10.90 (card-база).
- **A3** TaxWarningBanner: body 3.99; Link text-white на solid warn **4.81/1.41** + hover /90 4.02; X-hover warn/80 на РЕАЛЬНОМ стеке M **2.95** (80-sweep-пин 3.04 мерил по bare-bg — невалиден).
- **A4** TokenHealthBanner: body+lastError+Link 4.24/11.75 (BG-база — монтируется ВНЕ muted/50 main, layout.tsx:110).
- **A5** AutoFillBadge: warn 4.24; auto success/10 **4.49** (новый, реестром упущен); restore-hover warn на accent **4.41** (80-sweep аттестация 14.77 мерила fg-пару — класс оставался warn).
- **B** ProductTableRow warn-чип на 4 статусах строки: 4.24/4.07/**3.70**/**3.21** (реестр 4.19/3.58 ≈ воспроизведён).
- **B2** ProductMarginCell: polling-чип info-on-info/10 на selected **4.35/3.78**; margin-pos **4.44/3.82** (это и есть реестровский «primary 4.18» — нейтральные fg-пары строки PASS).
- Mount-chain открытие: dashboard main = bg-muted/50 (layout.tsx:116) → базы M/BG/card; ui/alert bg-background tw-merge-ится tint'ом; selected-hover info/20 перекрывает table hover muted/50.

## Ремедии (все — семантические токены, boundary 118 не двинулся)

- **fg-on-tint** (`text-foreground` на сохранённом /10-тинте; валентность = тинт+бордер+иконка): A1 body + снят вложенный /20; A2; A4; A5 оба бейджа (обе API); B warn-чип; B2 polling-чип + margin-pos. Post-remedy: 13.34-16.10 light / 9.94-15.89 dark на ВСЕХ статусах строк.
- **A3 Link**: `text-status-warning-foreground` (theme-aware, 4.81/11.41) + `hover:underline` (B10), hover-dim /90 снят.
- **A3 X**: hover полный warn (4.07/10.03 ≥3; /80-паттерн снят).
- **A5 restore**: `hover:text-foreground` (14.77/14.50 — канонная пара 80-sweep).
- **B chart-2:129** (3.71 dark selHover) — НЕ тронут: C5-owner (chart-токен-трек).
- Attestations PASS-as-is инлайн: иконки A1/A2/A4 (≥3), X-кнопки A2/A4 (пины 80-sweep воспроизводятся: 3.76/3.13), A1:72-passive fg (обновлён до in-situ 13.34/12.41), B нейтральные fg + кнопки; margin-neg error оставлен (5.66/4.87 — worst kept pair, PASS).

## Dev Agent Record (3 прохода opus свежим контекстом; P1 с независимым калькулятором)

### Post-1st-pass-review fixes (2026-09-06 — APPROVE-with-riders, 6: 3M+3L)
Независимый пересчёт подтвердил ВСЕ pre-remedy FAIL-числа точно (4.24/4.07/3.70/3.21, 4.35/3.78, 4.44/3.82, 4.41, 2.95) и все post-remedy пороги (worst kept 4.87; fg-on-tint ≥9.94). Findings — только аттестационные числа: [M] инфляция флоров («≥13.34 на каждом статусе» — реально 10.74/9.94; «≥12.01» — реально 10.59/10.48); [M] AutoFillBadge success/10-число переиспользовано с warn/10 (реально 14.11/15.36); [L] MAIN-трио внутренне-несогласовано (физически-корректная база 250: 4.07/13.62); [L] layout.tsx:107→:116; [L] «41/41» нес reproduced. **APPLIED** (оркестратор, doc-класс).
### Post-2nd-pass-review fixes (2026-09-06 — APPROVE-with-riders, 5: 2M+3L)
Runtime-sweep чист (cn/tw-merge конфликтов нет; иконка/текст разведены; тесты позиционно-независимы; RU-копия байт-идентична — только pretier-перенос). Residuals того же аттестационного класса: [M] cogs-контракт «≥13.34»; [M] selected-stack-хедер «13.34/12.41»; [L] legacy-бейдж per-tint недолег; [L] editor-пин удовлетворялся иконкой (мис-пин); [L] TokenHealth /80-расхождение легально (разные стеки) — нужна заметка. **APPLIED** (оркестратор): все 5 (editor-пин перепиннут на icon-scoped regex + body-fg; заметка стек-зависимости с трипвайром).
### Post-3rd-pass-review fixes (2026-09-06 — APPROVE, сходимость 6→5→1)
Все residual'ы LANDED (strip-compare diff-2→diff-3: ноль runtime-строк дрейфа). 1 LOW: коммент editor-контракта переописывал дискриминатор (реальный — runtime style-тест). **APPLIED** (оркестратор): коммент переписан.

**Trigger-учёт**: Trigger 3 (P1 6>5) → P3 обязательный; сходимость на P3 (1 ≤ 5). Цветовой item: P1 с независимым калькулятором (Δ-таблица claim-vs-mine), P2 с механическим strip-compare диффов.

## Evidence

Харнесс sanity **4/4** (7.81/10.05 · 5.13/9.38 · 4.78/8.77 · ANCHOR-2 4.34/10.89). RED **15 failed/17 passed** (все 15 новых пинов; до правок) → GREEN **41/41**; wave-файлы финально 39/39; консьюмеры 94 файла/**1727** зелёные. Полный vitest **19559/0** (флор 19537→19559, +22; CLAUDE.md тем же PR) · lint 0/0 · tsc 0 · build --webpack 0 · **boundary 118 = baseline** · docs 95 · locale 4 · lessons 0 · privacy 0 · prettier чисто · diff-check 0 · манифест-пинов 0 (14 файлов). Логи `/tmp/w6-*.log`.

## Остатки (реестр §14)

1. B chart-2 dark selHover 3.71 — C5-owner (chart-токен-трек, с остальными 118).
2. A3 borders warn/40 = 2.66 light — существующий 1.4.11-owner-rider (§3.3).
3. Аттестационные числа в реестре §9 (4.24 кластер) — обновлены этой волной до in-situ значений (3.99/3.15 и пр.).
4. `//`-комментарий внутри opening-тега (TokenHealthBanner) — легальная форма (ESLint+tsc зелёные), но хрупкое место при будущем реформатировании.

## Change Log

- 2026-09-06: Item исполнен; PR #417. (executor opus: 2 фазы — замер-инвентарь → ремедии; 3 ревью-прохода opus свежим контекстом; riders/residuals — оркестратор, doc-класс).
  **Lessons:** (1) Реальный стек меряется через mount-chain (main bg-muted/50), не через bare-bg — 80-sweep-пин 3.04 был невалиден. (2) Аттестационные числа обязаны быть per-tint/per-stack: переиспользование «проходного» числа на соседний тинт — систематический дрейф. (3) Иконка/текст в одном цветовом токене — разные пороги: разведение пинов по элементу ловит мис-пины.
