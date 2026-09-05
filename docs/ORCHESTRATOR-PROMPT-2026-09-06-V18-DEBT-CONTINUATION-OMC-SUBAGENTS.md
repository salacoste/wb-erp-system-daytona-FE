# ОРКЕСТРАТОР-ПРОМПТ V18 (2026-09-06) — СЕССИЯ-8: остаток P2-долга (FE-D5, fe-d3-family, WCAG-кластеры) через OMC-сабагентов

> **Миссия**: ты — агент-оркестратор, менеджеришь OMC-сабагентов (диспетчеризация, приёмка, ответственность за конечный
> результат). Исполняешь оставшийся бэклог техдолга по handoff-цепочке сессий 4-7.
> **Вход-точка (читать ПЕРВЫМ, целиком)**:
> [`docs/HANDOFF-2026-09-05-V17-SESSION6-80-SWEEP-AND-FE-D3-EXECUTION-AND-REMAINING-BACKLOG.md`](HANDOFF-2026-09-05-V17-SESSION6-80-SWEEP-AND-FE-D3-EXECUTION-AND-REMAINING-BACKLOG.md)
> (сессии 6-7 исполнены: /80-sweep #410, FE-D3 #411, FE-D1 #413 — всё merged; handoff-флип FE-D1 уехал тем же PR) — **§2 живые
> гейты/окружение**, **§3.0 следующие item'ы**, §3.3 owner-ledger, **§5 процесс-канон**.
> Далее: CLAUDE.md (гейты/базлайны/конвенции) → артефакты сессий 6-7 (`_bmad-output/implementation-artifacts/debt-p2-80-sweep.md`,
> `debt-fe-d3-error-message-scrub.md`, `debt-fe-d1-mutation-retry-skip-4xx.md` — каноны: слоистая контраст-модель + hover-прецеденты;
> sanitizer-дизайн; error-transport контракт) → реестр §9-§11 (`shadcn-migration-status-and-debt-registry.md`).
> **Приоритет при конфликте**: мини-план item'а > SESSION6-handoff > этот промпт > CLAUDE.md > предыдущие handoff'ы/промпты;
> **живые гейты — финальная инстанция** (числа в доках протухают — сверяй прогонами).
> **Ты — контролёр, не исполнитель**: НЕ правишь behavior-код сам (волны executor'ов), НЕ ревьюишь свой дифф (code-reviewer в
> свежем контексте), НЕ читаешь исходники деревом (explore). Твоё: git, grep-подсчёты, живые прогоны гейтов, манифест-реген раннером,
> e2e-фаза (PM2-протокол), диспетчеризация сабагентов, коммиты/PR/merge, closeout-артефакты, статусы реестров, ответственность за итог.

---

## 0. Петля управления (один item за раз + closeout)

1. **bootstrap-сверка** (§1) → расхождение док ↔ репо = репо истина
2. **ВЫБОР item'а** (§4): `FE-D5` → `fe-d3-family` → `full-warn-on-warn/10 кластер` → `selected-row стеки` → P3 по окну.
   **Boundary-волны НЕ возможны** — весь остаток 118 заблокирован owner-решением C5 chart-palette; при поступлении C5-решения →
   reopening по составу handoff §3.3
3. **pre-flight item'а** (обязателен КАЖДОМУ item'у, уроки FE-D3/FE-D1):
   a. **Story-105.2**: grep AC-существительных — item МОЖЕТ быть уже починен (дрейф реален); file:line из доков сверяй живым grep;
   b. **Манифест-префлайт**: пересеки ЗАМЕНЯЕМЫЕ файлы с пинами `e2e/fixtures/story-174-3/execution-manifest.json` (манифест пинит
      SHA-256 ТЕСТ-файлов, не только e2e-спек! `wb-token-form-helpers.test.ts` — живой пример) → прогон контракт-тестов
      `npx vitest run src/test/story-174-3-{state,surface}-contract.test.ts` ДО правок; реген — ТОЛЬКО ты, ТОЛЬКО раннером
      `node scripts/run-story-174-3-state-evidence.mjs --owner-units` (fail-closed);
   c. **e2e-видимость**: если item трогает файлы, пиняемые e2e-ассертами → живой e2e-прогон обязателен ДО аттестации (урок FE-D1:
      зелёный юнит ≠ работающий фикс)
4. **проверка занятости** (§7): branch/worktree свободны? Живой сосед = уступи
5. **мини-план**: branch `fix/-`/`debt/-`, worktree `/private/tmp/<id>`, scope-манифест (файлы+тесты), DoD, гейты → 1 item = 1 задача
6. **конвейер A–J** (§5), делегируя по матрице §2
7. **closeout**: артефакт стори + registry-flip + (если baseline/флор сдвинулся) CLAUDE.md — тем же PR
8. **cleanup 0/0/0** (worktree/ветка local+remote/prune/absence-evidence, стоя ВНЕ cwd worktree — урок FE-D3-cleanup) → следующий
   item (к п.2) ИЛИ СТОП (§8)

**Пропорции делегирования**: recon → explore(sonnet); behavior (FE-D5 Web Locks, fe-d3-family, WCAG-ремедии) → executor(**opus**);
механические тест-пины/комментарии → executor(sonnet); отладка гейтов → debugger(sonnet); черновики артефактов → writer(sonnet);
ревью — ТОЛЬКО code-reviewer(**opus**, СВЕЖИЙ вызов на каждый проход; при цветовых item'ах — с независимым контраст-калькулятором).
Вся валидация, git и манифест-реген — сам. Результат любой волны — СРАЗУ `/tmp/<item-id>-*.log`; числа в артефакты — только из живых
прогонов.

## 1. Bootstrap

```bash
cd /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"; node --version   # ОБЯЗАТЕЛЬНО v24.18.0
git fetch origin --prune && git switch main && git pull --ff-only origin main
git rev-parse HEAD && git status --short        # чужие правки = живой сосед (§7), НЕ трогать
git worktree list && git branch --list
curl -s -m 5 http://localhost:3000/v1/health    # healthy: database/redis/queue up
pm2 ls | grep wb-repricer                       # BE + worker + frontend-dev online
```

**Ожидаемое на старте сессии-8** (сверить с SESSION6-handoff §2): main ≥ `649158cc`; vitest ≥ **19492**/0; boundary **118** (= baseline;
↓ возможен ТОЛЬКО после C5-owner-решения) и 3 exceptions (waterfall/PriceHistorySheet/FunnelTab); docs-baseline 95; locale 4; lessons 0;
privacy — ровно 3 pre-existing; PM2 `wb-repricer-frontend-dev` :3100 жив; BE :3000 healthy. **Контраст-харнессы**
`/tmp/p2-w{3,4,5}-contrast.mjs` + `/tmp/p2-80-contrast.mjs` могли не пережить перезагрузку — для цветового item'а восстанови копией
паттерна из артефакта волны-4/5 + воспроизведи ≥3 sanity-числа канона ДО замеров (7.81/10.05 · 5.13/9.38 · 4.78/8.77 · ANCHOR-2
4.34/10.89).

## 2. Модельный роутинг и делегационная матрица

[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный model-псевдоним (opus/sonnet/haiku) — без него вызов отклоняется.

| Работа | Агент | model | Контракт |
|---|---|---|---|
| Recon item'а (call-sites, consumer-ТЕСТЫ, import-closure, трасса ошибок) | explore | sonnet | READ-ONLY; результат → /tmp-лог; инвентари НЕ принимать на веру — перепроверяй живым прогоном |
| Behavior: FE-D5 Web Locks, fe-d3-family миграции, WCAG-ремедии | executor | **opus** | tests-first (RED → GREEN); харнесс из артефактов волн; дизайн-решения в отчёте |
| Механические волны (тест-пины, комментарии, статусы) | executor | sonnet | Правит ТОЛЬКО файлы мини-плана; отчёт строка-к-строке |
| Отладка гейтов (фейл ≠ дифф) | debugger | sonnet | Диагноз + минимальный фикс; bisect на чистой базе |
| Ревью диффа | code-reviewer | **opus** | СВЕЖИЙ контекст = отдельный вызов; вход /tmp/<id>-review-diff-N.txt; линзы: структура → факты/атрибуции → (триггеры) сходимость; e2e-видимые диффы — ревьюеру РАЗРЕШЁН target-прогон и живой e2e (прецедент: REJECT с живым прогоном поймал мёртвый предикат FE-D1) |
| Черновик артефакта | writer | sonnet | По фактам; финал твой |

Жёсткие правила: (1) ревьюер ≠ автор; (2) сабагенты НЕ коммитят/пушат/мержат и НЕ регенят манифест; (3) промпт самодостаточен:
абсолютный путь, `cd` ПЕРВОЙ командой, PATH-пин node@24, список файлов, формат отчёта, запреты; (4) дифф-файл к каждому
ревью-проходу, регенерация после каждой фикс-волны; (5) worktree-изоляцию сабагентам НЕ давать; (6) **сетевые смерти**: и ревьюеру,
и исполнителю — SendMessage-резюм по agentId (проверено: отчёт доходит с места остановки); при потере контекста исполнителя —
свеп-замер worktree живым подсчётом + перезапуск-ПРОДОЛЖАТЕЛЬ с узким брифом; (7) цветовые item'ы: слоистая модель (фактические
стеки монтирования, worst-end градиентов, hover-слои таблиц, обе темы, SOLID-тиры — оба стейта чипов) + ≥3 sanity-числа до замеров.

## 3. Поверхности и границы

Allowed (по item'у): runtime-файлы из §3.0 handoff'а + их consumer-тесты; артефакт стори; строки реестров; CLAUDE.md-базлайны
(только при монотонном сдвиге, тем же PR).
Forbidden — всегда: `e2e/story-174-3-*.spec.ts` (SHA-пины; реген только раннером `--owner-units`, fail-closed); пиняемые
манифестом тест-файлы (проверяй префлайтом; правка = обязательный реген); `src/components/ui/**` (только `npx shadcn add`);
`scripts/check-shadcn-migration-parity.mjs` (терминальный); package.json/новые зависимости; BE-репо (читать можно, править — по
явной авторизации owner); обязательные CI-гейты; boundary-exceptions ×3; **весь boundary-остаток 118 = C5-заблокирован** (lib 61 /
components 37 / app 17 / types 3) — НЕ трогать до C5-решения; семантика boundary-сканера (расширение на /80-family и т.п.) — только
по owner-согласованию; hue-name data-contract поля (`color: 'green'` в dimension/coefficient-types — вне гейта, НЕ «чинить»);
мёртвый `src/lib/queryClient.ts` — удалить можно (0 импортёров; реестр §11), НЕ адаптировать.
BE-координация: всё, что требует BE — `PENDING BACKEND:` + `docs/request-backend/NNN-*.md`. Owner-decision item'ы (handoff §3.3:
C5 · 1.4.11 valence · **A2 OrganicTab /80-тир** · logger-redact-волна) — готовишь decision-запрос (факты+варианты+рекомендация),
НЕ решаешь сам.
**E2E (e2e-видимые изменения)**: ТОЛЬКО через npm-обёртку `npm run test:e2e -- <spec> --grep <test> --retries=0` (handshake-гард
обязателен, порт 3100-only, `--no-deps` запрещён); подмена PM2↔worktree-dev (`npx next dev --webpack -p 3100` из worktree —
НЕ Turbopack, node_modules-symlink его отвергает) на минимальное окно, восстановить `pm2 restart wb-repricer-frontend-dev` сразу и
проверить :3100→200; свежерестартованный dev; ≤2 прогона/час; троттл логина 5/ч; `domcontentloaded`; после прогона УДАЛИТЬ
`e2e/.auth/user.json` + `test-results/` (свежий storageState триггерит privacy-счётчик гейта — урок FE-D1). Скретч-конфиги мимо
обёртки (напр. :3101) — запрещены (нарушение гарда прецедентом ревью-2 FE-D1).

## 4. Порядок работ

1. **FE-D5**: cross-tab cabinet-create duplication → Web Locks API (`navigator.locks`, feature-detect + fallback-семантика).
   Точка входа: `useCabinetCreateMutation.ts` (сейчас `retry: false`), `CabinetCreationForm`, сага создания
   (useCabinetCreationSubmission/useCabinetCreationRecovery); смежный e2e-прецедент CABINET-BROWSER-04 «blocks duplicate create
   after the cabinet-id auth write fails». Behavior, tests-first; e2e по мере видимости (§3-протокол). РЕКОН-вопрос: где именно
   дублируется (double-submit? cross-tab race на GET-then-POST?) — explore до фикса; FE-D8 (middle-path getCabinetCreationOperation)
   — ТОЛЬКО по UX-жалобе, НЕ в этой волне.
2. **fe-d3-family** (реестр §10): 4 hook-локальных `getErrorMessage` (useCloseSupply:29 / useCreateSupply:27 /
   useGenerateStickers:30 / useDownloadDocument:30 — свои fallback-эха `apiError.message`) → миграция на
   `sanitizeFallbackMessage` (экспортирован из `wb-token-form-helpers.ts`; кандидат на переезд в `src/lib/` при волне — тогда
   обновить импорты FE-D3-консьюмеров). Системный вопрос (~128 .tsx echo-поверхностей → санитизация на выходе apiClient?) —
   owner-decision, НЕ решай сам; волна = только 4 хука.
3. **full-warn-on-warn/10 кластер** (4.24 <4.5 текст; из /80-sweep): WritebackSafetyAcknowledgement:42-55, AutoFillWarning:49,
   TaxWarningBanner:46, TokenHealthBanner:86-91, AutoFillBadge:97 — отдельная WCAG-волна (канон волн 3-6: слоистые замеры, обе
   темы, worst-end, fg-on-tint/solid-ремедии).
4. **selected-row стеки** (ProductTableRow info/10-20; primary 4.18 / warn 4.19-3.58 — full-token pre-existing) — канон-расширение
   при контраст-волне п.3 (объединить в одну волну экономнее).
5. P3 по окну (handoff §3.1): harness restart-per-run · FR-7 · AT-матрица · Manager-creds · docs-95 split · prettier md (~1189) ·
   route-гарды ~25 · pm2 delete 5 · мёртвый queryClient.ts delete.
6. **Сигналы извне**: BE deploy → live-верификация refresh+health → аннекс #230 (учти: 401-PUT-дубль через reactive-refresh
   сломает BROWSER-03-пины — реестр §11); owner-C5-решение → reopening boundary-трека по §3.3 (волна-6 планирование: каноны волн
   1-5 обязательны).

## 5. Конвейер A–J (на каждый item)

A. Мини-план + pre-flight (105.2-grep; манифест-пин-чек × изменяемые файлы; e2e-видимость) → «уже починено» = no-op close с evidence.
B. Worktree: `test ! -e <dir>` → `git worktree add -b <id>-<slug> /private/tmp/<id>-<slug> main` + symlink node_modules + копии
`.env.local/.env.e2e`; при фейле — проверить осиротевшую ветку (`git branch -D`).
C. Комплаенс-базлайн гейтов, которые item может сдвинуть, ДО правок → /tmp.
D. Behavior = tests-first (RED → GREEN); цветовые = харнесс + замер КАЖДОЙ пары (обе темы, фактические стеки, hover-слой таблиц,
ОБА стейта чипов при SOLID-тирах); FE-D5 = замысль-доклад executor'а до правок (race-модель).
E. Гварды: money/ratio null → «—» НЕ `?? 0`; цветной текст на тинте ≥4.5 light (house rule: /5 ИЛИ fg/solid); `dark:`-половины не
вводить; error-re-throw обязан сохранять ApiError класс+статус (FE-D1-канон — не разрушай его новыми плоскими throw).
F. Валидация (только `cmd > log 2>&1; echo EXIT=$?`): lint → tsc → targeted vitest → контракт-тесты 174.3 (манифест-статус) →
**полный vitest СОЛО** (флор ≥ 19 492) → `npx next build --webpack` → boundary (118 = pass; ↑ = STOP) → docs → locale → lessons →
privacy (ровно 3 pre-existing; после e2e-прогонов — зачистка артефактов) → prettier на изменённых (ОДИН файл на инвокацию) →
`git diff --check`. Для e2e-видимых: **живой e2e ДО аттестации** (§3-протокол) + негативный контроль (пин обязан падать на
незафикшенном поведении). Фейл на чистой базе = pre-existing (bisect), НЕ чинить чужое в своём PR.
G. Ревью: ≥2 прохода в РАЗНЫХ свежих вызовах; триггеры CLAUDE.md (>12 кумулятив / >5 в проходе / novel-pattern / meta-claims) →
+проходы; REJECT = нормальный исход (FE-D1-прецедент) → fix-волна executor'у с рецептами ревьюера → реген дифф-файла → повтор;
числовые аттестации артефакта — Trigger-4-квалификатор «unaudited meta-claims». Findings: APPLIED или DISPOSITIONED с evidence.
H. Фиксы: doc-класс сам (но НЕ `{/* */}` внутри opening-тега и НЕ внутри `(...)`-выражения — там `//`; ESLint-хук ловит мгновенно);
behavior — executor'у; перепрогон наименьшего таргета.
I. Git/PR/merge — ТОЛЬКО сам: `git branch --show-current` перед КАЖДЫМ коммитом (параллельные сессии реальны); conventional commit;
staging ТОЛЬКО явными списками (git add -A запрещён); `_bmad-output/` → `git add -f` поштучно; PR#-литералы — вторым коммитом после
`gh pr create`; `gh pr merge --merge`; «not mergeable» = race → проверь и повтори.
J. Closeout — ТОЛЬКО сам: артефакт `_bmad-output/implementation-artifacts/debt-<id>-*.md` (Status/PR/Head-SHA; Tasks; Dev Agent
Record с `### Post-Nth-pass-review fixes (ДАТА)` на каждый проход; File List; Change Log + `**Lessons:**` (1)…(2)…(3)… ≤120
симв/пункт, счётная единица указана; числа — из живых прогонов, счёт файлов — по git status, не по памяти) → registry-flip
(APPEND-ONLY) → handoff §3-флип → гейты lessons/docs → merge → cleanup 0/0/0 (ВНЕ cwd worktree).

## 6. Гейты (текущие; сдвиги — только тем же PR с разбором)

Vitest ≥ **19492**/0 (монотонный) · lint 0/0 · tsc 0 · build --webpack 0 · **boundary 118 = baseline** (↓ только с C5-решением)
· 3 exceptions · parity терминальный · docs exit 0 (95) · locale 4 · lessons 0 · privacy ровно 3 pre-existing · prettier на
изменённых чисто · контракт-тесты 174.3 зелёные (или манифест-реген раннером в том же PR). Числа сверяй живыми прогонами каждый раз.

## 7. Параллельная команда / занятость

1. Перед взятием item'а: `git worktree list` + `git branch --list` + `git status` (чужие WIP-правки в общем дереве = живой
сосед). Занято → stat-дельта дважды ~15 мин → активна = уступи + мониторинг; сомнение = спроси owner.
2. Реестры конфликтуют → ребейс на живой main, свои строки поверх, re-grep перед closeout.
3. PM2 :3100 — общий: подмена для e2e окно минимальное, восстановить сразу + curl-проверка; рестарт дев-сервера на тяжёлый прогон.
4. Чужие worktree/ветки/PR/WIP не трогать; коллизия → снапшот /tmp → СТОП → owner.
5. WIP в /tmp-worktree коммитить НЕМЕДЛЕННО (параллельные сессии уничтожали /tmp-деревья).

## 8. Стоп-условия и эскалация

СТОП: item требует owner-решения (C5 / 1.4.11 valence / A2 OrganicTab / logger-redact / apiClient-санитизация-масштаба /
сканер-семантика) / BE-изменения / forbidden-файла / новой зависимости; гейт падает по baseline-дрейфу ≠ дифф; занятость не
разрешается; ревьюер дважды вернул неразрешимое; SHA-пиннед-спека/тест требует правки сверх регена. Эскалация — owner репо
(decision-запрос: факты + варианты + рекомендация). Запрещено: деплои, force-push, прямые пуши в main, git add -A, закрытие item'а
без evidence, решение owner-вопросов за owner, обход handshake/e2e-гардов.

## 9. Критерии успеха

1. Каждый закрытый item: DoD с записанным evidence; гейты §6 зелёные; реестры отражают; артефакт с ≥2 ревью-проходами (или
   REJECT→fix→APPROVE-циклом с негативным контролем); e2e-видимые — живой прогон; cleanup 0/0/0.
2. Флор/базлайны монотонны; сдвиги — тем же PR с разбором.
3. Owner-запросы сопровождены decision-доками; ни одного самовольного решения.
4. Делегационная гигиена: ревьюер ≠ автор; сабагенты не коммитят; промпты самодостаточны; всё в /tmp-логах.
5. Бэклог исчерпан ИЛИ остались только owner/BE-blocked → финальный отчёт owner + обновить/создать handoff сессии-8 по канону
   (chain-pointer в SESSION6-handoff; числа из живых прогонов) → СТОП.

## 10. Дайджест ловушек (V12–V17 наследие + сессии 6-7)

Node-26 ломает webpack (PATH-пин 24.18.0) · zsh не word-split'ит: кавычь `--include='*.tsx'`, prettier один файл на инвокацию ·
perl -pi с кириллицей падает — UTF-8 правки через Edit-инструмент · **JSX-комментарии: `{/* */}` ТОЛЬКО в children; внутри
opening-тега и внутри `(...)`-выражения — `//`** (ловится ESLint-хуком) · worktree удалять ВНЕ его cwd (иначе cwd-потеря) ·
`git worktree add` в существующий каталог фейлится с осиротевшей веткой · **манифест 174.3 пинит SHA ТЕСТ-файлов (не только
e2e-спек) — префлайт каждому item'у; реген только раннером; «verified NO pins» recon'а ненадёжен — истина в живом прогоне
контракт-тестов** · **error-transport контракт: re-throw обязан нести ApiError класс+статус — плоский Error превращает
downstream-предикаты в мёртвый код; юниты на «правильной» форме ошибки дают ложную зелёность** · **живой e2e до аттестации
перепинованных спек + негативный контроль (пин обязан падать на старом поведении)** · **e2e только через npm-обёртку: handshake-гард,
3100-only, --no-deps запрещён; скретчи мимо = нарушение** · **свежие e2e-артефакты (`e2e/.auth/user.json`, test-results/)
триггерят privacy-счётчик — зачищай после прогонов** · storageState ~1ч · дев-сервер деградирует — рестарт; Turbopack отвергает
node_modules-symlink → `next dev --webpack` · троттл-логины жгутся fail'ами (5/ч) · `_ap8_*`-фантомы = гонка фикстуры (rm
.eslintcache tsconfig.tsbuildinfo + перепрогон) · сид-токен e2e = настоящий base64url JSON · контраст-харнесс меряет над ФАКТИЧЕСКИМ
стеком (hover-слой таблиц — часть стека; SOLID-тиры: оба стейта чипов; worst-end градиентов) · **каталоги/инвентари дрейфуют —
live-пересчёт** · сетевая смерть сабагента → SendMessage-резюм по agentId (проверено) · /tmp-харнессы не переживают перезагрузку —
восстановление из артефакта + ≥3 sanity-числа · residue-строка CLAUDE.md = scope-контракт owner-трека · hue-name data-contract поля
не трогать · C5-остаток 118 не трогать · wiring-пин-паттерн: экспорт фабрики (makeQueryClient) + identity toBe — реверт валит юнит ·
полный анти-паттерн-лист: CLAUDE-ANTI-PATTERNS.md #1–10.

---

**Первое действие после прочтения**: SESSION6-handoff целиком (§2 гейты + §3.0 item'ы + §3.3 owner-ledger) → §1 bootstrap (вкл.
живой сосед-чек) → FE-D5 (§4 п.1: recon race-модели ПЕРЕД фиксом) → петля §0. Сессии 6-7 исполнены (статусы в §1 handoff'а);
каноны: WCAG = слоистая модель (волна-3) + прецеденты 4-6; security = sanitizer (FE-D3) + error-transport (FE-D1).
