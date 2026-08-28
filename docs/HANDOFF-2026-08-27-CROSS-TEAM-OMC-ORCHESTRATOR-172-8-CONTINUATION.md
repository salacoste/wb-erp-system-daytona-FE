# HANDOFF 2026-08-27 (cross-team) — Оркестратору OMC-сабагентов: продолжение эпика 172 с 172.12

> **Аудитория**: агент-оркестратор НОВОЙ команды, работающий через **OMC-делегирование** (executor/code-reviewer/verifier сабагенты). Документ самодостаточен: прочитай целиком → §1 bootstrap → §2 миссия.
> **Точка входа**: этот документ заменяет [`HANDOFF-2026-08-26-LATE-…`](HANDOFF-2026-08-26-LATE-epic-171-complete-172-recon-ready.md) (его §0 синхронизирован PR #294; §1-§5 исторические). Supervisor prompt V11 — [`ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md`](ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md); V10 остаётся расширенным справочником. **Этот handoff содержит уроки 172.1-172.11 и верифицированное состояние**.
> **Приоритет при конфликте**: план стори > V10 > этот handoff; живой код + проходящие тесты — финальная инстанция.

---

## 0. Верифицированное состояние (2026-08-28, после Story 172.11 feature PR #311 и closeout PR #312)

| Метрика | Значение |
|---|---|
| `main` | `73174259` (Story 172.11 closeout PR #312 merged), primary-дерево чистое и IN-SYNC |
| Прогресс миграции 166-174 | **70/94** канонических стори |
| Эпики | 166 ✅ · 167 ✅ · 168 ✅ · **169 ✅ (15/15; 169.12 closeout PR #299)** · 170 ✅ (7/7) · 171 ✅ (9/9) · **172 IN PROGRESS (11/17)** · 173/174 backlog |
| Полный пол (vitest, **живой прогон при handoff**) | **19 423 passed / 0 failed / 1221 файл / EXIT=0** (рост: … → 19 414 → **19 423** [+9 exact 172.11 guard]) |
| Остальные гейты | lint 0/0 (zero-warning), tsc 0, max-lines OK, check:docs exit 0, locale-percent ratchet 4, lessons-length 0 |
| PM2 | `wb-repricer-frontend-dev` online :3100; BE :3000 |
| **NEXT** | **172.12-FE Monitoring Operations Console** (план `.omx/plans/172.12-*.md`; owner: lib STATUS_COLORS carry-out из 172.11) |
| Сессионные ветки/worktrees 172.x | Story 172.11 feature + closeout **0/0/0**; Story 172.12 branch `cdx/epic-172-story-12-monitoring` + worktree `/private/tmp/wb-repricer-fe-172-12-monitoring` активны и защищены от reset/rebase/stage/delete |

**Сделано сессией 172.1-172.11** (эталонные артефакты — читай перед стартом):
- **172.1** Business Dashboard — FULL 127 файлов, 4 executor-волны, 3-проходное ревью (PRs #278/#279) — эталон FULL-конвейера.
- **172.2-172.4** Automation (gallery/list/editor) — MINOR-серии + **созданные e2e-пакеты** + первый live-прогон 163.3-спеки (PRs #280-#286) — эталон MINOR + e2e-создания.
- **172.5** COGS single — FULL-lite, 3 прохода, **import-closure канон** (PRs #287/#288) — эталон closure-аудита.
- **172.6** COGS bulk — owner-стори (PRs #289/#291) — эталон owner-исполнения.
- **172.7** COGS history — **born-clean** + caption-контракт (PRs #293/#294) — эталон born-clean-пайплайна.
- **172.8** Price Calculator — semantic responsive migration с сохранённой formula boundary; feature #301 + reconciliation #303 + lifecycle #304; dynamic Playwright gap явный.
- **172.9** Communications Workspace — MINOR-GAP; feature #305 + closeout #306; targeted 84/84, full 19 394/0, dedicated E2E 11+1skip ×2, cleanup 0/0/0.
- **172.10** Finances & Documents — born-clean + **абсорбция параллельной дельты** (mid-flight-коллизия, разрешена владельцем) + e2e-спеки repair (glob→RegExp) — feature PR #308 + closeout PR #309; targeted 6/46, full 19 414/0/1220, e2e 12 passed + 1 intentional skip, feature + closeout cleanup 0/0/0; live visual/axe/keyboard/real-SR → 174.3, route-ledger status audit → 174.1.
- **172.11** Monitor Route — MINOR-GAP; feature PR #311 + closeout PR #312; 18 palette + 9 hex → semantic tokens, guard 9, targeted 21 files/155 tests, full 19 423/0/1221, strict E2E legend repair + warm retry 4/0, feature + closeout cleanup 0/0/0; shared STATUS_COLORS → 172.12, live visual/axe/keyboard/real-SR → 174.3, route-ledger status audit → 174.1.

Артефакты: `_bmad-output/implementation-artifacts/172-{1..11}-fe-*.md` (11 шт; формат Change Log + Lessons — обязателен к копированию).

---

## 1. Bootstrap — первые 15 минут (обязательная верификация)

Primary checkout: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/frontend` (далее `<FR>`; `../` — BE-репо).

```bash
cd <FR>
git fetch origin && git switch main && git pull --ff-only origin main
git rev-parse HEAD                 # ожидается 73174259 или новее (repo > doc)
git status --short                 # ожидается пусто
git worktree list                  # зафиксируй ЧУЖИЕ worktrees; active 172.12 lane НЕ трогать
export PATH="/opt/homebrew/opt/node@24/bin:$PATH"   # КРИТИЧНО: системный node = 26.7.0 ЛОМАЕТ webpack (§7.1)
node --version                     # v24.18.0
```

Затем: этот handoff §2-§6 → план стори 172.12 → конвейер §3 в уже активном worktree. **Handoff-контроль**: сверь §0 с живым репо (grep registry NEXT + sprint-status 172.12 + floor прогоном при сомнении); расхождение → доверяй репо, исправь §0 в первом closeout-коммите.

Веди TaskCreate-трекинг: одна стори = одна задача с подзадачами конвейера §3.

---

## 2. Миссия

**Немедленно: Story 172.12-FE Monitoring Operations Console** (план `.omx/plans/172.12-*.md`) в уже активном Story 172.12 lane. Затем **172.13-172.17** (порядок планов; owner-координация: **172.14** — см. registry §5; остальные owner-блокеры сняты) → **173 (13 стори)** → **174 (5, финальный: ledger-parity, legacy-removal, a11y, regression, docs)**.

**Мета-задача**: после каждого значимого сдвига (стори/эпик/floor/ловушка) — обновляй handoff §0 docs-веткой как обычный closeout-PR. Расхождение handoff ↔ репо = твой дефект.

**CURRENT LANE CHECK**: Story 172.12 уже имеет branch `cdx/epic-172-story-12-monitoring` и worktree `/private/tmp/wb-repricer-fe-172-12-monitoring`; не создавай дублирующий lane. Сначала сверь branch/HEAD/status и координируйся с текущим owner; не ребейзи, не сбрасывай, не стейджи и не удаляй чужой WIP. Epic 169 закрыт; посторонние worktrees и docs-reconciliation lanes не трогать.

---

## 3. OMC-делегирование (кому что) + конвейер стори

### 3.1 Делегационная матрица

| Работа | Агент (`subagent_type`) | `model` | Контракт |
|---|---|---|---|
| Ad-hoc разведка | `explore` | `sonnet` | READ-ONLY; вопрос + пути; результат file:line списком |
| **Волны миграции** (~30 файлов) | `executor` | `sonnet` | Правит ТОЛЬКО файлы из списка; канон-таблица в промпте; НЕ коммитит; отчёт = файлы + маппинг + отклонения |
| Сложная правка | `executor` | `opus` | Тот же контракт, меньше файлов |
| Отладка | `debugger` | `sonnet` | Диагноз + минимальный фикс |
| **Ревью диффа** | `code-reviewer` | `opus` | СВЕЖИЙ контекст = отдельный вызов; вход: `/tmp/<story>-review-diff.txt` + claims; выход: вердикт + findings severity |
| Верификация evidence | `verifier` | `sonnet` | Тест-выводы, инвентарь диффа, отсутствие forbidden |
| Артефакт/closeout | `writer` | `sonnet` | Черновик по факсам; финал сверяешь ты |
| BE/SDK-вопросы | `document-specialist` | `sonnet` | Repo-доки → Context7/web |

**Жёсткие правила**: (1) ревьюер ≠ автор — никогда не видит твоих объяснений до вердикта; (2) **сабагенты НЕ коммитят/пушат/мержат** — git только твой; (3) один вызов = самодостаточная задача: абсолютные пути (worktree!), списки файлов, канон, запреты — сабагент НЕ видит твой контекст; (4) дифф-файл прикладывай к каждому ревью (`git diff > /tmp/<s>-review-diff.txt` + новые файлы конкатенацией); (5) **[1m]-окружение: КАЖДЫЙ вызов Agent ТРЕБУЕТ явный `model`-псевдоним** (opus/sonnet/haiku) — без него энфорсер отклонит; (6) изоляцию `worktree` для сабагентов НЕ использовать — все волны одной стори в ОДИН стори-worktree с непересекающимися списками.

### 3.2 Конвейер стори (MINOR/FULL унифицирован)

**A. План + pre-flight**: grep AC-существенных; registry-carry-in grep по ID стори («обязательный carry-in НЕ наследуется recon» — урок 172.1); если всё реализовано → no-op close с evidence. Разведка — в файл, не в голову.
**B. Worktree + behavior-lock**: `git worktree add -b <branch-из-плана> /private/tmp/<worktree-из-плана> main` + symlink node_modules + копия `.env.e2e`/`.env.local`; targeted vitest baseline → N/M.
**C. Комплаенс-подсчёт** (явные пути! §7.4): palette+hex+py-6 по owned surface → вердикт NO-OP / MINOR-GAP / MINOR-born-clean / FULL-lite / FULL. **Closure-предскан ДО волны** (урок 172.5): замыкание импортов от entry-точек — все живые файлы в гард-каталог.
**D. Правки**: MINOR (≤10 файлов) — сам; FULL — executor-волны ~30 файлов, после каждой targeted vitest. Тест-пины → re-pin на token-подстроки (строже, не weakening).
**E. Гард** по эталонам 172.x (см. §5.2): каталог pinned per-file identity + no-palette/no-hex + контракты (caption/tabular/valence/badge). НЕ пиши guarded-литералы в комментариях кода (§7.7); `*/`-ловушка в док-комментариях (§7.6).
**F. Валидация** (exit-коды ТОЛЬКО непайпованно `cmd > log 2>&1; echo EXIT=$?`): targeted → lint → tsc → max-lines → `npx next build --webpack` → полный пол фоном (floor §0) → e2e npm-обёрткой (pm2 stop → worktree-dev `--webpack -p 3100` → спека → pm2 restart ОБЯЗАТЕЛЬНО) → `git diff --check`. Визуал: playwright-cli login → **`goto`**, не `open` — light+dark; a11y-снапшот. **e2e-обёртка подмешивает orders+auth к любому вызову — аттестуй разложение** (§7.12).
**G. Ревью**: микро-дифф <50 строк прод → 1 проход; behavior-changing → 2 в РАЗНЫХ свежих вызовах; триггеры ≥3 (novel-pattern / >12 находок / >5 в проходе / meta-claims). **Обязательный элемент чек-листа: import-closure аудит** (§7.10).
**H. Фиксы**: мелкие сам, крупные executor'у; перепрогон наименьшего таргета + универсальные.
**I. Коммит/PR/merge/cleanup** (только ты): `git branch --show-current` ПЕРЕД каждым коммитом (§7.18); stage явных файлов; conventional commit; `gh pr create` → `gh pr merge --merge`; cleanup до 0/0/0 (remote/local/worktree) + prune.
**J. Closeout** (сам): артефакт (формат 172-{1..11}; Change Log close-строка + **Lessons ≤120 симв/шт**; APPEND-ONLY) → sprint-flip → registry SHIPPED + NEXT → handoff §0 (этот документ) → процесс-гейты (lessons-length 0, check:docs exit 0) → docs-PR → merge → cleanup → IN-SYNC.

---

## 4. Гейты и baselines (каждый PR; exit-коды непайпованные, node 24)

| Гейт | Команда (из worktree) | Baseline |
|---|---|---|
| Vitest полный | `npm test -- --run` | **≥ 19 423 passing / 0 failed / 0 skipped** across **≥ 1,221 files** (floor растёт точными +N) |
| ESLint | `npm run lint` | 0 errors, **0 warnings** |
| TypeScript | `npm run type-check` | 0; без `any`/`as` |
| max-lines | `npm run check:max-lines` | source ≤200, test ≤800 |
| Doc-citations | `bash scripts/check-doc-citations.sh` | exit 0 (напрямую, НЕ через npm-пайп) |
| locale-percent | `bash scripts/check-locale-percent.sh` | ratchet 4 |
| lessons-length | `bash scripts/check-lessons-length.sh` | 0 нарушений (≤120 симв) |
| Build | `npx next build --webpack` (worktree) | exit 0 |
| E2E | `npm run test:e2e -- <spec>` (npm-обёртка ОБЯЗАТЕЛЬНА; `--no-deps` обёртка ОТКАЗЫВАЕТ) | 0 failed; cold-flake → тёплый ретрай (§7.13) |

Кодовые стандарты: path-алиасы `@/…`; Server Components по умолчанию; `src/components/ui/**` не редактировать; Boundary Normalizer; деньги/рейо `null`→`—` (AP#8); opaque ID `String(id)` (AP#10); `mockRejectedValueOnce`+реальный `ApiError` (AP#3); `TODO` запрещён (`PENDING BACKEND:`/`FUTURE:`); `formatPercentage(Int)`; 200/800 строк.

---

## 5. Гард-канон (эталоны) и границы surfaces

### 5.1 Surfaces священны
Allowed Change Surface = только файлы плана стори. Forbidden Shared Files (`package.json`, `src/components/ui/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `src/stores/**`, AppShell, `analytics/shared/**`, route-ledger, BMAD-планы сиблингов) — правка нужна → СТОП → эскалация. Границы доменов 172.x закодированы в гардах-соседях (172.5 исключает editor/bulk/history; 172.6 исключает single/history; **172.7 исключает single/bulk** — НЕ дублируй чужие сканы, cross-story restraint, прецедент MarginCalculationStatus).

### 5.2 Гард-паттерн (копируй из эталонов)
- Перечисление: `readdirSync(dir, {recursive: true}).map(f => f as string)` → фильтры на ОТНОСИТЕЛЬНЫХ сегментах ДО join (P9); эксклюзии разделитель-анкерные (`f !== 'editor' && !f.startsWith('editor/')`, nested: `!f.includes('/__tests__/')`).
- Каталог: pinned count + **per-file identity** (endsWith на каждый); dead-code файлы пинить с честной пометкой dead.
- Регексы: LEGACY_PALETTE (полный набор оттенков + префиксы from|to|via + shadow-семейство) и CONTEXTUAL_HEX (169.11, с self-test позитив+негатив).
- Резолв путей: **depth-N маршрут = N×`..` до src/** (проверяй первым прогоном сразу — RED дёшево, GREEN подтверждает).
- Пины контрактов: caption render-shape (`/captionText \? <TableCaption>/`), tabular-nums, valence, badge-идиома, padding pin **скоупь на route-контейнер** (intra-card `pt-6` при Card без header — легитимный паттерн `p-6 pt-0`).

---

## 6. Ревью-дисциплина и closeout-формат

- Автор ≠ ревьюер; находки чинить или disposition с evidence; оба прохода ДО flip review→done и ДО коммита.
- Closeout-артефакт: прецеденты `172-{1..11}-fe-*.md`; Status: done + PR/merge SHA; Tasks-чекбоксы; Dev Agent Record с `### Post-Nth-pass-review fixes (ДАТА)`; File List = точный diff; Change Log close-строка + `**Lessons:** (1)…(2)…(3)…` ≤120 симв; закрытые строки APPEND-ONLY.
- Attestation-дисциплина: числовые аттестации должны реконструироваться (e2e-суммы обёртки раскладывай: «13 = 8 spec + 2 orders + 3 auth»).
- Реестры: sprint-status flip + registry SHIPPED/NEXT + **handoff §0 этого документа** + CLAUDE.md floor — в одном closeout-PR.

---

## 7. Ловушки — готовые решения (20 уроков сессий 172.1-172.10 + V10-канон; НЕ наступать повторно)

1. **Node-26 (системный brew node = 26.7.0) ломает webpack**: `TypeError: WasmHash._updateWithBuffer` на `next build`. ВСЕ npm/npx — с `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"` (пинн 24.18.0). Симптом «внезапный» build-фейл с webpack-внутренним TypeError → сначала `node --version`.
2. **e2e-обёртка подмешивает** `e2e/orders.spec.ts` + auth-сетапы к любому вызову → «N passed» ≠ N тестов спеки. Аттестуй разложение. `--no-deps` обёртка ОТКАЗЫВАЕТ («authentication setup is required»).
3. **BE login-троттл 5/hr**: исчерпывается валидационными циклами (curl-логины + повторные e2e-сетапы). Лечится: юнит-близнец нового e2e-ассерта + честный gap в артефакте (обход --no-deps запрещён).
4. **zsh НЕ word-split'ит `$VAR`**: `rg … $FILES` передаёт одну склеенную строку → rg молчит → «ложный ноль». Только явные пути в сканах.
5. **`rg` glob-порядок**: позитивный `-g '*.ts'` ПОСЛЕ негативных glob'ов переопределяет исключения → тесты утекали в прод-инвентарь. Позитивные — первыми.
6. **`*/`-ловушка в док-комментариях**: `ProductList*/…` в `/** */` закрывает комментарий → parse error. Пиши «ProductList-family».
7. **Guarded-литералы в комментариях кода** матчатся регексами гарда — комментарии о цветах прозой.
8. **Loose color-word регексы в тестах** (`toMatch(/green/)`) невидимы для string-crossref сканов executor'ов — скань тест-деревья на них ПЕРЕД пост-волновым прогоном; аттач к волне по case-insensitive basename (`GMVCard.test` vs `GmvCard.tsx`).
9. **Пины вне targeted-паттернов** ловятся ТОЛЬКО полным прогоном — полный пол после каждой волны обязателен (дважды сработал: `dashboard/__tests__` в 172.1, `custom/__tests__/Cogs*` в 172.5).
10. **Import-closure аудит — обязательный шаг ревью палитровой стори**: BFS импортов от entry-точек; все живые (LIVE) файлы замыкания — в гард-каталог. Три пропущенных живых legacy-файла пойманы только им (172.5: HistoricalMarginContext, MarginCalculationStatus, ResizableTableHead). Ревьюер строит closure САМ, не верит спискам автора.
11. **Ре-экспорт-шим ↔ настоящая форма** — омонимы путей (`custom/BulkCogsForm.tsx` = 1-строчный shim; настоящая в `bulk-cogs/BulkCogsForm.tsx`): сверяй палитроносца с фактическим файлом до списка волны. Executor обязан СТОПнуться на файле вне списка — образцово сработало в 172.6.
12. **e2e-аттестация чисел** — см. §7.2: декомпозиция обязательна (урок MEDIUM-находки ревью).
13. **Cold-compile e2e-флейк**: первый тест файла / холодный маршрут → 10-30s таймауты (`nav[aria-label]`, `'COGS'`-линк). Прогрев dev кури 307-редиректами НЕ компилирует страницу (auth-редирект раньше). Лечение: (a) первому тесту файла — 30s waitForResponse; (b) при флейке — тёплый ретрай упавших + при сомнении бисект на чистом main (pm2-dev); класс повторился в 172.5/172.6/172.7 — всегда оказывался окружением.
14. **Fixture с ФИКСИРОВАННЫМ статусом** делает терминал недетерминированным (409-forever → диалог переоткрывается; `toBeHidden` проходит по тайминг-удаче). Фикстуры e2e обязаны иметь `setInstallStatus()`-переключатели и вести флоу к РЕАЛЬНОМУ терминалу.
15. **Chart-токены — сверяй HSL-значения, не имена**: `--chart-positive` ≡ `--chart-4` и `--chart-negative` ≡ `--primary` байт-в-байт (light). Pairwise-distinct ассерты в гардах чарт-конфигов (прецедент 172.1).
16. **Registry carry-in НЕ наследуется recon**: обязательные carry-in'ы реестра grep'ся по ID стори в pre-flight (пропуск в 172.1 → пост-фактум re-route 174.2 + disclosure). Born-clean поверхность всё равно несёт контракты (caption/tabular) — pre-flight считает не только палитру.
17. **Дефолт-Badge hover** (`hover:bg-primary/80` на зелёном тинте) — pre-existing, вне color-only скоупа; предупреждение «18 %» и e2e-тексты: `formatNumber(share)%` (blindspot locale-гейта) — не трогать без контракта, фиксировать carry-out.

18. **Параллельная сессия может ДОРАБАТЫВАТЬ внутрь твоего стори-worktree mid-flight** (172.10): файлы появляются/правятся поверх твоего WIP, branch перемещается на новый main. Протокол: криминалистический снапшот в /tmp → опрос mtime активности → СТОП + эскалация владельцу (AskUserQuestion) → по решению: абсорбция = полный повторный конвейер на объединённом дереве (валидация + СВЕЖЕЕ ревью дельты) либо восстановление своего отревьюенного состояния из /tmp-диффа. Никаких git-операций над спорным деревом до решения.
19. **Playwright end-anchored globs молча промахиваются по URL с query** (`'**/api/x'` ≠ `x?locale=ru&limit=…`): стабы не применяются, страница рендерит живые BE-данные, тесты «зелёные» на чужих данных или падают на текстах. Лечение: RegExp-роуты `/\/api\/x(?:\?.*)?$/` с проверкой коллизий; соседний паттерн с хвостом `*` в той же спеке — подсказка автора. Bisect на stash-clean дереве доказывает pre-existing.
20. **Фоновый полный пол vitest параллельно с build/e2e = «Timeout starting forks runner»** (пулы не стартуют, файлы «пропадают», EXIT=1 при обманчиво-зелёном счёте): читай Unhandled Errors в логе; полный пол — ТОЛЬКО соло, без конкурирующих тяжёлых процессов.
21. **Сетевые ConnectionRefused-смерти сабагентов** (3× за сессию 172.10-172.11: ревьюер, wave-2 executor, ещё ревьюер): агент падает с API Error, WIP частичен или пуст. Лечение: SendMessage-резюм по agentId восстанавливает контекст из транскрипта (ревьюеры доезжали); волна-исполнитель, умерший ДО правок, — перезапуск задачи вручную контролёром дешевле резюма. Проверяй git status worktree перед перезапуском (что успело примениться).

**V10-канон ловушек** (полный список в V10 §9): concurrent-сессии (`git branch --show-current` перед КАЖДЫМ коммитом; коммитить сразу; чужие worktrees не трогать; re-grep origin/main перед финализацией closeout — **merge-гонки реальны**: 169-lane влила #295/#296 поверх наших PR); Turbopack×symlink (только `--webpack`); порт 3100 pm2-конфликт (остановить → вернуть); exit-коды только `cmd > log; echo EXIT=$?`; BE-репо НИКОГДА `git add -A frontend/` (зеркал-дрейф блокирует BE-pull — не твой мандат); playwright-cli `goto` после логина; сабагенты наследуют PRIMARY cwd — абсолютный путь worktree первой командой; промежуточные unused-imports (импорт+использование одним батчем); волна вне списка = брак (откат + перезапуск).

---

## 8. Среда

| Параметр | Значение |
|---|---|
| Node / npm | **24.18.0 / 11.11.0** (пинн; PATH-префикс `/opt/homebrew/opt/node@24/bin`) |
| FE dev | `http://localhost:3100` (pm2 `wb-repricer-frontend-dev`; для e2e на ветке — worktree-dev `--webpack -p 3100`, pm2 stop → restart) |
| BE API | `http://localhost:3000` (`/v1/health`; Swagger `/api`; логин `test@test.com`/`Russia23!` — троттл 5/hr) |
| FE remote | `github.com:salacoste/wb-erp-system-daytona-FE.git` |
| Worktrees | `/private/tmp/<путь-из-плана>`; node_modules symlink; `.env.e2e`+`.env.local` копировать |
| Тяжёлые чтения | сабагентам; результаты сразу в `/tmp/<story>-*.log` |

---

## 9. Стоп-условия

План конфликтует с живым кодом; нужна правка forbidden; чужая сессия снесла worktree/WIP (восстановить из коммитов, задокументировать); BE недоступен >30 мин при необходимости e2e; гейт падает по baseline-дрейфу ≠ твой дифф; волна/ревьюер вернули неразрешимый материал (дважды). Эскалация — владелец репо через PR-описание/issue.

---

## 10. Канонические документы

| # | Документ | Роль |
|---|---|---|
| 1 | Этот handoff | ВХОД-ТОЧКА / состояние / уроки |
| 1a | `docs/ORCHESTRATOR-PROMPT-2026-08-28-V11-HANDOFF-SUPERVISOR-OMC.md` | **Операционный промпт контролёра** исполнения этого handoff через OMC-сабагентов (петля стори-за-стори, mid-flight правила, критерии успеха) |
| 2 | `docs/ORCHESTRATOR-PROMPT-2026-08-26-V10-OMC-SUBAGENT-ORCHESTRATION.md` | Процесс-канон OMC-делегирования (§4 матрица, §5 роутинг, §6 конвейер, §7 гейты, §8 нормы, §9 ловушки) |
| 3 | `.omx/plans/172.12-*.md` (затем 172.13+) | План стори — **authoritative** (branch/worktree/surface/валидация/cleanup) |
| 4 | `CLAUDE.md` | Правила репо: baselines-таблица, двухпроходность, анти-паттерны, гейты |
| 5 | `_bmad-output/planning-artifacts/epics-166-174-fe-shadcn-migration.md` | Канонические ID/AC стори |
| 6 | `_bmad-output/implementation-artifacts/sprint-status.yaml` | Живые статусы (flip — твой) |
| 7 | `_bmad-output/planning-artifacts/shadcn-migration-status-and-debt-registry.md` | Реестр + SHIPPED-строки + NEXT + carry-ins (§5 owner-заметки) |
| 8 | Артефакты `172-{1..11}-fe-*.md`, `171-{7,8,9}-fe-*.md` | Эталоны closeout-формата и конвейеров |
| 9 | `docs/HANDOFF-2026-08-26-LATE-…md` | Прежний вход (§0 синхронизирован; §1-§5 исторические) |
| 10 | Гарды-эталоны | 172.1 (обa dashboard-гарда), 172.5 (каталог-21 + closure), 172.7 (born-clean + caption + padding-скоупинг) |

---

## 11. Критерии успеха оркестратора

1. Стори закрываются полным конвейером §3 без пропуска гейтов; floor монотонно растёт точными +N (текущий: **19 423** across **1,221 files**).
2. Контекст survives: ни одной смерти на разведке (разведка = файл); делегирование по §3.1.
3. Реестры (sprint + registry + этот handoff §0 + CLAUDE.md) отражают реальность после каждого merge; reconciliation — в том же closeout-PR.
4. Ноль остаточных артефактов: 0/0/0 после каждой стори; primary чист; IN-SYNC.
5. Уроки — в Lessons (≤120) каждого артефакта; новые КЛАССЫ ошибок — эскалируй в §7 этого handoff (APPEND-ONLY) docs-PR'ом.
6. Делегационная гигиена: ревьюер ≠ автор; сабагенты не коммитят; каждый промпт самодостаточен (абсолютные пути, списки, канон).

**Первое действие после прочтения: §1 bootstrap → сверить active branch/worktree/status Story 172.12 и координацию с её owner без создания дублирующего lane → §2 план 172.12 → конвейер §3 (verdict по §3.C → волны/правки → гард §5 → валидация §4 → ревью §6 с closure-аудитом → merge → closeout с обновлением §0 этого документа).**
