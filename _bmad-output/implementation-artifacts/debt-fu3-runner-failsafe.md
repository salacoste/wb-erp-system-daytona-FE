# debt-fu3-runner-failsafe — изолированный раннер: dev-spawn fast-fail + abort-path пины (+ 3a no-op)

| Поле | Значение |
|---|---|
| Status | done (3b+3c implemented; 3a no-op close) |
| Date | 2026-09-10 (сессия-11, follow-up FU-3 из HANDOFF-2026-09-10 §3.4 №3; residual §22) |
| PR | [#439](https://github.com/salacoste/wb-erp-system-daytona-FE/pull/439) |
| Branch | `debt/fu3-runner-failsafe` @ `27fb3261` (база `1f00c5f2`) |
| Class | behavior/test-infra (tests-first RED→GREEN, executor opus), 2 ревью-прохода opus + эмпирический RED-check ревьюера |
| Реестр | §29 |

## Суб-item'ы

**3a — restore-verify в free-port пре-стейте: NO-OP CLOSE (уже = задокументированное owner-pinned design-решение).**
Рекон доказал: текущее поведение = громко (60s poll → `restoreVerified:false` → CRITICAL stderr → exit 1,
даже при зелёном сьюте), дискриминатор консьюмера = JSON `swapped:false`; запинено тестами
(`free-port run skips…` + `treats lsof exit 1 as no-listeners`). Pass-5 #431 диспозишн зафиксировал это как
fail-safe направление. Изменение семантики = переоткрытие owner-решения — зарегистрировано как owner-class
(вместе с вопросом о ложной тревоге «CRITICAL при незатронутом PM2», если owner захочет distinct-status).

**3b — dev-spawn fast-fail (implemented, RED→GREEN).** Spawn `'error'` и exit-before-ready (новый `'exit'`
listener, гейт `readinessAchieved`) абортят readiness-полл в пределах одного тика с cause-named сообщением
(вкл. «exited by signal SIGKILL» для signal-детей) вместо сжигания 180s окна; generic timeout throw остался
fallback'ом для медленного сервера. Summary contract аддитивен: `devExitedBeforeReady`, `devExitCode`,
`devExitSignal` (+ `devSpawnError` задокументирован в хедере впервые). Прецедент сигналов сохранён:
interrupt-first в `shouldAbort`, сообщение байт-идентично.

**3c — 2 abort-path пина (implemented, additive).** ps-failure (`status:null` → точный abort-текст
«Aborting before any state change: unable to read the process table…», без pm2 stop/worktree add) +
jlist-corrupt (`NOT_JSON{{` → «PM2 process not found» abort). Оба клоны lsof-паттерна, GREEN сразу
(пиннинг существующего fail-closed поведения).

## Живые доказательства

- RED: 2 fast-fail пина против пре-имплемент кода — **каждый горел полный 30s бюджет** (`30001ms`), затем
  GREEN `<10s` (фактически 2-5ms). Пины 3b-фальсифицируемы.
- **LIVE proof-run** (единственный e2e, 1 логин): `npm run test:e2e:isolated -- e2e/fr7-by-variant.spec.ts
  --retries=0` → exit 0, **7 passed/1 Manager-skip**, JSON `restoreVerified:true · portFreed:true ·
  swapped:true · worktreeRemoved:true · teardownErrors:[] · interrupted:null`, 27.3s. **Закрыт Open Question
  ревью-1 (npx-lifespan)**: здоровый npx-spawn не абортится ложным fast-fail; PM2 восстановлен
  (тройная аттестация), :3100→200, privacy/artifacts чисты.
- **RED-check прохода-2 (сам ревьюер)**: реверт одного statement'а try/finally-гейта → пин загрязнения
  падает точно на своём ассерте → байт-идентичное восстановление (sha256 + пустой `git diff`). Пин
  нефальсифицируемого класса исключён.

## Гейты (итоговое дерево)

node:test **63/63** (56 пре-существующих байт-нетронуты + 4 pass-0 + 3 pass-1) · vitest СОЛО 19570/19570
(на состоянии src/, не менявшемся после) · lint 0/0 · tsc 0 · build --webpack 0 · boundary 0 · docs 0 ·
locale 0 · lessons 0 · privacy 0 · prettier/eslint файлов 0 · diff-check 0. Манифест 174.3: оба файла
0 пинов (подтверждено рекон-ом) — реген не требовался.

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-10)

Проход-1 (opus): **APPROVE** — 3 MINOR + 2 INFO + Open Question. Применены (`bd2f35f6`, +3 пина):
(1) try/finally-гейт `readinessAchieved` — teardown-kill больше не загрязняет `devExitedBeforeReady` на
чужих абортах; (2) clear-on-success — mid-probe exit-запись стирается при достигнутой readiness
(undefined-ключи выпадают из JSON — контракт аддитивности сохранён); (3) `devExitSignal` + signal-named
сообщение вместо lossy «code null». INFO×2 DISPOSITIONED: shouldAbort-строгость (задокументированный
контракт), sync-error форма фейка (покрытие, не поведение). Open Question (npx-lifespan) закрыт живым
proof-run'ом.

### Post-2nd-pass-review fixes (2026-09-10)

Проход-2 (opus): **APPROVE** — 3 LOW. #3 APPLIED (`27fb3261`): хедер «immediately» → «within one poll tick»
(точность). #1 DISPOSITIONED: ~500ms race последнего тика может замаскировать уже известную причину generic-сообщением — JSON-аттестация корректна, message-quality only; фикс продублировал бы логику closure'а.
#2 DISPOSITIONED: clear-on-success не трогает `devSpawnError` — недостижимо (spawn-error ⇒ нет листенера/порта), а в гипотетическом случае честная аттестация лучше стирания.

Триггеры: 11 находок суммарно (≤12), максимум 5/проход (≤5), behavior-класс → 2 прохода достаточно;
пин-фальсификация усилена RED-check'ом прохода-2.

## File List

- `scripts/run-e2e-isolated.mjs` (+~90/−~30 через 3 коммита; 3 собственных региона: хедер-контракт, exit-handler, readiness-блок)
- `scripts/run-e2e-isolated.test.mjs` (+514/−0 — ЧИСТЫЕ аддишны, пре-существующие пины байт-нетронуты)

## Change Log

- 2026-09-10: item создан и закрыт (сессия-11 FU-3); 3a no-op (owner-pinned design), 3b/3c implemented;
  2 ревью-прохода APPROVE/APPROVE + эмпирический RED-check + живой proof-run.

**Lessons:** (1) A «follow-up» line can be a DONE-in-disguise — recon the pinned behavior before implementing; changing an owner-dispositioned fail-safe needs an owner, not a wave. (2) Spawn 'exit' needs a finally-gate — teardown's own kill otherwise pollutes the attestation it just tore down. (3) Reviewer-run RED-check (revert one fix statement → pin fails → byte-identical restore) is the cheapest proof a pin is not a tautology.
