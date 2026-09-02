# P2: /10-family ASB — AcceptanceStatusBadge success/warning → solid-пары (WCAG AA)

**Status**: done (2026-09-02, сессия-2 оркестратора V15; PR — см. Change Log)
**Branch**: `debt/p2-10-family-asb` (worktree `/private/tmp/p2-10-family-asb`, base main `36916754`)
**Owner-track**: P2 качество/консистентность; residual PR #384 (D-4 закрыл /15-family в этом же файле, /10-остаток остался).

## Дефект (verified live, pre-flight 105.2)

`AcceptanceStatusBadge.tsx` COLOR_CLASSES: `success`/`warning` рендерились /10-тинтами — light-контраст текста **4.49/4.24 <4.5** (WCAG AA 1.4.3 fail; замер из токенов globals.css, float blend над card). `high` уже solid (D-4, PR #384). `destructive` /10 = 5.55 light — AA pass, оставлен с документацией. Dark-тема всех вариантов ≥5.54 — давления нет.

## Tasks

- [x] Pre-flight: live-замер обеих тем до/после (оркестратор + дважды независимо перепроверен ревьюерами)
- [x] Реализация (executor sonnet): success/warning → `bg-status-X text-status-X-foreground border-status-X/40`; destructive документирован; tooltip `text-status-warning` на popover замерен 4.81/12.71 — pass, только комментарий
- [x] Тест-пины перепинены в ОБОИХ тест-файлах (AcceptanceStatusBadge.test.tsx + story-44.43 — обоснованное отклонение от 2-файлового манифеста, прецедент D-4)
- [x] 3 ревью-прохода (Trigger 3: плотность 6 в проходе 2); все findings APPLIED/DISPOSITIONED
- [x] Валидация: vitest полный 19421/0 (флор не сдвинут — ре-пины без добавления) · lint 0/0 · tsc 0 · boundary 459=459 · docs 95 · locale 4 · prettier · git diff --check
- [x] e2e не требуется (не e2e-видимое поведение: классы пинятся unit-уровнем; canonical-семья не в 174.3-пинах)

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-02)

Findings (5: 1 LOW / 4 NOTE; VERDICT APPROVE): точность чисел в комментариях (4.26→4.24, 5.54→5.55 + метод-нота), dark-значения в комментарии, формулировка про бордеры (/40), регистрация сиблингов. **APPLIED** всё doc-классовое (оркестратор); сиблинги → Follow-ups.

### Post-2nd-pass-review fixes (2026-09-02)

Findings (6: 1 MEDIUM / 2 LOW / 3 NOTE; VERDICT APPROVE). Ключевая находка:
- **F1 [MEDIUM] коллапс эскалации warning/high**: после P2 обе варианта рендерили идентичные классы (D-4 сделал high solid первым, P2 подтянул warning) — визуальный градиент >1.50 потерян, оставалась только иконка/лейбл. **APPLIED** (executor): `high` border `/60` vs warning `/40` (хроматический вес; текст-контраст не затронут — бордеры вне 1.4.3), комментарии обновлены, 3 сайта пинят /60 token-exact.
- F2 метод-нота переформулирована (float blend of 8-bit token colors). F3 честный титул теста. F4-F6 DISPOSITIONED (сиблинги → follow-ups; pre-existing hygiene).

### Post-3rd-pass-review fixes (2026-09-02, convergence)

Findings (5: 2 MEDIUM / 3 LOW; VERDICT APPROVE — сходимость):
- F1+F2 [MEDIUM]: мой предписанный титул «renders calendar-compatible border colors» + соседний комментарий утверждали несуществующий контракт (COLOR_CLASSES приватен; календарь потребляет свой COEFFICIENT_STATUS_CONFIG) — неполная пропагация фикса. **APPLIED**: титул → «renders per-status border tint classes», комментарий переписан.
- F3 [LOW]: формулировка «(now /40…)» → «(/40 for success/warning, /60 for high)». **APPLIED**.
- F4 [LOW]: ~100 сиблинг-/10-сайтов по репо — семейство НЕ закрыто этим item'ом. **DISPOSITIONED** → Follow-ups.
- F5 [LOW]: pre-existing vacuous tooltip-a11y тесты (титулы обещают keyboard-focus, ассертят testid/aria). **DISPOSITIONED** → hygiene follow-up.

**Trigger-учёт**: проход 1 = 5 (≤5), проход 2 = 6 (>5 → Trigger 3 armed), проход 3 = 5 (≤5 — сходимость). Кумулятив 16.

## File List

Modified (3):
- `src/components/custom/price-calculator/AcceptanceStatusBadge.tsx` — COLOR_CLASSES success/warning solid (+border /40), high border /60 (эскалация), destructive /10 документирован (5.55), tooltip-замер комментарий
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.test.tsx` — ре-пины классов/borders, честный титул+комментарий calendar-блока
- `src/components/custom/price-calculator/__tests__/AcceptanceStatusBadge.story-44.43.test.tsx` — ре-пины (fixture + AC1.3 + AC5.2)

## Гейты (финальное состояние)

vitest полный 19421/0 · lint 0/0 · tsc 0 · boundary 459=baseline 459 · docs exit 0 (95) · locale 4 · prettier clean · diff --check clean. Манифест 174.3 файлы НЕ пинит (проверено pre-flight) — регенерация не требовалась.

## Follow-ups (зарегистрированы)

1. **~100 сиблинг-/10-сайтов** repo-wide (`text-status-X` на `bg-status-X/10` ≈4.2-4.3 light): AutoFillBadge, TurnoverDaysInput, TwoLevelPriceHeader, MarginSlider, WarehouseSelect, PresetIndicator, DeliveryDatePicker:157, MonitorPageContent и др. — та же AA-fail математика; скоуп = owner-sweep residual (родственно boundary-459 lane), НЕ закрыто этим item'ом.
2. Pre-existing vacuous tooltip-a11y тесты в обоих ASB-файлах (титулы vs ассерты) — hygiene-кандидат.

## Change Log

- 2026-09-02: Item исполнен конвейером A–J (executor sonnet + 3 fix-волны; 3 ревью-прохода opus свежим контекстом; каждый проход независимо пересчитывал WCAG из токенов — все числа воспроизведены). Контраст: success/warning light 4.49/4.24 → 5.13/4.81 (solid), dark ≥8.0; эскалация high/warning восстановлена бордером /60-vs-/40.
  **Lessons:** (1) Фикс одного варианта («high» в D-4) создаёт коллапс при фиксe соседа («warning») — проверяй пары на идентичность классов после solid-миграций. (2) Комментарий-числа контраста обязаны указывать метод замера — иначе ревьюер-пересчёт «опровергает» верный вывод. (3) Титул теста — тоже контракт: «calendar-compatible» подразумевал несуществующую связь с календарём.
