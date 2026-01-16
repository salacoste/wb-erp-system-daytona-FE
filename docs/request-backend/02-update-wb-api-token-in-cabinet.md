# 02. Обновление WB API токена в кабинете

**📝 Важно:** См. [CHANGELOG: WB Token Key Name Fix](./CHANGELOG-wb-token-key-name.md) для информации об имени ключа токена (`wb_api_token`).

## 📋 Обзор

Пользователь может обновить (rotate) WB API токен для существующего кабинета через эндпоинт `PUT /v1/cabinets/:id/keys/:keyName`. Это полезно, когда:
- Токен истек или стал недействительным
- Нужно обновить токен по соображениям безопасности
- Токен был скомпрометирован

**⚠️ ВАЖНО:** При обновлении существующего токена автоматические процессы (исторический импорт, синхронизация продуктов) **НЕ запускаются**. Они запускаются только при создании нового ключа.

---

## 🔌 Backend Endpoint

### `PUT /v1/cabinets/:id/keys/:keyName`

**URL Parameters:**
- `id` (string, UUID) - ID кабинета
- `keyName` (string) - Идентификатор ключа (например, `wb_api_token`)

**Headers:**
- `Authorization: Bearer {jwt_token}` - JWT токен пользователя
- `X-Cabinet-Id: {cabinetId}` - **ОБЯЗАТЕЛЬНО** - ID кабинета (должен совпадать с `:id` в URL)

**Request Body:**
```typescript
{
  "token": "новый_wb_api_токен" // Новый WB API токен (будет зашифрован)
}
```

**Response (200 OK):**
```typescript
interface UpdateTokenResponse {
  id: string;              // UUID ключа
  keyName: string;         // Имя ключа (например, "wb_api_token")
  updatedAt: string;     // ISO 8601 timestamp обновления
  // ⚠️ НЕ возвращает historicalImport и productsSync (только для новых ключей)
}
```

**Error Responses:**
- `400 Bad Request` - Невалидный токен, отсутствует заголовок `X-Cabinet-Id`
- `401 Unauthorized` - Невалидный JWT токен
- `403 Forbidden` - Пользователь не имеет доступа к кабинету или недостаточно прав (требуется Owner или Manager)
- `404 Not Found` - Кабинет или ключ не найден

**Backend Reference:**
- Controller: `src/cabinets/cabinets.controller.ts:150-176`
- Service: `src/cabinets/cabinet-keys.service.ts:603-608` → `storeKey()` (строки 59-276)
- Validation: `src/cabinets/cabinet-keys.service.ts:291-339` (Story 13.1)

---

## 💻 Frontend Implementation

### Шаг 1: API функция для обновления токена

```typescript
// src/lib/api.ts или src/services/cabinets.service.ts

interface UpdateWbTokenRequest {
  token: string; // Новый WB API токен
}

interface UpdateWbTokenResponse {
  id: string;
  keyName: string;
  updatedAt: string;
}

/**
 * Обновляет WB API токен для кабинета
 * 
 * @param cabinetId - UUID кабинета
 * @param keyName - Имя ключа (например, "wb_api_token")
 * @param newToken - Новый WB API токен
 * @param jwtToken - JWT токен пользователя
 * @returns Обновленная информация о ключе
 * @throws Error если обновление не удалось
 */
export async function updateWbToken(
  cabinetId: string,
  keyName: string,
  newToken: string,
  jwtToken: string,
): Promise<UpdateWbTokenResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/cabinets/${cabinetId}/keys/${keyName}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Cabinet-Id': cabinetId, // ⚠️ ОБЯЗАТЕЛЬНО!
      },
      body: JSON.stringify({ token: newToken }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to update WB token',
    }));

    // Обработка специфичных ошибок
    if (response.status === 400) {
      // Невалидный токен или отсутствует X-Cabinet-Id
      throw new Error(
        error.message || 'Invalid token or missing X-Cabinet-Id header',
      );
    } else if (response.status === 403) {
      // Недостаточно прав
      throw new Error(
        error.message || 'Insufficient permissions to update token',
      );
    } else if (response.status === 404) {
      // Кабинет или ключ не найден
      throw new Error(error.message || 'Cabinet or key not found');
    }

    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Шаг 2: Компонент формы обновления токена

```typescript
// src/components/UpdateWbTokenForm.tsx

import { useState } from 'react';
import { updateWbToken } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useParams } from 'next/navigation'; // или useParams для React Router

interface UpdateWbTokenFormProps {
  keyName?: string; // По умолчанию "wb_api_token"
  onSuccess?: () => void; // Callback после успешного обновления
  onError?: (error: Error) => void; // Callback при ошибке
}

export function UpdateWbTokenForm({
  keyName = 'wb_api_token',
  onSuccess,
  onError,
}: UpdateWbTokenFormProps) {
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { token } = useAuthStore();
  const params = useParams();
  const cabinetId = params?.cabinetId as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    if (!cabinetId) {
      setError('Cabinet ID is required');
      setLoading(false);
      return;
    }

    if (!token) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const response = await updateWbToken(cabinetId, keyName, newToken, token);

      // Успешное обновление
      setSuccess(true);
      setNewToken(''); // Очищаем поле ввода
      
      // Показываем уведомление
      toast.success('WB API token updated successfully!');

      // Вызываем callback если предоставлен
      if (onSuccess) {
        onSuccess();
      }

      // Опционально: Обновляем список ключей или другую информацию
      // await refetchCabinetKeys();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update token';
      setError(errorMessage);
      
      // Показываем ошибку
      toast.error(errorMessage);

      // Вызываем callback ошибки если предоставлен
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="update-token-form">
      <div className="form-group">
        <label htmlFor="newToken">
          New WB API Token
          <span className="required">*</span>
        </label>
        <input
          id="newToken"
          type="password" // Скрываем токен при вводе
          value={newToken}
          onChange={(e) => setNewToken(e.target.value)}
          placeholder="Enter new WB API token"
          required
          disabled={loading}
          className={error ? 'error' : ''}
        />
        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Token updated successfully at {new Date().toLocaleString()}
          </div>
        )}
        <small className="help-text">
          Get your token from{' '}
          <a
            href="https://seller.wildberries.ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wildberries Seller Portal
          </a>
        </small>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          disabled={loading || !newToken.trim()}
          className="btn btn-primary"
        >
          {loading ? 'Updating...' : 'Update Token'}
        </button>
        <button
          type="button"
          onClick={() => {
            setNewToken('');
            setError(null);
            setSuccess(false);
          }}
          disabled={loading}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
```

### Шаг 3: Обработка специфичных ошибок валидации

Backend валидирует токен через WB API перед сохранением (Story 13.1). Ошибки валидации возвращаются с кодом `400` и структурированным форматом:

```typescript
// src/lib/api.ts - Расширенная обработка ошибок

interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    issue: string;
    value?: string;
    recommendation?: string;
  }>;
}

export async function updateWbToken(
  cabinetId: string,
  keyName: string,
  newToken: string,
  jwtToken: string,
): Promise<UpdateWbTokenResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/cabinets/${cabinetId}/keys/${keyName}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Cabinet-Id': cabinetId,
      },
      body: JSON.stringify({ token: newToken }),
    },
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      code: 'UNKNOWN_ERROR',
      message: 'Failed to update WB token',
    }));

    // Обработка специфичных кодов ошибок
    switch (error.code) {
      case 'INVALID_TOKEN':
        throw new Error(
          error.details?.[0]?.recommendation ||
            'WB API token is invalid or expired. Please check your token or get a new one from https://seller.wildberries.ru/',
        );
      case 'RATE_LIMITED':
        throw new Error(
          'WB API rate limit exceeded. Please wait a few minutes and try again.',
        );
      case 'NETWORK_ERROR':
        throw new Error(
          'Unable to connect to WB API. Please check your internet connection and try again later.',
        );
      case 'TOKEN_VALIDATION_FAILED':
        throw new Error(
          error.details?.[0]?.recommendation ||
            'Token validation failed. Please verify your token is correct.',
        );
      case 'FORBIDDEN':
        throw new Error(
          'You do not have permission to update tokens for this cabinet. Owner or Manager role required.',
        );
      case 'NOT_FOUND':
        throw new Error(
          'Cabinet or key not found. Please check the cabinet ID and key name.',
        );
      default:
        throw new Error(error.message || `HTTP ${response.status}`);
    }
  }

  return response.json();
}
```

### Шаг 4: Использование в странице настроек кабинета

```typescript
// src/pages/cabinets/[cabinetId]/settings.tsx или аналогичная страница

import { UpdateWbTokenForm } from '@/components/UpdateWbTokenForm';
import { useParams } from 'next/navigation';

export default function CabinetSettingsPage() {
  const params = useParams();
  const cabinetId = params?.cabinetId as string;

  const handleTokenUpdateSuccess = () => {
    // Опционально: Обновляем список ключей или другую информацию
    // queryClient.invalidateQueries(['cabinet-keys', cabinetId]);
    console.log('Token updated successfully');
  };

  const handleTokenUpdateError = (error: Error) => {
    // Логируем ошибку для мониторинга
    console.error('Token update failed:', error);
    // Дополнительная обработка ошибок (например, отправка в Sentry)
  };

  return (
    <div className="cabinet-settings">
      <h1>Cabinet Settings</h1>
      
      <section className="token-management">
        <h2>WB API Token Management</h2>
        <p>
          Update your Wildberries API token if it has expired or been
          compromised.
        </p>
        
        <UpdateWbTokenForm
          keyName="wb_api_token"
          onSuccess={handleTokenUpdateSuccess}
          onError={handleTokenUpdateError}
        />
      </section>
    </div>
  );
}
```

---

## 🔍 Валидация токена на Frontend (опционально)

Перед отправкой на backend можно выполнить базовую валидацию формата токена:

```typescript
// src/lib/validation.ts

/**
 * Базовая валидация формата WB API токена
 * ⚠️ Полная валидация выполняется на backend через WB API
 */
export function validateWbTokenFormat(token: string): {
  valid: boolean;
  error?: string;
} {
  if (!token || token.trim().length === 0) {
    return { valid: false, error: 'Token cannot be empty' };
  }

  // WB API токены обычно JWT, начинаются с "eyJ"
  // Минимальная длина ~100 символов
  if (token.length < 50) {
    return {
      valid: false,
      error: 'Token seems too short. Please check your token.',
    };
  }

  // Проверка на базовый формат JWT (3 части, разделенные точками)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      valid: false,
      error: 'Token format seems invalid. Please check your token.',
    };
  }

  return { valid: true };
}

// Использование в компоненте
const validation = validateWbTokenFormat(newToken);
if (!validation.valid) {
  setError(validation.error);
  return;
}
```

---

## ⚠️ Важные замечания

### 1. Заголовок X-Cabinet-Id обязателен

**❌ НЕПРАВИЛЬНО:**
```typescript
fetch(`/v1/cabinets/${cabinetId}/keys/${keyName}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    // ❌ Отсутствует X-Cabinet-Id
  },
  body: JSON.stringify({ token: newToken }),
});
```

**✅ ПРАВИЛЬНО:**
```typescript
fetch(`/v1/cabinets/${cabinetId}/keys/${keyName}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId, // ✅ ОБЯЗАТЕЛЬНО!
  },
  body: JSON.stringify({ token: newToken }),
});
```

### 2. Автоматические процессы не запускаются

При обновлении существующего токена:
- ❌ Исторический импорт **НЕ запускается**
- ❌ Синхронизация продуктов **НЕ запускается**

Эти процессы запускаются только при создании **нового** ключа через `POST /v1/cabinets/:id/keys`.

### 3. Токен валидируется через WB API

Backend проверяет токен через WB API перед сохранением (Story 13.1). Если токен невалидный, запрос вернет `400 Bad Request` с кодом `INVALID_TOKEN`.

### 4. Права доступа

Только пользователи с ролями **Owner** или **Manager** могут обновлять токены. Пользователи с ролью **Analyst** не имеют доступа к этому эндпоинту.

---

## 🧪 Тестирование

### Unit Test Example

```typescript
// src/lib/__tests__/api.test.ts

import { updateWbToken } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('updateWbToken', () => {
  const cabinetId = 'cabinet-uuid';
  const keyName = 'wb_api_token';
  const newToken = 'new-wb-token';
  const jwtToken = 'jwt-token';

  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should update token successfully', async () => {
    const mockResponse = {
      id: 'key-uuid',
      keyName: 'wb_api_token',
      updatedAt: '2025-01-12T10:00:00Z',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await updateWbToken(cabinetId, keyName, newToken, jwtToken);

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/v1/cabinets/${cabinetId}/keys/${keyName}`),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'X-Cabinet-Id': cabinetId,
          Authorization: `Bearer ${jwtToken}`,
        }),
        body: JSON.stringify({ token: newToken }),
      }),
    );
  });

  it('should throw error for invalid token', async () => {
    const mockError = {
      code: 'INVALID_TOKEN',
      message: 'WB API token is invalid or expired',
      details: [
        {
          field: 'token',
          issue: 'Token validation failed',
          recommendation: 'Get a new token from https://seller.wildberries.ru/',
        },
      ],
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => mockError,
    });

    await expect(
      updateWbToken(cabinetId, keyName, 'invalid-token', jwtToken),
    ).rejects.toThrow('Get a new token from https://seller.wildberries.ru/');
  });

  it('should throw error for missing X-Cabinet-Id header', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        code: 'VALIDATION_ERROR',
        message: 'Missing X-Cabinet-Id header',
      }),
    });

    await expect(
      updateWbToken(cabinetId, keyName, newToken, jwtToken),
    ).rejects.toThrow();
  });
});
```

---

## 📚 Дополнительные ресурсы

- **Backend Controller:** `src/cabinets/cabinets.controller.ts:150-176`
- **Backend Service:** `src/cabinets/cabinet-keys.service.ts:603-608`
- **Token Validation:** `src/cabinets/cabinet-keys.service.ts:291-339` (Story 13.1)
- **API Documentation:** `docs/API-PATHS-REFERENCE.md`
- **Frontend API Guide:** `frontend/docs/api-integration-guide.md`
- **Error Codes:** `docs/stories/epic-13/story-13.1-token-validation-on-key-creation.md`

---

## ✅ Checklist для Frontend разработчика

- [ ] API функция `updateWbToken()` реализована
- [ ] Заголовок `X-Cabinet-Id` добавлен в запрос
- [ ] Обработаны все коды ошибок (400, 401, 403, 404)
- [ ] Показываются понятные сообщения об ошибках пользователю
- [ ] Добавлена опциональная валидация формата токена на frontend
- [ ] Форма обновления токена скрывает ввод (type="password")
- [ ] После успешного обновления форма очищается
- [ ] Написаны unit тесты для API функции
- [ ] Компонент формы обновления токена протестирован

---

**Дата создания:** 2025-01-12  
**Последнее обновление:** 2025-01-12  
**Автор:** Backend Team (James - Dev Agent)

