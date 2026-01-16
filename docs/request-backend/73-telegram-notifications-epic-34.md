# Request #73: Telegram Notifications API (Epic 34)

**Date**: 2025-12-24
**Status**: ✅ COMPLETE
**Epic**: Epic 34 - Telegram Notifications
**Backend PR**: All stories merged
**Component**: Notifications Module + Telegram Bot Integration

---

## Обзор

Система Telegram push-уведомлений о выполнении фоновых задач с поддержкой:
- Привязка Telegram-аккаунта через 6-значный код верификации
- Настройка предпочтений уведомлений (типы событий, язык, тихие часы)
- Telegram bot с интерактивными командами (/start, /status, /settings, /help)
- Rate limiting (30 msg/s global, 1 msg/s per chat)
- Multi-language support (ru/en)

---

## API Endpoints

### 1. Telegram Account Binding

#### Start Binding Flow

```http
POST /v1/notifications/telegram/bind
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response (200)**:

```typescript
interface BindingCodeResponseDto {
  binding_code: string;        // 6-значный код (напр. "A1B2C3D4")
  expires_at: string;          // ISO datetime (10 минут TTL)
  instructions: string;        // Инструкция для пользователя
  deep_link: string;          // t.me ссылка для быстрого открытия бота
}
```

**Example Response**:
```json
{
  "binding_code": "A1B2C3D4",
  "expires_at": "2025-12-24T11:10:00.000Z",
  "instructions": "Отправьте команду /start A1B2C3D4 боту @WBRepricerBot",
  "deep_link": "https://t.me/WBRepricerBot?start=A1B2C3D4"
}
```

**User Flow**:
1. Frontend: Call `POST /v1/notifications/telegram/bind`
2. Frontend: Show binding code + instructions OR redirect to `deep_link`
3. User: Open Telegram, send `/start A1B2C3D4` to bot
4. Backend: Verify code, create binding
5. Bot: Confirm binding to user
6. Frontend: Poll `/v1/notifications/telegram/status` until `bound: true`

---

#### Check Binding Status

```http
GET /v1/notifications/telegram/status
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response (200)**:

```typescript
interface BindingStatusResponseDto {
  bound: boolean;
  telegram_username: string | null;
  bound_at: string | null;     // ISO datetime
  notifications_enabled: boolean;
}
```

**Example (bound)**:
```json
{
  "bound": true,
  "telegram_username": "username",
  "bound_at": "2025-12-24T10:00:00.000Z",
  "notifications_enabled": true
}
```

**Example (not bound)**:
```json
{
  "bound": false,
  "telegram_username": null,
  "bound_at": null,
  "notifications_enabled": false
}
```

---

#### Unbind Telegram

```http
DELETE /v1/notifications/telegram/unbind
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response (200)**:

```typescript
interface UnbindResponseDto {
  unbound: boolean;
  message: string;
}
```

**Example (success)**:
```json
{
  "unbound": true,
  "message": "Telegram account unlinked successfully"
}
```

**Example (no binding)**:
```json
{
  "unbound": false,
  "message": "No binding found"
}
```

---

### 2. Notification Preferences

#### Get Preferences

```http
GET /v1/notifications/preferences
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response (200)**:

```typescript
interface NotificationPreferencesResponseDto {
  cabinet_id: string;
  telegram_enabled: boolean;
  telegram_bound: boolean;
  telegram_username: string | null;
  preferences: {
    task_completed: boolean;
    task_failed: boolean;
    task_stalled: boolean;
    daily_digest: boolean;
    digest_time: string;       // HH:MM format (e.g., "09:00")
  };
  language: 'ru' | 'en';
  quiet_hours: {
    enabled: boolean;
    from: string;              // HH:MM format (e.g., "23:00")
    to: string;                // HH:MM format (e.g., "07:00")
    timezone: string;          // IANA timezone (e.g., "Europe/Moscow")
  };
}
```

**Example Response**:
```json
{
  "cabinet_id": "uuid-string",
  "telegram_enabled": true,
  "telegram_bound": true,
  "telegram_username": "username",
  "preferences": {
    "task_completed": true,
    "task_failed": true,
    "task_stalled": false,
    "daily_digest": true,
    "digest_time": "09:00"
  },
  "language": "ru",
  "quiet_hours": {
    "enabled": true,
    "from": "23:00",
    "to": "07:00",
    "timezone": "Europe/Moscow"
  }
}
```

---

#### Update Preferences

```http
PUT /v1/notifications/preferences
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json
```

**Request Body** (all fields optional):

```typescript
interface UpdateNotificationPreferencesDto {
  telegram_enabled?: boolean;
  preferences?: {
    task_completed?: boolean;
    task_failed?: boolean;
    task_stalled?: boolean;
    daily_digest?: boolean;
    digest_time?: string;      // HH:MM format
  };
  language?: 'ru' | 'en';
  quiet_hours?: {
    enabled?: boolean;
    from?: string;             // HH:MM format
    to?: string;               // HH:MM format
  };
  timezone?: string;           // IANA timezone
}
```

**Example (enable quiet hours)**:
```json
{
  "quiet_hours": {
    "enabled": true,
    "from": "23:00",
    "to": "07:00"
  },
  "timezone": "Europe/Moscow"
}
```

**Example (disable all notifications)**:
```json
{
  "telegram_enabled": false
}
```

**Example (change language)**:
```json
{
  "language": "en"
}
```

**Response (200)**: Same as `GET /v1/notifications/preferences` (updated preferences).

---

### 3. Test Notifications

```http
POST /v1/notifications/test
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response (200)**:

```typescript
interface TestNotificationResponseDto {
  sent: boolean;
  message: string;
  telegram_message_id?: number;
}
```

**Example (success)**:
```json
{
  "sent": true,
  "message": "Test notification sent successfully",
  "telegram_message_id": 12345
}
```

**Example (failed)**:
```json
{
  "sent": false,
  "message": "Failed to send: Connection timeout"
}
```

**Example (not linked - 400 error)**:
```json
{
  "message": "Telegram not linked",
  "details": "Please link your Telegram account first using POST /v1/notifications/telegram/bind"
}
```

---

## Event Types Reference

| Event Type | Описание | Default | Когда отправляется |
|------------|----------|---------|-------------------|
| `task_completed` | Задача успешно выполнена | ✅ true | При завершении любой фоновой задачи без ошибок |
| `task_failed` | Задача завершилась с ошибкой | ✅ true | При ошибке выполнения задачи (после всех retry попыток) |
| `task_stalled` | Задача зависла (>30 min) | ❌ false | Когда задача выполняется дольше 30 минут |
| `daily_digest` | Ежедневный дайджест | ✅ true | Ежедневно в `digest_time` (по умолчанию 08:00) |

---

## Message Templates (Examples)

### task.completed (RU)

```
✅ *Задача выполнена успешно*

📋 Тип: Импорт финансового отчёта
📅 Неделя: 2025-W51
⏱ Время: 2 мин 34 сек

📊 Обработано: 1,245 строк

💰 Итого к перечислению: 125,430.50 ₽
```

### task.failed (RU)

```
❌ *Ошибка выполнения задачи*

📋 Тип: Синхронизация товаров
📅 Неделя: 2025-W51
🔄 Попыток: 3/5

⚠️ *Ошибка:* WB API returned 429: Rate limit exceeded

💡 _Следующая попытка: через 5 минут_
```

### task.stalled (RU)

```
⚠️ *Задача зависла*

📋 Тип: Расчёт маржи
⏱ Время выполнения: 45 мин 12 сек

🔧 _Требуется проверка. Задача может быть автоматически перезапущена._
```

### daily_digest (RU)

```
📊 *Дневной отчёт за 2025-12-24*

✅ Успешно: 12
❌ Ошибок: 2
⏳ В очереди: 3

*Ошибки:*
• Синхронизация рекламы: Connection timeout
• Импорт платного хранения: WB API unavailable
```

---

## Telegram Bot Commands

**Bot Username**: @WBRepricerBot (example)

| Команда | Описание | Пример |
|---------|----------|--------|
| `/start <code>` | Привязать аккаунт с кодом верификации | `/start A1B2C3D4` |
| `/status` | Показать статус подключения и последние уведомления | `/status` |
| `/settings` | Интерактивные настройки с inline-кнопками | `/settings` |
| `/help` | Показать список доступных команд | `/help` |

**Settings Interactive Menu** (inline keyboard):

```
[Русский 🇷🇺] [English 🇬🇧]

Уведомления:
[✅ Успешно]  [✅ Ошибки]  [❌ Зависшие]  [✅ Дайджест]

Тихие часы:
[🔕 Включить] с 23:00 до 07:00

[💾 Сохранить]
```

---

## Rate Limiting

| Тип лимита | Значение | Описание |
|------------|----------|----------|
| **Global Rate** | 30 msg/sec | Telegram API limit (глобальный) |
| **Per-Chat Rate** | 1 msg/sec | Лимит на чат (предотвращение спама) |

**Behavior при превышении**:
- Уведомление откладывается в очередь
- Статус в `notification_log`: `rate_limited`
- Повторная попытка через интервал (exponential backoff)

---

## Error Responses

### 400 Bad Request

**Missing required fields**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid timezone",
    "details": [
      { "field": "timezone", "issue": "Must be valid IANA timezone (e.g., Europe/Moscow)" }
    ]
  }
}
```

**Invalid quiet hours format**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid quiet hours format",
    "details": [
      { "field": "quiet_hours_from", "issue": "Must be in HH:MM format (e.g., 23:00)" }
    ]
  }
}
```

---

### 404 Not Found

**Telegram not connected**:
```json
{
  "error": {
    "code": "TELEGRAM_NOT_CONNECTED",
    "message": "Telegram account is not connected"
  }
}
```

**Invalid binding code**:
```json
{
  "error": {
    "code": "INVALID_BINDING_CODE",
    "message": "Binding code is invalid or expired"
  }
}
```

---

### 409 Conflict

**Binding already exists**:
```json
{
  "error": {
    "code": "BINDING_ALREADY_EXISTS",
    "message": "Telegram account is already bound to another user"
  }
}
```

---

## Frontend Integration Examples

### React Hook - Binding Flow

```typescript
import { useMutation, useQuery } from '@tanstack/react-query';

// Start binding
const bindMutation = useMutation({
  mutationFn: () => api.post('/v1/notifications/telegram/bind'),
  onSuccess: (data) => {
    // Show binding code or redirect to deep_link
    window.open(data.deep_link, '_blank');

    // Start polling for binding status
    startPolling();
  }
});

// Poll binding status
const { data: status, refetch } = useQuery({
  queryKey: ['telegram-status'],
  queryFn: () => api.get('/v1/notifications/telegram/status'),
  refetchInterval: (data) => data?.bound ? false : 3000, // Poll every 3s until bound
});

// Handle binding
const handleBind = () => {
  bindMutation.mutate();
};
```

---

### React Component - Settings Panel

```typescript
import { useState } from 'react';

function TelegramSettingsPanel() {
  const [preferences, setPreferences] = useState({
    telegram_enabled: true,
    preferences: {
      task_completed: true,
      task_failed: true,
      task_stalled: false,
      daily_digest: true,
      digest_time: '09:00'
    },
    language: 'ru' as 'ru' | 'en',
    quiet_hours: {
      enabled: true,
      from: '23:00',
      to: '07:00'
    },
    timezone: 'Europe/Moscow'
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateNotificationPreferencesDto) =>
      api.put('/v1/notifications/preferences', data),
    onSuccess: () => {
      toast.success('Настройки сохранены');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  return (
    <div>
      <Switch
        checked={preferences.telegram_enabled}
        onChange={(enabled) => setPreferences({ ...preferences, telegram_enabled: enabled })}
        label="Включить Telegram уведомления"
      />

      <Switch
        checked={preferences.preferences.task_completed}
        label="Задача выполнена"
      />

      {/* ... other settings */}

      <Button onClick={handleSave}>Сохранить</Button>
    </div>
  );
}
```

---

### Test Notification Button

```typescript
function TestNotificationButton() {
  const testMutation = useMutation({
    mutationFn: () => api.post('/v1/notifications/test'),
    onSuccess: (data) => {
      if (data.sent) {
        toast.success('Тестовое уведомление отправлено в Telegram');
      } else {
        toast.error(`Ошибка: ${data.message}`);
      }
    }
  });

  return (
    <Button onClick={() => testMutation.mutate()}>
      Отправить тестовое уведомление
    </Button>
  );
}
```

---

## Database Schema Reference

### telegram_user_bindings

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `cabinet_id` | UUID | FK → cabinets (cascade delete) |
| `telegram_id` | BIGINT | Telegram user ID (unique) |
| `chat_id` | BIGINT | Telegram chat ID |
| `binding_code` | VARCHAR | 6-digit verification code |
| `binding_expires_at` | TIMESTAMP | Code expiration (10 min TTL) |
| `is_verified` | BOOLEAN | Account verified |
| `created_at` | TIMESTAMP | Record creation time |

### notification_preferences

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users |
| `cabinet_id` | UUID | FK → cabinets (cascade delete) |
| `telegram_enabled` | BOOLEAN | Master toggle |
| `event_preferences` | JSONB | Per-event toggles |
| `language` | VARCHAR | 'ru' \| 'en' |
| `quiet_hours_*` | VARCHAR | Quiet hours settings |
| `timezone` | VARCHAR | IANA timezone |

### notification_log

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Primary key |
| `cabinet_id` | UUID | FK → cabinets |
| `user_id` | UUID | FK → users |
| `channel` | VARCHAR | 'telegram' |
| `event_type` | VARCHAR | task.completed, task.failed, etc. |
| `task_id` | UUID | Related task (optional) |
| `status` | VARCHAR | sent/failed/skipped/rate_limited |
| `telegram_message_id` | BIGINT | Telegram message ID |
| `created_at` | TIMESTAMP | Record creation time |

---

## Documentation

### Backend

- **[TELEGRAM-NOTIFICATIONS-GUIDE.md](../../../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md)** - Complete guide
- **[API Reference](../../../docs/API-PATHS-REFERENCE.md#telegram-notifications-epic-34)** - API documentation
- **[test-api/13-notifications.http](../../../test-api/13-notifications.http)** - API testing examples

### Architecture

- **Epic 34**: [docs/epics/epic-34-telegram-notifications.md](../../../docs/epics/epic-34-telegram-notifications.md)
- **Stories**: [docs/stories/epic-34/](../../../docs/stories/epic-34/)

---

## TODO для Frontend

- [ ] Создать страницу `/settings/notifications`
- [ ] Добавить компонент привязки Telegram (с polling)
- [ ] Реализовать панель настроек уведомлений
- [ ] Добавить кнопку тестового уведомления
- [ ] Показывать статус привязки в header/sidebar
- [ ] Добавить настройки тихих часов с timezone selector
- [ ] Реализовать language switcher (ru/en)

---

## Related Requests

- **Request #71**: Advertising Analytics - Используется для уведомлений о синхронизации рекламы
- **Epic 20**: Automatic Margin Recalculation - Уведомления о завершении расчёта маржи
- **Epic 24**: Paid Storage Import - Уведомления о синхронизации данных хранения

---

*Дата создания: 2025-12-24*
*Последнее обновление: 2025-12-24*
*Epic Status: ✅ COMPLETE (Backend + Bot Integration)*
