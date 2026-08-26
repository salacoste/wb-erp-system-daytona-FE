# Shadcn Full-UI Migration — Status & Debt Registry

> **Snapshot date: 2026-08-26** (Story 169.13 shipped independently; Story 169.14 is in progress after the docs-only preflight correction; Epics 170 and 171 are complete; Story 171.9 shipped through PR #270; Program NEXT = 172.5; Stories 172.1-172.4 shipped through PRs #278, #280, #282, #285; Story 169.12 route PR #227 merged early and its contract closeout remains pending). Канонический статус-реестр программы миграции
> для BMAD-артефактов. Живая история — sprint-status.yaml (по-сторийно) и ledger
> BE-репо (docs/tech-debt/TECH-DEBT-2026-08-SESSION.md, Addendum-4 cont.1-25);
> этот файл = консолидированный срез «что сделано / что осталось / все долги».
> Обновлять в конце каждой orchestrator-сессии.

## 1. Execution status (по эпикам)

| Epic                         | Stories         | Done   | Остаток                           | Статус                                                                                                                          |
| ---------------------------- | --------------- | ------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 166-FE foundation            | 8               | 8      | —                                 | **CLOSED** (токены, примитивы, композиции, контракты)                                                                           |
| 167-FE AppShell/auth         | 9 (с merge'ами) | 9      | —                                 | **CLOSED** (freeze-8, W1)                                                                                                       |
| 168-FE analytics core        | 11              | 11     | —                                 | **CLOSED** (hub + 10 маршрутов; 168.2-168.11 orchestrator-волной)                                                               |
| 169-FE operational analytics | 15              | **12** | 169.14 → 169.15 → 169.12 closeout | **IN PROGRESS** (12 canonical Stories complete; 169.13 shipped independently; 169.12 route presentation remains review-blocked) |
| 170-FE                       | 7               | **7**  | —                                 | **CLOSED** (Stories 170.1-170.7 shipped through PRs #237-#250)                                                                  |
| 171-FE                       | 9               | **9**  | —                                 | **CLOSED** (Stories 171.1-171.9 shipped through PRs #252, #254, #256, #258, #260, #262, #266, #268, and #270)                   |
| 172-FE                       | 17              | **4**  | 172.5-17                          | IN PROGRESS (172.1 #278 FULL; 172.2-172.4 #280/#282/#285 MINOR-серии; automation-домен gallery+list+editor мигрирован целиком; см. §5) |
| 173-FE                       | 13              | 0      | 173.1-13                          | backlog                                                                                                                         |
| 174-FE консолидация          | 5               | 0      | 174.1-5                           | финал (СТРОГО после 166-173; 174.2 design-system/source-boundary/contrast; 174.3 visual/a11y; 174.4 functional/backend)         |

**Story readiness: 56 of 94 canonical Stories complete.** Story 169.11 returns analytics shipped through
preface PR #218 and implementation PR #219. PR #227 then merged Story 169.12's 27-file shadcn route
presentation early at `52f7f506`, but the Story is not counted complete: the approved Correct Course adds
two sequential non-route prerequisites without changing the 76-route ledger. Story 169.14 owns the backend
paid-storage request/status/result/error contract, Story 169.15 owns the shared frontend boundary, and only
then may Story 169.12 perform its bounded contract closeout. Story 169.13 completed independently through PR #232 and does not change this prerequisite chain.

169.13 SHIPPED 2026-08-25 (последний backlog-роут эпика; 12/15): preface #231 (`95522187` — unknown enums + nullables, opus APPROVE) + #232 (`2778d43e`; 26 файлов, owned 58→73, **e2e на ветке 33/1↓/0**, 2×opus);
полный пол **19 055/0**. Эпик 169: осталось 169.14 (BE) → 169.15 (shared FE) → 169.12-closeout. Carry-out: e2e-flake
«sidebar→supply-planning» (dashboard URL-race, load-зависимый, задокументирован в самом тесте) —
кандидат на e2e-hardening до 172.1.

**Paid-storage chain NEXT = finish 169.14 → 169.15 → 169.12 contract closeout** (169.14 `in-progress`; 169.15 `backlog`; 169.12 `review`; plans `.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`, `.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md`, and `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md`). Story 169.14 uses its frontend implementation artifact as the durable cross-repository record: clean backend local-main fast-forward is preferred, while verified refreshed `origin/main` is allowed only under the recorded exact foreign-WIP/no-overlap reservation. Honest RED, independent review, and the frozen reviewed backend manifest must be retained as exact payload bytes in a direct artifact-only evidence commit and re-read from trusted frontend history before the first backend production edit. After backend merge, branch/worktree cleanup retains the reviewed-head, three-line PR, and strict nine-line cleanup-authority records; an exact artifact-only final handoff must then enter trusted frontend history before five-source record retirement. Story 169.13 remains independent and is now `done`.

**Canonical paid-storage lifecycle gates:** require exactly one fetch URL and one push URL and resolve both independently to the expected backend/frontend repository. Mutation-authorizing reads and deletion use the verified push endpoint. Retain collision, unattached-branch, list-limit, pagination, and count-equality checks. Exactly one serialized Story leader owns the lifecycle; concurrent fence invocations remain outside the supported contract.

Both Stories validate all retained RED/reviewer/manifest delimiters with one global exact-order marker state machine that rejects duplicates, same-type or cross-type nesting, mismatched/early END markers, reordering, and unclosed blocks. They extract all three payloads to files with byte-exact trailing-LF preservation and recompute every SHA-256 directly. Before evidence-preflight succeeds, Story 169.14 authorizes its canonical nonempty manifest as an allowed subset containing every required path; Story 169.15 authorizes its blank-line-stripped canonical nonempty manifest as a static-allowlist subset excluding the evidence artifact. Delivery and publish recovery retain the same manifest gate. Both Stories use synthetic identities and sanitized logging and run a suffix-aware non-echoing scan that rejects credential-bearing headers, Bearer/Basic values, private-key material, credential-bearing URI userinfo, and the full credential-family set across exactly `=`, `:=`, `+=`, `-=`, `?=`, `&&=`, and `||=`. The seven mandatory prefixed synthetics (`DATABASE_PASSWORD=`, `OPENAI_API_KEY:=`, `GH_TOKEN+=`, `JWT_SECRET-=`, `AWS_ACCESS_KEY_ID?=`, `X_AUTH_TOKEN&&=`, and `service-refresh-token||=`) fail independently, while benign prose such as `OPENAI_API_KEY field omitted` remains allowed. Story 169.14 requires exactly one `STORY_169_14_PRIVACY_REVIEW_ATTESTATION: PASS_NO_SECRET_OR_CUSTOMER_PII` line, and Story 169.15 exactly one `STORY_169_15_PRIVACY_REVIEW_DISPOSITION: PASS` line, inside the respective committed and hashed retained reviewer payload; missing or duplicate lines fail closed. Hash-only or caller-only evidence is invalid.

Known BullMQ `waiting | delayed | prioritized | waiting-children` states map to wire `pending`, `active` maps to `processing`, and terminal states retain their meanings. Explicit BullMQ `unknown` fails closed as wire `failed` with stable sanitized `UNKNOWN_QUEUE_STATE` detail; Story 169.15 separately preserves the frontend-only `unknown` sentinel for an actually unrecognized backend wire value.

Before each final commit, the serialized leader atomically publishes a dedicated mode-600 review-bootstrap record binding the exact reviewed parent/tree, manifest or artifact hashes, both final reviewer identities/PASS dispositions, and applicable predecessor-record hashes. Commit-before-reviewed-head recovery is authorized only by that byte-identical bootstrap and must reauthenticate the direct parent, tree, manifest/artifact, reviewers, and remote absence. The reviewed-head record is cross-checked against the bootstrap; the bootstrap is then deleted and proven absent before first push. Missing, foreign, malformed, wrong-mode, or symlinked bootstrap state fails closed. REST all-state PR enumeration combines lowercase REST `state` with `merged_at`, normalizes only `OPEN | MERGED | CLOSED_UNMERGED`, re-reads after creation, rejects closed-unmerged/invalid outcomes, and never re-merges an already merged exact PR. First branch publication requires remote absence and an absence-expecting lease; recovery creates only an absent ref, skips only exact recorded-SHA equality, and rejects every foreign ref, including a fast-forwardable ancestor. Story 169.14 separately uses a create-or-byte-identical three-line backend PR record plus strict nine-line cleanup-authority record. Its backend cleanup proves feature → exact merge → refreshed backend `origin/main` and remains restartable when the worktree/branch is already absent; phase `branch-worktree` removes only exact backend refs/worktree and retains all three backend records. It then runs an executable frontend final-handoff lifecycle with phases `create | delivery | publish-recovery | cleanup`: the exact twice-reviewed artifact-only head is protected by its own review-bootstrap and published through a separate mode-600 reviewed-head record, ambiguous PR creation recovers only an exact zero-or-one normalized identity into a separate PR record, merge uses `--match-head-commit` only for `OPEN`, and cleanup proves handoff commit → exact frontend merge → refreshed frontend `origin/main` before removing exact refs/worktree. The committed artifact contains exactly one ordered 30-line version-3 record plus the adjacent cleanup-authenticated foreign-WIP payload (`NONE` for clean local main, otherwise canonical sorted unique newline-delimited paths), with SHA-256 over complete payload bytes including the final LF. Phase `record-retirement` publishes the strict self-contained 48-line mode-600 transaction before any source deletion. It binds both repositories, reviewed bases/evidence/commits/trees/manifests/artifact/reviewer pairs, both exact PR topologies/merges, recorded-main ancestry, five source paths/hashes, deletion set, and cleanup proof. Recovery reruns live Git/GitHub topology, accepts each source only as exact-present or already absent under the authenticated transaction, and fails before further deletion on malformed/reordered/extra/missing fields, wrong mode/type, symlink, foreign hash, or topology drift. The transaction is removed only after all five sources are proven absent.

Story 169.15 treats the caller-supplied final-handoff commit only as an expected value. Before worktree creation it reads the exact committed artifact from verified frontend `origin/main`, proves the handoff is a direct single-parent artifact-only ancestor whose actual parent equals the committed frontend-base field, strict-parses the exact 30-line version-3 record/payload, independently reconstructs the complete strict nine-line cleanup-authority bytes from committed/static authoritative fields, and requires their SHA-256 to equal the committed authority hash. Executable synthetics accept the valid reconstruction and reject every changed field or expected hash. It validates the exact frontend final-handoff PR repository/base/head/head SHA/merge topology plus handoff → merge → refreshed-origin ancestry. It independently authenticates the recorded predecessor evidence commit as single-parent and artifact-only, reads the exact evidence artifact with `git show`, globally validates/extracts RED/reviewer/manifest payloads, recomputes their hashes, reruns the suffix-aware seven-operator privacy gate, authorizes the frozen manifest against Story 169.14's allowed/required sets, and requires byte/hash equality with the real backend base-to-feature manifest. It also validates the exact backend PR/merge lineage and proves backend/frontend branch/worktree cleanup plus absence of all five source records and predecessor retirement-transaction residue. Every expected-absent record/bootstrap/transaction/worktree path must also be non-symlinked; an executable synthetic rejects dangling symlinks. Story 169.15 then uses its own review-bootstrap plus separate ten-line lifecycle record: PENDING is create-or-identical, an existing PENDING record and its recorded OPEN PR are validated before remote mutation, finalization requires exact PENDING bytes, and finalized state routes to cleanup. Cleanup publishes the strict self-contained 24-line mode-600 transaction before either source deletion, binding base/evidence/feature/tree/cumulative-manifest/reviewer truth, exact PR/merge/main topology, both source paths/hashes, deletion set, and cleanup proof. Recovery reauthenticates live topology, accepts each source only as exact-present or already absent under the authenticated transaction, fails closed on parser/mode/type/symlink/hash/topology drift, and removes the transaction only after both sources are absent. Both Stories require direct feature → exact merge ancestry and exact-old-SHA lease deletion so a changed remote survives.

170.1 SHIPPED 2026-08-25 (открытие Эпика 170; 1/7): preface #236 (`3eda5d66`) + #237 (`44a6eb7d`; 41 файл,
owned 417→447, **e2e на ветке 10/1↓/0 чистый**, 2×opus FRESH); полный пол **19 076/0**; 3 lib-канала
остановлены (lockstep цел); VALIDATOR-FAIL поймал 4 факт-ошибки разведки до кода.

170.2 SHIPPED 2026-08-25 (2/7): #239 (`5bb0dcc3`; 5 файлов, route 10→11 + card 17→26, полный пол **19 086/0**,
2×opus APPROVE×2, без preface; BackLink AX-фикс). 170.3 SHIPPED 2026-08-25 (3/7): #241 (`03a4b3b8`; 4 файла, owned 50→62, полный пол **19 098/0** (+12),
e2e на ветке 12/1↓/0, 2×opus APPROVE×2, без preface — mapBrandItem чист). 170.4 SHIPPED 2026-08-25 (4/7): #243 (`34f89495`; 14 файлов, owned 5→48, полный пол **19 139/0** (+41),
2×opus, без preface — 0-share→null контракт-санкционирован #225:55; 3 AC-объекта доставлены:
sr-alternative + filter-context subtitle + invalid-range). 170.5 SHIPPED 2026-08-26 (5/7): #245 (`19009e3d`; 5 файлов, owned 52→65, полный пол **19 154/0** (+15),
e2e на ветке 6/1↓/0, 2×opus; прямое зеркало 170.3 + Caption/tabular/scroll-дельта + entityFallback AX-пин).
170.6 SHIPPED 2026-08-26 (6/7): #247 (`d1bb947e`; 17 файлов, owned 51→78, полный пол **19 180/0** (+26),
e2e на ветке 7/5↓/0; 3-pass trail — r1-фиксы дефектны (косметика+вакуум-regex), r2 REQUEST_CHANGES
поймал оба, r3 verify; AC-2 закрыт). 170.7 SHIPPED 2026-08-26 — **ЭПИК 170 ЗАВЕРШЁН 7/7**: #249 preface + #250 (`7a94dac0`; 26 файлов,
owned 174→195, полный пол **19 204/0**, e2e 8/8 оживлены, 3-pass Trigger-1). Волна Эпика 170:
7 историй за 25-26.08 (PRs #237-#250), 3 preface-грани, все маршруты с e2e на ветке.

171.1 SHIPPED 2026-08-26 (Эпик 171 открыт, 1/9): #252 (`1c0bb385`; MINOR-GAP цикл — роут рождён
токен-чистым, 7 контракт-гэпов закрыты; owned 23→37, полный пол **19 217/0**, 2×opus APPROVE×2).
171.2 SHIPPED 2026-08-26 (2/9): #254 (`103a3ffe`; MINOR-GAP — born-clean, 7 гэпов; owned 50→58,
полный пол **19 226/0** (+8), 2×opus APPROVE×2; epic-literal focus-return-to-row доставлен).
171.3 SHIPPED 2026-08-26 (3/9): #256 (`116263fc`; NO-OP-вердикт + 2 микро-фикса — error-association AC-3 +
max-w; owned 26→28, полный пол **19 228/0**, 1×opus, e2e 10/1↓/0). 171.4 SHIPPED 2026-08-26 (4/9): #258 (`5a1e40f1`; полный цикл — 13 chart-hex, cutout dark-FIX ×2 (r1-HIGH
пойял wrong-surface), band tiers, sr-table; owned 183→196, полный пол **19 241/0**, 2×opus RC→APPROVE).
171.5 SHIPPED 2026-08-26 (5/9): #260 (`ae2eb11a`; MINOR-GAP — 1 amber + captions; owned 39→44,
полный пол **19 246/0**, 1×opus, e2e 7/1↓/0). 171.6 SHIPPED 2026-08-26 (6/9): #262 (`b867551f`;
MINOR-GAP-plus — 7 palette classNames→status tokens (hue-preserving, dark-fix), pulse dot, p-6
double-pad, caption, tabular-nums; STATUS_BADGE_CONFIG shape frozen для [id]-саброутов 171.7/171.9;
owned 51→58, полный пол **19 253/0**, 1×opus APPROVE-WITH-NOTES, e2e 13/1↓/0). 171.7 SHIPPED
2026-08-26 (7/9): #266 (`37ae5b4c`; MINOR-GAP — born-clean, 4 сайта: STATUS_BADGE_CONFIG.className
DETACH → route-local Record<ModelStatus,string> (hue-preserving 1:1, все 7 статусов; label из
shared-конфига; удаление поля — 171.9), TableCaption naming model, tabular-nums ×7 (nmId exempt),
p-6 double-pad; guard-8 (sku-accuracy exclusion load-bearing) + caption-тесты; owned 55→65,
полный пол **19 263/0**, 1×opus APPROVE-WITH-NOTES (0 дефектов), e2e 13/1↓/0, light+dark visual).
171.8 SHIPPED 2026-08-26 (8/9): #268 (`4970c17a`; MINOR-GAP — born-clean: TableCaption ×2
(overview names model AP#10 String-form; history names SKU), tabular-nums ×9 (nmId exempt),
route-paddings ×8 убраны; guard-6 + caption-тесты ×2; CROSS-SURFACE: anchor-safe фикс гарда 171.7
(substring-фильтр на абсолютном пути матчил имя worktree 171.8 — коллизия план-пиновых имён,
доказана симуляцией; relative-first фильтры); owned 63→71, полный пол **19 271/0**, 1×opus
APPROVE-WITH-NOTES (0 дефектов), e2e 13/1↓/0, light+dark visual оба вида).
171.9 SHIPPED 2026-08-26 (**ЭПИК 171 ЗАКРЫТ 9/9** — models-дерево мигрировано полностью): #270
(`2d46a175`; MINOR-GAP-plus — единственный саброут с реальной палитрой+hex: DRIFT+valence
palette→status tokens (dark-fix), MapeTrendChart 8 hex→171.4 chart-канон CSS vars (border/
chart-axis/chart-1, parity по живому ForecastChart), STATUS_BADGE_CONFIG.className DETACH
(route-local 1:1 map; поле остаётся — registry-root ModelListSection:149 тоже потребитель);
caption naming model + tabular + p-6; guard-9 + caption role-тест + 6 re-pins; owned 41→51,
полный пол **19 281/0**, 1×opus APPROVE (0 дефектов), e2e 13/1↓/0, light+dark visual с графиком).
**172.1 SHIPPED (2026-08-26, PR #278, merge `a001abee`)** — FULL-цикл: 127 файлов (125M+2A guard-теста), 4 executor-волны, targeted 65/1394→67/1410, полный пол **19 281→19 297** (+16 гардов), e2e 28/1↓/1 pre-existing (бисект на main), 3 ревью-прохода (REJECT 1 MAJOR chart-token collision → 2× APPROVE-WITH-NOTES), light+dark+390px visual, cleanup 0/0/0. Артефакт: `implementation-artifacts/172-1-fe-migrate-the-business-dashboard.md`.
**172.2 SHIPPED (2026-08-27, PR #280, merge `d35f1e09`)** — MINOR-GAP born-clean: 5 файлов (+437/−7), py-6-долг и raw-button закрыты, СОЗДАН e2e-пакет галереи (fixture-контроллер + 6-тестовая спека по канонической матрице; 1×opus review с HIGH-фиксом fixture-гонки), гард 7 тестов, полный пол **19 304/0**. Артефакт: `implementation-artifacts/172-2-fe-migrate-the-canned-automation-rules-gallery.md`.
**172.3 SHIPPED (2026-08-27, PR #282, merge `629b74c1`)** — MINOR-GAP-plus: 6 файлов (+291/−9), статус-токены (badge/safety/banner), полный пол **19 311/0**, e2e 10/0 first-run. Артефакт: `implementation-artifacts/172-3-fe-migrate-the-installed-automation-rules-list.md`.
**172.4 SHIPPED (2026-08-27, PR #285, merge `25c8bc19`)** — MINOR-GAP-plus: 5 файлов (+144/−15), status-токены editor'а, полный пол **19 319/0**; **163.3 editor-спека впервые live 8/8** (stale-заголовок снят). Артефакт: `implementation-artifacts/172-4-fe-migrate-the-installed-rule-detail-and-editor.md`.
**NEXT = 172.5 COGS single assignment (OWNER-КООРДИНАЦИЯ!)** (эпик 172, 13 стори осталось; owner-зависимые: 172.5/172.6/172.14 — см. §5; планы `.omx/plans/172.{5..17}-*.md`).
**Carry-out → 174.2 owner (route-ledger handoff из 171.9):** (1) удалить поле className из
STATUS_BADGE_CONFIG после миграции ModelListSection на собственный overlay; (2) переписать
stale-комментарий model-list-helpers.ts:24-26 («subroutes 171.7/171.9» — остался только
registry-root); (3) переписать stale-комментарий evaluations-list-helpers.ts:20-23 («removal
owned by 171.9»); (4) перенести статус-токен пины гарда 171.6 (читают helpers напрямую);
(5) anchor-hardening гарда 171.6 (join-before-filter — 171.8-класс, латентно).
параллельно независимо: 169.14 `in-progress` → 169.15 `backlog` → 169.12 `review` contract closeout (plans `.omx/plans/169.14-establish-authoritative-paid-storage-import-lifecycle-and-result-contract.md`, `.omx/plans/169.15-align-shared-frontend-paid-storage-import-boundary.md`, and `.omx/plans/169.12-migrate-storage-analytics-and-paid-storage-import.md`). Story 169.13 remains independently `done`.
**Волна 23-24.08** (два полных цикла + инфраструктура): 169.11 returns — preface #218 (`d6ed2c65`,
unknown-категория на boundary + нейтральный лейбл) + #219 (`129e99ed`; owned 50→73) + e2e-gap закрыт
post-close #222 (гнилой пин от стандартизации 1804aa8f; финал 12/1↓/0); 169.12 storage — preface #226
(`2c7a3c59`, tri-state `has_warehouse_stock` / nullable `percent_of_total` / импорт-статус unknown) +
маршрутная миграция #227 (`52f7f506`; 27 файлов, owned 119→147, **e2e на ветке 6/1↓/0**, 2×opus FRESH);
CSV-security #223 (OWASP defang + trade-off documented); чужой WIP реконсилирован #225 (cogs-split +
rateLimit + csv-dedupe); Correct Course #228 (`4d0ff685`) ввёл 169.14/169.15 + bounded 169.12-closeout.
**Пол vitest 19 281/0** (актуальный пол); lint 0/0; tsc 0. Browser/theme/visual evidence — carry-out 174.3;
credentialed functional E2E — carry-out 174.4. Plan-status аудит 2026-08-24: 167.5/167.8/167.9 → executed
(были review/ready-for-dev/backlog при done-строках).

## 2. Верификационные факты (2026-08-24, W9 + frontend Correct Course checkpoint)

- Fresh frontend evidence: PR #213 implementation `e738dd80`, merge `5c6950f3`; merge parents
  `0245f52b e738dd80`; route 55/55, full Vitest 18 952/18 952, build 70/70, final two reviews
  `APPROVE`, implementation branch/remote/worktree cleanup proven.
- Recovered COGS/CSV/rate-limit WIP was finalized in feature commit
  `e69e0516b119e6ad688fd34eeefe5b1fcdc55a38` and merged through PR #225
  (`https://github.com/salacoste/wb-erp-system-daytona-FE/pull/225`) as merge commit
  `069fd000a06a75f00f0ce898f2e4c7783dc16f2f`. The feature/WIP branches and old worktrees were
  cleaned after merge.
- Final frontend integration baseline for this docs package: PR #227 merged at
  `52f7f5061d73f5633fbc0fe575ff35f2055be194` after preface PR #226 at
  `2c7a3c5931dbc9890ed585eaf71f5717c04453b2`, and the Correct Course branch was reconciled onto PR #227
  before push. PR #226 is a Story 169.12 preface, not Story 169.15 completion: it preserves an
  internal `unknown` import sentinel in the shared type/normalizer/test and keeps it nonterminal in the
  route consumer, but it does not deliver the post-169.14 request/result/error/polling/diagnostic contract.
  Story 169.15 therefore remains `backlog`. PR #227 delivered the route presentation and evidence artifact,
  but Story 169.12 remains `review` until the approved contract chain closes. The unrelated remote automation branch
  `origin/automation/openwiki-32120597348-1` remains and is not part of this migration cleanup.
- Historical W9 backend snapshot only, **not current evidence and not revalidated by this frontend
  documentation follow-up**: backend `main` was `58e1a0a77`, backend Jest was 13 170/0, PM2 services
  were online, and Docker postgres/redis/mindsdb/prophet were up. Story 169.14 must collect fresh
  backend repository and service evidence before implementation.
- Story 169.14 preflight correction records current backend local `main` `e8cff608da1aa87e1c482a68566e8ba824fe1e2d`, refreshed `origin/main` `25b41be67f9f7e3b0aa6e8081f741b263dbecd64`, and the planned verified-origin Story base. The exact foreign-WIP paths that block a safe local fast-forward are `openwiki/.last-update.json` and `openwiki/workflows/fe-shadcn-migration.md`; Story-owned backend paths are non-overlapping. The immediate-pre-creation collision gate follows the canonical linked-worktree, unattached-branch, list-truncation, pagination/count-equality, and open-PR rules above. The correction limits the security expansion on the shared Excel/paid-storage status boundary to the necessary top-of-file `CabinetGuard` import plus method-level guard and directly related Swagger decorators. The intentional JWT-to-`X-Cabinet-Id` hardening applies to both job types, while authorized same-cabinet Excel polling remains regression-compatible. The handler body, unrelated methods, and class-wide guard remain forbidden, and `src/imports/imports.service.ts` remains read-only. Exact-SHA review additionally requires executable canonical-manifest authorization before evidence-preflight success and binds the exact unique Story privacy line inside the hashed reviewer payload while expanding the non-echoing credential scan. Before merge, exact PR `OPEN`/base/head/`headRefOid` identity must match the reviewed local head; cleanup must use the recorded PR number, prove direct feature → exact merge → refreshed-origin ancestry, and apply exact remote-ref equality before deletion. The two-phase, record-driven cleanup and committed final-handoff authentication supersede the old environment-supplied merge/cleanup trust and one-pass record removal wording.

## 3. Полный долг-реестр

### 3.1 FE-debt (по триггерам; 174.2 принимает только применимые design-system/source-boundary долги)

| ID    | Суть                                                                       | Триггер/фикс                                                                       |
| ----- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| FE-D1 | mutations retry:1 ретраит 4xx (WB-токен PUT ×2; e2e пинит putAttempts===2) | behavior-change ОТДЕЛЬНО (full vitest + e2e; обновить e2e-пин)                     |
| FE-D2 | WbTokenBanner dead code 0 importers                                        | ближайшая FE-story или 174.2                                                       |
| FE-D3 | getErrorMessage эхо сырого error.message юзеру                             | при касании apiClient/error-пути; scrub/truncate                                   |
| FE-D5 | cross-tab create duplication (нет CAS)                                     | fast-follow Web Locks API                                                          |
| FE-D6 | ExportConfigForm дубль ExportDialogForm (dead)                             | ближайшая чистка или 174.2                                                         |
| FE-D8 | getCabinetCreationOperation middle-path (юзер висит в SAFE_RECONCILIATION) | по UX-жалобе; НЕ менять без fresh-ревью                                            |
| FE-D9 | logApiError логирует non-2xx тела (вкл. plaintext password /register)      | БЛИЖАЙШАЯ FE-story трогающая apiClient; redact + isPasswordPolicyError → API-owner |

### 3.2 Волновые carry-outs (от маршрутных миграций 168.10-169.10)

| ID  | Суть                                                                                                                                                                          | Файл                                                                         | Фикс                                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | 4 tooltip-контейнера bg-white (dark-дефект)                                                                                                                                   | dashboard ExpenseChartTooltip/PatternTooltip/StatusTooltip                   | ближайшая dashboard-стори; bg-popover канон                                                                                                               |
| C2  | MarginDisplay legacy-палитра (gray/green/red-600)                                                                                                                             | components/custom/MarginDisplay.tsx                                          | ближайшая dashboard-стори или sweep; sign→financial, zero→muted                                                                                           |
| C3  | dead exports getProfitabilityColor/BgClass (0 прод-консьюмеров)                                                                                                               | lib/unit-economics-config.ts                                                 | 174.x sweep (вместе с FE-D2/D6)                                                                                                                           |
| C4  | getHealthScoreInfo hex+bgColor без прод-консьюмеров                                                                                                                           | lib/unit-economics-analysis.ts                                               | тот же 174.x sweep                                                                                                                                        |
| C5  | waterfall double-color-source (utils green vs config blue)                                                                                                                    | unit-economics-utils vs waterfall-chart-config                               | debt-ID при касании waterfall; решить канон-источник                                                                                                      |
| C6  | date-cells tabular-nums отсутствует во всех 3 acquiring-таблицах                                                                                                              | acquiring/**                                                                 | 174.x tree-wide sweep (НЕ пер-роутный фикс)                                                                                                               |
| C7  | e2e-комментарий «amber rate-limit banner» устарел                                                                                                                             | e2e/acquiring.spec.ts:130                                                    | при следующем касании спеки                                                                                                                               |
| C8  | FunnelPageContent находится ровно на source cap 200 строк                                                                                                                     | analytics/funnel/FunnelPageContent.tsx                                       | вынести sync/toolbar block при первом следующем касании                                                                                                   |
| C9  | Browser/theme/responsive/axe/keyboard/visual matrix 169.8-169.10 не выполнена                                                                                                 | analytics/funnel + gaps + liquidity                                          | обязательный consolidated evidence pass в 174.3                                                                                                           |
| C10 | KPI-icon canon Funnel semantic (owner 22.08), а 169.6/169.7 muted                                                                                                             | analytics/funnel + fbs routes                                                | свести к одному owner-canon в 174.2 (semantика = целевой)                                                                                                 |
| C11 | Cold-cache Funnel Vitest один раз дал 12 failures, warm/full runs стабильны                                                                                                   | analytics/funnel tests                                                       | расследовать только при повторном воспроизведении; не считать текущим functional failure                                                                  |
| C12 | GapsPageContent suites частично дублируются: route-level содержит 6 базовых composition checks, components-level дополнительно владеет corrective state/lifecycle regressions | analytics/gaps                                                               | консолидировать без потери corrective coverage в отдельном debt-pass                                                                                      |
| C13 | GapsTable: caption + scroll-aria-label дублируют смысл таблицы                                                                                                                | analytics/gaps/GapsTable.tsx                                                 | опциональная дедупликация (P1-LOW)                                                                                                                        |
| C14 | Gaps pure-digit hex guard исправлен в PR #213; остальные route guards ещё требуют owner-sweep                                                                                 | presentation-source-contracts tests outside analytics/gaps                   | при касании route-owner или применимый 174.2 source-boundary sweep; не переписывать ticket refs                                                           |
| C15 | URGENCY_CLASS кириллическими label-ключами (rename в lib = тихий fallback)                                                                                                    | analytics/liquidity/LiquidationScenarioCard.tsx                              | при касании: типизировать ключи через lib-тир или days-tier map                                                                                           |
| C16 | Pie `as unknown as` double-cast (pre-existing) + chart-3-as-text запас 0.02 (4.52)                                                                                            | analytics/liquidity/LiquidityDistributionChart.tsx                           | при касании waterfall-подобных графов; 174.2 контраст-ревью                                                                                               |
| C17 | Credentialed functional E2E для Story 169.9 corrective не выполнен                                                                                                            | analytics/gaps auth/session/error-recovery + local-backend critical journeys | Story 174.4; требуется отдельное явное credential-разрешение. Если оно выдано, передавать credential только in-memory, никогда не выводить и не сохранять |

### 3.3 BE-debt

| ID                    | Суть                                                                                                 | Триггер                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| TD-S2b                | supply-sync terminal-branch: first-seen-CLOSED не получают syncSupplyOrders; backfill >14d by design | одна строка link-call; ближайшая BE-story про supply-sync |
| TD-P8                 | supply barcode 409 на непакованном боксе                                                             | re-check на следующей РЕАЛЬНОЙ поставке                   |
| legacy test-api ×42   | апрельские naming-схемы                                                                              | owner-решение о массовой чистке                           |
| getMarginColor dedupe | локальные копии 168.3 + shared top-table-utils + dashboard (токенизированы в 172.1)                 | **re-route → 174.2** (дедуп требует analytics+shared правок — вне Allowed Surface 172.1; оценка проведена пост-фактум, disclosure в артефакте 172.1) |

### 3.4 Contrast/foundation эскалации → 174.2

- /15-chip light: warning 3.96 / success 4.21 / **success 4.19 (169.10 замер)** / chart-2 dark 4.46
  (известная семья <AA 4.5; legacy был 6.84 — REGRESS vs legacy, но консистентная волна-политика;
  dark PASS 7.8-10.4). Владелец = foundation (166), НЕ маршрутные стори; консолидация в 174.2
  (направление: затемнить light `--status-warning/success` до ~L24-25%; solid-пары имеют запас).
- **Chart-токены как ТЕКСТ** (правило волны с 169.10): на bg-card лучший 4.52 (запас 0.02!),
  на /15-тинте 3.71-4.19 FAIL — цвет серии ТОЛЬКО заливкой/бордером; текст на тинтах =
  `var(--color-foreground)`.
- /80-weaker-text light 3.2-3.45 = known-accept (волна).
- margin-tier divergence — foundation-owned.
- ЗАМЕТКА: контраст /15-пар зависит от слоя-подложки (bg-background vs card) — при сверке
  указывать слой (урок cont.21).

### 3.5 Наблюдения (не debt-ID, кандидаты в owner-вопросы)

- Нет мониторинга «BE мёртв N часов» — infra лежала 4 дня незамеченно (18-22.08; ledger cont.19).
- Advertising daily-trend spend `#7C3AED` purple остаётся hex до своих стори; 169.8 кладёт
  фундамент (adSpend → chart-4 в funnel); advertising reconciles своей волной.

## 4. Параллельные треки (вне программы миграции)

| Трек                                 | Статус                                                                                                                   | NEXT                                                                                                                                |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **W4 Epic-121 P3** (price writeback) | owner-решения ПОЛУЧЕНЫ (A→B→C; DRY_RUN enum; cap ±20%/2-write-day; dark-ship; kill-switch PRICE_WRITEBACK_ENABLED=false) | impl по дизайну docs/epics/epic-121-phase3-writeback-design.md; enum-миграция ТОЛЬКО в MAIN с throwaway shadow (⛔-правила live-db) |
| **W5 Epic-128**                      | ТОЛЬКО owner-акты (attestations; v2-envelope подпись; final-live-evidence Node 24.18.0)                                  | не трогать без owner; после PASS → 128-12                                                                                           |
| **W7 Финансы**                       | W34 (17-23.08) будет залита авто-пуллом **Пн 24.08 17:00 МСК** (недельный cron; owner подтвердил Пн-Вс)                  | ПЕРЕЧЕРК после 24.08; пусто после захода → эскалация owner                                                                          |
| **Инфра**                            | Восстановлена 22.08 после 4-дневного дауна (Docker off → BE dead; pm2 resurrect)                                         | живая проверка pm2/docker в начале КАЖДОЙ сессии                                                                                    |

## 5. Owner-зависимые стори (вехи 172-173)

- 172.5 — owner COGS; 172.6 — recovered COGS/CSV/rate-limit WIP merged through PR #225 and its temporary refs/worktrees are cleaned, but canonical Story 172.6 is **not complete**: it still depends on Story 172.5 and requires owner coordination for the `/cogs/bulk` route, validation/preview, explicit partial results, and failed-row retry contract; 172.14 — owner orders;
  173.1 — owner settings; 173.8 — owner shipments; 173.12 — owner supplies.

## 6. Процесс-ссылки

- Оркестратор-промпт v8 (процесс-канон, самодостаточный): docs/ORCHESTRATOR-PROMPT-2026-08-22-V8-AGENT-TEAM-CONTINUATION.md (BE-репо); канон-дельты W8/W9 — в соответствующих handoff.
- Хэндофф-цепочка: …→ W7-entry → W8 (169.8-9) → **W9** `docs/HANDOFF-2026-08-23-W9-169-10-SHIPPED.md` (актуальный вход) + ПОЛНЫЙ реестр: `docs/HANDOFF-2026-08-23-W9-FULL-DEBTS-AND-ROADMAP.md`.
- Ledger: docs/tech-debt/TECH-DEBT-2026-08-SESSION.md (Addendum-4 cont.1-25; каждая cont = закрытый item с уроками).
- Дефект-паттерны 1-44 + идиомы волны: v8-промпт + W8 §4 + W9 §3 (lib-hex-каналы, chart-не-текст, PR-reopen).
- W9 зафиксировала параллельную сессию, которая влила #209/#213 между нашими PR; boot-процесс должен сохранять fetch-детект и reopen-recovery после merge-гонки (W9 §2).
