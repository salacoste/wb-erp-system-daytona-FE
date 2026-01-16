# Epic 34-FE: API Integration Guide for Backend Team

**Created**: 2025-12-29
**Updated**: 2025-12-30 (Bot config + Monitoring added)
**Frontend Status**: ✅ COMPLETE - Production Ready
**Backend Epic**: Epic 34, Request #73 (✅ COMPLETE)

**📄 Related Documentation**:
- [Epic 34-FE Specification](epics/epic-34-fe-telegram-notifications-ui.md)
- **[Developer Handoff](DEV-HANDOFF-EPIC-34-FE.md)** - Complete integration guide
- [CHANGELOG](CHANGELOG-EPIC-34-FE.md) - Implementation history

---

## 📋 Quick Start

This guide helps the backend team integrate the Telegram Notifications frontend (Epic 34-FE) with the backend API.

**Frontend Components**: 8 components + 1 page
**API Endpoints Required**: 6 endpoints
**Authentication**: JWT + X-Cabinet-Id header
**Base URL**: Configure via environment variable

---

## 🔧 Required API Endpoints

### 1. Generate Binding Code

**Endpoint**: `POST /v1/notifications/telegram/bind`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Request Body**: None

**Response** (200 OK):
```typescript
{
  binding_code: string;        // 8-character code (e.g., "A1B2C3D4")
  expires_at: string;          // ISO 8601 timestamp
  instructions: string;        // User instructions (ru/en)
  deep_link: string;           // https://t.me/WBRepricerBot?start={code}
}
```

**Frontend Usage**:
- Called when user clicks "Подключить Telegram" button
- Frontend displays `binding_code` in modal
- `deep_link` opens Telegram app
- `expires_at` drives countdown timer (10 minutes)

**Error Handling**:
```typescript
// 400 Bad Request - Already bound
{
  error: {
    code: "ALREADY_BOUND",
    message: "Telegram already connected"
  }
}
```

---

### 2. Check Binding Status (Polling)

**Endpoint**: `GET /v1/notifications/telegram/status`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Response** (200 OK):
```typescript
{
  bound: boolean;              // True if Telegram connected
  telegram_username?: string;  // Username (if bound)
  bound_at?: string;           // ISO 8601 timestamp (if bound)
}
```

**Frontend Usage**:
- **Polling**: Called every **3 seconds** while modal is open
- Auto-stops when `bound: true`
- Used to detect when user completes /start command in Telegram

**Performance Note**:
- Frontend uses React Query with smart polling
- Stops immediately on success to reduce backend load
- Only active while modal is open (user-initiated)

---

### 3. Unbind Telegram

**Endpoint**: `DELETE /v1/notifications/telegram/unbind`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Request Body**: None

**Response** (204 No Content): Empty

**Frontend Usage**:
- Called after user confirms unbind in dialog
- Shows confirmation with consequences
- Updates UI immediately after success

---

### 4. Get Notification Preferences

**Endpoint**: `GET /v1/notifications/preferences`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Response** (200 OK):
```typescript
{
  event_types: {
    task_completed: boolean;
    task_failed: boolean;
    task_stalled: boolean;
    daily_digest: boolean;
  };
  language: 'ru' | 'en';
  daily_digest_time?: string;  // HH:MM format (e.g., "09:00")
  quiet_hours: {
    enabled: boolean;
    from: string;               // HH:MM format (e.g., "22:00")
    to: string;                 // HH:MM format (e.g., "08:00")
    timezone: string;           // IANA timezone (e.g., "Europe/Moscow")
  };
}
```

**Frontend Usage**:
- Loaded on page mount (if Telegram bound)
- Populates all form fields
- Used for dirty state detection

**Default Values** (if no preferences saved):
```typescript
{
  event_types: {
    task_completed: true,
    task_failed: true,
    task_stalled: true,
    daily_digest: false
  },
  language: 'ru',
  daily_digest_time: '09:00',
  quiet_hours: {
    enabled: false,
    from: '22:00',
    to: '08:00',
    timezone: 'Europe/Moscow'
  }
}
```

---

### 5. Update Notification Preferences

**Endpoint**: `PUT /v1/notifications/preferences`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json
```

**Request Body** (partial updates supported):
```typescript
{
  event_types?: {
    task_completed?: boolean;
    task_failed?: boolean;
    task_stalled?: boolean;
    daily_digest?: boolean;
  };
  language?: 'ru' | 'en';
  daily_digest_time?: string;
  quiet_hours?: {
    enabled?: boolean;
    from?: string;
    to?: string;
    timezone?: string;
  };
}
```

**Response** (200 OK): Same as GET response

**Frontend Usage**:
- Called when user clicks "Сохранить" button
- Uses optimistic updates (updates UI before API call)
- Rolls back on error

**Validation Rules**:
- `daily_digest_time` required if `daily_digest: true`
- `quiet_hours.from` and `quiet_hours.to` required if `quiet_hours.enabled: true`
- Overnight periods allowed (e.g., from: "22:00", to: "08:00")

---

### 6. Send Test Notification

**Endpoint**: `POST /v1/notifications/test`

**Headers**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json
```

**Request Body**:
```typescript
{
  type: 'task_completed' | 'task_failed' | 'task_stalled' | 'daily_digest';
}
```

**Response** (204 No Content): Empty

**Frontend Usage**:
- Called when user clicks "Отправить тестовое уведомление" button
- Shows toast on success/error
- Used to verify Telegram integration

**Test Message Example** (backend should send via Telegram):
```
🎉 Тестовое уведомление

Это тестовое уведомление типа "task_completed".
Если вы видите это сообщение, Telegram настроен правильно!
```

---

## 🔐 Authentication & Security

### Required Headers

**All endpoints require**:
```
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Frontend Implementation**:
```typescript
// src/lib/api/notifications.ts
function getAuthHeaders(): HeadersInit {
  const { token, cabinetId } = useAuthStore.getState();

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
    'X-Cabinet-Id': cabinetId || '',
  };
}
```

### Error Responses

**Standard Error Format**:
```typescript
{
  error: {
    code: string;              // Machine-readable code
    message: string;           // Human-readable message (ru/en)
    details?: Array<{          // Optional validation errors
      field: string;
      issue: string;
    }>;
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED` (401): Invalid JWT or missing token
- `FORBIDDEN` (403): Wrong cabinet_id or insufficient permissions
- `VALIDATION_ERROR` (400): Invalid request body
- `NOT_BOUND` (400): Telegram not connected (for preferences/test endpoints)
- `ALREADY_BOUND` (400): Telegram already connected (for bind endpoint)
- `RATE_LIMITED` (429): Too many requests

---

## 📱 Frontend API Client

### File Location
```
src/lib/api/notifications.ts
```

### Implementation Example
```typescript
import { useAuthStore } from '@/lib/stores/auth';

// SSR-safe auth headers
function getAuthHeaders(): HeadersInit {
  const { token, cabinetId } = useAuthStore.getState();

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || ''}`,
    'X-Cabinet-Id': cabinetId || '',
  };
}

// API client with error handling
export async function startBinding(): Promise<BindingCodeResponseDto> {
  const response = await fetch('/api/v1/notifications/telegram/bind', {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    await handleApiError(response);
  }

  return response.json();
}
```

### Error Handling
```typescript
async function handleApiError(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let errorMessage = `API Error: ${response.statusText}`;

  if (isJson) {
    try {
      const errorData: ApiErrorResponse = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch {
      // JSON parsing failed, use default message
    }
  }

  throw new Error(errorMessage);
}
```

---

## 🔄 React Query Hooks

### 1. useTelegramBinding (Polling Hook)

**File**: `src/hooks/useTelegramBinding.ts`

**Features**:
- 3-second polling for binding status
- Auto-stops on success (`bound: true`)
- Mutations for bind/unbind

**Usage**:
```typescript
const {
  isBound,               // boolean
  username,              // string | undefined
  startBinding,          // mutation
  unbind,                // mutation
  isStartingBinding,     // boolean
  isUnbinding            // boolean
} = useTelegramBinding();
```

**Polling Behavior**:
- Polls every 3 seconds while modal open
- Stops immediately when `bound: true`
- Only active if binding code generated
- Runs in background (continues if tab loses focus)

---

### 2. useNotificationPreferences (Manual Save Hook)

**File**: `src/hooks/useNotificationPreferences.ts`

**Features**:
- GET preferences on mount
- PUT on manual save button click
- Dirty state detection (JSON comparison)
- Optimistic updates

**Usage**:
```typescript
const {
  preferences,           // NotificationPreferencesResponseDto | undefined
  updatePreferences,     // mutation
  isDirty,               // boolean (has unsaved changes)
  isLoading,
  isUpdating
} = useNotificationPreferences();
```

**Dirty Detection**:
```typescript
// Compares current form state with server data
const isDirty = JSON.stringify(formData) !== JSON.stringify(preferences);
```

---

### 3. useQuietHours (Timezone Hook)

**File**: `src/hooks/useQuietHours.ts`

**Features**:
- Timezone calculations
- Overnight period detection
- Active quiet hours check

**Usage**:
```typescript
const {
  isOvernightPeriod,     // boolean (from > to)
  isInQuietHours,        // boolean (current time in period)
  currentTime            // Date object in selected timezone
} = useQuietHours(preferences);
```

---

## 🧪 Testing Checklist

### Backend Integration Tests

**1. Binding Flow**:
- [ ] POST /bind generates unique 8-character code
- [ ] Code expires after 10 minutes
- [ ] GET /status returns `bound: false` initially
- [ ] GET /status returns `bound: true` after Telegram /start
- [ ] POST /bind returns 400 if already bound

**2. Preferences**:
- [ ] GET /preferences returns defaults for new user
- [ ] PUT /preferences accepts partial updates
- [ ] PUT /preferences validates `daily_digest_time` if `daily_digest: true`
- [ ] PUT /preferences validates quiet hours if enabled
- [ ] PUT /preferences returns 400 if Telegram not bound

**3. Test Notifications**:
- [ ] POST /test sends Telegram message immediately
- [ ] POST /test returns 400 if Telegram not bound
- [ ] Message matches `language` preference (ru/en)

**4. Security**:
- [ ] All endpoints require valid JWT
- [ ] All endpoints require X-Cabinet-Id header
- [ ] Endpoints return 401 if token invalid
- [ ] Endpoints return 403 if cabinet_id mismatch

---

## 🌐 CORS & Environment

### Environment Variables

**Frontend .env.local**:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**API Base URL Usage**:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

fetch(`${API_BASE_URL}/v1/notifications/telegram/bind`, {
  method: 'POST',
  headers: getAuthHeaders(),
});
```

### CORS Configuration (Backend)

**Required Headers**:
```
Access-Control-Allow-Origin: http://localhost:3100
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Cabinet-Id
Access-Control-Allow-Credentials: true
```

---

## 📊 Performance Expectations

### Response Time Targets

| Endpoint | Target | Notes |
|----------|--------|-------|
| POST /bind | <500ms | Generates code + stores in DB |
| GET /status | <100ms | Simple DB lookup (polled every 3s) |
| DELETE /unbind | <300ms | Update DB + invalidate Telegram |
| GET /preferences | <200ms | DB query |
| PUT /preferences | <300ms | DB update |
| POST /test | <1s | Send Telegram API request |

### Rate Limiting

**Polling Endpoint** (GET /status):
- Frontend polls every 3 seconds (only while modal open)
- Average: ~20 requests per minute during binding
- Recommend rate limit: **60 requests/minute per cabinet**

**Other Endpoints**:
- User-initiated (button clicks)
- Average: <5 requests per minute
- Recommend rate limit: **30 requests/minute per cabinet**

---

## 🐛 Common Issues & Solutions

### Issue 1: Polling Never Stops

**Symptom**: Frontend keeps polling even after binding success

**Backend Check**:
- Ensure GET /status returns `bound: true` immediately after Telegram /start
- Verify DB update is committed before responding

**Frontend Fix** (already implemented):
```typescript
// React Query auto-stops polling when bound: true
refetchInterval: (query) => {
  return query.state.data?.bound ? false : 3000;
}
```

---

### Issue 2: CORS Errors in Browser

**Symptom**: Browser console shows CORS policy errors

**Backend Fix**:
```typescript
// Allow frontend origin
Access-Control-Allow-Origin: http://localhost:3100

// Allow credentials (for JWT cookies)
Access-Control-Allow-Credentials: true
```

---

### Issue 3: JWT Token Refresh

**Symptom**: API calls fail after token expiration

**Frontend Handling** (already implemented):
- Zustand auth store manages token refresh
- API client uses latest token from store
- Redirects to login if refresh fails

**Backend Requirement**:
- Return 401 if token expired
- Frontend will handle re-authentication

---

## 📞 Contact & Support

**Frontend Team**: [Your Name]
**Epic Document**: [epic-34-fe-telegram-notifications-ui.md](epics/epic-34-fe-telegram-notifications-ui.md)
**Backend Epic**: Epic 34, Request #73
**Backend Doc**: `../docs/TELEGRAM-NOTIFICATIONS-GUIDE.md`

**For Questions**:
- API contract issues: Check Request #73
- Frontend integration: This document
- Telegram Bot: See backend docs

---

**Last Updated**: 2025-12-29
**Frontend Status**: ✅ PRODUCTION READY
**Backend Status**: Pending integration
