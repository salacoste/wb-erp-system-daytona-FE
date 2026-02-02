# BUG-002: FBS Order Prices Stored in Kopecks Without Conversion

**Дата обнаружения**: 2026-02-01
**Дата исправления**: 2026-02-01
**Severity**: CRITICAL
**Status**: ✅ FIXED
**Component**: `orders-sync.service.ts`

---

## Описание проблемы

FBS заказы синхронизируются из WB API с ценами **в копейках**, но сохраняются в БД **без деления на 100**. В результате суммы отображаются в 100 раз больше реальных.

---

## Доказательства

### WB SDK Документация

```typescript
// Из docs/stories/2.5.orders-fbs-retrieval-status.md
interface Order {
  price: number;           // Price with discounts × 100
  convertedPrice: number;  // Price in seller currency × 100
}

// Пример использования из SDK:
console.log(`Price: ${order.price / 100} RUB`);
```

### Текущий код бэкенда

```typescript
// src/orders/services/orders-sync.service.ts:708-709
price: order.price,              // ❌ Сохраняет kopecks как rubles!
salePrice: order.convertedPrice, // ❌ Сохраняет kopecks как rubles!
```

### Результат

| Поле | API значение | Ожидаемое (₽) | Сохранённое |
|------|--------------|---------------|-------------|
| price | 47300 kopecks | 473.00 ₽ | 47300 ₽ |
| salePrice | 320900 kopecks | 3209.00 ₽ | 320900 ₽ |

### Влияние на дашборд (Week 2026-W05)

| Метрика | Отображается | Должно быть |
|---------|--------------|-------------|
| FBS Total Revenue | 964,400 ₽ | **9,644.00 ₽** |
| FBS Avg Order Value | 107,155 ₽/заказ | **1,071.55 ₽/заказ** |
| Total Orders Revenue | 1,265,467 ₽ | **304,711 ₽** |

---

## Рекомендуемое исправление

### Вариант 1: Конвертация при синхронизации (Рекомендуется)

```typescript
// src/orders/services/orders-sync.service.ts
const created = await tx.orderFbs.create({
  data: {
    // ...
    price: order.price / 100,              // ✅ Конвертация kopecks → rubles
    salePrice: order.convertedPrice / 100, // ✅ Конвертация kopecks → rubles
    // ...
  },
});
```

### Вариант 2: Конвертация при чтении (API layer)

```typescript
// src/orders/services/orders-query.service.ts
return {
  // ...
  price: Number(order.price) / 100,
  salePrice: Number(order.salePrice) / 100,
  // ...
};
```

---

## Миграция данных

После исправления потребуется миграция существующих данных:

```sql
-- Миграция существующих FBS заказов
UPDATE orders_fbs
SET price = price / 100,
    sale_price = sale_price / 100
WHERE price > 10000;  -- Только записи с копеечными значениями
```

---

## Сравнение с FBO заказами

FBO заказы (`orders_fbo` таблица) приходят из другого API (`/api/v1/supplier/orders`) и **уже в рублях**:

```json
{
  "totalPrice": 5937,      // 5,937 ₽ - разумная цена
  "finishedPrice": 5937,
  "priceWithDisc": 5937
}
```

Поэтому FBO суммы корректны, а FBS - нет.

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/orders/services/orders-sync.service.ts` | Деление на 100 при upsert |
| `src/orders/services/orders-query.service.ts` | (Опционально) Деление на 100 при чтении |
| Миграция SQL | Конвертация существующих данных |

---

## Приоритет

**CRITICAL** - Искажает финансовые метрики на дашборде

---

**Подготовлено**: Claude Code
**Дата**: 2026-02-01
