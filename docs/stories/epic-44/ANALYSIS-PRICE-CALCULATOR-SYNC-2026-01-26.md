# Анализ: Price Calculator - Синхронизация с Backend

**Дата**: 2026-01-26
**Epic**: 44-FE (Price Calculator UI)
**Статус**: 🔍 АНАЛИЗ

---

## 📊 Ключевые открытия из обновленной документации Backend

### 1. SUPPLY System возвращает РЕАЛЬНЫЕ тарифы хранения!

**Из документации бэкенда** (реальный тест 2026-01-27):

```json
{
  "warehouseId": 130744,
  "warehouseName": "Краснодар (Тихорецкая)",
  "boxTypeId": 5,
  "boxTypeName": "Pallets",
  "delivery": {
    "coefficient": 1.65,
    "baseLiterRub": 75,
    "additionalLiterRub": 23
  },
  "storage": {
    "coefficient": 1.65,
    "baseLiterRub": 41.25,      ← НЕ 0!
    "additionalLiterRub": 0      ← Для Pallets = 0
  }
}
```

**Что мы видели в консоли фронтенда:**

```
storage: {
  baseLiterRub: 0        ← Приходит 0!
  additionalLiterRub: 0
  coefficient: 1.65
}
```

**Вывод**: Либо бэкенд был обновлен после нашего теста, либо мы смотрели на другой `boxTypeId`.

---

### 2. Box Types - КРИТИЧЕСКИ ВАЖНО!

| boxTypeId | Название              | Особенности storage                             |
| --------- | --------------------- | ----------------------------------------------- |
| **2**     | Boxes (Коробки)       | Обычный расчет                                  |
| **5**     | Pallets (Монопаллеты) | `additionalLiterRub = 0` (фиксированная ставка) |
| **6**     | Supersafe (Суперсейф) | Обычный расчет                                  |

**⚠️ ПРОБЛЕМА**: Мы фильтруем по `boxTypeId: 2` (Boxes), но для Pallets формула хранения отличается!

---

### 3. Формулы расчета (ОБНОВЛЕННЫЕ)

**Логистика:**

```typescript
logistics = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × deliveryCoef
```

**Хранение (ежедневно):**

```typescript
dailyStorage = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × storageCoef
```

**Хранение (итого):**

```typescript
storage = dailyStorage × days
```

**Пример для Pallets (1 литр, 30 дней):**

- Логистика: `(75 + 0 × 23) × 1.65 = 123.75 ₽`
- Хранение/день: `(41.25 + 0 × 0) × 1.65 = 68.06 ₽`
- Хранение (30 дней): `68.06 × 30 = 2041.80 ₽`
- **ИТОГО: 2165.55 ₽**

---

### 4. Warehouse ID Mapping

| Warehouse Name         | INVENTORY ID | SUPPLY ID |
| ---------------------- | ------------ | --------- |
| Краснодар              | 507          | 130744    |
| Краснодар (Тихорецкая) | -            | 130744    |
| Коледино               | 117686       | 117686    |
| Электросталь           | 117825       | 117825    |

**✅ УЖЕ ИСПРАВЛЕНО**: Мы перешли на SUPPLY warehouses.

---

## 🔴 Найденные несоответствия Frontend vs Backend

### 1. Storage тарифы = 0 (КРИТИЧНО)

**Симптом**: UI показывает "0.00 ₽/день" для хранения
**Причина**: Backend API возвращает `storage.baseLiterRub: 0` для некоторых записей
**Наш текущий fix**: Fallback на DEFAULT_TARIFFS (0.07/0.05)
**Правильное решение**: Проверить почему backend возвращает 0, использовать реальные значения (41.25)

### 2. Box Type не учитывается в UI

**Симптом**: Нет выбора типа упаковки (Коробки/Паллеты)
**Влияние**: Для Pallets `additionalLiterRub = 0` - формула хранения отличается
**Решение**: Добавить выбор boxType или отображать информацию о типе

### 3. Формула хранения может быть неверной

**Текущая формула (storage-cost-utils.ts)**:

```typescript
baseCost = basePerDayRub + additionalLiters * perLiterPerDayRub
return baseCost * coefficient
```

**Правильная формула (из backend docs)**:

```typescript
dailyStorage = (baseLiterRub + max(0, volume-1) × additionalLiterRub) × storageCoef
```

**Разница**: `max(0, volume-1)` vs `additionalLiters = volume - 1`

- Наша формула правильная, но нужно проверить edge cases

### 4. Коэффициент приёмки не используется в расчетах

**Backend возвращает**: `coefficient: 1` (коэффициент приёмки)
**Использование**: `-1` = недоступно, `0` = бесплатно, `≥1` = множитель
**Текущий статус**: Показываем в UI, но не используем в формулах

---

## 📋 План работ

### Фаза 1: Диагностика (сегодня)

- [ ] Проверить что реально возвращает backend API для storage
- [ ] Сравнить наши формулы с документацией
- [ ] Проверить boxTypeId фильтрацию

### Фаза 2: Исправления (Priority P1)

- [ ] **Fix Storage = 0**: Выяснить причину, исправить
- [ ] **Verify Formulas**: Сравнить `storage-cost-utils.ts` с backend формулами
- [ ] **Box Type Handling**: Добавить поддержку boxTypeId: 5 (Pallets)

### Фаза 3: Улучшения (Priority P2)

- [ ] Добавить выбор Box Type в UI (если требуется)
- [ ] Показать коэффициент приёмки в UI
- [ ] Обновить формулы для Pallets (additionalLiterRub = 0)

---

## 🔍 Следующие шаги

1. **Запросить у backend**: Почему storage.baseLiterRub = 0 для некоторых записей?
2. **Проверить boxTypeId**: Какой boxTypeId возвращается для Краснодар (Тихорецкая)?
3. **Валидировать формулы**: Сравнить с реальными данными из backend

---

**Автор**: Frontend Team
**Ревьювер**: Backend Team (для подтверждения)
