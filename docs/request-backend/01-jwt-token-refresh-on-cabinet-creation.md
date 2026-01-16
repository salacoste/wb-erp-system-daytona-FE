# 01. JWT Token Refresh при создании кабинета

## 📋 Обзор

При создании нового кабинета через `POST /v1/cabinets` backend автоматически:
1. Создает кабинет
2. Добавляет `cabinet_id` в массив `user.cabinet_ids` в базе данных
3. **Генерирует новый JWT токен** с обновленным массивом `cabinet_ids`
4. Возвращает кабинет вместе с новым токеном

**⚠️ КРИТИЧНО:** Frontend **ОБЯЗАН** обновить сохраненный JWT токен новым значением из ответа, иначе пользователь не сможет получить доступ к только что созданному кабинету.

---

## 🔌 Backend Endpoint

### `POST /v1/cabinets`

**Request:**
```typescript
interface CreateCabinetRequest {
  name: string; // Название кабинета
}
```

**Response (201 Created):**
```typescript
interface CreateCabinetResponse {
  id: string;                    // UUID кабинета
  name: string;                  // Название кабинета
  isActive: boolean;             // true (по умолчанию)
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
  newToken: string;             // ⚠️ НОВЫЙ JWT ТОКЕН - ОБЯЗАТЕЛЬНО ОБНОВИТЬ!
  productsSyncTasks?: Array<{   // Опционально: задачи синхронизации продуктов
    keyName: string;
    taskUuid: string;
    status: string;
    // ... другие поля
  }>;
}
```

**Backend Reference:**
- Controller: `src/cabinets/cabinets.controller.ts:44-62`
- Service: `src/cabinets/cabinets.service.ts:40-223`
- DTO: `src/cabinets/dto/cabinet-response.dto.ts:184-203`

---

## 💻 Frontend Implementation

### Шаг 1: Вызов API при создании кабинета

```typescript
// src/lib/api.ts или src/services/cabinets.service.ts

interface CreateCabinetRequest {
  name: string;
}

interface CreateCabinetResponse {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  newToken: string; // ⚠️ КРИТИЧНО: Новый JWT токен
  productsSyncTasks?: Array<{
    keyName: string;
    taskUuid: string;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    error?: string | null;
    recommendation?: string | null;
  }>;
}

export async function createCabinet(
  data: CreateCabinetRequest,
  token: string,
): Promise<CreateCabinetResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/cabinets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'Failed to create cabinet',
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
```

### Шаг 2: Обновление токена в store после создания кабинета

```typescript
// src/stores/authStore.ts или аналогичный store

import { createCabinet } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export async function handleCreateCabinet(cabinetName: string) {
  const { token, refreshToken } = useAuthStore.getState();

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    // 1. Создаем кабинет
    const response = await createCabinet({ name: cabinetName }, token);

    // 2. ⚠️ КРИТИЧНО: Обновляем JWT токен в store
    // Используем refreshToken() метод из store
    refreshToken(response.newToken);

    // 3. Опционально: Обновляем user объект, если он изменился
    // (обычно не требуется, но на всякий случай)
    // const updatedUser = decodeJWT(response.newToken);
    // useAuthStore.getState().setUser(updatedUser);

    // 4. Возвращаем созданный кабинет
    return {
      cabinet: {
        id: response.id,
        name: response.name,
        isActive: response.isActive,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      },
      productsSyncTasks: response.productsSyncTasks,
    };
  } catch (error) {
    console.error('Failed to create cabinet:', error);
    throw error;
  }
}
```

### Шаг 3: Использование в компоненте

```typescript
// src/components/CabinetCreationForm.tsx или аналогичный компонент

import { useState } from 'react';
import { handleCreateCabinet } from '@/services/cabinets.service';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation'; // или useNavigate для React Router

export function CabinetCreationForm() {
  const [cabinetName, setCabinetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Создаем кабинет (внутри handleCreateCabinet токен обновится автоматически)
      const result = await handleCreateCabinet(cabinetName);

      // Показываем уведомление об успехе
      toast.success(`Cabinet "${result.cabinet.name}" created successfully!`);

      // Перенаправляем на страницу кабинета или dashboard
      router.push(`/cabinets/${result.cabinet.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cabinet');
      toast.error(error || 'Failed to create cabinet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={cabinetName}
        onChange={(e) => setCabinetName(e.target.value)}
        placeholder="Cabinet name"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading || !cabinetName}>
        {loading ? 'Creating...' : 'Create Cabinet'}
      </button>
    </form>
  );
}
```

---

## 🔍 Проверка обновления токена

### Метод 1: Проверка через декодирование JWT

```typescript
// src/lib/auth.ts

import { jwtDecode } from 'jwt-decode'; // или другая библиотека для декодирования JWT

interface JWTPayload {
  sub: string;           // User ID
  role: string;          // User role
  cabinet_ids: string[]; // Массив ID кабинетов
  exp: number;           // Expiration timestamp
}

export function decodeJWT(token: string): JWTPayload {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

// Проверка, что новый кабинет добавлен в токен
export function verifyCabinetInToken(token: string, cabinetId: string): boolean {
  const payload = decodeJWT(token);
  return payload.cabinet_ids.includes(cabinetId);
}
```

### Метод 2: Логирование для отладки

```typescript
// В handleCreateCabinet после обновления токена

const oldToken = token;
const newToken = response.newToken;

// Декодируем оба токена для сравнения
const oldPayload = decodeJWT(oldToken);
const newPayload = decodeJWT(newToken);

console.log('Token updated:', {
  oldCabinetIds: oldPayload.cabinet_ids,
  newCabinetIds: newPayload.cabinet_ids,
  newCabinetAdded: newPayload.cabinet_ids.includes(response.id),
});

// Проверяем, что новый кабинет действительно в токене
if (!newPayload.cabinet_ids.includes(response.id)) {
  console.error('⚠️ WARNING: New cabinet not found in updated token!');
}
```

---

## ⚠️ Важные замечания

### 1. Обновление токена обязательно

**❌ НЕПРАВИЛЬНО:**
```typescript
// Создали кабинет, но забыли обновить токен
const response = await createCabinet({ name: 'My Cabinet' }, token);
// Пользователь не сможет получить доступ к кабинету!
```

**✅ ПРАВИЛЬНО:**
```typescript
// Создали кабинет И обновили токен
const response = await createCabinet({ name: 'My Cabinet' }, token);
refreshToken(response.newToken); // ⚠️ ОБЯЗАТЕЛЬНО!
```

### 2. Токен должен обновляться синхронно

Не используйте асинхронное обновление токена, иначе последующие запросы могут использовать старый токен:

**❌ НЕПРАВИЛЬНО:**
```typescript
createCabinet(data, token).then((response) => {
  // Асинхронное обновление - может быть race condition
  setTimeout(() => refreshToken(response.newToken), 0);
});
```

**✅ ПРАВИЛЬНО:**
```typescript
const response = await createCabinet(data, token);
refreshToken(response.newToken); // Синхронное обновление
```

### 3. Обработка ошибок

Если создание кабинета успешно, но обновление токена не удалось, пользователь не сможет получить доступ к кабинету:

```typescript
try {
  const response = await createCabinet(data, token);
  
  try {
    refreshToken(response.newToken);
  } catch (tokenError) {
    // Критическая ошибка - токен не обновлен
    console.error('Failed to update token:', tokenError);
    // Можно показать предупреждение пользователю
    toast.warning(
      'Cabinet created, but token update failed. Please refresh the page or log in again.'
    );
  }
} catch (error) {
  // Ошибка создания кабинета
  console.error('Failed to create cabinet:', error);
  throw error;
}
```

---

## 🧪 Тестирование

### Unit Test Example

```typescript
// src/services/__tests__/cabinets.service.test.ts

import { createCabinet } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { handleCreateCabinet } from '@/services/cabinets.service';

jest.mock('@/lib/api');
jest.mock('@/stores/authStore');

describe('handleCreateCabinet', () => {
  it('should update JWT token after cabinet creation', async () => {
    const mockToken = 'old-token';
    const mockNewToken = 'new-token-with-updated-cabinet-ids';
    const mockResponse = {
      id: 'cabinet-id',
      name: 'Test Cabinet',
      isActive: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      newToken: mockNewToken,
    };

    (useAuthStore.getState as jest.Mock).mockReturnValue({
      token: mockToken,
      refreshToken: jest.fn(),
    });

    (createCabinet as jest.Mock).mockResolvedValue(mockResponse);

    const refreshTokenSpy = jest.fn();
    useAuthStore.getState().refreshToken = refreshTokenSpy;

    await handleCreateCabinet('Test Cabinet');

    // Проверяем, что refreshToken был вызван с новым токеном
    expect(refreshTokenSpy).toHaveBeenCalledWith(mockNewToken);
    expect(refreshTokenSpy).toHaveBeenCalledTimes(1);
  });
});
```

---

## 📚 Дополнительные ресурсы

- **Backend Controller:** `src/cabinets/cabinets.controller.ts:44-62`
- **Backend Service:** `src/cabinets/cabinets.service.ts:40-223`
- **Response DTO:** `src/cabinets/dto/cabinet-response.dto.ts:184-203`
- **API Documentation:** `docs/API-PATHS-REFERENCE.md`
- **Frontend API Guide:** `frontend/docs/api-integration-guide.md`

---

## ✅ Checklist для Frontend разработчика

- [ ] API функция `createCabinet()` реализована
- [ ] После успешного создания кабинета вызывается `refreshToken(response.newToken)`
- [ ] Токен обновляется синхронно (не асинхронно)
- [ ] Обработаны ошибки обновления токена
- [ ] Добавлено логирование для отладки (опционально)
- [ ] Написаны unit тесты для проверки обновления токена
- [ ] Компонент создания кабинета использует обновленный токен для последующих запросов

---

**Дата создания:** 2025-01-12  
**Последнее обновление:** 2025-01-12  
**Автор:** Backend Team (James - Dev Agent)

