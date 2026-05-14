# 161 — Планирование поставок и расчёт себестоимости с учётом доставки (Epic 79)

> **Статус**: Backend полностью реализован (10/10 stories, 23 эндпоинта, 229 тестов)
> **Swagger UI**: `http://localhost:3000/api` → раздел `shipment-cost`
> **HTTP-примеры**: [`test-api/35-shipment-cost.http`](../../../test-api/35-shipment-cost.http)

---

## Содержание

1. [Бизнес-контекст](#1-бизнес-контекст)
2. [Сущности и модель данных](#2-сущности-и-модель-данных)
3. [Рабочий процесс (Workflow)](#3-рабочий-процесс-workflow)
4. [API: Типы коробок](#4-api-типы-коробок)
5. [API: Упаковка SKU](#5-api-упаковка-sku)
6. [API: Поставки](#6-api-поставки)
7. [Расчёт стоимости (Calculate)](#7-расчёт-стоимости-calculate)
8. [Подтверждение и пересчёт](#8-подтверждение-и-пересчёт)
9. [Обработка ошибок валидации](#9-обработка-ошибок-валидации)
10. [Ограничения по статусу (DRAFT vs CONFIRMED)](#10-ограничения-по-статусу)
11. [Работа с Decimal-полями](#11-работа-с-decimal-полями)
12. [Рекомендации для UI](#12-рекомендации-для-ui)
13. [Ссылки на документацию](#13-ссылки-на-документацию)

---


## 1. Бизнес-контекст

### Зачем это нужно

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-03-13
**Summary**: Epic 79 (Shipment Cost Allocation) fully implemented with 23 endpoints and 229 tests. Complete workflow: box type management, SKU packaging, shipment creation with multi-box support, cost calculation (PCU + DCU = FCU), confirmation, and recalculation. All decimal fields handled correctly.
**Remaining frontend action**: Build shipment cost UI if needed. See also Request #162 for FCU aggregation endpoint.
При отправке товаров на склад Wildberries продавец несёт расходы на доставку (транспорт, палетизация). Эти расходы нужно **аллоцировать** на каждую единицу товара, чтобы получить **полную себестоимость** с учётом логистики.

**FCU (Final Cost per Unit)** — итоговая себестоимость единицы товара:

```
FCU = PCU + DCU
```

| Обозначение | Расшифровка | Источник |
|-------------|-------------|----------|
| **PCU** | Production Cost per Unit — себестоимость производства | Из таблицы COGS (справочник себестоимости) |
| **DCU** | Delivery Cost per Unit — стоимость доставки на единицу | Рассчитывается системой |
| **ABDC** | Allocated Box Delivery Cost — аллоцированная стоимость доставки на коробку | `PDC × (BTV / PTV)` |
| **BTV** | Box Total Volume — общий объём коробок в строке | `boxVolume × boxCount` |
| **PTV** | Pallet Total Volume — суммарный объём всех коробок на паллете | `Σ BTV` всех строк |
| **PDC** | Pallet Delivery Cost — стоимость доставки паллета | Зависит от режима доставки |

### Два режима доставки

| Режим | Enum | Формула PDC | Когда использовать |
|-------|------|-------------|-------------------|
| **Фиксированная стоимость авто** | `FIXED_VEHICLE` | `PDC = TDC / P` (общая стоимость / кол-во палет) | Фура с фиксированной ценой |
| **Ставка за паллет** | `PER_PALLET` | `PDC = PR` (ставка за паллет напрямую) | Сборный груз, тариф за палетоместо |

### Формула расчёта (полная цепочка)

```
DCU = ABDC / U                          — стоимость доставки на единицу
ABDC = PDC × (BTV / PTV)                — доля доставки пропорционально объёму
FCU = PCU + DCU                          — итоговая себестоимость
FCL = FCU × totalUnits                   — итоговая стоимость по строке
```

> **Пример**: Коробка 60×40×40 = 96 000 см³, 5 коробок = 480 000 см³ на паллете общим объёмом 768 000 см³. Доставка паллета 25 000 ₽. ABDC = 25000 × (480000/768000) = 15 625 ₽. При 50 единицах: DCU = 312.50 ₽/шт.



## 2. Сущности и модель данных

### Диаграмма связей

```
BoxType (1) ←── (N) SkuPackaging (N) ──→ (1) Product
                        │
                        ▼
Shipment (1) ──→ (N) ShipmentPallet (1) ──→ (N) ShipmentBoxLine
    │                                              │
    │ (on confirm)                                 │ (references)
    ▼                                              ▼
ShipmentCostSnapshot (N) ←─────────────────── BoxType, COGS
```

### Описание сущностей

| Сущность | Таблица | Описание |
|----------|---------|----------|
| **BoxType** | `box_types` | Справочник типов коробок (размеры → объём). Soft-delete через `isActive` |
| **SkuPackaging** | `sku_packaging` | Привязка SKU (nmId) к типу коробки + кол-во единиц в коробке |
| **Shipment** | `shipments` | Поставка: режим доставки, стоимость, статус (DRAFT/CONFIRMED) |
| **ShipmentPallet** | `shipment_pallets` | Паллет в поставке, автонумерация (`palletNumber`) |
| **ShipmentBoxLine** | `shipment_box_lines` | Строка коробки: SKU + кол-во коробок + кол-во единиц |
| **ShipmentCostSnapshot** | `shipment_cost_snapshots` | Замороженный снимок себестоимости (создаётся при confirm, неизменяем) |

### Ключевые поля ShipmentBoxLine (после расчёта)

| Поле | Тип | Описание |
|------|-----|----------|
| `nmId` | `number` | Артикул WB (ссылка на products) |
| `boxCount` | `number` | Количество коробок данного SKU |
| `totalUnits` | `number` | Общее кол-во единиц (по умолчанию = boxCount × unitsPerBox) |
| `unitCostRub` | `string` (Decimal) | PCU — себестоимость единицы из COGS |
| `boxVolume` | `string` (Decimal) | Объём одной коробки (из BoxType.volumeCm3) |
| `totalVolume` | `string` (Decimal) | BTV = boxVolume × boxCount |
| `volumeShare` | `string` (Decimal) | Доля объёма на паллете (BTV / PTV) |
| `allocatedDeliveryCost` | `string` (Decimal) | ABDC — аллоцированная стоимость доставки |
| `deliveryCostPerUnit` | `string` (Decimal) | DCU = ABDC / totalUnits |
| `finalCostPerUnit` | `string` (Decimal) | FCU = PCU + DCU |
| `finalCostLine` | `string` (Decimal) | FCL = FCU × totalUnits |

> **Важно**: До вызова `/calculate` все расчётные поля (`unitCostRub`, `boxVolume`, ..., `finalCostLine`) равны `null`.

### Перечисления (Enums)

**`DeliveryMode`**:
- `"FIXED_VEHICLE"` — фиксированная стоимость за весь транспорт
- `"PER_PALLET"` — ставка за палетоместо

**`ShipmentStatus`**:
- `"DRAFT"` — черновик, можно редактировать
- `"CONFIRMED"` — подтверждено, снепшоты созданы, изменения запрещены



## 3. Рабочий процесс (Workflow)

### Диаграмма состояний поставки

```
┌──────────┐     calculate     ┌──────────────┐     confirm     ┌─────────────┐
│  DRAFT   │ ──────────────→   │ DRAFT (calc) │ ─────────────→  │  CONFIRMED  │
│          │ ←── edit/delete   │              │                  │             │
│ Создание │     add/remove    │  Результат   │                  │  Снепшоты   │
│ палет,   │     pallets,      │  расчёта     │                  │  созданы    │
│ строк    │     box-lines     │  сохранён    │                  │             │
└──────────┘                   └──────────────┘                  └──────┬──────┘
                                                                        │
                                                                  recalculate
                                                                  (admin only)
                                                                        │
                                                                        ▼
                                                                 ┌─────────────┐
                                                                 │  CONFIRMED  │
                                                                 │  (updated)  │
                                                                 └─────────────┘
```

### Пошаговый процесс

| Шаг | Действие | Endpoint | Комментарий |
|-----|----------|----------|-------------|
| **0a** | Создать типы коробок | `POST /v1/box-types` | Одноразовая настройка. Размеры в см |
| **0b** | Настроить упаковку SKU | `POST /v1/sku-packaging` или `/bulk` | Одноразово: какой SKU в какую коробку, сколько штук |
| **1** | Создать поставку | `POST /v1/shipments` | Выбрать режим: FIXED_VEHICLE или PER_PALLET |
| **2** | Добавить паллеты | `POST /v1/shipments/:id/pallets` | Повторить N раз (без тела запроса) |
| **3** | Добавить строки коробок | `POST .../pallets/:palletId/box-lines` | Для каждого SKU на каждом паллете |
| **4** | Рассчитать (превью) | `POST /v1/shipments/:id/calculate` | Проверяет валидность → считает FCU. Можно вызывать повторно |
| **5** | Исправить ошибки | Редактирование строк/паллетов | Если calculate вернул ошибки валидации |
| **6** | Подтвердить | `POST /v1/shipments/:id/confirm` | Замораживает стоимость. Статус → CONFIRMED |
| **7** | Пересчитать (опц.) | `POST /v1/shipments/:id/recalculate` | Только Manager/Owner/Admin. Пересоздаёт снепшоты |

### Важные правила

1. **XOR валидация при создании**: для `FIXED_VEHICLE` обязателен `totalDeliveryCost`, для `PER_PALLET` — `palletRate`. Нельзя указать оба.
2. **Calculate можно вызывать многократно** — каждый вызов обновляет расчётные поля в box lines.
3. **Confirm вызывает calculate внутри** — не нужно предварительно вызывать calculate.
4. **После CONFIRMED** — все мутации заблокированы (409), кроме `recalculate`.
5. **totalUnits по умолчанию** = `boxCount × unitsPerBox` (из sku_packaging). Можно переопределить явно (для неполных коробок).



## 4. API: Типы коробок

> **Base path**: `/v1/box-types`
> **Авторизация**: `Authorization: Bearer <token>`, `X-Cabinet-Id: <uuid>`

### 4.1. Создать тип коробки

```
POST /v1/box-types
```

**Тело запроса:**

```json
{
  "name": "Стандартная 60×40×40",
  "lengthCm": 60,
  "widthCm": 40,
  "heightCm": 40
}
```

| Поле | Тип | Обязательное | Валидация |
|------|-----|:---:|-----------|
| `name` | `string` | Да | Уникальное в рамках кабинета |
| `lengthCm` | `number` | Да | > 0 |
| `widthCm` | `number` | Да | > 0 |
| `heightCm` | `number` | Да | > 0 |

**Ответ 201:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "cabinetId": "cab-uuid",
  "name": "Стандартная 60×40×40",
  "lengthCm": "60.00",
  "widthCm": "40.00",
  "heightCm": "40.00",
  "volumeCm3": "96000.0000",
  "isActive": true,
  "createdAt": "2026-03-09T10:00:00.000Z",
  "updatedAt": "2026-03-09T10:00:00.000Z"
}
```

**Ошибки:** `400` — валидация полей, `409` — имя уже существует

### 4.2. Получить список типов коробок

```
GET /v1/box-types?includeInactive=false
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|:---:|-----------|
| `includeInactive` | `boolean` | `false` | Включить деактивированные типы |

**Ответ 200:** `BoxTypeResponseDto[]`

### 4.3. Получить тип коробки по ID

```
GET /v1/box-types/:id
```

**Ответ 200:** `BoxTypeResponseDto` | **404** — не найден

### 4.4. Обновить тип коробки

```
PUT /v1/box-types/:id
```

**Тело запроса** (все поля опциональные):

```json
{
  "name": "Обновлённое название",
  "lengthCm": 50,
  "widthCm": 35,
  "heightCm": 35
}
```

**Ответ 200:** обновлённый `BoxTypeResponseDto`
**Ошибки:** `400`, `404`, `409` (конфликт имени или изменение размеров при наличии привязок)

### 4.5. Удалить (деактивировать) тип коробки

```
DELETE /v1/box-types/:id
```

**Ответ 200:** `BoxTypeResponseDto` с `isActive: false`
**Ошибки:** `404`, `409` — есть привязки в `sku_packaging` или `shipment_box_lines`

> **Soft-delete**: тип коробки не удаляется физически, а деактивируется. Деактивированный тип нельзя использовать для новых привязок.

---

## 5. API: Упаковка SKU

> **Base path**: `/v1/sku-packaging`
> **Авторизация**: `Authorization: Bearer <token>`, `X-Cabinet-Id: <uuid>`

### 5.1. Создать привязку упаковки

```
POST /v1/sku-packaging
```

**Тело запроса:**

```json
{
  "nmId": 123456789,
  "boxTypeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "unitsPerBox": 10
}
```

| Поле | Тип | Обязательное | Валидация |
|------|-----|:---:|-----------|
| `nmId` | `number` | Да | Должен существовать в таблице `products` |
| `boxTypeId` | `uuid` | Да | Должен быть активным (`isActive = true`) |
| `unitsPerBox` | `number` | Да | Целое число > 0 |

**Ответ 201:**

```json
{
  "nmId": 123456789,
  "cabinetId": "cab-uuid",
  "boxTypeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "unitsPerBox": 10,
  "boxType": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Стандартная 60×40×40",
    "lengthCm": "60.00",
    "widthCm": "40.00",
    "heightCm": "40.00",
    "volumeCm3": "96000.0000",
    "isActive": true
  },
  "product": {
    "nmId": 123456789,
    "vendorCode": "ART-001",
    "brand": "MyBrand",
    "subject": "Футболки"
  },
  "createdAt": "2026-03-09T10:00:00.000Z",
  "updatedAt": "2026-03-09T10:00:00.000Z"
}
```

**Ошибки:** `400`, `404` (товар не найден), `409` (привязка уже существует или boxType неактивен)

### 5.2. Массовое создание/обновление

```
POST /v1/sku-packaging/bulk
```

**Тело запроса:**

```json
{
  "items": [
    { "nmId": 123456789, "boxTypeId": "uuid-1", "unitsPerBox": 10 },
    { "nmId": 987654321, "boxTypeId": "uuid-2", "unitsPerBox": 5 },
    { "nmId": 111222333, "boxTypeId": "uuid-invalid", "unitsPerBox": 8 }
  ]
}
```

**Ответ 201** (частичный успех):

```json
{
  "created": 1,
  "updated": 1,
  "errors": [
    { "nmId": 111222333, "error": "Box type not found or inactive" }
  ]
}
```

> **Важно**: Невалидные записи пропускаются, валидные обрабатываются. Ответ всегда 201.

### 5.3. Получить список привязок

```
GET /v1/sku-packaging?nmId=123456789&boxTypeId=uuid
```

| Параметр | Тип | Описание |
|----------|-----|----------|
| `nmId` | `number` | Фильтр по артикулу (опционально) |
| `boxTypeId` | `uuid` | Фильтр по типу коробки (опционально) |

**Ответ 200:** `SkuPackagingResponseDto[]`

### 5.4. Получить привязку по nmId

```
GET /v1/sku-packaging/:nmId
```

**Ответ 200:** `SkuPackagingResponseDto` | **400** (нечисловой nmId) | **404**

### 5.5. Удалить привязку

```
DELETE /v1/sku-packaging/:nmId
```

**Ответ 204** (без тела) | **400** | **404** | **409** (JSON-тело с сообщением — есть ссылки в `shipment_box_lines`)



## 6. API: Поставки

> **Base path**: `/v1/shipments`
> **Авторизация**: `Authorization: Bearer <token>`, `X-Cabinet-Id: <uuid>`

### 6.1. Создать поставку

```
POST /v1/shipments
```

**Тело запроса (режим FIXED_VEHICLE):**

```json
{
  "name": "Мартовская поставка №1",
  "deliveryMode": "FIXED_VEHICLE",
  "totalDeliveryCost": 50000,
  "createdBy": "user@example.com",
  "supplyId": "00000000-0000-0000-0000-000000000001"
}
```

**Тело запроса (режим PER_PALLET):**

```json
{
  "name": "Сборная поставка",
  "deliveryMode": "PER_PALLET",
  "palletRate": 12500,
  "createdBy": "user@example.com"
}
```

| Поле | Тип | Обязательное | Валидация |
|------|-----|:---:|-----------|
| `name` | `string` | Нет | Произвольное название |
| `deliveryMode` | `enum` | Да | `"FIXED_VEHICLE"` или `"PER_PALLET"` |
| `totalDeliveryCost` | `number` | XOR | Обязательно для FIXED_VEHICLE, запрещено для PER_PALLET |
| `palletRate` | `number` | XOR | Обязательно для PER_PALLET, запрещено для FIXED_VEHICLE |
| `createdBy` | `string` | Да | Email создателя (не fallback из JWT — обязательное поле в DTO) |
| `supplyId` | `uuid` | Нет | Метаданные: ссылка на поставку WB. Не влияет на расчёт — только для UI-связки |

> **XOR-валидация**: Нельзя указать оба поля `totalDeliveryCost` и `palletRate` одновременно. Нельзя указать не то поле для выбранного режима.

**Ответ 201:**

```json
{
  "id": "ship-uuid",
  "cabinetId": "cab-uuid",
  "name": "Мартовская поставка №1",
  "deliveryMode": "FIXED_VEHICLE",
  "totalDeliveryCost": "50000.00",
  "palletRate": null,
  "status": "DRAFT",
  "createdBy": "user@example.com",
  "confirmedBy": null,
  "confirmedAt": null,
  "supplyId": null,
  "createdAt": "2026-03-09T10:00:00.000Z",
  "updatedAt": "2026-03-09T10:00:00.000Z",
  "pallets": []
}
```

**Ошибки:** `400` — валидация полей или XOR-нарушение

### 6.2. Получить список поставок

```
GET /v1/shipments?status=DRAFT&page=1&limit=20
```

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|:---:|-----------|
| `status` | `enum` | — | Фильтр: `DRAFT` или `CONFIRMED` |
| `page` | `number` | `1` | Номер страницы |
| `limit` | `number` | `20` | Элементов на странице |

> **Сортировка**: `createdAt DESC` (hardcoded). Параметры `sortBy`/`sortOrder` не реализованы в бэкенде.

**Ответ 200:**

```json
{
  "data": [ /* ShipmentResponseDto[] */ ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### 6.3. Получить поставку по ID (полная вложенность)

```
GET /v1/shipments/:id
```

**Ответ 200** — полный объект с вложенными палетами, строками и типами коробок:

```json
{
  "id": "ship-uuid",
  "cabinetId": "cab-uuid",
  "name": "Мартовская поставка №1",
  "deliveryMode": "FIXED_VEHICLE",
  "totalDeliveryCost": "50000.00",
  "palletRate": null,
  "status": "DRAFT",
  "createdBy": "user@example.com",
  "confirmedBy": null,
  "confirmedAt": null,
  "supplyId": null,
  "createdAt": "2026-03-09T10:00:00.000Z",
  "updatedAt": "2026-03-09T10:00:00.000Z",
  "pallets": [
    {
      "id": "pallet-uuid",
      "palletNumber": 1,
      "shipmentId": "ship-uuid",
      "boxLines": [
        {
          "id": "line-uuid",
          "palletId": "pallet-uuid",
          "nmId": 123456789,
          "boxCount": 5,
          "totalUnits": 50,
          "unitCostRub": null,
          "boxVolume": null,
          "totalVolume": null,
          "volumeShare": null,
          "allocatedDeliveryCost": null,
          "deliveryCostPerUnit": null,
          "finalCostPerUnit": null,
          "finalCostLine": null,
          "boxType": {
            "id": "bt-uuid",
            "name": "Стандартная 60×40×40",
            "lengthCm": "60.00",
            "widthCm": "40.00",
            "heightCm": "40.00",
            "volumeCm3": "96000.0000",
            "isActive": true
          }
        }
      ]
    }
  ]
}
```

> **Обратите внимание**: все расчётные поля box line = `null` до вызова `/calculate`. После расчёта — заполнены строками (Decimal).

> **Получение строк коробок**: Отдельного `GET .../box-lines` с пагинацией нет. Строки всегда вложены в `GET /v1/shipments/:id` (через `pallets[].boxLines[]`). При большом кол-ве строк загружается весь граф.

**Ошибки:** `404`

### 6.4. Обновить поставку (только DRAFT)

```
PUT /v1/shipments/:id
```

**Тело запроса** (все поля опциональные):

```json
{
  "name": "Новое название",
  "deliveryMode": "PER_PALLET",
  "palletRate": 15000
}
```

> При смене `deliveryMode` нужно также обновить соответствующее поле стоимости.

**Ответ 200:** обновлённый `ShipmentResponseDto`
**Ошибки:** `404`, `409` (поставка не в статусе DRAFT)

### 6.5. Удалить поставку (только DRAFT)

```
DELETE /v1/shipments/:id
```

**Ответ 204** (без тела) | **404** | **409** (не DRAFT)

### 6.6. Добавить паллет

```
POST /v1/shipments/:id/pallets
```

> Тело запроса не требуется. Номер паллета присваивается автоматически.

**Ответ 201:**

```json
{
  "id": "pallet-uuid",
  "palletNumber": 1,
  "shipmentId": "ship-uuid",
  "boxLines": []
}
```

**Ошибки:** `404`, `409` (не DRAFT)

### 6.7. Удалить паллет

```
DELETE /v1/shipments/:id/pallets/:palletId
```

> Удаляет паллет вместе со всеми его строками коробок (каскадное удаление).

**Ответ 204** | **404** | **409** (не DRAFT)

### 6.8. Добавить строку коробки в паллет

```
POST /v1/shipments/:id/pallets/:palletId/box-lines
```

**Тело запроса:**

```json
{
  "nmId": 123456789,
  "boxCount": 5,
  "totalUnits": 25
}
```

| Поле | Тип | Обязательное | Валидация |
|------|-----|:---:|-----------|
| `nmId` | `number` | Да | Артикул WB |
| `boxCount` | `number` | Да | Целое число > 0 |
| `totalUnits` | `number` | Нет | По умолчанию = boxCount × unitsPerBox. Для неполных коробок можно указать вручную |

**Ответ 201:** `BoxLineResponseDto` с вложенным `boxType`, расчётные поля = `null`

**Ошибки:** `404` (поставка или паллет не найден), `409` (не DRAFT)

### 6.9. Обновить строку коробки

```
PUT /v1/shipments/:id/box-lines/:boxLineId
```

**Тело запроса** (все поля опциональные):

```json
{
  "boxCount": 10,
  "totalUnits": 100
}
```

**Ответ 200:** обновлённый `BoxLineResponseDto`
**Ошибки:** `404`, `409` (не DRAFT)

### 6.10. Удалить строку коробки

```
DELETE /v1/shipments/:id/box-lines/:boxLineId
```

**Ответ 204** | **404** | **409** (не DRAFT)

> **Примечание**: Отдельного `GET /box-lines` эндпоинта нет. Строки коробок всегда вложены в ответ `GET /v1/shipments/:id` → `pallets[].boxLines[]`. Для получения актуального состояния строк — перезапрашивайте поставку целиком.

## 7. Расчёт стоимости (Calculate)

### 7.1. Предварительный расчёт (DRAFT only)

```
POST /v1/shipments/:id/calculate
```

> Тело запроса не требуется.

Выполняет 9 проверок валидации (см. [раздел 9](#9-обработка-ошибок-валидации)). При успехе — рассчитывает FCU для каждой строки коробки и сохраняет результат.

**Ответ 201** (NestJS POST default — нет `@HttpCode` override в контроллере):

```json
{
  "shipmentId": "ship-uuid",
  "deliveryMode": "FIXED_VEHICLE",
  "totalDeliveryCost": 50000,
  "palletCount": 2,
  "results": [
    {
      "palletId": "pallet-uuid-1",
      "palletNumber": 1,
      "palletDeliveryCost": 25000,
      "palletTotalVolume": 768000,
      "lines": [
        {
          "boxLineId": "line-uuid-1",
          "nmId": 123456789,
          "boxCount": 5,
          "totalUnits": 50,
          "boxVolume": 96000,
          "totalVolume": 480000,
          "volumeShare": 0.625,
          "unitCostRub": 150.50,
          "allocatedDeliveryCost": 15625,
          "deliveryCostPerUnit": 312.50,
          "finalCostPerUnit": 463.00,
          "finalCostLine": 23150.00
        },
        {
          "boxLineId": "line-uuid-2",
          "nmId": 987654321,
          "boxCount": 3,
          "totalUnits": 30,
          "boxVolume": 96000,
          "totalVolume": 288000,
          "volumeShare": 0.375,
          "unitCostRub": 200.00,
          "allocatedDeliveryCost": 9375,
          "deliveryCostPerUnit": 312.50,
          "finalCostPerUnit": 512.50,
          "finalCostLine": 15375.00
        }
      ]
    }
  ],
  "totalFinalCost": 38525.00,
  "calculatedAt": "2026-03-09T12:00:00.000Z"
}
```

> **Важно**: Ответ `/calculate` возвращает поля как `number` (не строки). Это единственный эндпоинт с числовыми значениями вместо Decimal-строк.

**Ошибки:**
- `400` — ошибки валидации (см. [раздел 9](#9-обработка-ошибок-валидации))
- `403` — нет доступа
- `404` — поставка не найдена
- `409` — поставка не в статусе DRAFT

### 7.2. Что происходит при расчёте

1. **Загрузка данных**: Получение COGS (себестоимость) и SkuPackaging (упаковка) для всех SKU
2. **Валидация**: 9 проверок одновременно (collect-all — все ошибки сразу)
3. **Расчёт PDC**: По формуле в зависимости от `deliveryMode`
4. **Аллокация объёма**: Для каждого паллета — пропорционально BTV/PTV
5. **Расчёт FCU**: PCU + DCU для каждой строки
6. **Коррекция округления**: Двухуровневая — на уровне паллета и строки (копейки добавляются к строке с наибольшим объёмом)
7. **Сохранение**: Расчётные поля записываются в box lines (видны через `GET /shipments/:id`)

---

## 8. Подтверждение и пересчёт

### 8.1. Подтвердить поставку

```
POST /v1/shipments/:id/confirm
```

**Тело запроса** (опционально):

```json
{
  "confirmedBy": "admin@company.com"
}
```

> Если `confirmedBy` не указан — берётся из JWT токена автоматически.

**Что происходит:**
1. Проверка статуса DRAFT
2. Автоматический вызов calculate (пересчёт с актуальными COGS)
3. Создание неизменяемых снепшотов (`shipment_cost_snapshots`) для каждой строки
4. Смена статуса на CONFIRMED

**Ответ 200:**

```json
{
  "shipmentId": "ship-uuid",
  "status": "CONFIRMED",
  "confirmedAt": "2026-03-09T14:00:00.000Z",
  "confirmedBy": "admin@company.com",
  "snapshotCount": 5,
  "totalFinalCost": 38525.00
}
```

**Ошибки:**
- `400` — ошибки валидации (те же 9 проверок, что и в calculate)
- `404` — поставка не найдена
- `409` — уже подтверждена

> **Примечание о снепшотах**: Таблица `shipment_cost_snapshots` создаётся автоматически при confirm. Отдельного `GET` endpoint для чтения снепшотов **нет** — данные снепшотов (FCU, DCU, COGS на момент подтверждения) зафиксированы в расчётных полях box lines и доступны через `GET /v1/shipments/:id`. Для отображения `confirmedAt`, `confirmedBy`, `snapshotCount` используйте ответ `/confirm` или поля в `ShipmentResponseDto`.

### 8.2. Пересчитать подтверждённую поставку

```
POST /v1/shipments/:id/recalculate
```

> Тело запроса не требуется. **Требует роль**: Manager, Owner или Admin.

**Что происходит:**
1. Проверка статуса CONFIRMED (DRAFT вернёт 400)
2. Пересчёт с актуальными значениями COGS
3. Удаление старых снепшотов
4. Создание новых снепшотов
5. Статус остаётся CONFIRMED

**Ответ 200:**

```json
{
  "shipmentId": "ship-uuid",
  "status": "CONFIRMED",
  "recalculatedAt": "2026-03-10T09:00:00.000Z",
  "snapshotCount": 5,
  "previousSnapshotCount": 5,
  "totalFinalCost": 39100.00
}
```

> Разница `totalFinalCost` между подтверждением и пересчётом обусловлена изменением COGS (себестоимости) между двумя датами.

**Ошибки:**
- `400` — поставка не в статусе CONFIRMED (`SHIPMENT_NOT_CONFIRMED`)
- `403` — недостаточная роль (нужен Manager/Owner/Admin)
- `404` — не найдена

### 8.3. Чтение снепшотов

> **Нет отдельного эндпоинта** для `GET /shipments/:id/snapshots`. Снепшоты (`shipment_cost_snapshots`) — внутренние аудит-записи бэкенда. Фронтенд получает результат расчёта через `GET /v1/shipments/:id` (box lines с заполненными полями) и ответы `/confirm` и `/recalculate` (`totalFinalCost`, `snapshotCount`).



## 9. Обработка ошибок валидации

### Формат ответа при ошибке валидации

При вызове `/calculate` или `/confirm` система выполняет **9 проверок одновременно** (collect-all паттерн). Все найденные ошибки возвращаются в одном ответе:

```json
{
  "statusCode": 400,
  "message": "Shipment validation failed",
  "errorCode": "SHIPMENT_VALIDATION_FAILED",
  "errors": [
    {
      "errorCode": "MISSING_COGS",
      "message": "COGS not found for 2 SKU(s) at the reference date",
      "affectedIds": [123456789, 987654321]
    },
    {
      "errorCode": "EMPTY_PALLET",
      "message": "1 pallet(s) have no box lines",
      "affectedIds": ["b2c3d4e5-f6a7-8901-bcde-f12345678901"]
    }
  ]
}
```

### Таблица кодов ошибок

| Код ошибки | Описание | Что содержит `affectedIds` | Как исправить |
|------------|----------|---------------------------|---------------|
| `MISSING_COGS` | Нет себестоимости для SKU на дату расчёта | `number[]` — список nmId | Задать COGS для этих артикулов (`POST /v1/cogs`) |
| `MISSING_PACKAGING` | Нет конфигурации упаковки для SKU | `number[]` — список nmId | Создать привязку (`POST /v1/sku-packaging`) |
| `INVALID_BOX_VOLUME` | Объём типа коробки ≤ 0 | `string[]` — boxLineId (uuid) | Обновить размеры типа коробки |
| `NO_PALLETS` | В поставке нет ни одного паллета | `[]` (пустой) | Добавить паллеты |
| `EMPTY_PALLET` | Паллет без строк коробок | `string[]` — palletId (uuid) | Добавить строки или удалить пустой паллет |
| `NEGATIVE_DELIVERY_COST` | Стоимость доставки < 0 | `[]` (пустой) | Обновить `totalDeliveryCost` или `palletRate` |
| `ZERO_UNITS` | totalUnits ≤ 0 в строке | `string[]` — boxLineId (uuid) | Обновить строку: задать `totalUnits > 0` |
| `ZERO_BOXES` | boxCount ≤ 0 в строке | `string[]` — boxLineId (uuid) | Обновить строку: задать `boxCount > 0` |
| `ZERO_PALLET_VOLUME` | Суммарный объём паллета ≤ 0 | `string[]` — palletId (uuid) | Проверить типы коробок привязанных SKU |

### Рекомендации для UI

- Показывать **все ошибки сразу** (не только первую)
- Для `MISSING_COGS` и `MISSING_PACKAGING` — показать ссылки на страницы настройки COGS и упаковки
- Для ошибок с `affectedIds` — подсветить конкретные строки/паллеты в таблице
- Использовать иконку предупреждения рядом с кнопкой «Рассчитать» если есть известные проблемы

### Прочие HTTP-ошибки

| Код | Контекст | Описание |
|-----|----------|----------|
| `400` | Все POST/PUT | Ошибка валидации тела запроса |
| `403` | calculate, recalculate | Нет доступа или недостаточная роль |
| `404` | Все `:id` эндпоинты | Ресурс не найден |
| `409` | Мутации CONFIRMED поставки | Поставка подтверждена, изменения запрещены |
| `409` | POST box-types | Дублирование имени типа коробки |
| `409` | DELETE box-types | Есть ссылки (sku_packaging или box_lines) |
| `409` | POST sku-packaging | Привязка уже существует или boxType неактивен |
| `409` | DELETE sku-packaging | Есть ссылки в box_lines |

---

## 10. Ограничения по статусу

### Матрица разрешений DRAFT vs CONFIRMED

| Действие | Endpoint | DRAFT | CONFIRMED |
|----------|----------|:-----:|:---------:|
| Обновить заголовок | `PUT /v1/shipments/:id` | ✅ | ❌ 409 |
| Удалить поставку | `DELETE /v1/shipments/:id` | ✅ | ❌ 409 |
| Добавить паллет | `POST .../pallets` | ✅ | ❌ 409 |
| Удалить паллет | `DELETE .../pallets/:id` | ✅ | ❌ 409 |
| Добавить строку | `POST .../box-lines` | ✅ | ❌ 409 |
| Обновить строку | `PUT .../box-lines/:id` | ✅ | ❌ 409 |
| Удалить строку | `DELETE .../box-lines/:id` | ✅ | ❌ 409 |
| Рассчитать (превью) | `POST .../calculate` | ✅ | ❌ 409 |
| Подтвердить | `POST .../confirm` | ✅ | ❌ 409 |
| Пересчитать | `POST .../recalculate` | ❌ 400 | ✅ (Manager+) |

### Рекомендации для UI

- В статусе **DRAFT**: показывать все кнопки редактирования
- В статусе **CONFIRMED**: скрывать/дизейблить кнопки мутации, показывать бейдж «Подтверждено»
- Кнопку **«Пересчитать»** показывать только для CONFIRMED и только пользователям с ролью Manager/Owner/Admin
- При попытке мутации CONFIRMED поставки — показать toast «Поставка уже подтверждена. Изменения невозможны»

---

## 11. Работа с Decimal-полями

### Проблема

Prisma ORM возвращает `DECIMAL` поля как **строки** (`"96000.0000"`), а не числа. Это сделано для сохранения точности.

### Что приходит строкой (нужен `parseFloat()`)

| Поле | Точность в БД | Пример значения |
|------|:---:|-------|
| `lengthCm`, `widthCm`, `heightCm` | `DECIMAL(10,2)` | `"60.00"` |
| `volumeCm3` | `DECIMAL(15,4)` | `"96000.0000"` |
| `boxVolume`, `totalVolume` | `DECIMAL(15,4)` | `"480000.0000"` |
| `volumeShare` | `DECIMAL(15,6)` | `"0.625000"` |
| `unitCostRub`, `finalCostPerUnit`, `deliveryCostPerUnit` | `DECIMAL(15,4)` | `"312.5000"` |
| `finalCostLine`, `allocatedDeliveryCost` | `DECIMAL(15,4)` | `"15625.0000"` |
| `totalDeliveryCost`, `palletRate` | `DECIMAL(15,2)` | `"50000.00"` |

### Что приходит числом (не нужен parseFloat)

| Эндпоинт | Поля | Тип |
|----------|------|-----|
| `POST .../calculate` (AllocationResultResponseDto) | Все числовые поля | `number` |
| `POST .../confirm` (ConfirmShipmentResponseDto) | `totalFinalCost`, `snapshotCount` | `number` |
| `POST .../recalculate` (RecalculateShipmentResponseDto) | `totalFinalCost`, `snapshotCount`, `previousSnapshotCount` | `number` |

### Рекомендация: утилита-парсер

```typescript
// src/lib/shipment-utils.ts
export function parseDecimal(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// Использование
const volume = parseDecimal(boxLine.volumeCm3); // 96000
const cost = parseDecimal(boxLine.finalCostPerUnit); // 312.5
```

### Отображение

```typescript
// Стоимость
formatCurrency(parseDecimal(line.finalCostPerUnit))  // "312,50 ₽"

// Объём
parseDecimal(boxType.volumeCm3)?.toLocaleString('ru-RU') + ' см³'  // "96 000 см³"

// Доля
(parseDecimal(line.volumeShare) * 100).toFixed(1) + '%'  // "62.5%"
```



## 12. Рекомендации для UI

### Структура экранов

#### Экран 1: Справочник типов коробок (`/shipments/box-types`) ✅ Маршрут совпадает с `routes.ts`

- Таблица: название, размеры (Д×Ш×В), объём, статус (активен/неактивен)
- Кнопка «Добавить тип коробки» → модальное окно с формой
- Inline-редактирование или кнопка «Редактировать» → модалка
- Кнопка «Деактивировать» с подтверждением (проверка ссылок на бэкенде)
- Фильтр: показать/скрыть неактивные (`?includeInactive=true`)

#### Экран 2: Привязка упаковки SKU (`/shipments/sku-packaging`) ✅ Маршрут совпадает с `routes.ts`

- Таблица: артикул (nmId), название товара, бренд, тип коробки, шт/коробку
- Кнопка «Привязать товар» → форма с поиском товара + выбор типа коробки
- Массовая привязка: загрузка списка через `/bulk` эндпоинт
- Показывать ошибки bulk-операции inline (какие SKU не привязались и почему)

#### Экран 3: Список поставок (`/shipments`) ✅ Маршрут совпадает с `routes.ts`

- Таблица с пагинацией: название, режим доставки, статус (бейдж DRAFT/CONFIRMED), дата создания
- Фильтры: по статусу, сортировка по дате
- Кнопка «Создать поставку» → форма выбора режима доставки
- Цветовые бейджи: DRAFT = серый/синий, CONFIRMED = зелёный

#### Экран 4: Детали поставки (`/shipments/:id`) ✅ Маршрут совпадает с `routes.ts` (`/shipments/[id]`)

Основной рабочий экран с несколькими зонами:

**Заголовок поставки:**
- Название, режим доставки, стоимость доставки, статус
- Кнопки: «Редактировать» (DRAFT), «Удалить» (DRAFT), «Рассчитать», «Подтвердить»

**Список паллетов (accordion/tabs):**
- Каждый паллет как раскрывающаяся секция
- Кнопка «Добавить паллет» (DRAFT)
- Кнопка «Удалить паллет» с подтверждением (каскадное удаление строк)

**Строки коробок в каждом паллете (таблица):**

| Колонка | До расчёта | После расчёта |
|---------|:---:|:---:|
| Артикул (nmId) | ✅ | ✅ |
| Товар (vendorCode) | ✅ | ✅ |
| Тип коробки | ✅ | ✅ |
| Кол-во коробок | ✅ (редактируемое) | ✅ |
| Кол-во единиц | ✅ (редактируемое) | ✅ |
| Себестоимость (PCU) | — | ✅ |
| Объём коробки | — | ✅ |
| Доля объёма | — | ✅ (%) |
| Стоимость доставки (ABDC) | — | ✅ |
| Доставка на единицу (DCU) | — | ✅ |
| **FCU (итоговая)** | — | ✅ (**выделить**) |
| Стоимость строки (FCL) | — | ✅ |

**Итоговая панель (после расчёта):**
- Общая стоимость доставки
- Количество паллетов
- Общая себестоимость (totalFinalCost)
- Средний FCU по поставке

### UX-подсказки

1. **Пустое состояние**: При создании поставки показать пошаговый wizard или подсказки «Добавьте паллет → Добавьте товары → Рассчитайте»
2. **Кнопка «Рассчитать»**: Показывать как primary action. После первого расчёта менять текст на «Пересчитать»
3. **Ошибки валидации**: Показывать inline рядом с проблемными строками/паллетами. Использовать `affectedIds` для точечной подсветки
4. **Подтверждение**: Двухэтапное — сначала показать результат расчёта, затем кнопка «Подтвердить и заморозить»
5. **CONFIRMED view**: Показать бейдж «Подтверждено» + дату + кто подтвердил. Все поля read-only
6. **Пересчёт**: Кнопка с предупреждением «Текущие снепшоты будут заменены. Продолжить?»
7. **Неполные коробки**: При `totalUnits ≠ boxCount × unitsPerBox` показать индикатор ⚠️ «Ручное кол-во единиц»
8. **Навигация из ошибок**: `MISSING_COGS` → ссылка на `/products` с фильтром по nmId. `MISSING_PACKAGING` → ссылка на `/shipments/sku-packaging`

### Переиспользование существующих компонентов

| Компонент | Откуда | Где использовать |
|-----------|--------|-----------------|
| `DataTable` | `components/ui/` | Все таблицы (box types, packaging, shipments, box lines) |
| `Badge` | `components/ui/` | Статус DRAFT/CONFIRMED |
| `Dialog` / `Sheet` | `components/ui/` | Формы создания/редактирования |
| `Select` | `components/ui/` | Выбор deliveryMode, boxType |
| `formatCurrency()` | `lib/format-utils.ts` | Все денежные значения |
| `useToast()` | `hooks/` | Уведомления об ошибках и успехе |

---

## 13. Ссылки на документацию

### Backend документация

| Документ | Путь | Содержимое |
|----------|------|-----------|
| **HTTP-примеры API** | [`test-api/35-shipment-cost.http`](../../../test-api/35-shipment-cost.http) | Полные примеры всех 23 эндпоинтов + error cases |
| **Архитектура** | [`docs/architecture/shipment-cost-allocation-architecture.md`](../../../docs/architecture/shipment-cost-allocation-architecture.md) | ADR-005, модель данных, ограничения |
| **Руководство разработчика** | [`docs/guides/shipment-cost-allocation-guide.md`](../../../docs/guides/shipment-cost-allocation-guide.md) | Пошаговый гайд, структура модуля, интеграция |
| **Бизнес-логика** | [`docs/BUSINESS-LOGIC-REFERENCE.md`](../../../docs/BUSINESS-LOGIC-REFERENCE.md) | Формулы FCU, режимы доставки, 9 валидаций (поиск: «Epic 79») |
| **Пользовательский гайд** | [`docs/USER-GUIDE.md`](../../../docs/USER-GUIDE.md) | Workflow 17: пошаговые curl-примеры |
| **Справочник API** | [`docs/API-PATHS-REFERENCE.md`](../../../docs/API-PATHS-REFERENCE.md) | Все эндпоинты с кодами ответов (поиск: «box-types», «sku-packaging», «shipments») |
| **Swagger UI** | `http://localhost:3000/api` | Интерактивная документация (раздел `shipment-cost`) |

### Связанные разделы фронтенда

| Ресурс | Описание |
|--------|----------|
| COGS API | `POST /v1/cogs` — задание себестоимости (нужен для calculate) |
| Products API | `GET /v1/products` — справочник товаров (для выбора nmId) |
| Supplies API | `GET /v1/supplies` — поставки WB (для связи через supplyId) |

---

> **Дата создания**: 2026-03-09
> **Epic**: 79 — Shipment Cost Allocation
> **Автор**: Backend Team
> **Версия API**: v1

