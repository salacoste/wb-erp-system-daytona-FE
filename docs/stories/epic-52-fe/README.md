# Epic 52-FE: Tariff Settings Admin UI

**Status**: 📋 Ready for Development
**Total Stories**: 7
**Total Story Points**: 26 SP
**Estimated Duration**: 10-14 days

---

## Overview

Frontend implementation for managing Wildberries global tariff settings. Integrates with Backend Epic 52 (complete) which provides 7 admin-only API endpoints.

---

## Stories

| Story | Title | SP | Status | Depends On |
|-------|-------|-----|--------|------------|
| [52-FE.1](./story-52-fe.1-version-history-table.md) | Version History Table | 3 | 📋 Ready | 52-FE.7 |
| [52-FE.2](./story-52-fe.2-tariff-settings-edit-form.md) | Tariff Settings Edit Form | 8 | 📋 Ready | 52-FE.7, 52-FE.1 |
| [52-FE.3](./story-52-fe.3-schedule-future-version.md) | Schedule Future Version | 5 | 📋 Ready | 52-FE.7, 52-FE.2 |
| [52-FE.4](./story-52-fe.4-audit-log-viewer.md) | Audit Log Viewer | 4 | 📋 Ready | 52-FE.7 |
| [52-FE.5](./story-52-fe.5-delete-scheduled-version.md) | Delete Scheduled Version | 2 | 📋 Ready | 52-FE.1 |
| [52-FE.6](./story-52-fe.6-rate-limit-ux.md) | Rate Limit UX & Error Handling | 2 | 📋 Ready | 52-FE.7 |
| [52-FE.7](./story-52-fe.7-page-layout-types.md) | Page Layout, Types & Integration | 2 | 📋 Ready | None |

---

## Implementation Order

```
Sprint 1 (9 SP) - Foundation
├── 52-FE.7 (2 SP) - Types, API client, page layout
├── 52-FE.1 (3 SP) - Version history (read-only)
└── 52-FE.4 (4 SP) - Audit log (read-only)

Sprint 2 (10 SP) - Core Features
├── 52-FE.2 (8 SP) - Edit form (main feature)
└── 52-FE.6 (2 SP) - Rate limit UX

Sprint 3 (7 SP) - Advanced Features
├── 52-FE.3 (5 SP) - Schedule versions
└── 52-FE.5 (2 SP) - Delete scheduled
```

---

## API Endpoints

| Endpoint | Method | Used In |
|----------|--------|---------|
| `/v1/tariffs/settings` | GET | 52-FE.2, 52-FE.7 |
| `/v1/tariffs/settings` | PUT | 52-FE.2 |
| `/v1/tariffs/settings` | PATCH | 52-FE.2 |
| `/v1/tariffs/settings/history` | GET | 52-FE.1 |
| `/v1/tariffs/settings/schedule` | POST | 52-FE.3 |
| `/v1/tariffs/settings/:id` | DELETE | 52-FE.5 |
| `/v1/tariffs/settings/audit` | GET | 52-FE.4 |

---

## Key Technical Decisions

1. **Route**: `/settings/tariffs` (admin-only)
2. **State Management**: TanStack Query for server state
3. **Form Handling**: react-hook-form + zod validation
4. **Rate Limit**: Zustand store for tracking remaining requests
5. **Tab Layout**: shadcn/ui Tabs component

---

## Files Structure

```
src/
├── app/(dashboard)/settings/tariffs/
│   └── page.tsx
├── components/custom/tariffs-admin/
│   ├── TariffSettingsForm.tsx
│   ├── AcceptanceRatesSection.tsx
│   ├── LogisticsRatesSection.tsx
│   ├── CommissionRatesSection.tsx
│   ├── StorageSettingsSection.tsx
│   ├── FbsSettingsSection.tsx
│   ├── LogisticsTiersEditor.tsx
│   ├── VersionHistoryTable.tsx
│   ├── VersionStatusBadge.tsx
│   ├── ScheduleVersionModal.tsx
│   ├── ScheduleVersionForm.tsx
│   ├── AuditLogTable.tsx
│   ├── AuditFieldFilter.tsx
│   ├── AuditValueDisplay.tsx
│   ├── DeleteVersionDialog.tsx
│   └── RateLimitIndicator.tsx
├── types/
│   └── tariffs-admin.ts
├── lib/api/
│   └── tariffs-admin.ts
├── hooks/
│   ├── tariff-query-keys.ts
│   ├── useTariffSettings.ts
│   ├── useTariffVersionHistory.ts
│   ├── useTariffAuditLog.ts
│   ├── useUpdateTariffSettings.ts
│   ├── useScheduleTariffVersion.ts
│   └── useDeleteTariffVersion.ts
└── stores/
    └── rateLimitStore.ts
```

---

## Related Documentation

- [Epic Document](../../epics/epic-52-fe-tariff-settings-admin-ui.md)
- [Backend Request #101](../request-backend/101-epic-52-tariff-settings-admin-api.md)
- Backend Epic 52 stories: `docs/stories/epic-52/`

---

**Created**: 2026-01-22
**Author**: BMad Master + PM Agent
