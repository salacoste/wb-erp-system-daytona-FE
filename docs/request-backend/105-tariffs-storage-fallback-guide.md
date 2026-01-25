# Руководство: Механизм Fallback для тарифов хранения (Storage Tariffs)

**Дата**: 2026-01-25
**Версия**: 1.0
**Целевая аудитория**: Frontend-разработчики
**Связанные документы**:
- `docs/TARIFFS-FORMULA-VALIDATION-REPORT.md`
- `docs/stories/epic-43/story-43.12-default-box-storage-rates.md`
- `frontend/docs/request-backend/102-tariffs-base-rates-frontend-guide.md`

---

## Содержание

1. [Проблема](#проблема)
2. [Решение: Backend Fallback](#решение-backend-fallback)
3. [Значения по умолчанию](#значения-по-умолчанию)
4. [Когда активируется fallback](#когда-активируется-fallback)
5. [Frontend реализация](#frontend-реализация)
6. [Тестирование](#тестирование)
7. [FAQ](#faq)

---

## Проблема

### Симптомы

**Что вы можете увидеть**:
- API возвращает `"storage.base_per_day_rub": 0` для некоторых складов
- API может не возвращать поле `storage` вообще (`null`/`undefined`)
- В Price Calculator отображается `0₽` стоимость хранения (неверно!)

### Причина

**WB API возвращает неполные данные**:

```typescript
// Ответ от Wildberries API (实际问题)
{
  "warehouseId": "123456",
  "boxStorageBase": "0",        // ← Проблема: "0" вместо реального тарифа
  "boxStorageLiter": "0",       // ← Проблема: "0" вместо реального тарифа
  "boxStorageCoefExpr": "115"
}
```

**Почему это происходит**:
1. У WB API нет тарифа хранения для конкретного склада
2. WB API токен имеет ограниченные права доступа
3. Новый склад ещё не добавлен в базу тарифов WB
4. Временный сбой в API Wildberries

**Результат без fallback**:
```typescript
// ❌ Неправильный расчёт с "0"
storageCost = (0 + (volume - 1) * 0) * coefficient * days = 0₽
```

---

## Решение: Backend Fallback

### Как это работает

Backend автоматически подставляет дефолтные значения из `WbTariffSettings` таблицы:

**Логика в backend** (`warehouses-tariffs.service.ts:502-506`):

```typescript
// 1. Парсим значения из WB API
const storageBase = this.parseNumeric(raw.boxStorageBase);  // "0" → 0
const storageLiter = this.parseNumeric(raw.boxStorageLiter); // "0" → 0

// 2. Если WB API вернул 0 или null, используем дефолтные значения
const finalStorageBase = storageBase > 0
  ? storageBase
  : defaultStorageBasePerDay ?? storageBase;

const finalStorageLiter = storageLiter > 0
  ? storageLiter
  : defaultStorageLiterPerDay ?? storageLiter;

// 3. Возвращаем корректные данные в API response
return {
  storage: {
    base_per_day_rub: finalStorageBase,    // 0 → 0.11
    liter_per_day_rub: finalStorageLiter,  // 0 → 0.11
    coefficient: this.parseCoefficient(raw.boxStorageCoefExpr)
  }
}
```

### Где берутся дефолтные значения

**Backend запрашивает дефолтные настройки** (`warehouses-tariffs.service.ts:334-347`):

```typescript
// Fetch default storage rates for fallback when WB API returns 0
let defaultStorageBasePerDay: number | undefined;
let defaultStorageLiterPerDay: number | undefined;

try {
  [defaultStorageBasePerDay, defaultStorageLiterPerDay] = await Promise.all([
    this.tariffSettings.getDefaultStorageBoxBaseRate(),   // → 0.11
    this.tariffSettings.getDefaultStorageBoxLiterRate(),  // → 0.11
  ]);

  // Debug logging (видно в backend logs при LOG_LEVEL=debug)
  this.logger.debug(
    `Using default storage rates: base=${defaultStorageBasePerDay}₽, ` +
    `liter=${defaultStorageLiterPerDay}₽`
  );
} catch (error) {
  this.logger.warn(
    'Failed to fetch default storage rates, will use 0 for missing values',
    error
  );
}
```

**API response после обработки**:

```json
// ✅ Правильный ответ с fallback
{
  "warehouse_id": "123456",
  "warehouse_name": "Коледино",
  "tariffs": {
    "storage": {
      "base_per_day_rub": 0.11,      // ← Fallback сработал
      "liter_per_day_rub": 0.11,     // ← Fallback сработал
      "coefficient": 1.15
    }
  }
}
```

---

## Значения по умолчанию

### Дефолтные тарифы хранения

**Источник**: WB PDF "Стоимость логистики, приёмки и хранения"

| Поле | Значение | Описание | Источник |
|------|----------|----------|----------|
| `storageBoxBasePerDay` | **0.11₽/день** | Первый литр в день | База данных `WbTariffSettings` |
| `storageBoxLiterPerDay` | **0.11₽/литр/день** | Каждый дополнительный литр | База данных `WbTariffSettings` |

**Пример расчёта с дефолтными значениями**:

```typescript
// Товар: 5 литров, хранится 30 дней, coefficient = 1.15
const volume = 5;
const days = 30;
const coefficient = 1.15;
const baseRate = 0.11;  // дефолтный
const literRate = 0.11; // дефолтный

// Формула: ((base + (volume - 1) * liter) * coefficient) * days
const dailyCost = (0.11 + Math.max(0, 5 - 1) * 0.11) * 1.15;
//            = (0.11 + 4 * 0.11) * 1.15
//            = 0.55 * 1.15 = 0.6325₽/день

const totalCost = dailyCost * days;
//             = 0.6325 * 30 = 18.975₽ ≈ 19₽
```

### Как изменить дефолтные значения (Admin only)

**API Endpoint**: `PATCH /v1/admin/tariff-settings`

```typescript
// Только для пользователей с ролью Admin
const response = await fetch('http://localhost:3000/v1/admin/tariff-settings', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    storageBoxBasePerDay: 0.15,    // Новое значение
    storageBoxLiterPerDay: 0.12    // Новое значение
  })
});
```

**Проверка текущих значений**:

```bash
# GET /v1/tariffs/settings (доступно всем авторизованным)
curl http://localhost:3000/v1/tariffs/settings \
  -H "Authorization: Bearer ${JWT_TOKEN}"
```

**Response**:

```json
{
  "storage_box_base_per_day": 0.11,
  "storage_box_liter_per_day": 0.11,
  "storage_free_days": 60,
  // ... другие настройки
}
```

---

## Когда активируется fallback

### Условия срабатывания

**Fallback активируется, когда выполняется ХОТЯ БЫ ОДНО условие**:

1. **`boxStorageBase` = "0"** (строка "0" из WB API)
2. **`boxStorageBase` отсутствует** (`null`/`undefined`)
3. **`boxStorageLiter` = "0"**
4. **`boxStorageLiter` отсутствует**

**Код активации** (`warehouses-tariffs.service.ts:505-506`):

```typescript
// Условие: storageBase > 0 ?
const finalStorageBase = storageBase > 0
  ? storageBase                           // ✅ Используем значение от WB API
  : defaultStorageBasePerDay ?? storageBase; // ❌ Fallback на дефолт

// То же самое для liter
const finalStorageLiter = storageLiter > 0
  ? storageLiter
  : defaultStorageLiterPerDay ?? storageLiter;
```

### Debug Logging (для backend команды)

**Уровни логирования**:

```typescript
// 1. DEBUG - Когда fallback успешно применён
this.logger.debug(
  `Using default storage rates: base=0.11₽, liter=0.11₽`
);

// 2. WARN - Когда не удалось получить дефолтные значения
this.logger.warn(
  'Failed to fetch default storage rates, will use 0 for missing values',
  error
);
```

**Как включить debug логи**:

```bash
# Backend .env
LOG_LEVEL=debug

# Перезапустить backend
pm2 restart wb-repricer-backend
```

**Логи в console**:

```text
[2026-01-25 10:30:45] DEBUG: Using default storage rates: base=0.11₽, liter=0.11₽
[2026-01-25 10:30:46] DEBUG: Warehouse Коледино tariffs transformed with fallback
```

---

## Frontend реализация

### Как обрабатывать в frontend коде

**❌ НЕПРАВИЛЬНО** (использование `??`):

```typescript
// ❌ НЕ РАБОТАЕТ для "0" (0 не является null/undefined)
const storageBase = tariffs?.storage?.base_per_day_rub ?? 0.11;
// Если API вернул 0, то останется 0 (fallback не сработает)
```

**✅ ПРАВИЛЬНО** (использование `||`):

```typescript
// ✅ ПРАВИЛЬНО: используем || для fallback на 0
const storageBase = tariffs?.storage?.base_per_day_rub || 0.11;
const storageLiter = tariffs?.storage?.liter_per_day_rub || 0.11;
const storageCoefficient = tariffs?.storage?.coefficient || 1.0;
```

**Пример из реального кода** (`frontend/src/hooks/useWarehouses.ts:62-66`):

```typescript
import { TARIFF_DEFAULTS } from '@/config/tariffs';

function transformToWarehouse(data: ApiWarehouseData): Warehouse {
  // ... другой код ...

  return {
    id: data.warehouse_id,
    name: data.warehouse_name,
    tariffs: {
      // Delivery tariffs from FBO
      deliveryBaseLiterRub: fboTariffs?.delivery_base_rub || TARIFF_DEFAULTS.deliveryBaseLiterRub,
      deliveryPerLiterRub: fboTariffs?.delivery_liter_rub || TARIFF_DEFAULTS.deliveryPerLiterRub,
      logisticsCoefficient: fboTariffs?.logistics_coefficient || TARIFF_DEFAULTS.logisticsCoefficient,

      // ⭐ Storage tariffs (ВАЖНО: используем || вместо ??)
      // IMPORTANT: Use || instead of ?? because API may return 0 for missing storage data
      storageBaseLiterRub: storageTariffs?.base_per_day_rub || TARIFF_DEFAULTS.storageBaseLiterRub,
      storagePerLiterRub: storageTariffs?.liter_per_day_rub || TARIFF_DEFAULTS.storagePerLiterRub,
      storageCoefficient: storageTariffs?.coefficient || TARIFF_DEFAULTS.storageCoefficient,
    },
  }
}
```

### Константа TARIFF_DEFAULTS

**Расположение**: `frontend/src/config/tariffs.ts` (создаём если нет)

```typescript
/**
 * Default tariff values for fallback
 * Source: Backend API GET /v1/tariffs/settings
 */
export const TARIFF_DEFAULTS = {
  // Delivery (FBO)
  deliveryBaseLiterRub: 46,        // TODO: sync from backend
  deliveryPerLiterRub: 5,          // TODO: sync from backend
  logisticsCoefficient: 1.0,       // 100%

  // Storage (Story 43.12)
  storageBaseLiterRub: 0.11,       // First liter per day
  storagePerLiterRub: 0.11,        // Additional liter per day
  storageCoefficient: 1.0,         // 100%

  // Commission
  commissionFboPct: 25.0,          // 25%
  commissionFbsPct: 28.0,          // 28%
} as const;
```

### React Hook Pattern для Price Calculator

**Пример использования в компоненте**:

```typescript
// components/price-calculator/StorageCostDisplay.tsx

import { useWarehousesWithTariffs } from '@/hooks/useWarehouses';
import { TARIFF_DEFAULTS } from '@/config/tariffs';

export function StorageCostDisplay({
  warehouseId,
  volumeLiters,
  storageDays
}: Props) {
  const { warehouses, isLoading } = useWarehousesWithTariffs();

  const warehouse = warehouses.find(w => w.id === warehouseId);

  // ✅ ПРАВИЛЬНО: Используем || для fallback
  const storageBase = warehouse?.tariffs?.storage?.base_per_day_rub
    || TARIFF_DEFAULTS.storageBaseLiterRub;

  const storageLiter = warehouse?.tariffs?.storage?.liter_per_day_rub
    || TARIFF_DEFAULTS.storagePerLiterRub;

  const coefficient = warehouse?.tariffs?.storage?.coefficient
    || TARIFF_DEFAULTS.storageCoefficient;

  // Расчёт стоимости хранения
  const calculateStorageCost = () => {
    const volume = Math.max(volumeLiters, 1);
    const additionalLiters = Math.max(0, volume - 1);
    const dailyCost = (storageBase + additionalLiters * storageLiter) * coefficient;
    return Math.round(dailyCost * storageDays * 100) / 100;
  };

  const storageCost = calculateStorageCost();

  if (isLoading) return <Skeleton />;

  return (
    <div className="storage-cost">
      <p>Стоимость хранения: <strong>{storageCost} ₽</strong></p>
      <p className="text-sm text-gray-500">
        Тариф: {storageBase} ₽/л + {storageLiter} ₽/л (коэф. {coefficient})
      </p>
    </div>
  );
}
```

---

## Тестирование

### Как проверить, что fallback работает

#### 1. Unit тесты (Vitest)

```typescript
// hooks/__tests__/useWarehouses.test.ts

import { TARIFF_DEFAULTS } from '@/config/tariffs';

describe('Warehouses Tariffs - Storage Fallback', () => {
  it('should use fallback when API returns 0 for storage rates', () => {
    const mockWarehouse = {
      warehouse_id: '123',
      warehouse_name: 'Тестовый склад',
      tariffs: {
        storage: {
          base_per_day_rub: 0,        // ← API вернул 0
          liter_per_day_rub: 0,       // ← API вернул 0
          coefficient: 1.15
        }
      }
    };

    const result = transformToWarehouse(mockWarehouse);

    // ✅ Fallback должен подставить дефолтные значения
    expect(result.tariffs.storageBaseLiterRub).toBe(TARIFF_DEFAULTS.storageBaseLiterRub);
    expect(result.tariffs.storagePerLiterRub).toBe(TARIFF_DEFAULTS.storagePerLiterRub);
    expect(result.tariffs.storageCoefficient).toBe(1.15); // коэффициент остался
  });

  it('should use API values when they are > 0', () => {
    const mockWarehouse = {
      warehouse_id: '456',
      warehouse_name: 'Коледино',
      tariffs: {
        storage: {
          base_per_day_rub: 0.07,     // ← Реальный тариф от WB API
          liter_per_day_rub: 0.05,    // ← Реальный тариф от WB API
          coefficient: 1.0
        }
      }
    };

    const result = transformToWarehouse(mockWarehouse);

    // ✅ Должны использоваться значения от API
    expect(result.tariffs.storageBaseLiterRub).toBe(0.07);
    expect(result.tariffs.storagePerLiterRub).toBe(0.05);
    expect(result.tariffs.storageCoefficient).toBe(1.0);
  });
});
```

#### 2. E2E тесты (Playwright)

```typescript
// e2e/price-calculator-storage-fallback.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Price Calculator - Storage Fallback', () => {
  test('should calculate storage cost when warehouse has 0 tariffs', async ({ page }) => {
    // 1. Открываем Price Calculator
    await page.goto('/cogs/price-calculator');

    // 2. Выбираем склад с tariff.storage = 0 (если есть в тестовых данных)
    await page.selectOption('select[name="warehouse"]', 'test-warehouse-zero');

    // 3. Вводим параметры товара
    await page.fill('input[name="volumeLiters"]', '5');
    await page.fill('input[name="storageDays"]', '30');

    // 4. Проверяем, что стоимость хранения рассчитана (не 0)
    const storageCost = page.locator('[data-testid="storage-cost"]');
    await expect(storageCost).not.toHaveText('0 ₽');

    // 5. Проверяем, что используется fallback (может быть в логах или tooltip)
    const fallbackNotice = page.locator('[data-testid="fallback-notice"]');
    await expect(fallbackNotice).toContainText('используются тарифы по умолчанию');
  });
});
```

#### 3. Ручное тестирование через Swagger UI

```bash
# 1. Открыть Swagger UI
open http://localhost:3000/api

# 2. Найти endpoint: GET /v1/tariffs/warehouses-with-tariffs

# 3. Выполнить запрос

# 4. Проверить response
{
  "data": {
    "warehouses": [
      {
        "warehouse_id": "123456",
        "warehouse_name": "Коледино",
        "tariffs": {
          "storage": {
            "base_per_day_rub": 0.11,    // ← Должен быть 0.11 (fallback)
            "liter_per_day_rub": 0.11,   // ← Должен быть 0.11 (fallback)
            "coefficient": 1.15
          }
        }
      }
    ]
  }
}
```

### Тестовые кейсы

| Сценарий | Входные данные (WB API) | Ожидаемый результат (Frontend) |
|----------|-------------------------|-------------------------------|
| **Склад с тарифами** | `base: 0.07`, `liter: 0.05` | Используются значения от API (0.07, 0.05) |
| **Склад с 0** | `base: 0`, `liter: 0` | Fallback на 0.11, 0.11 |
| **Склад без storage** | `storage: null` | Fallback на 0.11, 0.11 |
| **Склад без tariffs** | `tariffs: null` | Fallback на TARIFF_DEFAULTS |
| **Новый склад** | Отсутствует в списке | Warehouse не отображается в UI |

---

## FAQ

### Вопросы и ответы

#### Q1: Почему стоимость хранения отображается как 0₽?

**A**: Это может происходить по двум причинам:

1. **Frontend использует `??` вместо `||`**:
   ```typescript
   // ❌ Неправильно
   const storageBase = tariffs?.storage?.base_per_day_rub ?? 0.11;
   // Если API вернул 0, то останется 0
   ```

   **Решение**:
   ```typescript
   // ✅ Правильно
   const storageBase = tariffs?.storage?.base_per_day_rub || 0.11;
   ```

2. **Backend не применил fallback** (проверьте логи):
   ```bash
   pm2 logs wb-repricer-backend --lines 100
   ```

   Ищите:
   ```
   DEBUG: Using default storage rates: base=0.11₽, liter=0.11₽
   ```

#### Q2: Могу ли я изменить дефолтные тарифы хранения?

**A**: Да, если у вас роль **Admin**:

```typescript
// PATCH /v1/admin/tariff-settings
await apiClient.patch('/v1/admin/tariff-settings', {
  storageBoxBasePerDay: 0.15,
  storageBoxLiterPerDay: 0.12
});
```

**Важно**: Изменения повлияют на все расчёты, где используется fallback.

#### Q3: Какие тарифы использовать для тестирования?

**A**: Используйте тестовые данные:

```typescript
// Тестовый склад с нулевыми тарифами (для проверки fallback)
const mockWarehouseZeroTariffs = {
  warehouse_id: 'test-zero-tariffs',
  tariffs: {
    storage: {
      base_per_day_rub: 0,
      liter_per_day_rub: 0,
      coefficient: 1.0
    }
  }
};

// Тестовый склад с реальными тарифами
const mockWarehouseRealTariffs = {
  warehouse_id: 'test-real-tariffs',
  tariffs: {
    storage: {
      base_per_day_rub: 0.07,
      liter_per_day_rub: 0.05,
      coefficient: 1.15
    }
  }
};
```

#### Q4: Как определить, что сработал fallback?

**A**: Три способа:

1. **Проверить логи backend** (при `LOG_LEVEL=debug`):
   ```
   DEBUG: Using default storage rates: base=0.11₽, liter=0.11₽
   ```

2. **Проверить API response**:
   - Если WB API вернул 0, а в response 0.11 → fallback сработал ✅

3. **Проверить в frontend** (сравнить с бэкапом):
   ```typescript
   // Если API вернул 0.11 (дефолт), значит fallback сработал
   const isFallback = warehouse.tariffs.storage.base_per_day_rub === 0.11;
   ```

#### Q5: Что если `WbTariffSettings` таблица пустая?

**A**: Backend запишет warning в лог и использует 0:

```typescript
// Лог будет:
WARN: Failed to fetch default storage rates, will use 0 for missing values

// Результат:
base_per_day_rub: 0
liter_per_day_rub: 0
```

**Как исправить**: Проверьте seed данные:

```bash
# В корне backend проекта
npx prisma db seed

# Проверьте, что запись создана
npx prisma studio
# → Таблица: wb_tariff_settings
# → Поле: storage_box_base_per_day = 0.11
```

#### Q6: В чём разница между `||` и `??`?

**A**:

| Оператор | Срабатывает на | Пример |
|----------|----------------|--------|
| `??` (nullish coalescing) | `null`, `undefined` | `0 ?? 11 = 0` |
| `||` (logical or) | **Ложные значения** (`0`, `""`, `false`, `null`, `undefined`) | `0 || 11 = 11` |

**Для тарифов хранения** используем `||`, потому что `0` — это невалидное значение.

#### Q7: Как показать пользователю, что используются дефолтные тарифы?

**A**: Добавить предупреждение в UI:

```typescript
// components/price-calculator/StorageTariffWarning.tsx

export function StorageTariffWarning({ warehouse }: Props) {
  const isUsingFallback = warehouse.tariffs.storage.base_per_day_rub === 0.11;

  if (!isUsingFallback) return null;

  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Внимание</AlertTitle>
      <AlertDescription>
        Для склада "{warehouse.name}" используются тарифы хранения по умолчанию (0.11₽/день).
        Возможна неточность в расчётах.
      </AlertDescription>
    </Alert>
  );
}
```

---

## Краткая сводка (Cheat Sheet)

### Для Frontend разработчиков

```typescript
// ✅ ПРАВИЛЬНЫЙ ПАТТЕРН
const storageTariffs = {
  base: warehouse?.tariffs?.storage?.base_per_day_rub || 0.11,
  liter: warehouse?.tariffs?.storage?.liter_per_day_rub || 0.11,
  coefficient: warehouse?.tariffs?.storage?.coefficient || 1.0,
};

// ❌ НЕПРАВИЛЬНЫЙ ПАТТЕРН
const storageTariffs = {
  base: warehouse?.tariffs?.storage?.base_per_day_rub ?? 0.11, // Не сработает для 0
  liter: warehouse?.tariffs?.storage?.liter_per_day_rub ?? 0.11, // Не сработает для 0
  coefficient: warehouse?.tariffs?.storage?.coefficient ?? 1.0,
};
```

### Дефолтные значения (Story 43.12)

| Параметр | Значение | Описание |
|----------|----------|----------|
| `storageBaseLiterRub` | 0.11₽/день | Первый литр |
| `storagePerLiterRub` | 0.11₽/литр/день | Дополнительные литры |
| `storageCoefficient` | 1.0 | Коэффициент (100%) |

### API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/v1/tariffs/warehouses-with-tariffs` | GET | Получить склады с тарифами (с fallback) |
| `/v1/tariffs/settings` | GET | Получить дефолтные настройки |
| `/v1/admin/tariff-settings` | PATCH | Изменить дефолтные настройки (Admin only) |

---

## Дополнительные ресурсы

### Внутренние документы

- **Валидация формул**: `docs/TARIFFS-FORMULA-VALIDATION-REPORT.md`
- **Story 43.12**: `docs/stories/epic-43/story-43.12-default-box-storage-rates.md`
- **Руководство по базовым тарифам**: `frontend/docs/request-backend/102-tariffs-base-rates-frontend-guide.md`
- **API Paths Reference**: `docs/API-PATHS-REFERENCE.md`

### Код backend

- **Fallback логика**: `src/tariffs/warehouses-tariffs.service.ts:502-506`
- **Получение дефолтов**: `src/tariffs/wb-tariff-settings.service.ts:447-461`
- **DTO**: `src/tariffs/dto/warehouses-tariffs.dto.ts`

### Код frontend

- **Hook**: `frontend/src/hooks/useWarehouses.ts:62-66`
- **Конфиг**: `frontend/src/config/tariffs.ts`
- **Price Calculator**: `frontend/src/hooks/usePriceCalculator.ts`

---

**Дата создания**: 2026-01-25
**Автор**: Backend Team
**Версия**: 1.0
**Статус**: Production Ready
