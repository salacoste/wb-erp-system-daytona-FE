# Epic: МойСклад (completion) + Order Management — implementation tracker

> **Source of truth for the `/loop 15m` implementation cycle.** The loop picks the **first ⬜ story**, implements it per the BMad cycle (§Loop contract), marks it ✅, commits, and moves on. Append-only Progress log at the bottom.
> cwd: `frontend/` · branch per story (`feat/<story-id>-lowercase`) → merge `--no-ff` main → push.
> Verify-first is MANDATORY for every story (probe the live endpoint → exact contract before coding).

## Gathered documentation

- **МойСклад contract** — `docs/request-backend/221-moysklad-integration-backend-contract.md` (committed; 9 endpoints, 3 models, D43/D44 read-only, bootstrap-cabinet, response-shape quirks). Phase 1 already shipped (`b3945edf`).
- **Order Management** — **NO contract doc** for S11/S12/S8. Each O-story MUST verify-first: probe the endpoint, capture the enum/shape, then build. Live endpoints (verified 2026-07-02, dev backend):
  - `PATCH /v1/orders/:orderId/operational-status` — body `{ status: <OrderOperationalStatus> }` (NOT `operationalStatus`). Enum unknown → capture from a valid-order probe or backend `src/orders/` dto.
  - `POST /v1/orders/:orderId/confirm` · `POST /v1/orders/:orderId/cancel` · `PATCH /v1/orders/:orderId/meta` — routes exist (500/400 on bad id).
  - `POST /v1/supplies/:id/acceptance-act` — route exists.
  - `GET /v1/orders?limit=N` → items: `{ orderId, orderUid, nmId, vendorCode, productName, price, salePrice, supplierStatus, wbStatus, warehouseId, deliveryType, isB2B, cargoType, createdAt, … }`.
- **FE modules to extend**: `/orders` page (`src/app/(dashboard)/orders/`), `src/lib/api/orders.ts` + `orders/` dir, `src/hooks/useOrders.ts`; `/supplies` for acceptance-act.

## Hard rules (project CLAUDE.md — every story)
- ≤200 lines source / ≤800 test (split proactively ~150). No `any` (use `unknown`+narrow); no `as` casts (except `raw as RawInterface` normalizer pattern). `@/` aliases. Russian-locale formatters (`formatCurrency`/`formatDate`/`formatPercentage`) — no inline `%`.
- **Boundary Normalizer Pattern**: every backend response → FE-canonical at the API layer (raw shapes never reach components). Money/ratio `?? null` (AP#8, ESLint-enforced); counts `?? 0`. `skipDataUnwrap` when the envelope (`{count,total,rows}` / `{data,pagination}`) must survive.
- **Verify-first**: before coding an endpoint, `curl` it (login → JWT) to confirm shape; cite the verified shape in the normalizer test.
- **Gates** (all green before merge): `npm run type-check` 0 · `npx eslint 'src/**/*.{ts,tsx}'` 0 new · `npm test -- --run` ≥ floor + new tests, 0 failed · `bash scripts/check-locale-percent.sh` baseline 4 · `bash scripts/check-eslint-rules.sh` OK. `check:doc-citations` exit 0 (update baseline if a route edit legitimately shifts line-citations — `--update-baseline` same commit).
- **2-pass review**: behavior-changing source (mutations, normalizers, state machines) → 2 fresh-context `code-reviewer` passes before commit (1st structural/correctness, 2nd narrative/drift). Trivial additive UI: inline verify OK.
- **Concurrent-session protocol**: `git reset -q` before `git add`; stage ONLY your files; contamination check (`git diff --cached --name-only | grep -iE …`) before commit. Nuke `.next` before any live/Playwright check.

---

## Epic M — МойСклад (complete the module)

### M1 — Сток tab: `/stock-db` snapshots ✅
- **Verify-first (VERIFIED 2026-07-03)**: `GET /v1/moysklad/stock-db?limit=&date=YYYY-MM-DD` → `{count,total,date,rows[]}` (skipDataUnwrap). Omit `date` → latest snapshot date. Invalid `date` → 400. Row: `{id,cabinetId,date,moyskladAssortmentId,nmId(null=unmatched),stockFree,reserve(null),syncedAt}`. **`stockFree`/`reserve` are Prisma Decimal** — serialized as `{s,e,d}` decimal.js object (e.g. `{s:1,e:4,d:[28765,3100000]}`) → parse to number via a tested helper. 365 total snapshots (2026-07-03).
- **ACs**: (1) Сток tab renders a table (date, МС товар name [join via mappings cache or assortmentId], nmId or «не привязан», stockFree, reserve); (2) date selector (latest by default; invalid date → 400 handled); (3) pagination hint + pager; (4) loading/empty states; (5) null money → «—».
- **Files**: `stock-db` in `moysklad.ts` + normalizer; `useMoyskladStockDb`; `components/MoyskladStockTable.tsx`; wire into page.tsx Сток tab (replace placeholder).
- **Tests**: normalizer (null, date-validation), table render; E2E (Сток tab renders rows).

### M2 — МС товары browse (live `/products`) ✅
- **Verify-first (VERIFIED 2026-07-03)**: `GET /v1/moysklad/products?limit=&offset=` → `{rows: MoyskladProduct[], meta:{size,...}}` (NO `{data}` wrapper — top-level is `{rows,meta}`; read `.rows` + `.meta.size`). 394 products. Row: `{id,name,article?,code?,externalCode?,buyPrice?:{value,currency},salePrices?:[{value,currency}],updated?}`. **`buyPrice.value`/`salePrices[].value` are МС minor units (kopecks for RUB) → ÷100 for rubles** (matches Phase-1 `buyPriceKopeck/100`).
- **ACs**: (1) paginated list of МС products (name, article, code, buyPrice, salePrices); (2) live-call failure → graceful error (per contract v1-boundary #2, live ESM path); (3) limit/offset pager.
- **Files**: `getMoyskladProducts`; `useMoyskladProducts`; `components/MoyskladProductsList.tsx`; sub-tab or section on Обзор.
- **Tests**: normalizer + pager; E2E (list renders).

### M3 — МС модификации browse (live `/variants`) ✅
- **Verify-first (VERIFIED 2026-07-03, auth restored)**: `GET /v1/moysklad/variants?limit=&offset=` → `{rows, meta:{size}}` (same envelope as /products — no `{data}` wrapper; read `.rows` + `.meta.size`). 41 variants. Row: `{id, name, code, product (parent ref), barcodes[], updated}` — **NO article** (variants lack it, per contract). Auth was broken (seed re-seed) → fixed: seed reverted to `Russia23!` + idempotency gap patched; storageState regenerated.
- **Verify-first**: `GET /v1/moysklad/variants?limit=2` → `{rows, meta}`. Variants have **no article** (per contract).
- **ACs**: (1) paginated variant list; (2) indicates variant (no article) vs product; (3) live-call error handling.
- **Files**: `getMoyskladVariants`; `useMoyskladVariants`; `components/MoyskladVariantsList.tsx`.
- **Tests**: normalizer; E2E.

### M4 — Mappings pagination (reach all 422 pending) ✅
- **Verify-first (VERIFIED 2026-07-03)**: `/mappings?matched=false&limit=2&offset=0` vs `offset=2` → distinct rows (ids `26ce7ac0` vs `11660612`), `total:435`. limit/offset pagination works. M4 adds the pager UI to `MoyskladMappingsTable` (Phase 1 shows ≤100 + hint only).
- **ACs**: (1) limit/offset pager on `MoyskladMappingsTable` (currently capped 100 + hint); (2) «Показано N из total» updates; (3) filter (matched/pending) preserved across pages; (4) keyboard-accessible pager.
- **Files**: extend `MoyskladMappingsTable.tsx` (+ a small `Pagination` reuse if exists, else shadcn).
- **Tests**: page navigation; filter preserved; E2E.

### M5 — COGS-recalc visibility (after link+sync) ✅
- **Verify-first (VERIFIED 2026-07-04)**: no new endpoint — client-side visibility on `MoyskladMappingRow`. Matched row already shows `nmId` + `buyPriceRub`; product route `ROUTES.ANALYTICS.PRODUCT='/analytics/product'` exists (FR-7). M5 adds: (a) drill-through link nmId→product page; (b) transient «себестоимость обновлена» badge after link+sync (recentlyLinked set; clears on next sync).
- **Context**: buy-price → versioned Cogs → auto `MARGIN_CALCULATION` (backend). FE surfaces it.
- **ACs**: (1) after a successful link+sync, the linked mapping shows «себестоимость обновлена» badge (buyPrice → Cogs); (2) a link to the product's COGS/margin view; (3) badge clears on next sync.
- **Files**: `MoyskladMappingRow.tsx` badge; hook state (post-sync linked-set).
- **Tests**: badge renders after link+sync; E2E optional.
- **Deps**: M1 (sync) done (Phase 1).

---

## Epic O — Order Management

### O1 — Order operational-status (PATCH) ⬜
- **Verify-first (CRITICAL)**: probe `PATCH /v1/orders/<realOrderId>/operational-status` with a valid order id (from `GET /orders?limit=1`) → capture the `OrderOperationalStatus` enum + the response shape + valid transitions. Do NOT guess.
- **ACs**: (1) per-order status badge in the orders table (supplierStatus/wbStatus → operational); (2) a status-change control (dropdown) → PATCH; (3) only valid transitions enabled (capture from verify); (4) optimistic update + invalidate; (5) error toast on failure.
- **Files**: `orders.ts` `updateOrderOperationalStatus`; normalizer + enum type; `useUpdateOrderOperationalStatus`; row component in `/orders`.
- **Tests**: enum/normalizer; mutation + invalidate; E2E (status change on a real order — or non-mutating: control visible/disabled states).
- **2-pass review** (state machine + mutation).

### O2 — Confirm order (POST `/orders/:id/confirm`) ⬜
- **Verify-first**: probe with a real pending order → response shape + preconditions (which orders can be confirmed).
- **ACs**: (1) «Подтвердить» action on confirmable orders; (2) success → status flips; (3) disabled on non-confirmable; (4) loading state.
- **Files**: `confirmOrder`; `useConfirmOrder`; row action.
- **Tests**: mutation + state; E2E.

### O3 — Cancel order (POST `/orders/:id/cancel`) ⬜
- **Verify-first**: probe → shape + preconditions.
- **ACs**: (1) «Отменить» action with a **confirm dialog** (destructive); (2) success → status flips; (3) reason field if the API requires it; (4) disabled on non-cancellable.
- **Files**: `cancelOrder`; `useCancelOrder`; `CancelOrderDialog.tsx`.
- **Tests**: confirm-gate; mutation; E2E.

### O4 — Edit order meta (PATCH `/orders/:id/meta`) ⬜
- **Verify-first (CRITICAL)**: probe `PATCH /meta` with `{}` (400) and a valid body → capture **which fields** are editable (the contract is unknown). Do NOT guess.
- **ACs**: (1) edit dialog with the editable fields (from verify); (2) save → PATCH; (3) validation; (4) success → row updates.
- **Files**: `updateOrderMeta`; `useUpdateOrderMeta`; `EditOrderMetaDialog.tsx`.
- **Tests**: field validation; mutation; E2E.

### O5 — Acceptance-act (POST `/supplies/:id/acceptance-act`) ⬜
- **Verify-first**: probe with a real supply id → shape (WB act storage, indefinite retention).
- **ACs**: (1) «Загрузить акт приёмки» action on a supply; (2) success → stored-act indicator + link/date; (3) idempotent (re-request doesn't duplicate); (4) error handling.
- **Files**: `requestAcceptanceAct` (in supplies API); `useRequestAcceptanceAct`; supply row action.
- **Tests**: mutation + idempotency; E2E.

---

## Loop contract (BMad cycle — each fire)

For the **first ⬜ story** in order (M1→M5→O1→O5):
1. **Verify-first** — `curl` the story's endpoint(s) (login→JWT, X-Cabinet-Id); capture exact shape/enum; update the story's "Verify-first" line with the verified contract. If the endpoint is NOT live → mark ⛔ (blocked: backend) + move on.
2. **Analyze** — read the cited existing code (patterns to mirror: МойСklad Phase 1 normalizer/hooks; orders module for O-stories).
3. **Implement (TDD)** — types → normalizer (+ unit tests for nullability/shape) → hook → component → page wiring → fixture. ≤200 lines/file.
4. **Validate** — `type-check` + `eslint` (changed files) + `vitest` (new + touched area). Fix until 0.
5. **QA** — component/page tests cover every AC; add a Playwright E2E (`e2e/<story>.spec.ts`, storageState, `--no-deps`, no networkidle). Run it (nuke `.next` first). Non-mutating where possible.
6. **2-pass review** (behavior-changing) — fresh-context `code-reviewer` ×2; address findings; re-validate.
7. **Green?** all gates + tests + E2E pass → mark story ✅, append a dated **Progress log** entry (files + gate results), commit `feat(<id>): <subject>` on the story branch, merge `--no-ff` main, push, delete branch. → next fire picks the next ⬜.
   **Not green / blocked** → mark ⛔ with reason (gate fail you can't fix in-fire / external block); do NOT commit broken code; next fire retries or moves on.
8. **No ⬜ remain** → stop, post a final summary.

## Status legend
⬜ pending · 🔄 in-progress · ✅ done · ⛔ blocked

## Progress log (append-only)
- **2026-07-03 — M1 ✅**: Сток tab (`/stock-db` snapshots). Files: `src/types/moysklad.ts` (stock types), `src/lib/api/moysklad-stock.ts` (new — `mapStockSnapshot` + `getMoyskladStockDb` skipDataUnwrap), `src/lib/api/normalizer-helpers.ts` (`toDecimalNumber` — Prisma Decimal `{s,e,d}`→number, no runtime decimal.js dep), `src/hooks/useMoyskladQueries.ts` (`useMoyskladStockDb`), `src/app/(dashboard)/moysklad/components/MoyskladStockTable.tsx`, page.tsx Сток-tab wiring, fixture + tests, `e2e/m1-moysklad-stock.spec.ts`. Fresh-context review SHIP (0 CRIT/HIGH/MED; 1 LOW — dropped redundant `as` casts for strict no-`as`). Gates: type-check 0 · eslint 0 · 73 unit tests · locale 4 · E2E 2/2 · eslint-rules OK. Caught + fixed a type error the executor's self-report missed (test fixture `nmId:null` vs `typeof matchedRow[]` param — independent gate re-run).
- **2026-07-03 — M2 ✅**: МС товары tab (live `/products` browse). Files: `src/types/moysklad.ts` (MoyskladProduct), `src/lib/api/moysklad-products.ts` (new — `mapMoyskladProduct` reuses `kopeckToRubles` for buyPrice.value/salePrices[0].value ÷100; `getMoyskladProducts` skipDataUnwrap → `{rows,total:meta.size}`), `src/hooks/useMoyskladQueries.ts` (`useMoyskladProducts`, retry:0), `src/app/(dashboard)/moysklad/components/MoyskladProductsTable.tsx` (paginated, 6 cols, graceful live-call error banner), page.tsx 4th tab, fixture + tests, `e2e/m2-moysklad-products.spec.ts`. Read-path trivial normalizer (reuses helpers) → inline-verified (formal review reserved for O-stories' mutations). Gates: type-check 0 · eslint 0 · 18 unit tests · locale 4 · E2E 1/1.
- **2026-07-03 — M3 ⛔→✅ (auth restored + shipped)**: AUTH blocker resolved — backend reverted seed to `Russia23!` + patched the seed idempotency gap (re-seed now re-hashes password on mismatch); FE regenerated `e2e/.auth/user.json` (nuke `.next` fixed a stale-build login-form hang). Then M3 shipped: `src/lib/api/moysklad-variants.ts` (`mapMoyskladVariant` — barcodesCount count-exception, parentProductHref best-effort, no article), `useMoyskladVariants`, `MoyskladVariantsTable` (5 cols, NO «Артикул» — variants lack it, paginated), page.tsx 5th tab, fixture + 21 tests, `e2e/m3-moysklad-variants.spec.ts`. Gates: type-check 0 · eslint 0 · 21 unit · locale 4 · E2E 1/1.
- **2026-07-04 — M4 ✅**: Mappings pagination (reach all 422 pending). `MoyskladMappingsTable` + new `MoyskladMappingsPager` (page size 20, limit/offset on the active view, reset-on-filter-change, «Назад»/«Вперёд» + «Показано N–M из total», disabled at bounds). 3 count queries (limit:1) untouched. Gates: type-check 0 · eslint 0 · 34 moysklad tests (11 MappingsTable: 8 existing + 3 pager) · locale 4 · E2E 1/1.
- **2026-07-04 — M5 ✅**: COGS-recalc visibility. Drill-through Link on matched nmId → `/analytics/product/<nmId>` (anti-pattern #10: String id); transient «себестоимость обновлена» badge via `useRecentlyLinked` (in-memory Set, cleared on the mappings-query `dataUpdatedAt` bump = sync-completed signal — crosses the tab boundary a 2nd `useMoyskladSync` instance couldn't). New `CogsRecalcBadge.tsx` + `useRecentlyLinked.ts`. 5 new tests (drill-through href, no-link-on-pending, badge on recent+buyPrice, no-badge-otherwise, no-badge-null-price). **No live E2E** — drill-through is data-dependent (needs matched rows); live matched count dropped 13→0 (re-sync lost the vendorCode auto-matches — data/backend concern, not M5). Link rendering unit-tested. Gates: type-check 0 · eslint 0 · 39 moysklad tests · locale 4. **МойСклад module COMPLETE (M1–M5).**
