# Сообщение для Frontend Team: Две тарифные системы WB

**Дата**: 2026-01-25
**Тема**: ВАЖНО: Две тарифные системы Wildberries - как использовать правильно

---

## Привет команда! 👋

Мы сделали важное открытие касательно тарифов Wildberries, и хотим поделиться с вами, чтобы вы правильно интегрировали это в Price Calculator и другие компоненты.

---

## 🎯 Главное ( TL;DR )

У Wildberries **ДВЕ разные тарифные системы**, и они уже реализованы в нашем бэкенде:

| Система | Для чего | Эндпоинт |
|---------|----------|----------|
| **Inventory (остатки)** | Фактические затраты на хранение **сегодня** | `GET /v1/tariffs/warehouses-with-tariffs` |
| **Supply (поставка)** | Планирование поставок на **14 дней вперёд** | `GET /v1/tariffs/acceptance/coefficients` |

**Важный момент**: Разница в ставках между Marketplace и нашим API — это нормально!

**Конкретный пример** (см. скриншот):
- Marketplace: **276 ₽** (Supply - для планирования)
- Наш API: **250 ₽** (Inventory - фактические затраты)
- Разница: **26 ₽** (~10.4%)

Почему так:
- Marketplace показывает ставки **Supply** (для планирования, обычно выше)
- Наш API возвращает ставки **Inventory** (фактические затраты, обычно ниже)

Это не баг, это фича — разные системы для разных целей.

---

## 📚 Полная документация

Создали для вас подробный гайд:

---

## Backend Team Response

**Status**: RESOLVED (informational message)
**Resolution date**: 2026-01-25
**Summary**: Informational message to frontend team explaining the two WB tariff systems (Inventory vs Supply). This is correct behavior, not a bug. Full documentation provided in Request #108.
**Remaining frontend action**: None - informational only.
**`frontend/docs/request-backend/108-two-tariff-systems-guide.md`**

Там всё расписано:
- Когда какую систему использовать
- Примеры кода на TypeScript
- Структуры ответов API
- Ответы на частые вопросы

---

## 🚀 Как действовать в ваших задачах

### Price Calculator

**Для расчёта текущих затрат** (фактическая стоимость):
```typescript
// ИСПОЛЬЗУЙТЕ Inventory систему
const { data: warehouses } = useWarehousesWithTariffs();

// Берёте tariffs.fbo.delivery_base_rub — это то, что вы **действительно** заплатите
```

**Для планирования будущей поставки** (через 5 дней, через неделю):
```typescript
// ИСПОЛЬЗУЙТЕ Supply систему
const { data: coefficients } = useAcceptanceCoefficients();

// Фильтруете по нужной дате
// Берёте delivery.baseLiterRub — это прогноз на будущую дату
```

### Decision Matrix (Матрица решений)

| Ситуация | Какой эндпоинт | Почему |
|----------|----------------|---------|
| Расчёт маржи за прошлую неделю | `/warehouses-with-tariffs` | Нужны **фактические** затраты |
| Отображение ставок в Price Calculator | `/warehouses-with-tariffs` | Показываем **текущие** тарифы |
| Планирование поставки на завтра | `/acceptance/coefficients` | Нужен **прогноз** на завтра |
| Проверка доступности склада на дату X | `/acceptance/coefficients/all` | Фильтруете по дате, смотрите `isAvailable` |
| Финансовые отчёты | `/warehouses-with-tariffs` | Только реальные расходы |

---

## ⚠️ Частые вопросы

**Q: Почему в Marketplace ставка 120₽, а в API 80₽?**
**A**: Потому что Marketplace показывает Supply (планирование), а API — Inventory (факт). Оба правильные, просто для разных задач.

**Q: Какой эндпоинт использовать для Price Calculator по умолчанию?**
**A**: Используйте `/warehouses-with-tariffs` (Inventory) для расчёта **текущих** затрат.

**Q: Как проверить, примет ли склад поставку через 3 дня?**
**A**: Используйте `/acceptance/coefficients/all`, отфильтруйте по дате, проверьте `coefficient >= 0 && isAvailable === true`.

---

## 📝 Что изменилось в документации

1. **Создали файл 108** — полный гайд по двум системам
2. **Обновили файл 98** — добавили секцию "Two Tariff Systems" в начало
3. **Обновили API-PATHS-REFERENCE.md** — добавили заметку о двух системах

---

## 🤝 Нужна помощь?

Если есть вопросы по интеграции:
- Читайте гайд в файле 108 (там есть примеры кода)
- Смотрите примеры в `test-api/18-tariffs.http`
- Пишите нам — объясним!

---

Удачи с интеграцией! 🚀

Backend Team
