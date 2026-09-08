# Frontend → Product Manager Requests Index

Документация запросов от frontend/backend команды к продуктовой команде для анализа и принятия решений по UX/UI.

**Цель папки**: Документировать найденные расхождения, неточности в трактовке информации для пользователя, и получить от продуктовой команды решение о том, как лучше презентовать данные.

---

## 📋 Active Requests

_Нет активных запросов_

---

## ✅ Resolved Requests

### Request #02: Концепция презентации финансовых данных ✅ РЕАЛИЗОВАНО 2025-12-14

**Реализация**: Воронка продаж от ВАШЕЙ цены до прибыли
**Backend**: Request #58 реализован
**Frontend**: FinancialSummaryTable + UnitEconomics

---

### Request #01: Расхождение "Продажи" между WB Dashboard и нашей аналитикой ✅ РЕШЕНО

**Date**: 2025-12-13
**Priority**: 🟡 Medium - UX Clarity Issue
**Status**: ✅ **РЕАЛИЗОВАНО** — 2025-12-13
**Component**: Frontend - Analytics Dashboard
**File**: [01-sales-gross-vs-retail-price-discrepancy.md](./01-sales-gross-vs-retail-price-discrepancy.md)

**Краткое описание**: При сравнении W47 данных, "Продажи" в нашей системе показывают **309,896.32₽**, а WB Dashboard показывает **209,691.98₽**. Разница = Комиссия WB (96,086.34₽). Оба значения технически корректны, но означают разное.

**PM Decision**: **Вариант A + B** — Показывать `sale_gross` (как WB Dashboard) + tooltip с GMV и комиссией.
**PM**: Sarah (Product Owner) | **Дата**: 2025-12-13

---

## ✅ Resolved Requests

### Request #01: Расхождение "Продажи" — ✅ РЕАЛИЗОВАНО 2025-12-13

**Решение**: Показывать `sale_gross` (чистые продажи) + tooltip с детализацией.
**PM**: Sarah (Product Owner)
**Реализация**: `FinancialSummaryTable.tsx` — секция "Доходы" упрощена до одной строки с tooltip

---

## 📚 Request Workflow

### Frontend/Backend Team → Product Manager

1. **Discovery**: Команда находит расхождение или неточность в данных/UX
2. **Investigation**: Анализ причины расхождения
3. **Documentation**: Создание детального описания проблемы в `frontend/docs/request-product-manager/`
4. **Review**: PM команда анализирует варианты решения
5. **Decision**: PM документирует выбранное решение
6. **Implementation**: Команда реализует согласованное решение
7. **Closure**: Обновление статуса запроса

### Request Template

```markdown
# Request #XX: [Title]

**Date**: YYYY-MM-DD
**Priority**: 🔴 High / 🟡 Medium / 🟢 Low
**Status**: 🟡 Ожидает решения / 🔵 В анализе / ✅ Решено
**Component**: Frontend/Backend - [Module Name]

## Краткое описание проблемы
[1-2 предложения о сути проблемы]

## Детальное описание

### Текущее поведение
[Что система показывает сейчас]

### Альтернативное поведение (WB Dashboard / конкуренты)
[Что показывают другие системы]

### Причина расхождения
[Техническое объяснение почему данные отличаются]

## Варианты решения

### Вариант A: [Название]
**Плюсы**: ...
**Минусы**: ...
**Рекомендация команды**: ...

### Вариант B: [Название]
**Плюсы**: ...
**Минусы**: ...

## Вопросы к PM
1. [Конкретный вопрос 1]
2. [Конкретный вопрос 2]

## Визуальные примеры
[Скриншоты, таблицы сравнения]

---

## PM Decision (заполняется PM)

**Решение**: [Выбранный вариант]
**Обоснование**: [Почему выбран этот вариант]
**Дата решения**: YYYY-MM-DD
**PM**: [Имя]
```

---

## 📂 File Organization

```
frontend/docs/request-product-manager/
├── README.md                                    # This file (index)
├── XX-[request-title].md                        # Request documents
└── XX-[request-title]-decision.md               # PM decision documents (optional)
```

**Naming Convention**:

- Requests: `XX-[kebab-case-title].md`
- PM decisions: `XX-[kebab-case-title]-decision.md`

---

## 🔗 Related Documentation

**Backend Requests**:

- `frontend/docs/request-backend/` - Технические запросы к backend команде

**Frontend Stories**:

- `frontend/docs/stories/` - User stories и требования

**Backend Documentation**:

- `docs/WB-DASHBOARD-METRICS.md` - Справочник метрик WB Dashboard

---

**Last Updated**: 2025-12-14
**Active Requests**: 0
**Resolved Requests**: 2
