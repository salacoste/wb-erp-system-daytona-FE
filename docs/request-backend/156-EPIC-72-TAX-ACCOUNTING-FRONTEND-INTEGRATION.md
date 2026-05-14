# Request #156: Epic 72 Tax Accounting — Frontend Integration Guide & Backend Requests

**Date**: 2026-02-22
**Status**: ✅ Backend Complete (2026-02-23) — ready for frontend Epic 66-FE
**Priority**: P0
**Related**: Backend Epic 72, Frontend Epic 66-FE, Request #155 (НДС/VAT)
**Authored By**: Frontend Team (BMad Master)

---

## 1. Что мы получили от бекенда (Epic 72 Summary)

Backend Epic 72 реализовал полный налоговый учёт. Фронтенд получил:

### 1.1 Cabinet Tax Settings

**Чтение**: `GET /v1/cabinets/:id`
```json
{
  "id": "uuid",
  "name": "My Cabinet",
  "taxSystem": "usn6",
  "taxRate": null,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-02-15T10:00:00.000Z"
}
```

**Обновление**: `PUT /v1/cabinets/:id`
```json

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-23
**Summary**: Epic 72 (Tax Accounting) backend complete. Tax settings integrated into cabinet model (taxSystem, taxRate, vatPayer, vatRate). Tax metrics available in finance-summary response under `summary_total.tax`. Supports USN 6%, USN 15%, manual rate, and VAT integration. Ready for frontend Epic 66-FE.
**Remaining frontend action**: Build tax configuration UI per Epic 66-FE using endpoints documented here.{ "taxSystem": "usn15", "taxRate": null }
```

| taxSystem | Название | taxRate |
|-----------|----------|---------|
| `null` | Не настроена | Игнорируется |
| `"usn6"` | УСН 6% (по доходам) | Автоочистка до null |
| `"usn15"` | УСН 15% (по прибыли) | Автоочистка до null |
| `"manual"` | Пользовательская ставка | **Обязателен**, 0-100 |

**Ошибка валидации (400)**:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "taxRate is required when taxSystem is \"manual\"" } }
```

### 1.2 Finance Summary Tax Metrics

**Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=2025-W45`

**КРИТИЧНО**: Налоговые данные ТОЛЬКО в `summary_total.tax`. Поля `summary_rus.tax` и `summary_eaeu.tax` — ВСЕГДА null.

```json
{
  "summary_total": {
    "week": "2025-W45",
    "sales_gross_total": 1450000.00,
    "payout_total": 810000.25,
    "tax": {
      "tax_amount": 87000.00,
      "tax_base": 1450000.00,
      "effective_tax_rate": 6.00,
      "tax_system": "usn6",
      "is_minimum_rule": false,
      "net_profit_after_tax": 723000.25
    }
  }
}
```

### 1.3 TaxMetrics DTO

| Поле | Тип | Описание |
|------|-----|----------|
| `tax_amount` | `number \| null` | Рассчитанная сумма налога |
| `tax_base` | `number \| null` | База: выручка (USN6/manual), прибыль (USN15) |
| `effective_tax_rate` | `number \| null` | Применённая ставка в % |
| `tax_system` | `string \| null` | `"usn6"` / `"usn15"` / `"manual"` |
| `is_minimum_rule` | `boolean` | true = применено правило мин. 1% (USN15) |
| `net_profit_after_tax` | `number \| null` | Чистая прибыль после налога |

Когда `tax === null` → налоговая система не настроена для кабинета.

### 1.4 Формулы расчёта (бекенд)

**УСН 6%**: `налог = sales_gross_total × 6%`

**УСН 15%**:
```
расходы = логистика + хранение + приёмка + штрафы + корректировки + себестоимость + реклама
прибыль = выручка − расходы
стандартный_налог = прибыль × 15%
минимальный_налог = выручка × 1%
налог = MAX(стандартный_налог, минимальный_налог)
```

**Manual**: `налог = tax_base × (taxRate / 100)`

---

## 2. План фронтенд-интеграции (Epic 66-FE)

### 2.1 Архитектурное решение

**Ранее (Epic 65)**: TaxCard делал ЛОКАЛЬНЫЕ расчёты через `tax-calculations.ts`.

**Теперь (Epic 66-FE)**: Переходим на **бекенд-данные** из `summary_total.tax`. Локальные расчёты deprecated.

### 2.2 Что создаём

| Story | Описание | Файлы |
|-------|----------|-------|
| 66.1 | Типы + API модуль кабинета | `types/cabinet.ts`, `types/finance-summary.ts`, `lib/api/cabinet.ts` |
| 66.2 | TanStack Query хуки | `hooks/useCabinetTaxSettings.ts` |
| 66.3 | Страница настроек `/settings/tax` | `app/(dashboard)/settings/tax/page.tsx`, `components/custom/settings/TaxSettingsForm.tsx` |
| 66.4 | Интеграция tax в finance-summary пайплайн | `hooks-v1/financial/aggregation.ts` |
| 66.5 | Рефакторинг TaxCard на бекенд-данные | `components/custom/dashboard/TaxCard.tsx` |
| 66.6 | Карточка "Чистая прибыль после налога" | `components/custom/dashboard/NetProfitCard.tsx` |
| 66.7 | Предупреждения и пустые состояния | `components/custom/dashboard/TaxWarningBanner.tsx` |

### 2.3 Основные паттерны интеграции

```typescript
// Чтение налоговых настроек кабинета
const { data } = useCabinetTaxSettings(cabinetId)
// data = { taxSystem: 'usn6', taxRate: null }

// Обновление налоговых настроек
const mutation = useUpdateTaxSettings(cabinetId)
mutation.mutate({ taxSystem: 'manual', taxRate: 7.5 })

// Получение налоговых метрик из finance-summary
const taxData = financeSummary?.tax  // TaxMetrics | null

// Отображение
if (taxData === null) → "Настройте систему"
if (taxData.is_minimum_rule) → бейдж "Мин. 1%"
const afterTaxMargin = (taxData.net_profit_after_tax / revenue) * 100
```

---

## 3. Вопросы и уточнения к бекенд-команде

### 3.1 Вопрос: Мульти-неделя и tax агрегация

**Контекст**: Фронтенд отображает данные за месяц (4-5 недель). Каждая неделя имеет свой `tax` объект.

**Вопрос**: Правильно ли суммировать `tax_amount` и `net_profit_after_tax` по неделям при отображении месячных данных? Или бекенд планирует предоставить агрегированный endpoint для периода?

**Наше текущее решение**:
```typescript
// Суммируем tax_amount и net_profit_after_tax
// effective_tax_rate берём из первой недели (ставка не меняется)
// is_minimum_rule = true если хотя бы одна неделя имеет minimum rule
```

### 3.2 Вопрос: taxSystem change mid-period

**Контекст**: Пользователь меняет `taxSystem` с `usn6` на `usn15` в середине месяца.

**Вопрос**: Пересчитываются ли ВСЕ предыдущие недели автоматически (бэкфилл), или только будущие недели агрегации?

**Важно для фронтенда**: Если бэкфилл автоматический, нужно ли инвалидировать кеш всех finance-summary запросов?

### 3.3 Вопрос: Рекламные расходы в USN 15%

**Контекст**: В формуле USN 15% расходы включают "рекламу". В `summary_total` рекламные расходы приходят из `advertising/summary` — это отдельный API.

**Вопрос**: Откуда бекенд берёт рекламные расходы для расчёта налога? Из `advertising_expenses` в weekly aggregation? Или из отдельного источника?

**Проблема**: Если реклама не синхронизирована (stale data), это повлияет на точность налога.

### 3.4 Вопрос: Previous period tax для comparison

**Контекст**: Dashboard показывает сравнение текущей и предыдущей недели. Для TaxCard нужны `previousTax` метрики.

**Вопрос**: Можно ли получить `tax` объект из предыдущей недели/периода через стандартный вызов `finance-summary?week=YYYY-Wxx`? Или нужен отдельный comparison endpoint?

**Наше текущее решение**: Вызываем `finance-summary` для предыдущего периода и берём `summary_total.tax` оттуда.

### 3.5 Замечание: Cabinet GET endpoint

**Контекст**: Фронтенд использует `GET /v1/cabinets/:id` для чтения текущих налоговых настроек.

**Уточнение**: Этот endpoint уже возвращает `taxSystem` и `taxRate`? Или нужен отдельный endpoint `GET /v1/cabinets/:id/tax-settings`?

В текущем фронтенд-коде (`src/types/cabinet.ts`) Cabinet interface НЕ имеет этих полей — мы добавим их в Epic 66-FE, Story 66.1.

---

## 4. НДС (VAT) — Отдельный запрос

**Полное описание**: см. **Request #155** (`155-VAT-NDS-INTEGRATION.md`)

### Краткое резюме

Epic 72 **НЕ поддерживает НДС** (Налог на добавленную стоимость). Это отдельный налог, который:

- Применяется к **цене продажи**, а не к прибыли
- Имеет фиксированные ставки: 0%, 5%, 20%, 22%
- Требует расчёта **входящего НДС** из COGS для вычета
- Влияет на расчёт дохода ДО расчёта налога на прибыль

**Кому нужен НДС**:
- ООО на ОСН → 20%
- ИП на ОСН → 20%
- УСН при выручке > 60М (с 2025) → 5%

**Что нужно от бекенда**:
1. Добавить `vatPayer: boolean` + `vatRate: number | null` в Cabinet
2. Расширить `TaxMetrics` полями: `vat_output`, `vat_input`, `vat_payable`, `revenue_excl_vat`
3. Изменить порядок расчёта: сначала НДС → затем налог на доход с revenue_excl_vat
4. Миграция: существующие кабинеты → `vatPayer: false`

**Оценка**: 3-5 SP на бекенде поверх существующей инфраструктуры Epic 72.

**Ключевые вопросы**:
1. Есть ли в COGS данные о входящем НДС для вычета?
2. Есть ли отдельная колонка НДС в еженедельном отчёте WB?
3. Как обрабатывать смену ставки НДС в середине периода?

---

## 5. Что НЕ реализуем сейчас (подтверждено бекенд-командой)

| Функционал | Причина | Когда |
|------------|---------|-------|
| Per-SKU налоговые метрики | Рассчитываются, но не выведены в API v1 | Следующая итерация |
| История изменений настроек (UI) | Аудит-трейл на бекенде, нет эндпоинта для просмотра | Следующая итерация |
| Ручной запуск бэкфилла | `POST /v1/tasks/enqueue` с `tax_backfill`, только для админов | Пока без UI |
| ~~НДС (VAT)~~ | ✅ Реализовано бекендом (Task-50) | Request #155 resolved |

---

## 6. Найденные несоответствия и риски

### 6.1 Риск: Локальные vs Бекенд расчёты

**Текущее состояние**: `TaxCard.tsx` (Epic 65) использует `tax-calculations.ts` для ЛОКАЛЬНЫХ расчётов. После Epic 66-FE будет использовать бекенд-данные.

**Риск**: В переходный период возможно расхождение между локальными и бекенд-расчётами (разный набор расходов в USN 15%).

**Митигация**: Epic 66-FE Story 66.5 полностью заменяет локальные расчёты. Добавим deprecation comment в `tax-calculations.ts`.

### 6.2 Риск: Advertising data freshness

USN 15% включает рекламные расходы. Если advertising sync устаревший, налог рассчитан неточно.

**Рекомендация**: Показывать пользователю индикатор свежести рекламных данных рядом с налоговой метрикой (аналогично `AdvertisingSyncStatusBadge` из Story 63.3-FE).

### 6.3 Замечание: Price Calculator tax vs Cabinet tax

В `Price Calculator` (Epic 44) есть своя система налогов (`TaxConfigurationSection.tsx`). Она работает НЕЗАВИСИМО от кабинетных настроек — пользователь вводит налог для конкретного расчёта цены.

**Решение**: Не объединяем. Price Calculator — калькулятор "что если", Cabinet tax — фактический учёт.

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | Frontend Team (BMad Master) | Initial document created |
| 2026-02-23 | Frontend Team (Claude) | Backend fully verified: Epic 72 + Task-50 (НДС). Migrations applied, 119/119 tests passing. Decimal serialization fixed. Ready for Epic 66-FE implementation. |
