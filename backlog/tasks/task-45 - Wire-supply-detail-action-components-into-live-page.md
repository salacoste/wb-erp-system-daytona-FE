---
id: task-45
title: Wire supply detail action components into live page
status: Done
assignee:
  - '@codex'
created_date: '2026-06-16 18:06'
updated_date: '2026-06-16 18:23'
labels:
  - validation
  - supplies
  - ui
  - functional-gap
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Operations UI validation found that `/supplies/[id]` renders action buttons for adding orders, closing supply, and generating stickers, but the page handlers only show placeholder toasts (`скоро будет доступно`) even though `OrderPickerDrawer`, `CloseSupplyDialog`, and `GenerateStickersModal` components already exist. This is a real functional gap: visible functionality is not available to users.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Clicking “Добавить заказы” opens the existing OrderPickerDrawer and allows adding eligible orders.
- [x] #2 Clicking “Закрыть поставку” opens the existing close confirmation flow and uses the close supply mutation.
- [x] #3 Clicking sticker/generate action opens the existing sticker format/generation modal for eligible supply statuses.
- [x] #4 Relevant unit/E2E tests validate live actions instead of placeholder toasts.
- [x] #5 No placeholder 'скоро будет доступно' toasts remain for shipped supply detail actions.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented during operations UI validation. `/supplies/[id]` now wires existing `OrderPickerDrawer`, `CloseSupplyDialog`, and `GenerateStickersModal` instead of placeholder toast handlers. Added accessible/testable `data-testid="supply-status-badge"` + aria-label on `SupplyStatusBadge`. Fixed latent Next build blockers in imported supply hooks by moving `'use client'` directives to the top of `useCloseSupply.ts`, `useGenerateStickers.ts`, and `useDownloadDocument.ts`.

Evidence 2026-06-16: `npx playwright test e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts --project=chromium --no-deps --reporter=line` => 41 passed, 3 skipped. Supply detail tests cover order picker drawer, close confirmation dialog, sticker modal, documents, and mobile behavior. Lifecycle skips are data-dependent (no eligible orders / empty supply), not placeholder-toasts.

Evidence 2026-06-16: full operations smoke `npx playwright test e2e/shipments-page.spec.ts e2e/shipments/shipments-a11y.spec.ts e2e/shipments/shipments-list.spec.ts e2e/shipments/shipments-detail.spec.ts e2e/shipments/shipments-lifecycle.spec.ts e2e/supplies-page.spec.ts e2e/supplies/supplies-a11y.spec.ts e2e/supplies/supplies-list.spec.ts e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts e2e/fbs-enhanced.spec.ts e2e/fbs-stock.spec.ts e2e/alerts-page.spec.ts e2e/backfill-page.spec.ts e2e/settings/backfill-a11y.spec.ts e2e/settings/backfill-admin.spec.ts --project=chromium --no-deps --reporter=line` => 196 passed, 63 skipped, 0 failed.

Static evidence 2026-06-16: targeted ESLint on changed files with `--max-warnings=0 --no-warn-ignored` passed; `npm run type-check` passed with 0 TypeScript errors.


Evidence 2026-06-18: targeted source ESLint passed for `src/app/(dashboard)/supplies/[id]/page.tsx`, `SupplyStatusBadge.tsx`, `useCloseSupply.ts`, `useDownloadDocument.ts`, and `useGenerateStickers.ts`; targeted E2E ESLint passed for `e2e/supplies/supply-detail.spec.ts` and `e2e/supplies/supply-lifecycle.spec.ts`.

Evidence 2026-06-18: `npm run type-check` passed with 0 TypeScript errors.

Evidence 2026-06-18: `npx playwright test e2e/supplies/supply-detail.spec.ts e2e/supplies/supply-lifecycle.spec.ts --project=chromium --no-deps --reporter=line` => 16 passed. Mutating supply lifecycle flows are guarded by `mutation-guard` and are skipped by default unless explicit sandbox mutation env is set.
<!-- SECTION:NOTES:END -->
