# Debt P3: CABINET-BROWSER-02 pre-existing red — root-cause + re-pin (сессия-9, V19)

> **Status**: done · **PR**: [#421](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/421) · **Branch**: `debt/cabinet-browser-02-repin` @ `d03123fa` (worktree /private/tmp/cabinet-browser-02)
> **Источник**: HANDOFF-2026-09-06-V18 §3.0 №7 + реестр §12 residual FE-D5; исполнен оркестратором сессии-9 (2026-09-08)
> **Класс**: e2e spec re-pin (test assertions → обязательные 2 ревью-прохода по CLAUDE.md)

---

## Root cause (recon: explore-агент, sonnet; верифицирован 2 ревью-проходами opus)

**Стухший пин спеки, НЕ продуктовая регрессия. Гипотеза handoff (интеракция с retry-семантикой FE-D1) фальсифицирована.**

- Тест `[P0] [CABINET-BROWSER-02] recovers deliberately...` (e2e/onboarding.spec.ts:797, describe 'Story 167.5 browser-owned evidence') падал на строке 1057: `await expect(recoveryAlert).toHaveCount(0)` → **Expected 0 / Received 1**.
- Это **второй из двух идентичных пинов-близнецов** `toHaveCount(0)`; первый (create-resubmit, ~1008) перепиновил `6ac32024` (174.4) с комментарием, документирующим ровно эту семантику; второй был пропущен.
- Семантика продукта (задокументирована в спеке и верифицирована из исходников обоими ревьюерами): `onSubmit` никогда не чистит `recoveryError`; recovery-эффект quiet-return для локально-диспетчированных операций (useCabinetCreationRecovery.ts:129-137); margin-алерт размонтируется ТОЛЬКО через PUT#2-success навигацию (`settleUpdateSuccess` → `router.push('/wb-token')`); fall-through-nuller (147-152) стирает только TOKEN/SAFE тексты. Пока мок держит `successfulPutGate`, алерт структурно не может исчезнуть.
- **FE-D1-гипотеза невозможна**: обе мутации потока имеют явный `retry: false` (useCabinetCreateMutation.ts:76, useCabinetTaxSettings.ts:59), 4xx в моках нет, `shouldRetryMutation` на путь не консультируется. «Expected 1, Received 2» из памяти — сигнатура WB-TOKEN-BROWSER-02 (другой тест, зафикшен FE-D1).
- Старый пин **никогда не кодировал зелёное поведение** (форензика прохода-1: quiet-guard существовал уже в 03250e1b — авторском коммите обоих близнецов; red с момента авторства, числился в 174.4-инвентаре 67 pre-existing).

## Фикс

Re-pin по прецеденту 6ac32024 (commit `d03123fa`, 9+/1−, 1 файл): `toHaveCount(0)` → `toHaveText(MARGIN_RECOVERY_MESSAGE)` + документирующий комментарий (английский, стиль 6ac32024; БЕЗ line-cites — новый комментарий дрейф-устойчив, в отличие от близнеца). Литерал байт-верифицирован против константы `cabinetCreationSubmission.ts:46-47` (86 chars). Компонентный код НЕ тронут.

## Pre-flight

- Story-105.2-grep: item не был починен (red на main). **Манифест 174.3: `e2e/onboarding.spec.ts` — 0 пинов** (реген не требовался). Контракт-тесты baseline: 33/33.
- Occupancy: 0 worktree, ветка одна.

## Validation (финальное дерево `d03123fa`)

| Гейт | Результат |
|---|---|
| vitest полный соло | **19559/0** exit 0 |
| lint / tsc / boundary | 0/0 · 0 · 3 exceptions |
| build --webpack | exit 0 |
| docs / lessons / locale | exit 0 · 0 · 4 |
| privacy | **exit 0 на дереве item'а** (fallback=HEAD-diff=1 файл); main-checkout = exit 1 — pre-existing docs-примеры, см. ниже |
| контракты 174.3 | 33/33 |
| git diff --check / дерево | чисто |

## Live e2e (канон §3: npm-обёртка, ≤2 прогона/час, PM2-протокол)

1. **Негативный контроль** (main, PM2-dev :3100): тест падает ровно на перепинованном ассерте — `toHaveCount` на `#cabinet-creation-recovery-error` **Expected: 0 / Received: 1** (совпадает с бисект-сигнатурой сессии-8 и 174.4-инвентарём). Пин падает на незафикшенном поведении ✓. (Первая попытка репро не дошла до тестов — preflight-гвард, стек был мёртв после второго за день cold-boot'а Docker/PM2; восстановлен, прогон повторён.)
2. **Позитивный прогон** (worktree-dev `next dev --webpack -p 3100`, окно свапа минимально): **CABINET-BROWSER-02 PASSED (3.3s)**; 4 passed / 1 skipped (Manager-creds, известный). **Downstream-пины 1066-1107 (Сохранение…, гейт-релиз, счётчики запросов, заголовки, history, console-гварды) — первый живой прогон, все зелёные** (закрыт coverage-gap ревью-проходов). PM2 восстановлен сразу: `:3100→200`.
3. e2e-артефакты зачищены (e2e/.auth, test-results, playwright-report — в обоих чекаутах); `.gitkeep` восстановлен; privacy-пергон на дереве item'а = 0.

## Post-1st-pass-review fixes (2026-09-08)

Review pass 1 (code-reviewer, opus, свежий контекст) — VERDICT: **APPROVE**, 0 blocking:

- **Regression-laundering проверен из исходников**: полный обход `setRecoveryError` call-сайтов — ни один путь не чистит margin-алерт на update-retry; форензика: старый пин никогда не был зелёным.
- DOM-безопасность `toHaveText`: alert = bare `role="alert"` div, единственный чайлд = текст сообщения (эмпирически: идентичный паттерн строки 1035 проходит в red-прогонах).
- LOW-файнды: (a) прецедент-нарратив уточнён — «байт-идентичны с 03250e1b» относилось к маркер-модулю; хуки менялись post-174.4 (D-1/FE-D5), сохраняя no-clear семантику; (b) стухший line-cite в ПРЕДСЕСТВУЮЩЕМ комментарии близнеца (spec:1019 → quiet-guard теперь :129) — optional follow-up вне диффа; (c) coverage-gap: пины 1066+ не исполнялись — закрыт живым прогоном (см. выше).

### Post-2nd-pass review (2026-09-08)

Review pass 2 (code-reviewer, opus, СВЕЖИЙ контекст) — VERDICT: **APPROVE**, 0 blocking. Независимо: перечислены все 5 достижимых значений `recoveryError` в этом потоке — новый пин не может пройти на «чужом» алерте (маркер `UPDATE_PENDING` блокирует перезапись: `markerAllowsUpdate=false` для pending-фаз); таймлайн-прогулка мока — детерминированно, элемент не может отцепиться до ассерта (гейт держит PUT#2 до строки 1074, ассерт на 1063); каждый клайм комментария сверен с исходником; фикс-гигиена 9+/1−, один хунк.

**Meta-claim qualifier**: аттестационные формулировки этого артефакта о полноте ревью-покрытия — unaudited meta-claims (Trigger 4); обе ревью-статьи с их собственными coverage-gap декларациями — первичный evidence.

## File List

- `e2e/onboarding.spec.ts` (d03123fa, re-pin 9+/1−)
- `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` (§17 APPEND)
- `_bmad-output/implementation-artifacts/debt-p3-cabinet-browser-02-repin.md` (этот артефакт)

## Change Log

| Date | Change |
|---|---|
| 2026-09-08 | Создан; recon → re-pin → 2×APPROVE → live negctl(red)+pos(green) → гейты зелёные |

**Lessons:** (1) близнецы-пины: перепиновывая ассерт-класс, грепни ВСЕ близнецы в том же проходе — фикс-один-пропусти-один дал red на 2 недели (2) privacy-гейт на чистом дереве сканирует HEAD merge-diff: доки-примеры всплывают в момент merge, не в момент написания (3) негативный контроль сверяй с зарегистрированной сигнатурой: stack-шум waitForURL в логе — не тот ассерт
