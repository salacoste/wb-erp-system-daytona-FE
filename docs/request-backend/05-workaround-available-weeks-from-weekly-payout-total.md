# 05. Workaround: Получение доступных недель из weekly_payout_total

## 📋 Обзор

Endpoint `/v1/analytics/weekly/available-weeks` возвращает пустой массив из-за того, что использует таблицу `imports`, где поля `week` и `weeks_included` не заполняются. Данные есть в таблице `weekly_payout_total`, но нет прямого API endpoint для их получения.

**Статус:** ✅ **РЕШЕНО И ЗАДЕПЛОЕНО** - Story 2.7 реализована и задеплоена на backend  
**Приоритет:** HIGH  
**Дата создания:** 2025-11-21
**Дата решения:** 2025-11-21
**Дата деплоя:** 2025-11-21

---

## 🔍 Анализ доступных API endpoints

Изучив `test-api/` (см. 05-analytics-basic.http), доступны следующие endpoints для работы с неделями:

### 1. Получение списка недель
- **`GET /v1/analytics/weekly/available-weeks`** ❌ Возвращает пустой массив (проблема)

### 2. Получение данных по конкретной неделе
Все эти endpoints требуют указания конкретной недели в query параметре:
- `GET /v1/analytics/weekly/finance-summary?week=2025-W45`
- `GET /v1/analytics/weekly/by-sku?week=2025-W45`
- `GET /v1/analytics/weekly/by-brand?week=2025-W45`
- `GET /v1/analytics/weekly/by-category?week=2025-W45`
- `GET /v1/analytics/weekly/raw-transactions?week=2025-W45`

**Проблема:** Нет endpoint, который возвращает список недель из `weekly_payout_total`.

---

## 💡 Предлагаемые решения

### Решение 1: Изменить backend endpoint `available-weeks` (РЕКОМЕНДУЕТСЯ)

**Описание:** Изменить реализацию endpoint `/v1/analytics/weekly/available-weeks`, чтобы он использовал таблицу `weekly_payout_total` вместо `imports`.

**Преимущества:**
- ✅ Исправляет проблему на уровне API
- ✅ Не требует изменений на frontend
- ✅ Более надежный источник данных (только готовые агрегированные данные)
- ✅ Соответствует рекомендации Backend Team (см. документ `04-analytics-api-response-format-clarification.md`)

**Реализация на Backend:**
```typescript
// src/analytics/weekly-analytics.service.ts

async getAvailableWeeks(cabinetId: string): Promise<AvailableWeeksResponseDto> {
  this.logger.log(`Fetching available weeks for cabinet ${cabinetId}`);

  // ✅ ИСПРАВЛЕНИЕ: Использовать weekly_payout_total вместо imports
  const weeks = await this.prisma.weeklyPayoutTotal.findMany({
    where: { cabinetId },
    select: { week: true },
    distinct: ['week'],
    orderBy: { week: 'desc' },
  });

  // Calculate start_date for each week
  const data = weeks.map((w) => ({
    week: w.week,
    start_date: this.calculateWeekStartDate(w.week),
  }));

  this.logger.log(`Found ${data.length} unique weeks from weekly_payout_total`);

  return { data };
}
```

**Альтернативный вариант (гибридный):**
```typescript
// Использовать weekly_payout_total как основной источник, imports как fallback
const weeksFromTotal = await this.prisma.weeklyPayoutTotal.findMany({
  where: { cabinetId },
  select: { week: true },
  distinct: ['week'],
});

const weeksFromImports = await this.prisma.import.findMany({
  where: {
    cabinetId,
    status: 'completed',
  },
  select: {
    weeksIncluded: true,
    week: true,
  },
});

// Объединить оба источника
const weekSet = new Set<string>();
weeksFromTotal.forEach((w) => weekSet.add(w.week));
weeksFromImports.forEach((imp) => {
  if (imp.weeksIncluded?.length) {
    imp.weeksIncluded.forEach((w) => weekSet.add(w));
  } else if (imp.week) {
    weekSet.add(imp.week);
  }
});

const weekStrings = Array.from(weekSet).sort().reverse();
```

**Статус:** ⚠️ Требуется изменение на backend

---

### Решение 2: Создать новый endpoint (АЛЬТЕРНАТИВА)

**Описание:** Создать новый endpoint `/v1/analytics/weekly/available-weeks-from-total`, который явно использует `weekly_payout_total`.

**Преимущества:**
- ✅ Не ломает существующий endpoint
- ✅ Можно использовать параллельно со старым
- ✅ Явно показывает источник данных

**Недостатки:**
- ❌ Дублирование функциональности
- ❌ Требует изменений на frontend

**Реализация:**
```typescript
// src/analytics/weekly-analytics.controller.ts

@Get('available-weeks-from-total')
@UseGuards(JwtAuthGuard, CabinetOwnershipGuard)
async getAvailableWeeksFromTotal(
  @Headers('x-cabinet-id') cabinetId: string,
): Promise<AvailableWeeksResponseDto> {
  return this.weeklyAnalyticsService.getAvailableWeeksFromTotal(cabinetId);
}
```

**Статус:** ⚠️ Требуется создание нового endpoint на backend

---

### Решение 3: Временный workaround на frontend (НЕ РЕКОМЕНДУЕТСЯ)

**Описание:** На frontend попробовать запросить `finance-summary` для нескольких последних недель и определить, какие возвращают данные.

**Преимущества:**
- ✅ Не требует изменений на backend
- ✅ Можно реализовать немедленно

**Недостатки:**
- ❌ Неэффективно (множественные запросы)
- ❌ Неточное определение недель (может пропустить недели)
- ❌ Увеличивает нагрузку на API
- ❌ Не масштабируется (нельзя проверить все недели)

**Пример реализации (НЕ РЕКОМЕНДУЕТСЯ):**
```typescript
// ❌ НЕ РЕКОМЕНДУЕТСЯ - только как временный workaround
async function getAvailableWeeksWorkaround(cabinetId: string): Promise<string[]> {
  const weeks: string[] = [];
  const currentDate = new Date();
  
  // Попробовать последние 13 недель
  for (let i = 0; i < 13; i++) {
    const week = getISOWeek(currentDate);
    const weekString = `${currentDate.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    
    try {
      const response = await apiClient.get(
        `/v1/analytics/weekly/finance-summary?week=${weekString}`
      );
      
      if (response.summary_total || response.summary_rus) {
        weeks.push(weekString);
      }
    } catch (error) {
      // Неделя не найдена, пропускаем
    }
    
    // Перейти к предыдущей неделе
    currentDate.setDate(currentDate.getDate() - 7);
  }
  
  return weeks;
}
```

**Статус:** ⚠️ Только как временный workaround, не рекомендуется для production

---

## 📊 Сравнение решений

| Решение | Требует Backend | Требует Frontend | Эффективность | Рекомендация |
|---------|----------------|------------------|---------------|--------------|
| 1. Изменить `available-weeks` | ✅ Да | ❌ Нет | ⭐⭐⭐⭐⭐ | ✅ **РЕКОМЕНДУЕТСЯ** |
| 2. Новый endpoint | ✅ Да | ✅ Да | ⭐⭐⭐⭐ | ⚠️ Альтернатива |
| 3. Frontend workaround | ❌ Нет | ✅ Да | ⭐⭐ | ❌ Не рекомендуется |

---

## 🎯 Рекомендация

**✅ РЕКОМЕНДУЕТСЯ: Решение 1** - Изменить backend endpoint `available-weeks` для использования `weekly_payout_total`.

**Обоснование:**
1. Соответствует рекомендации Backend Team (см. документ `04-analytics-api-response-format-clarification.md`)
2. Исправляет проблему на уровне источника данных
3. Не требует изменений на frontend
4. Более надежный и эффективный подход
5. Показывает только недели с готовыми агрегированными данными

**План действий:**
1. Backend Team изменяет endpoint `/v1/analytics/weekly/available-weeks`
2. Использует `weekly_payout_total` вместо `imports`
3. Тестирует endpoint с реальными данными
4. Frontend автоматически начнет получать корректные данные

---

## 📝 Запрос к Backend Team

**Просьба реализовать Решение 1:**

1. **Изменить endpoint `/v1/analytics/weekly/available-weeks`:**
   - Использовать таблицу `weekly_payout_total` вместо `imports`
   - Сохранить текущий формат ответа `{ data: [{ week, start_date }] }`
   - Сохранить логику расчета `start_date`

2. **Альтернативно (гибридный подход):**
   - Использовать `weekly_payout_total` как основной источник
   - Добавить fallback на `imports` для недель, которые импортированы, но еще не агрегированы

3. **Тестирование:**
   - Проверить с реальными данными из БД
   - Убедиться, что возвращаются все недели из `weekly_payout_total`
   - Проверить формат ответа соответствует текущему

**Backend Reference:**
- Текущая реализация: `src/analytics/weekly-analytics.service.ts:100-141`
- Таблица `weekly_payout_total`: `prisma/schema.prisma:337-366`
- Таблица `imports`: `prisma/schema.prisma:106-156`

---

## 🔗 Связанные документы

- `04-analytics-api-response-format-clarification.md` - Подробное описание проблемы и ответ Backend Team
- `test-api/` - Директория с примерами API запросов (см. SECTION-MAPPING.md)
- `api-integration-guide.md` - Руководство по интеграции с API

---

**Дата создания:** 2025-11-21  
**Дата решения:** 2025-11-21  
**Дата деплоя:** 2025-11-21  
**Автор:** Frontend Team (Auto - Dev Agent)  
**Статус:** ✅ **РЕШЕНО И ЗАДЕПЛОЕНО** - Story 2.7 реализована и задеплоена на backend

---

## ✅ Решение реализовано

**Story 2.7**: Fix Available Weeks Endpoint - Use weekly_payout_total Instead of imports

**Реализовано:** 2025-11-21  
**Файл Story:** `docs/stories/epic-2/story-2.7-fix-available-weeks-data-source.md`

### Что было сделано:

1. ✅ Endpoint `/v1/analytics/weekly/available-weeks` теперь использует таблицу `weekly_payout_total` вместо `imports`
2. ✅ Устранена race condition - недели появляются в списке только после успешной агрегации
3. ✅ Гарантия: если неделя в списке → данные доступны через `finance-summary`
4. ✅ Все тесты обновлены и проходят (24/24 unit tests)
5. ✅ E2E тесты обновлены
6. ✅ Документация обновлена

### Изменения в коде:

**Файл:** `src/analytics/weekly-analytics.service.ts`

```typescript
// Story 2.7: Changed from imports table to weekly_payout_total
const totals = await this.prisma.weeklyPayoutTotal.findMany({
  where: { cabinetId },
  select: { week: true },
  distinct: ['week'],
  orderBy: { week: 'desc' },
});
```

### Результат:

- ✅ Endpoint возвращает только недели с готовыми агрегированными данными
- ✅ Нет race condition между импортом и агрегацией
- ✅ Единый источник данных с `finance-summary` endpoint
- ✅ Лучший UX - пользователи видят только доступные недели

### Frontend Impact:

- ✅ **Никаких изменений не требуется** - формат ответа остался прежним
- ✅ Endpoint автоматически начнет возвращать корректные данные
- ✅ Можно удалить любые workaround'ы на frontend

**Рекомендация:** Протестировать endpoint с реальными данными после деплоя.

---

## 📝 Комментарии по корректной реализации запроса (Story 2.7)

**Дата обновления:** 2025-11-22  
**Статус:** ✅ Реализовано и протестировано

### ✅ Что изменилось после Story 2.7

**До Story 2.7:**
- ❌ Endpoint использовал таблицу `imports` (недели появлялись до завершения агрегации)
- ❌ Race condition: неделя в списке, но данные еще не готовы → 404 ошибка
- ❌ Нет гарантии доступности данных

**После Story 2.7:**
- ✅ Endpoint использует таблицу `weekly_payout_total` (только готовые данные)
- ✅ **Гарантия**: Если неделя в списке → данные доступны через `finance-summary`
- ✅ Нет race condition - недели появляются только после успешной агрегации
- ✅ Единый источник данных с `finance-summary` endpoint

### 🔧 Корректная реализация запроса

#### 1. Базовый запрос (без изменений в формате)

```typescript
// ✅ КОРРЕКТНО: Формат запроса не изменился
const response = await apiClient.get('/v1/analytics/weekly/available-weeks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId,
  },
});

// ✅ Формат ответа остался прежним
// {
//   "data": [
//     { "week": "2025-W46", "start_date": "2025-11-09" },
//     { "week": "2025-W45", "start_date": "2025-11-02" },
//     { "week": "2025-W44", "start_date": "2025-10-26" }
//   ]
// }
```

#### 2. Обработка пустого массива

**Важно:** Пустой массив `{ data: [] }` теперь означает, что **нет агрегированных данных**, а не ошибку.

```typescript
// ✅ КОРРЕКТНО: Обработка пустого состояния
const response = await apiClient.get('/v1/analytics/weekly/available-weeks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId,
  },
});

if (response.data.length === 0) {
  // Это нормально - данные еще не агрегированы
  // Показываем сообщение: "Нет доступных недель. Данные будут доступны после завершения агрегации."
  return [];
}

// Используем список недель
return response.data.map(item => ({
  week: item.week,
  startDate: item.start_date, // YYYY-MM-DD format
}));
```

#### 3. Гарантия доступности данных

**Ключевое преимущество Story 2.7:** Если неделя в списке, данные гарантированно доступны.

```typescript
// ✅ КОРРЕКТНО: Можно безопасно запрашивать finance-summary для любой недели из списка
async function getFinanceSummaryForWeek(week: string) {
  // Предварительная проверка: неделя должна быть в available-weeks
  const availableWeeks = await getAvailableWeeks();
  const weekExists = availableWeeks.some(w => w.week === week);
  
  if (!weekExists) {
    throw new Error(`Week ${week} is not available. Please select from available weeks.`);
  }
  
  // ✅ Гарантия: finance-summary вернет данные (не будет 404)
  const summary = await apiClient.get(
    `/v1/analytics/weekly/finance-summary?week=${week}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Cabinet-Id': cabinetId,
      },
    }
  );
  
  return summary;
}
```

#### 4. Обновление списка недель

**Рекомендация:** Обновлять список после завершения импорта и агрегации.

```typescript
// ✅ КОРРЕКТНО: Обновление списка после импорта
async function handleImportComplete(importId: string) {
  // Ждем завершения агрегации (можно использовать WebSocket или polling)
  await waitForAggregation(importId);
  
  // Обновляем список доступных недель
  const updatedWeeks = await getAvailableWeeks();
  
  // Теперь новая неделя появится в списке (только после агрегации)
  return updatedWeeks;
}

// Вспомогательная функция для ожидания агрегации
async function waitForAggregation(importId: string, maxWaitTime = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    // Проверяем статус задачи агрегации
    const taskStatus = await checkAggregationTaskStatus(importId);
    
    if (taskStatus === 'completed') {
      return; // Агрегация завершена
    }
    
    if (taskStatus === 'failed') {
      throw new Error('Aggregation failed');
    }
    
    // Ждем перед следующей проверкой
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  throw new Error('Aggregation timeout');
}
```

#### 5. Обработка ошибок

**Важно:** После Story 2.7 ошибка 404 для недели из списка `available-weeks` **не должна происходить**.

```typescript
// ✅ КОРРЕКТНО: Обработка ошибок с учетом Story 2.7
async function getFinanceSummarySafely(week: string) {
  try {
    // 1. Проверяем, что неделя в списке доступных
    const availableWeeks = await getAvailableWeeks();
    const weekData = availableWeeks.find(w => w.week === week);
    
    if (!weekData) {
      // Неделя не в списке - это нормально (данные еще не агрегированы)
      return {
        error: 'WEEK_NOT_AVAILABLE',
        message: `Week ${week} is not yet available. Please wait for aggregation to complete.`,
      };
    }
    
    // 2. Запрашиваем данные (гарантированно доступны после Story 2.7)
    const summary = await apiClient.get(
      `/v1/analytics/weekly/finance-summary?week=${week}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Cabinet-Id': cabinetId,
        },
      }
    );
    
    return { data: summary };
    
  } catch (error) {
    // После Story 2.7: 404 для недели из available-weeks НЕ должно происходить
    // Если это произошло - это баг, нужно логировать
    if (error.response?.status === 404) {
      console.error('CRITICAL: 404 for week from available-weeks list', {
        week,
        availableWeeks: await getAvailableWeeks(),
      });
      // Отправить в систему мониторинга ошибок
    }
    
    throw error;
  }
}
```

### 🎯 Рекомендации для Frontend

#### ✅ DO (Рекомендуется)

1. **Использовать недели только из `available-weeks`:**
   ```typescript
   // ✅ DO: Всегда проверять список перед запросом данных
   const weeks = await getAvailableWeeks();
   const selectedWeek = weeks.find(w => w.week === userSelectedWeek);
   if (!selectedWeek) {
     showMessage('Week not available yet');
     return;
   }
   ```

2. **Обрабатывать пустой массив как нормальное состояние:**
   ```typescript
   // ✅ DO: Пустой массив = данные еще не агрегированы
   if (weeks.length === 0) {
     showMessage('No weeks available yet. Data will appear after aggregation completes.');
   }
   ```

3. **Использовать `start_date` для UI:**
   ```typescript
   // ✅ DO: Использовать start_date для отображения в календаре/селекторе
   weeks.forEach(week => {
     displayWeek({
      label: `Week ${week.week} (${week.start_date})`,
      value: week.week,
      startDate: week.start_date, // YYYY-MM-DD
    });
   });
   ```

4. **Обновлять список после импорта:**
   ```typescript
   // ✅ DO: Обновлять список после завершения импорта и агрегации
   onImportComplete(() => {
     refreshAvailableWeeks();
   });
   ```

#### ❌ DON'T (Не рекомендуется)

1. **Не делать множественные запросы для проверки доступности:**
   ```typescript
   // ❌ DON'T: Не нужно проверять каждую неделю через finance-summary
   // После Story 2.7: если неделя в списке → данные доступны
   for (const week of allPossibleWeeks) {
     try {
       await getFinanceSummary(week); // ❌ Неэффективно
     } catch (error) {
       // Пропустить неделю
     }
   }
   ```

2. **Не игнорировать пустой массив:**
   ```typescript
   // ❌ DON'T: Не показывать ошибку при пустом массиве
   if (weeks.length === 0) {
     showError('Failed to load weeks'); // ❌ Это нормальное состояние
   }
   ```

3. **Не использовать старые workaround'ы:**
   ```typescript
   // ❌ DON'T: Удалить старые workaround'ы (если были)
   // Старый код для обхода проблемы больше не нужен
   ```

### 📊 Пример полной реализации

```typescript
// ✅ ПОЛНАЯ РЕАЛИЗАЦИЯ с учетом Story 2.7
class WeeklyAnalyticsService {
  private apiClient: ApiClient;
  private cabinetId: string;
  private token: string;

  /**
   * Получить список доступных недель
   * Story 2.7: Гарантирует, что все недели в списке имеют доступные данные
   */
  async getAvailableWeeks(): Promise<WeekData[]> {
    try {
      const response = await this.apiClient.get(
        '/v1/analytics/weekly/available-weeks',
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'X-Cabinet-Id': this.cabinetId,
          },
        }
      );

      // Story 2.7: Пустой массив = нет агрегированных данных (нормально)
      if (!response.data || response.data.length === 0) {
        return [];
      }

      // Преобразуем в формат для UI
      return response.data.map(item => ({
        week: item.week, // "2025-W45"
        startDate: item.start_date, // "2025-11-03"
        label: `Week ${item.week} (${this.formatDate(item.start_date)})`,
      }));
    } catch (error) {
      console.error('Failed to fetch available weeks:', error);
      throw error;
    }
  }

  /**
   * Получить финансовую сводку за неделю
   * Story 2.7: Гарантирует, что если неделя в available-weeks, данные доступны
   */
  async getFinanceSummary(week: string): Promise<FinanceSummary> {
    // Предварительная проверка (опционально, но рекомендуется)
    const availableWeeks = await this.getAvailableWeeks();
    const weekExists = availableWeeks.some(w => w.week === week);

    if (!weekExists) {
      throw new Error(
        `Week ${week} is not available. ` +
        `Please select from available weeks: ${availableWeeks.map(w => w.week).join(', ')}`
      );
    }

    // Story 2.7: Гарантия - данные доступны (не будет 404)
    const response = await this.apiClient.get(
      `/v1/analytics/weekly/finance-summary?week=${week}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'X-Cabinet-Id': this.cabinetId,
        },
      }
    );

    return response;
  }

  /**
   * Обновить список недель после импорта
   */
  async refreshAfterImport(importId: string): Promise<WeekData[]> {
    // Ждем завершения агрегации (можно использовать WebSocket)
    await this.waitForAggregation(importId);

    // Обновляем список (новая неделя появится только после агрегации)
    return this.getAvailableWeeks();
  }

  private async waitForAggregation(importId: string): Promise<void> {
    // Реализация ожидания агрегации (WebSocket или polling)
    // ...
  }

  private formatDate(dateString: string): string {
    // Форматирование даты для UI
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}
```

### 🔍 Отладка и мониторинг

#### Логирование для отладки

```typescript
// ✅ Рекомендуется: Логировать важные события
async function getAvailableWeeksWithLogging() {
  const startTime = Date.now();
  
  try {
    const weeks = await getAvailableWeeks();
    
    console.log('Available weeks fetched:', {
      count: weeks.length,
      weeks: weeks.map(w => w.week),
      duration: Date.now() - startTime,
    });
    
    return weeks;
  } catch (error) {
    console.error('Failed to fetch available weeks:', {
      error: error.message,
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
```

#### Проверка консистентности данных

```typescript
// ✅ Опционально: Проверка консистентности (для отладки)
async function verifyDataConsistency() {
  const availableWeeks = await getAvailableWeeks();
  
  // Проверяем, что все недели из списка имеют доступные данные
  const results = await Promise.allSettled(
    availableWeeks.map(async (week) => {
      try {
        await getFinanceSummary(week.week);
        return { week: week.week, status: 'ok' };
      } catch (error) {
        // После Story 2.7: это НЕ должно происходить
        return { week: week.week, status: 'error', error: error.message };
      }
    })
  );
  
  const errors = results.filter(r => r.status === 'rejected' || r.value.status === 'error');
  if (errors.length > 0) {
    console.error('Data consistency check failed:', errors);
    // Отправить в систему мониторинга
  }
  
  return results;
}
```

### 📋 Чеклист для Frontend разработчика

- [ ] Использовать endpoint `/v1/analytics/weekly/available-weeks` для получения списка недель
- [ ] Обрабатывать пустой массив `{ data: [] }` как нормальное состояние (нет агрегированных данных)
- [ ] Использовать недели только из списка `available-weeks` для запросов `finance-summary`
- [ ] Удалить старые workaround'ы (если были)
- [ ] Использовать поле `start_date` для отображения в UI (календарь, селектор)
- [ ] Обновлять список недель после завершения импорта и агрегации
- [ ] Логировать ошибки 404 для недель из списка (не должно происходить после Story 2.7)
- [ ] Показывать понятное сообщение пользователю при пустом списке недель

### 🎉 Преимущества после Story 2.7

1. **Надежность:** Гарантия доступности данных для всех недель в списке
2. **Простота:** Не нужно обрабатывать race condition
3. **Производительность:** Один запрос вместо множественных проверок
4. **UX:** Пользователи видят только доступные недели
5. **Консистентность:** Единый источник данных с `finance-summary`

---

**Последнее обновление:** 2025-11-22  
**Статус:** ✅ Реализовано и готово к использованию

