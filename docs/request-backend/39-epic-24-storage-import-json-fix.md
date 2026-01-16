# Request #39: Epic 24 Storage Import - JSON Format Fix

**Date**: 2025-12-04
**Priority**: ✅ **RESOLVED**
**Status**: ✅ **COMPLETE** - Import now works with real WB API data
**Component**: Backend - Imports Module (ExcelParser)

---

## Summary

**Проблема**: Импорт данных о платном хранении падал с ошибкой — **WB API возвращает JSON, а не Excel** как указано в документации.

**Решение**: Добавлена поддержка JSON формата в `ExcelParserService.parsePaidStorageReport()`.

**Результат**: Импорт успешно работает, данные в БД доступны для Analytics API.

---

## Root Cause Analysis

### Ошибка до исправления

```
Failed to parse paid storage Excel report: Can't find end of central directory : is this a zip file?
```

Затем после добавления debug логирования:

```
WB API returned invalid data (not Excel). Got: JSON (767348 bytes)
```

### Причина

WB SDK `ReportsModule.downloadPaidStorageReport()` возвращает **JSON массив** (~750KB), а не Excel файл (.xlsx) как предполагалось в документации Epic 24.

**Реальный формат данных от WB API**:
```json
[
  {
    "nmId": 148188881,
    "vendorCode": "LL-20-WH",
    "warehouseName": "Краснодар",
    "warehousePrice": 58.61,
    "volume": 0.112,
    "date": "2025-11-22",
    "brand": "Space Chemical",
    "subject": "Рассеиватели",
    "techSize": "0",
    "barcode": "2000000012345",
    "calcType": "По обычным ценам"
  },
  // ... еще ~2000 записей
]
```

---

## Fix Applied

### Файл: `src/imports/parsers/excel-parser.service.ts`

**Изменения**:
1. Добавлена детекция формата по первым байтам файла
2. Добавлен метод `parseJsonPaidStorageReport()` для JSON
3. Сохранён fallback на Excel парсинг (JSZip/ExcelJS)

**Детекция формата**:
```typescript
// ZIP signature (Excel .xlsx = ZIP archive)
const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;

// JSON starts with [ or {
const isJson = firstBytes.startsWith('[') || firstBytes.startsWith('{');
```

**Маппинг полей JSON → DB**:

| WB API Field | DB Field (paid_storage_daily) |
|--------------|-------------------------------|
| `nmId` | `nm_id` |
| `warehouseName` | `warehouse` |
| `warehousePrice` | `warehouse_price` |
| `volume` | `volume` |
| `date` | `date` |
| `vendorCode` | `vendor_code` |
| `brand` | `brand` |
| `subject` | `subject` |
| `techSize` | `size` |
| `barcode` | `barcode` |
| `calcType` | `calc_type` |

---

## Verification

### Import Status

```sql
SELECT id, status, created_records
FROM imports
WHERE report_type='paid_storage'
ORDER BY uploaded_at DESC LIMIT 1;
```

**Результат**:
```
id                                   | status    | created_records
--------------------------------------+-----------+----------------
ae983ed1-9ced-4b8e-adfb-c05268ddbd27 | completed | 1397
```

### Data in paid_storage_daily

```sql
SELECT COUNT(*) as total, MIN(date), MAX(date)
FROM paid_storage_daily;
```

**Результат**:
```
total | min_date   | max_date
------+------------+-----------
550   | 2025-11-18 | 2025-11-24
```

> **Note**: 1397 parsed → 550 unique records after deduplication by `(cabinet_id, date, nm_id, warehouse)`

### Sample Data

```sql
SELECT nm_id, warehouse, date, warehouse_price, vendor_code, brand
FROM paid_storage_daily
ORDER BY warehouse_price DESC LIMIT 3;
```

**Результат**:
```
nm_id     | warehouse | date       | warehouse_price | vendor_code | brand
----------+-----------+------------+-----------------+-------------+----------------
148188881 | Краснодар | 2025-11-22 | 58.61           | LL-20-WH    | Space Chemical
148188881 | Краснодар | 2025-11-20 | 58.61           | LL-20-WH    | Space Chemical
148188881 | Краснодар | 2025-11-21 | 58.61           | LL-20-WH    | Space Chemical
```

---

## Frontend Usage

### Storage Analytics API теперь работает

Все эндпоинты из Request #36 теперь возвращают реальные данные:

#### 1. GET /v1/analytics/storage/by-sku

```http
GET /v1/analytics/storage/by-sku?weekStart=2025-W47&weekEnd=2025-W48
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

#### 2. GET /v1/analytics/storage/top-consumers

```http
GET /v1/analytics/storage/top-consumers?weekStart=2025-W47&weekEnd=2025-W48&limit=10
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

#### 3. GET /v1/analytics/storage/trends

```http
GET /v1/analytics/storage/trends?weekStart=2025-W47&weekEnd=2025-W48
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

### Manual Import Trigger

Для загрузки данных за конкретный период:

```http
POST /v1/imports/paid-storage
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
Content-Type: application/json

{
  "dateFrom": "2025-11-18",
  "dateTo": "2025-11-24"
}
```

**Response** (202 Accepted):
```json
{
  "import_id": "8",
  "status": "queued",
  "date_range": {
    "from": "2025-11-18",
    "to": "2025-11-24"
  },
  "rows_imported": 0,
  "message": "Import queued for processing."
}
```

**Ограничения**:
- Максимум **8 дней** за один запрос (ограничение WB API)
- Формат дат: `YYYY-MM-DD`

---

## Updated Documentation

### Request #36 Correction

В документации `36-epic-24-paid-storage-analytics-api.md` указано:

> **Формат**: Excel файл с детализацией по дням

**Актуально**: WB SDK возвращает **JSON массив**, backend обрабатывает оба формата.

### Data Source Update

**WB API Response Format**: JSON (не Excel)

**Пример структуры элемента**:
```typescript
interface WbPaidStorageItem {
  nmId: number;           // Артикул WB
  vendorCode: string;     // Артикул продавца
  warehouseName: string;  // Название склада
  warehousePrice: number; // Стоимость хранения (₽)
  volume: number;         // Объём (литры)
  date: string;           // Дата (YYYY-MM-DD)
  brand: string;          // Бренд
  subject: string;        // Предмет/категория
  techSize: string;       // Размер
  barcode: string;        // Штрихкод
  calcType: string;       // Тип расчёта
}
```

---

## Empty State Handling

Если данных нет (например, импорт ещё не выполнялся), API возвращает:

```json
{
  "period": { "from": "2025-W47", "to": "2025-W48", "days_count": 14 },
  "data": [],
  "summary": {
    "total_storage_cost": 0,
    "products_count": 0,
    "avg_cost_per_product": 0
  },
  "pagination": { "total": 0, "cursor": null, "has_more": false },
  "has_data": false
}
```

**Frontend должен**:
1. Проверить `has_data: false`
2. Показать empty state с инструкцией:
   - "Данные о хранении отсутствуют за выбранный период"
   - "Загрузите данные через Импорт → Платное хранение"
   - Кнопка для запуска импорта

---

## Checklist

- [x] JSON формат обрабатывается корректно
- [x] Данные сохраняются в `paid_storage_daily`
- [x] Дедупликация работает (unique constraint)
- [x] Storage Analytics API возвращает данные
- [x] Manual import endpoint работает
- [x] Error messages понятные

---

## Related Files

**Backend**:
- `src/imports/parsers/excel-parser.service.ts` - JSON/Excel parser
- `src/imports/services/paid-storage-import.service.ts` - Import orchestration
- `src/analytics/services/storage-analytics.service.ts` - Analytics queries

**Documentation**:
- `36-epic-24-paid-storage-analytics-api.md` - Full API spec
- `37-epic-24-storage-endpoints-not-implemented.md` - RESOLVED
- `38-storage-analytics-improve-empty-data-handling.md` - `has_data` flag

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-04 | Backend Team | Fixed JSON parsing for WB Paid Storage API |
| 2025-12-04 | Backend Team | First successful import: 550 records |

---

**Status**: ✅ **RESOLVED** - Storage Analytics fully operational
