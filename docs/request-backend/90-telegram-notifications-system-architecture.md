# Request #90: Telegram Notifications System - Complete Frontend Guide

**Date**: 2025-12-30
**Status**: ✅ Production Ready
**Epic**: Epic 34 - Telegram Notifications
**Related**: Request #89 (Integration Guide), Request #73 (Epic Overview)

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Responsibilities](#architecture--responsibilities)
3. [Event System](#event-system)
4. [Notification Structure](#notification-structure)
5. [Task Types & Metrics](#task-types--metrics)
6. [Message Templates](#message-templates)
7. [User Preferences API](#user-preferences-api)
8. [Telegram Binding Flow](#telegram-binding-flow)
9. [Real-time Status](#real-time-status)
10. [Examples & Use Cases](#examples--use-cases)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose

Automated Telegram notification system that sends real-time updates about:
- Task completions (products sync, advertising sync, storage import, etc.)
- Task failures with error details
- Task stalls (worker health issues)
- Daily digests (planned, not yet implemented)

### Key Features

- ✅ **Backend-Driven Content**: 100% of notification content, formatting, and logic managed by backend
- ✅ **Rich Metrics**: Task-specific detailed metrics (e.g., products fetched/added/removed)
- ✅ **Multi-language**: Russian and English templates
- ✅ **User Control**: Preferences for enable/disable, quiet hours, event filters
- ✅ **Visual Enhancement**: Emoji-based visual structure for better readability
- ✅ **Rate Limiting**: Automatic rate limiting to prevent spam
- ✅ **Logging**: Complete audit trail in `notification_log` table

---

## Architecture & Responsibilities

### Backend Responsibilities (100%)

---

## Backend Team Response
**Status**: RESOLVED — this document IS the backend response. See the parent request file for the original frontend ask.

**Backend owns ALL notification content:**
1. **Event Detection**: Listens to BullMQ task events (completed, failed, stalled)
2. **Context Extraction**: Extracts task-specific metrics from job results
3. **Template Rendering**: Renders message templates with Handlebars-like syntax
4. **Preference Checks**: Validates user preferences (enabled, quiet hours, event filters)
5. **Rate Limiting**: Applies rate limits (60 messages/hour per chat)
6. **Telegram API**: Sends messages via Telegraf library
7. **Logging**: Records all notification attempts in database

**Key Services**:
- `NotificationService` - Core orchestration
- `NotificationTemplateService` - Message rendering
- `TelegramBotService` - Telegram API integration
- `NotificationPreferencesService` - User preferences
- `NotificationRateLimiter` - Rate limiting
- `TaskEventListener` - BullMQ event listener

### Frontend Responsibilities (Preferences Only)

**Frontend manages ONLY user preferences:**
1. **Telegram Binding UI**: Help user connect Telegram account
2. **Preferences UI**: Enable/disable notifications, set quiet hours, choose language
3. **Event Filters**: Allow user to enable/disable specific event types
4. **Status Display**: Show binding status, last notification time

**Frontend does NOT:**
- ❌ Format notification messages
- ❌ Decide when to send notifications
- ❌ Apply business logic to notifications
- ❌ Interact with Telegram API directly

---

## Event System

### Event Types

| Event Type | Description | When Triggered | User Control |
|------------|-------------|----------------|--------------|
| `task.completed` | Task finished successfully | BullMQ job completed | ✅ Can disable |
| `task.failed` | Task failed after all retries | BullMQ job failed | ✅ Can disable |
| `task.stalled` | Worker stopped responding | BullMQ job stalled | ✅ Can disable |
| `daily_digest` | Daily summary | Planned (not yet implemented) | ✅ Can disable |

### Event Flow

```
┌─────────────┐
│  BullMQ Job │ (products_sync, adv_sync, etc.)
└──────┬──────┘
       │
       ├─ completed → task.completed event
       ├─ failed    → task.failed event
       └─ stalled   → task.stalled event
              │
              ▼
    ┌──────────────────┐
    │ TaskEventListener │ (listens to BullMQ QueueEvents)
    └────────┬─────────┘
             │
             ▼
    ┌───────────────────────┐
    │ NotificationService   │
    │  1. Extract context   │
    │  2. Check preferences │
    │  3. Check quiet hours │
    │  4. Rate limit check  │
    │  5. Format message    │
    │  6. Send to Telegram  │
    │  7. Log result        │
    └───────────────────────┘
```

### Preference Checks (Automatic)

Before sending any notification, backend checks:

1. **Telegram Enabled**: `preferences.telegramEnabled === true`
2. **Event Enabled**: Specific event type enabled (e.g., `taskCompleted`, `taskFailed`)
3. **Quiet Hours**: Current time NOT in user's quiet hours range
4. **Rate Limit**: User hasn't exceeded 60 messages/hour
5. **Binding Verified**: User has verified Telegram binding

If ANY check fails → notification is skipped and logged with reason.

---

## Notification Structure

### Message Format (Telegram Markdown)

All notifications use **Telegram Markdown V1** with this structure:

```
[Emoji] *Bold Header*

📋 Field: Value
📋 Field: Value
{{#if conditional_field}}
📋 Optional Field: {{value}}
{{/if}}
```

### Example: task.completed

```
✅ *Задача выполнена успешно*

📋 Тип: 📦 Синхронизация товаров
⏱️ Время: 1 сек
📦 Загружено товаров: 55
➕ Добавлено новых: 2
➖ Удалено: 0
```

### Example: task.failed

```
❌ *Ошибка выполнения задачи*

📋 Тип: 📢 Синхронизация рекламы
🔄 Попыток: 5/5

⚠️ *Ошибка:* Rate limit exceeded for WB API
```

### Example: task.stalled

```
⚠️ *Задача зависла*

📋 Тип: 📊 Импорт платного хранения
⏱ Время выполнения: 45 мин 23 сек

🔧 _Требуется проверка. Задача может быть автоматически перезапущена._
```

---

## Task Types & Metrics

### Task-Specific Metrics (2025-12-30 Update)

Each task type now includes **detailed metrics** instead of just generic "rows processed":

#### 1. `products_sync` - Синхронизация товаров

**Backend Fields** (from worker result):
```typescript
{
  products_fetched: number,  // Total products loaded from WB API
  products_added: number,    // New products added to database
  products_removed: number   // Products removed (no longer active)
}
```

**Notification Output**:
```
📦 Загружено товаров: 55
➕ Добавлено новых: 2
➖ Удалено: 0
```

#### 2. `adv_sync` - Синхронизация рекламы

**Backend Fields**:
```typescript
{
  campaigns_synced: number,   // Total campaigns synced
  stats_campaigns: number,    // Campaigns with statistics processed
  cost_records: number        // Cost records loaded
}
```

**Notification Output**:
```
📢 Синхронизировано кампаний: 259
📊 Обработано статистики: 55 кампаний
💰 Загружено затрат: 98 записей
```

#### 3. `paid_storage_import` - Импорт платного хранения

**Backend Fields**:
```typescript
{
  records_imported: number    // Storage records imported
}
```

**Notification Output**:
```
📊 Импортировано записей: 1,312
```

#### 4. `product_imt_sync` - Синхронизация склеек (imtId)

**Backend Fields**:
```typescript
{
  products_updated: number,   // Products with imtId updated
  unique_groups: number       // Unique merged product groups created
}
```

**Notification Output**:
```
🔗 Обновлено товаров: 47
📦 Создано групп склеек: 27
```

#### 5. Generic Tasks (Fallback)

**Backend Fields**:
```typescript
{
  rowsCount?: number,         // Generic rows processed
  count?: number              // Generic count
}
```

**Notification Output**:
```
📊 Обработано: 1,234 строк
```

### Complete Task Type List

| Task Type | Icon | Russian Label | English Label |
|-----------|------|---------------|---------------|
| `products_sync` | 📦 | Синхронизация товаров | Products sync |
| `adv_sync` | 📢 | Синхронизация рекламы | Advertising sync |
| `paid_storage_import` | 📊 | Импорт платного хранения | Paid storage import |
| `product_imt_sync` | 🔗 | Синхронизация склеек (imtId) | Product card linking (imtId) |
| `finances_weekly_ingest` | 💰 | Импорт финансового отчёта | Financial report import |
| `margin_calculation` | 📈 | Расчёт маржи | Margin calculation |
| `recalculate_weekly_margin` | 🔄 | Пересчёт маржи | Margin recalculation |
| `weekly_sanity_check` | ✅ | Проверка данных | Data validation |
| `publish_weekly_views` | 📤 | Публикация витрин | Views publishing |
| `enrich_cogs` | 💵 | Обогащение себестоимостью | COGS enrichment |
| `weekly_margin_aggregate` | 📊 | Агрегация маржи | Margin aggregation |
| `stocks_sync` | 📦 | Синхронизация остатков | Stocks sync |
| `orders_sync` | 🛒 | Синхронизация заказов | Orders sync |
| `prices_sync` | 💲 | Синхронизация цен | Prices sync |
| `daily_sales_sync` | 📈 | Синхронизация продаж | Sales sync |

---

## Message Templates

### Template Syntax

Backend uses **Handlebars-like syntax** for templates:

```handlebars
✅ *Задача выполнена успешно*

📋 Тип: {{task_type_label}}
{{#if week}}📅 Неделя: {{week}}{{/if}}
⏱️ Время: {{duration}}
{{#if products_fetched}}
📦 Загружено товаров: {{products_fetched}}{{/if}}
```

**Syntax Elements**:
- `{{variable}}` - Simple variable substitution
- `{{#if variable}}...{{/if}}` - Conditional block (only shown if value is truthy)
- `{{#each array}}...{{/each}}` - Loop over array (used in daily_digest)

### Variable Formatting

Backend automatically formats variables:

1. **Duration**: `1234567ms` → `20 мин 34 сек`
2. **Numbers**: `1234567` → `1,234,567` (Russian locale with space separator)
3. **Errors**: Truncated to 200 chars, sanitized (no sensitive data)
4. **Task Labels**: Translated to user's language with emoji

### Template Files

- **Templates**: `src/notifications/templates/notification-templates.ts`
- **Labels**: `src/notifications/templates/task-type-labels.ts`
- **Service**: `src/notifications/services/notification-template.service.ts`

---

## User Preferences API

### Preferences Structure

```typescript
interface NotificationPreferences {
  id: string;
  userId: string;
  cabinetId: string;
  language: 'ru' | 'en';
  telegramEnabled: boolean;

  // Event filters
  taskCompleted: boolean;
  taskFailed: boolean;
  taskStalled: boolean;
  dailyDigest: boolean;

  // Quiet hours (UTC)
  quietHoursEnabled: boolean;
  quietHoursStart: string;  // "22:00" format
  quietHoursEnd: string;    // "08:00" format

  createdAt: Date;
  updatedAt: Date;
}
```

### API Endpoints

#### 1. Get Preferences

```http
GET /v1/notifications/preferences?cabinetId={cabinetId}
Authorization: Bearer {jwt}
```

**Response**:
```json
{
  "preferences": {
    "id": "uuid",
    "userId": "uuid",
    "cabinetId": "uuid",
    "language": "ru",
    "telegramEnabled": true,
    "taskCompleted": true,
    "taskFailed": true,
    "taskStalled": true,
    "dailyDigest": false,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "createdAt": "2025-12-30T00:00:00Z",
    "updatedAt": "2025-12-30T00:00:00Z"
  }
}
```

#### 2. Update Preferences

```http
PATCH /v1/notifications/preferences
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "cabinetId": "uuid",
  "telegramEnabled": true,
  "language": "en",
  "taskCompleted": true,
  "taskFailed": true,
  "quietHoursEnabled": true,
  "quietHoursStart": "23:00",
  "quietHoursEnd": "07:00"
}
```

**Response**: Same as GET

#### 3. Reset Preferences to Defaults

```http
POST /v1/notifications/preferences/reset
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "cabinetId": "uuid"
}
```

**Default Values**:
- `language`: "ru"
- `telegramEnabled`: false (must be enabled manually)
- All events: true
- `quietHoursEnabled`: false

---

## Telegram Binding Flow

### Step-by-Step Process

```
┌──────────────┐
│  1. Frontend │  User clicks "Connect Telegram"
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│  2. Backend API │  POST /v1/telegram/binding/init
│  Returns:       │  { verificationToken: "ABC123" }
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│  3. User Opens   │  t.me/YourBot?start=ABC123
│     Telegram     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  4. Bot Receives │  /start ABC123 command
│     /start       │  Verifies token, creates binding
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  5. Frontend     │  Poll GET /v1/telegram/binding/status?cabinetId=...
│     Polls        │  Until isVerified: true
└──────────────────┘
```

### API Endpoints for Binding

#### 1. Initialize Binding

```http
POST /v1/telegram/binding/init
Authorization: Bearer {jwt}
Content-Type: application/json

{
  "cabinetId": "uuid"
}
```

**Response**:
```json
{
  "binding": {
    "id": "uuid",
    "verificationToken": "ABC123",
    "isVerified": false,
    "expiresAt": "2025-12-30T01:00:00Z"
  },
  "botUrl": "https://t.me/YourBot?start=ABC123"
}
```

#### 2. Check Binding Status

```http
GET /v1/telegram/binding/status?cabinetId={cabinetId}
Authorization: Bearer {jwt}
```

**Response (Not Verified)**:
```json
{
  "binding": {
    "id": "uuid",
    "isVerified": false,
    "expiresAt": "2025-12-30T01:00:00Z"
  }
}
```

**Response (Verified)**:
```json
{
  "binding": {
    "id": "uuid",
    "userId": "uuid",
    "cabinetId": "uuid",
    "chatId": "123456789",
    "username": "john_doe",
    "isVerified": true,
    "verifiedAt": "2025-12-30T00:30:00Z"
  }
}
```

#### 3. Unbind Telegram

```http
DELETE /v1/telegram/binding?cabinetId={cabinetId}
Authorization: Bearer {jwt}
```

**Response**: 204 No Content

---

## Real-time Status

### Notification Log

All notification attempts are logged in `notification_log` table:

```sql
SELECT
  event_type,
  task_type,
  status,
  error_message,
  sent_at
FROM notification_log
WHERE cabinet_id = 'uuid'
ORDER BY sent_at DESC
LIMIT 10;
```

**Status Values**:
- `sent` - Successfully sent to Telegram
- `failed` - Failed to send (Telegram API error)
- `skipped` - Skipped due to preferences
- `rate_limited` - Skipped due to rate limit
- `quiet_hours` - Skipped due to quiet hours

### API Endpoint for Recent Notifications

```http
GET /v1/notifications/history?cabinetId={cabinetId}&limit=10
Authorization: Bearer {jwt}
```

**Response**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "eventType": "task.completed",
      "taskType": "products_sync",
      "status": "sent",
      "messageText": "✅ Задача выполнена успешно...",
      "sentAt": "2025-12-30T03:00:00Z"
    },
    {
      "id": "uuid",
      "eventType": "task.failed",
      "taskType": "adv_sync",
      "status": "failed",
      "errorMessage": "Telegram API timeout",
      "sentAt": "2025-12-30T02:45:00Z"
    }
  ]
}
```

---

## Examples & Use Cases

### Use Case 1: Daily Sync Success

**Scenario**: User has enabled all notifications, products_sync completes at 06:05 MSK

**Backend Flow**:
1. BullMQ job completes with result: `{ products_fetched: 55, products_added: 2, products_removed: 0 }`
2. TaskEventListener catches `completed` event
3. NotificationService extracts context with task-specific fields
4. Checks preferences: ✅ telegramEnabled, ✅ taskCompleted, ✅ not in quiet hours
5. Rate limiter: ✅ under 60/hour limit
6. Template service renders message with all metrics
7. Telegram API sends message
8. Log success in `notification_log`

**User Receives**:
```
✅ Задача выполнена успешно

📋 Тип: 📦 Синхронизация товаров
⏱️ Время: 1 сек
📦 Загружено товаров: 55
➕ Добавлено новых: 2
➖ Удалено: 0
```

### Use Case 2: Task Failure During Quiet Hours

**Scenario**: adv_sync fails at 23:30 MSK, user has quiet hours 22:00-08:00

**Backend Flow**:
1. BullMQ job fails after 5 retries
2. TaskEventListener catches `failed` event
3. NotificationService checks preferences
4. Quiet hours check: ❌ Current time in quiet hours range
5. Notification skipped, logged as `quiet_hours`

**User Receives**: Nothing (skipped)

**Log Entry**:
```json
{
  "status": "quiet_hours",
  "eventType": "task.failed",
  "taskType": "adv_sync"
}
```

### Use Case 3: Rate Limit Exceeded

**Scenario**: Many tasks complete in short period, exceeding 60 messages/hour

**Backend Flow**:
1. First 60 messages sent successfully
2. 61st message: Rate limiter blocks
3. Notification skipped, logged as `rate_limited`

**User Receives**: First 60 messages only

**Note**: Rate limit resets after 1 hour window

---

## Troubleshooting

### Issue 1: User Not Receiving Notifications

**Diagnosis Checklist**:

1. **Check Telegram Binding**:
   ```http
   GET /v1/telegram/binding/status?cabinetId={id}
   ```
   - ✅ `isVerified: true`?
   - ✅ `chatId` present?

2. **Check Preferences**:
   ```http
   GET /v1/notifications/preferences?cabinetId={id}
   ```
   - ✅ `telegramEnabled: true`?
   - ✅ Specific event enabled (e.g., `taskCompleted: true`)?

3. **Check Quiet Hours**:
   - ✅ Current time NOT in quiet hours range?
   - Convert user's quiet hours from UTC to local time

4. **Check Recent Logs**:
   ```http
   GET /v1/notifications/history?cabinetId={id}
   ```
   - Look for `status: "skipped"` or `"rate_limited"`
   - Check `errorMessage` for failures

5. **Check Rate Limit**:
   - Has user received 60+ messages in last hour?

### Issue 2: Notification Contains No Metrics

**Possible Causes**:

1. **Worker Not Returning Metrics**: Check worker processor implementation
   - `products_sync` should return `products_fetched`, `products_added`, `products_removed`
   - Verify worker is using latest code (2025-12-30 update)

2. **ExtractContext Logic**: Check `notification.service.ts:extractContext()`
   - Verify switch-case includes the task type
   - Check result field mapping

**Frontend Action**: Report to backend team if metrics missing

### Issue 3: Wrong Language

**Diagnosis**:
1. Check user preferences: `GET /v1/notifications/preferences`
2. Verify `language` field is "ru" or "en"
3. Update if needed: `PATCH /v1/notifications/preferences`

**Backend Behavior**: Defaults to "ru" if not set

### Issue 4: Bot Not Responding to /start

**Possible Causes**:

1. **Token Expired**: Verification tokens expire after 15 minutes
   - Solution: Generate new token via `POST /v1/telegram/binding/init`

2. **Bot Offline**: Backend Telegram bot service down
   - Check backend logs: `pm2 logs wb-repricer | grep Telegram`
   - Should see: "Telegram bot connected"

3. **Wrong Bot**: User opened wrong bot link
   - Verify `botUrl` from init response matches actual bot

**Frontend Action**: Show error message, suggest retry with new token

---

## Frontend Integration Checklist

### Required UI Components

- [ ] **Telegram Binding Section**
  - [ ] "Connect Telegram" button
  - [ ] QR code for mobile users
  - [ ] Status indicator (verified/not verified)
  - [ ] "Disconnect" button

- [ ] **Preferences Section**
  - [ ] Master enable/disable toggle
  - [ ] Language selector (ru/en)
  - [ ] Event type checkboxes (taskCompleted, taskFailed, taskStalled)
  - [ ] Quiet hours toggle + time pickers

- [ ] **Notification History** (Optional)
  - [ ] List of recent notifications
  - [ ] Status indicators
  - [ ] Filter by status/event type

### Required API Calls

1. **On Page Load**:
   ```typescript
   // Check binding status
   const binding = await api.get('/v1/telegram/binding/status', {
     params: { cabinetId }
   });

   // Load preferences
   const prefs = await api.get('/v1/notifications/preferences', {
     params: { cabinetId }
   });
   ```

2. **Connect Telegram**:
   ```typescript
   const { binding, botUrl } = await api.post('/v1/telegram/binding/init', {
     cabinetId
   });

   // Show botUrl as QR code + link
   // Poll status every 2 seconds
   const interval = setInterval(async () => {
     const status = await api.get('/v1/telegram/binding/status', {
       params: { cabinetId }
     });
     if (status.binding.isVerified) {
       clearInterval(interval);
       // Update UI to "Connected"
     }
   }, 2000);
   ```

3. **Update Preferences**:
   ```typescript
   await api.patch('/v1/notifications/preferences', {
     cabinetId,
     telegramEnabled: true,
     language: 'en',
     taskCompleted: true,
     taskFailed: true,
     quietHoursEnabled: true,
     quietHoursStart: '23:00',
     quietHoursEnd: '07:00'
   });
   ```

### TypeScript Types

```typescript
// See full types in Request #89: frontend/docs/request-backend/89-telegram-notifications-integration.md

interface TelegramBinding {
  id: string;
  userId?: string;
  cabinetId?: string;
  chatId?: bigint;
  username?: string;
  firstName?: string;
  lastName?: string;
  verificationToken?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  expiresAt?: Date;
}

interface NotificationPreferences {
  id: string;
  userId: string;
  cabinetId: string;
  language: 'ru' | 'en';
  telegramEnabled: boolean;
  taskCompleted: boolean;
  taskFailed: boolean;
  taskStalled: boolean;
  dailyDigest: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}
```

---

## Related Documentation

- **Epic 34 Overview**: `docs/epics/epic-34-telegram-notifications.md`
- **Backend Improvements**: `docs/notifications/NOTIFICATION-IMPROVEMENTS-2025-12-30.md`
- **Frontend Integration Guide**: `frontend/docs/request-backend/89-telegram-notifications-integration.md`
- **Story 34.3 (Event Processor)**: `docs/stories/epic-34/story-34.3-notification-event-processor.md`
- **Story 34.4 (Templates)**: `docs/stories/epic-34/story-34.4-notification-templates.md`

---

## Changelog

### 2025-12-30 - Task-Specific Metrics Enhancement

**Added**:
- Detailed metrics for `products_sync` (fetched/added/removed)
- Detailed metrics for `adv_sync` (campaigns/stats/costs)
- Detailed metrics for `paid_storage_import` (records imported)
- Detailed metrics for `product_imt_sync` (products/groups)
- Emoji icons for all task types
- Number formatting with thousands separators

**Changed**:
- Template structure to include conditional metric blocks
- `extractContext()` to use switch-case logic for task-specific fields
- All task type labels to include emojis

**Impact on Frontend**:
- ✅ No changes required (backend-only enhancement)
- ✅ Notifications automatically show richer data
- ℹ️ Users will see more detailed notifications starting 2025-12-30

---

**Document Version**: 2.0.0
**Last Updated**: 2025-12-30 03:45 MSK
**Author**: Backend Team (SuperClaude)
