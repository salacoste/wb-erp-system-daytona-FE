---
title: 'Термины и формулы в аналитике'
slug: terminy-i-formuly-v-analitike
source: https://selsup.ru/help/terminy-i-formuly-v-analitike/
chars: 50290
---

# Термины и формулы в аналитике

В этой статье мы разберем основные термины, используемые в программе и расскажем как считаем.

В этой статье:

- 
- <a href="#vse-formuly-prozrachny" rel="nofollow">Все формулы — прозрачны</a>
- <a href="#terminy-razdela-tseny" rel="nofollow">Термины раздела Цены</a>
- <a href="#terminy-otcheta-pnl" rel="nofollow">Термины отчета PnL</a>
- <a href="#tovarnaya-analitika-yunit-ekonomika" rel="nofollow">Товарная аналитика (юнит-экономика)</a>
- <a href="#prodazhi-i-vyruchka" rel="nofollow">Продажи и выручка</a>
- <a href="#rashody-i-vyplaty-marketplejsa" rel="nofollow">Расходы и выплаты маркетплейса</a>
- <a href="#nalogi" rel="nofollow">Налоги</a>
- <a href="#sebestoimost" rel="nofollow">Себестоимость</a>
- <a href="#ostatki" rel="nofollow">Остатки</a>
- <a href="#pribyl-i-effektivnost" rel="nofollow">Прибыль и эффективность</a>
- <a href="#kak-schitaetsya-logistika-v-yunit-ekonomike" rel="nofollow">Как считается логистика в юнит-экономике</a>
- <a href="#formuly-logistiki-ozon" rel="nofollow">Формулы логистики Ozon:</a>
- <a href="#formuly-logistiki-wildberries" rel="nofollow">Формулы логистики Wildberries:</a>

## Все формулы — прозрачны

Мы не прячем логику расчетов. Наоборот, мы даем вам полную возможность проверить и понять, откуда берется каждая цифра в отчете. Это наше ключевое преимущество —полная прозрачность.

**Как легко посмотреть любую формулу?**

1.  **Наведите курсор.** Просто подведите указатель мыши к названию показателя в отчете — и сразу увидите всплывающую подсказку с подробной формулой его расчета.
2.  **Скачайте в Excel.** При выгрузке отчета в Excel формулы сохраняются. Вы можете открыть любую ячейку и увидеть, из каких данных она посчитана.

Мы уверены: вы должны не просто получать цифры, а понимать их. Поэтому мы ничего не скрываем — вся аналитика у вас перед глазами.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Термины раздела Цены

**Закупочная цена** - цена, по которой вы купили товар. В SelSup закупочная цена хранится для каждой партии (единицы товара), также хранится и в рублях, и в валюте.

**Доп. расходы на товар** - это те расходы, которые можно разделить на 1 единицу. Например, стоимость упаковки 1 единицы, стоимость стикеровки. Или стоимость доставки в разделе закупки или отгрузки по ФБО можно также разделить на товары и записать в доп. расходы на товар.

**Себестоимость** = Закупочная цена + доп. расходы на товар.

**Цена товара в Селсап показывается до вычета СПП** - это то же самое, что управлять ценами через ЛК маркетплейсов, только удобно и безошибочно.\
Если вы хотите знать цену с учетом СПП (после СПП), то вам нужен инструмент репрайсер. Обратитесь к вашему менеджеру по вопросу подключения.

Что такое СПП? Это скидка постоянного покупателя для ВБ. В Озоне есть такой же инструмент - озон соинвест. У Яндекса также.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Термины отчета PnL

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Чистая прибыль</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Итоговая прибыль после вычета прочих расходов и налогов из валовой прибыли.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Валовая прибыль - Прочие расходы - Налоги

<p>Прочие расходы берутся из раздела <strong>Финансы → Доходы и расходы</strong>.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Маржинальная прибыль</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Чистая прибыль без учёта постоянных расходов (OPEX) и дополнительных доходов из раздела «Доходы и расходы».</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">При расчёте маржинальной прибыли вычитаются только переменные расходы на товары: <strong>себестоимость</strong>, <strong>накладные расходы</strong> и <strong>налог</strong>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Валовая маржинальность, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, какую долю от выручки составляет валовая прибыль. Может быть отрицательной и помогает оценить эффективность продаж.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Валовая прибыль / Выручка × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Рентабельность, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, какую долю от выручки составляет чистая прибыль. Чем выше показатель, тем эффективнее работают продажи и ниже влияние расходов на итоговую прибыль.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Чистая прибыль / Выручка × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля рекламы ДРР, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, какую часть выручки составляют расходы на рекламу. Метрика помогает оценивать эффективность рекламных кампаний и контролировать затраты на продвижение.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Расходы на рекламу / Выручка × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля логистики, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, какую часть выручки занимают логистические расходы. Показатель помогает отслеживать рост затрат на доставку и хранение товаров.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Логистика / Выручка × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля комиссии, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, сколько процентов от выручки уходит на комиссию маркетплейса. Метрика помогает оценить влияние комиссии площадки на прибыльность товаров.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Комиссия / Выручка × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Выручка, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Выручка после вычета возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажа - Возврат
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Выручка, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество проданных единиц товара после вычета возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Считается так же, как <strong>Выручка, руб.</strong>, но отображается в штуках.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Сумма расходов на МП, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Все удержания маркетплейсов: логистика, комиссия, штрафы и другие расходы.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Данные берутся из отчётов маркетплейсов и операций, загруженных в SelSup.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Итого к оплате по данным API, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма к выплате по данным маркетплейса.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Данные по API подтягиваются напрямую из маркетплейса.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Прочие расходы, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Расходы, внесённые вручную: зарплата, аренда и другие расходы.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берутся из раздела <strong>Финансы → Доходы и расходы</strong>.
<hr />
<p>Прочие расходы могут включать <strong>как расходы, так и доходы</strong>. Поэтому при прочих доходах чистая прибыль может быть выше валовой или даже стать положительной при отрицательной валовой.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Налог</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Расчётная сумма налога по выбранной системе налогообложения.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Ставка налога берётся из раздела <strong>Мои организации</strong>. Подробнее о формулах расчёта <a href="../nalogi/index.html">читайте в отдельной статье.</a></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Логистика</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Все расходы, которые относятся к логистике.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Для <strong>Wildberries</strong> в логистику входят:
<ul>
<li>логистика по России;</li>
<li>международная логистика;</li>
<li>услуги Поверенного: выдача и возврат товаров на ПВЗ;</li>
<li>НДС.</li>
</ul>
<p>Для <strong>Ozon</strong> в логистику входят:</p>
<ul>
<li>плата за обработку и доставку: логистика, услуга FBO без размещения, услуга FBS, последняя миля, НДС;</li>
<li>плата за возвраты и отмены: обработка возвратов, обработка частичного невыкупа, обработка отменённых и невостребованных товаров, обратная логистика.</li>
</ul></td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Товарная аналитика (юнит-экономика)

**Цветовая маркировка:**

- зелёный — показатель берется напрямую из отчетов;
- синий — показатель рассчитывается по формуле в SelSup.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Продажи и выручка

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество продаж товара за выбранный период.
<p>Если продажи в штуках = 0, но в продажах в рублях есть сумма, это может быть компенсация брака или возмещение издержек по перевозке.</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Возвраты, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество возвратов товара за выбранный период.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи - возвраты, шт.</strong> [в Excel]
<p><strong>Выручка, шт.</strong> [в интерфейсе]</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Чистое количество проданных единиц после вычета возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи, шт. - Возвраты, шт.
</td>
</tr>
<tr style="display: none !important; background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи в у.е.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Продажи в условных единицах. Используется, если товар учитывается не только в штуках или есть пересчет в единицы измерения.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи, шт. × коэффициент в у.е.
</td>
</tr>
<tr style="display: none !important; background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Возвраты в у.е.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Возвраты в условных единицах.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Возвраты, шт. × коэффициент в у.е.
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи - возвраты, у.е.</strong> [в Excel]
<p><strong>Выручка, у.е.</strong> [в интерфейсе]</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Чистые продажи в условных единицах после вычета возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи в у.е. - Возвраты в у.е.
</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Отмены, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество отмененных заказов за период. Используется в формуле процента выкупа для Wildberries.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма продаж в рублях за выбранный период.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Возвраты, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма возвратов в рублях за выбранный период.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Продажи - возвраты, руб.</strong> [в Excel]
<p><strong>Выручка, руб.</strong> [в интерфейсе]</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Выручка после вычета возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи, руб. - Возвраты, руб.
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Процент выкупа</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля выкупленных заказов с учетом возвратов и отмен.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
<strong>Wildberries:</strong>

<strong>% выкупа</strong> = Выкупы / (Выкупы + Отмены) × 100

Данные берутся из воронки продаж Wildberries: количество фактических выкупов и количество отмен.

<strong>Ozon:</strong>

<strong>% выкупа</strong> = Невозвращённые заказы / Все заказы × 100

Данные берутся из <a href="../otchyot-po-operatsiyam-s-marketplejsa/index.html">«Отчёта по операциям с маркетплейса»</a>.

<strong>Другие:</strong>

<strong>% выкупа</strong> = Продажи / (Продажи + Возвраты) × 100

Данные берутся из <a href="../otchyot-po-operatsiyam-s-marketplejsa/index.html">«Отчёта по операциям с маркетплейса»</a>.
</td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Расходы и выплаты маркетплейса

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Логистика, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма расходов на логистику по операциям маркетплейса.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.
<p>Для <strong>Wildberries</strong> в логистику входят:</p>
<ul>
<li>логистика по России;</li>
<li>международная логистика;</li>
<li>услуги Поверенного: выдача и возврат товаров на ПВЗ;</li>
<li>НДС.</li>
</ul>
<p>Для <strong>Ozon</strong> в логистику входят:</p>
<ul>
<li><strong>плата за обработку и доставку</strong>: логистика, услуга FBO без размещения, услуга FBS, последняя миля, НДС;</li>
<li><strong>плата за возвраты и отмены</strong>: обработка возвратов, обработка частичного невыкупа, обработка отмененных и невостребованных товаров, обратная логистика.</li>
</ul></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Платная приёмка, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Расходы на платную приемку товара маркетплейсом.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Комиссия, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Комиссия маркетплейса по продажам. В Товарной аналитике в этом показателе также учитывается эквайринг.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берётся из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.
<p><strong>На Wildberries комиссия может быть отрицательной из-за возмещения СПП:</strong> если СПП превышает комиссию, сумма превышения отражается как отрицательная комиссия или доначисление.</p>
<hr />
<p>В комиссии также учитывается <strong>эквайринг</strong>.</p>
<p>Поэтому эквайринг влияет на показатели, которые зависят от комиссии: <strong>«Итого к оплате»</strong>, <strong>«Средняя комиссия»</strong>, <strong>«Валовая прибыль»</strong> и <strong>«Средний расход по продаже на МП»</strong>.</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>СПП на WB, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Скидка постоянного покупателя Wildberries или ее компенсация площадкой.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.
<p>Влияет на расчет комиссии и итого к оплате.</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Штрафы, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Штрафы маркетплейса по конкретному товару.
<p>Если штраф не привязан к товару, он отображается в строке «Без карточки».</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доплаты, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доплаты или доначисления от маркетплейса.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.
<p>Прибавляются в формуле «Итого к оплате».</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Услуги, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Платные услуги маркетплейса.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Прочие начисления, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Прочие начисления от маркетплейса.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.
<p>Прибавляются в формуле «Итого к оплате».</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Платное хранение, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Расходы на платное хранение.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Реклама, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Расходы на рекламу.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>ДРР, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля рекламных расходов в выручке.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
(Расход на рекламу, руб. / Выручка, руб.) × 100

<p>Расчет производится только если <strong>Выручка &gt; 0</strong>. Если выручки нет, значение ДРР не рассчитывается.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Средний расход по продаже на МП на 1 ед. товара, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Средний расход маркетплейса на одну проданную единицу.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Сумма расходов / (Продажи - возвраты, шт.)

<p>Где <strong>сумма расходов</strong>:</p>

Логистика + Комиссия + Штрафы + Услуги + СПП на WB + Платное хранение + Доплаты + Реклама + Платная приёмка - Прочие начисления
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Итого к оплате, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма к выплате после вычета расходов маркетплейса и учета доплат/начислений.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи - возвраты, руб.<br />
- Логистика - Комиссия - Штрафы<br />
+ Доплаты - Услуги<br />
+ Прочие начисления - Платное хранение - Реклама - Платная приёмка
</td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Налоги

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 32%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Налог SelSup</th>
<th style="text-align: left; width: 68%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Для УСН «Доходы»</strong>
<ul>
<li>Налог, руб.</li>
<li>Налог + НДС, руб.</li>
</ul>
<p> </p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
<p><strong>НДС =</strong> Выручка × ставка НДС</p>
<p><strong>Налог, руб. =</strong> (Выручка − НДС) × ставка УСН</p>

<p><strong>Налог + НДС, руб.</strong> = Налог + НДС</p>

</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Для УСН «Доходы минус расходы»</strong>
<ul>
<li>Налог, руб.</li>
<li>Налог + НДС, руб.</li>
</ul></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
<strong>Если в настройках организации указана ставка НДС:</strong>

<p><strong>НДС</strong> = Выручка × ставка НДС / (1 + ставка НДС)</p>
<p><strong>Выручка без НДС</strong> = Выручка − НДС</p>
<p><strong>Расходы</strong> = Логистика + Комиссия + Штрафы + Услуги + Реклама + Хранение + Приёмка − Прочие начисления</p>
<p><strong>Налог, руб</strong> = большее из двух значений:<br />
1. (Выручка без НДС − Расходы) × ставка УСН<br />
2. Выручка без НДС × 1%</p>

<p><strong>Налог + НДС, руб</strong> = Налог + НДС</p>

<strong>Если ставка НДС не указана:</strong>

<p><strong>Расходы =</strong> Логистика + Комиссия + Штрафы + Услуги + Реклама + Хранение + Приёмка − Прочие начисления</p>
<p><strong>Налог, руб</strong> = большее из двух значений:<br />
1. (Выручка − Расходы) × ставка УСН<br />
2. Выручка × 1%</p>

<p><strong>Налог + НДС, руб</strong> = Налог</p>
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Для ОСНО</strong>
<ul>
<li>Налог, руб.</li>
<li>Налог + НДС, руб.</li>
</ul></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
<p><strong>Исходящий НДС</strong> = Выручка × ставка НДС / (1 + ставка НДС)</p>
<p><strong>Входящий НДС</strong> = Расходы × ставка НДС / (1 + ставка НДС)</p>
<p><strong>Итоговый НДС</strong> = Исходящий НДС − Входящий НДС, но не меньше 0</p>
<p><strong>Налог на прибыль</strong> = (Выручка − Итоговый НДС − Расходы) × 20%, но не меньше 0</p>

<p><strong>Налог + НДС, руб</strong> = Итоговый НДС + Налог на прибыль</p>
</td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Себестоимость

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Себестоимость единицы товара, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Себестоимость одной единицы товара на момент выгрузки отчета.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Закупочная цена + дополнительные расходы на товар

<p>На момент выгрузки отчёта SelSup.</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Закупочная цена проданного товара, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма закупочных цен проданных товаров.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доп. расходы на проданный товар, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Дополнительные расходы, приходящиеся на проданный товар.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Себестоимость проданного товара, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Себестоимость проданных товаров.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Закупочная цена проданного товара + дополнительные расходы на проданный товар

<p>Считается с учетом себестоимости товара на момент продажи, по схеме ФИФО. Если настройка ФИФО не включена, аналитика считается по последней себестоимости.</p></td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Кол-во не заполненных зак. цен, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество проданных единиц без заполненной закупочной цены.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>.</td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Остатки

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Товарный остаток FBS, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Текущий остаток товара на FBS-складах.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/productCurrent/">Отчёта по остаткам</a>.</td>
</tr>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Товарный остаток FBO, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Текущий остаток товара на всех FBO-складах маркетплейсов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/productCurrent/">Отчёта по остаткам</a>.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Общий товарный остаток, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Суммарный остаток FBS и FBO.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Товарный остаток FBS + Товарный остаток FBO
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Товарный остаток в зак. ценах, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Стоимость текущего остатка в закупочных ценах.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Себестоимость единицы товара × Общий товарный остаток

<p>Считается по текущей закупочной цене, без учета закупочной цены на момент поступления.</p></td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Прибыль и эффективность

<table style="width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 15px; line-height: 1.5;">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr>
<th style="text-align: left; width: 26%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Показатель SelSup</th>
<th style="text-align: left; width: 30%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Что означает</th>
<th style="text-align: left; width: 44%; border: 1px solid #d9dde5; background: #f5f7fb; padding: 12px 14px; vertical-align: top;">Формула / откуда берутся данные</th>
</tr>
</thead>
<tbody>
<tr style="background: #f3fbf5;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Самовыкупы, шт.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Количество единиц, отмеченных как самовыкуп.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Берется из <a href="https://selsup.ru/application/profitReport/">Отчёта по операциям с маркетплейса</a>, по операциям, вручную отмеченным пользователем как самовыкуп.</td>
</tr>
<tr style="display: none !important; background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Самовыкупы, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сумма стоимости товаров, отмеченных как самовыкуп.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Требует уточнения формулы.</td>
</tr>
<tr style="display: none !important; background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Средняя фактическая цена продажи, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Средняя цена продажи после возвратов.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи - возвраты, руб. / Продажи - возвраты, шт.
</td>
</tr>
<tr style="display: none !important; background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Фактическая наценка, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Наценка на товар.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Требует уточнения формулы.</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Валовая прибыль, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Прибыль до вычета налога и НДС.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Итого к оплате - Себестоимость проданного товара - Самовыкупы, руб.
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Чистая прибыль, руб.</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Прибыль после вычета налога и НДС.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Валовая прибыль - (Налог + НДС)

<p>Может совпадать с валовой прибылью, если налоговый режим не УСН «Доход».</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>ROI (Return on Investment)</strong> [только в интерфейсе]</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Показывает, насколько эффективно вложения в товар, рекламу, акции и другие расходы возвращаются в виде чистой прибыли.
<p><strong>Как использовать ROI в работе:</strong></p>
<ul>
<li>масштабировать товары, у которых ROI выше;</li>
<li>увеличивать закупки или продвижение товаров с высоким ROI;</li>
<li>выводить из продаж товары, у которых ROI стабильно ниже целевого значения, например ниже 5–10%;</li>
<li>проверять цену, скидки, себестоимость и расходы, если оборот растёт, а ROI снижается.</li>
</ul>
<p>Если ROI высокий, вложения в товар окупаются хорошо. Если ROI низкий, товар приносит мало прибыли относительно вложенных средств или не окупает вложения.</p></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
ROI = Чистая прибыль / (Закупочная цена проданного товара + Реклама + Прочие расходы) × 100%
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Маржинальность, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля валовой прибыли в выручке.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Валовая прибыль / Продажи - возвраты, руб. × 100

<p>Если валовая прибыль или выручка ≤ 0, в Excel ставится 0.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля логистики в структуре выручки, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Какая часть выручки ушла на логистику.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Логистика, руб. / Продажи - возвраты, руб. × 100

<p>Если выручка ≤ 0, ставится 0.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля в выручке, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля товара или группы в общей положительной выручке.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Продажи - возвраты, руб. / сумма положительной выручки по всем товарам за период × 100

<p>Если выручка отрицательная, доля = 0.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля в валовой прибыли, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля товара или группы в общей положительной валовой прибыли.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Валовая прибыль / сумма положительной валовой прибыли по всем строкам × 100

<p>Если валовая прибыль отрицательная, доля = 0.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Доля в товарном остатке, %</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Доля товара или группы в общей стоимости товарного остатка.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Товарный остаток в закупочных ценах / сумма положительных остатков в закупочных ценах × 100
</td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Эффективность по выручке</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сравнивает долю товара в выручке с долей товара в остатках.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Доля в выручке / Доля в товарном остатке

<p>Если доля в остатке = 0, в Excel ставится 1.</p>
<p>Больше 1 — товар дает выручки больше, чем занимает в остатке.</p></td>
</tr>
<tr style="background: #f4f8ff;">
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top"><strong>Эффективность по валовой прибыли</strong></td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">Сравнивает долю товара в валовой прибыли с долей товара в остатках.</td>
<td style="border: 1px solid #d9dde5; padding: 10px 14px; vertical-align: top">
Доля в валовой прибыли / Доля в товарном остатке

<p>Если доля в остатке = 0, в Excel ставится 1.</p>
<p>Больше 1 — товар эффективен по прибыли относительно остатка.</p></td>
</tr>
</tbody>
</table>

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как считается логистика в юнит-экономике

Логистика рассчитывается исходя из выбранного тарифа организации и габаритов товара. Тариф организации можно установить в разделе [**Настройки → Цены и акции → Организации**](https://selsup.ru/application/settings/prices).

При расчёте используются параметры, указанные в настройках, а также действующие правила маркетплейса для выбранной схемы работы. Подробнее о каждой настройке [можно узнать в нашей статье](../nastrojki-selsup/index.html).

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/2026.06.24_chrome_wxuy.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Формулы логистики Ozon:

**Прямая логистика Ozon FBO** = значение логистики из таблицы тарифов Ozon + наценка за нелокальную продажу (если есть) + стоимость доставки до места выдачи, руб.

Для расчёта логистики Ozon по схеме FBO сначала рассчитывается объём товара в литрах. Габариты берутся из карточки товара в SelSup, указанной на уровне размера. Если размеры не заполнены, используются данные с уровня модели.

**Формула объёма:**\
(Длина в см. × Ширина в см. × Высота в см.) / 1000 = Объём в литрах

Далее по [таблице тарифов Ozon](https://seller-edu.ozon.ru/libra/commissions-tariffs/commissions-tariffs-ozon/rashody-na-dostavku) определяется стоимость логистики в зависимости от объёма товара и цены продажи.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/browser_fvfl9hnyqb.png.webp)

Если для кластера доставки [действует наценка](https://seller-edu.ozon.ru/libra/commissions-tariffs/commissions-tariffs-ozon/rashody-na-dostavku) за нелокальную продажу, логистика увеличивается.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/browser_uwiwnb46po.png.webp)

**Формула наценки за нелокальную продажу:**\
Цена продажи × % наценки

Стоимость доставки до места выдачи, руб. можно посмотреть в настройках SelSup.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/04/browser_sp9pxwoxmd.png.webp)

**Пример расчёта:**\
Объём = 251050 / 1000 = 12,5 л\
Стоимость логистики по таблице тарифов Ozon для такого объёма = 192 руб.\
Наценка = 501 × 6% = 30 руб.\
Стоимость доставки до места выдачи = 25 руб.\
**Итоговая стоимость логистики = 247 руб.**

**Прямая логистика Ozon FBS** = логистика за объём и цену по таблице Ozon + стоимость доставки до места выдачи.

Важно: для FBS стоимость логистики зависит не только от габаритов, но и от цены товара. Для товаров стоимостью до 300 ₽ и свыше 300 ₽ Ozon применяет разные тарифные условия.

**Обратная логистика Ozon для FBO и FBS** = логистика за объём и цену по таблице Ozon.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Формулы логистики Wildberries:

**Прямая логистика Wildberries** рассчитывается исходя из литража товара, коэффициента склада, индекса локализации и индекса распределения продаж.

**Обратная логистика Wildberries** рассчитывается исходя только из литража товара. Коэффициент склада, индекс локализации и индекс распределения продаж в этом расчёте не применяются.

**Стоимость логистики до покупателя:**

**Для товара больше 1 л:**

(46 ₽ за 1 л + 14 ₽ за каждый доп. литр) × Коэффициент склада × ИЛ в день заказа + Цена товара × ИРП в день заказа

**Для товара меньше 1 л:**

Объём товара × Тариф за литр × Коэффициент склада × ИЛ в день заказа + Цена товара × ИРП в день заказа

**Тарифы для товаров меньше 1 л:**

- от 0,001 до 0,200 литра — 23 ₽ за литр;
- от 0,201 до 0,400 литра — 26 ₽ за литр;
- от 0,401 до 0,600 литра — 29 ₽ за литр;
- от 0,601 до 0,800 литра — 30 ₽ за литр;
- от 0,801 до 1,000 литра — 32 ₽ за литр.

**Обратная логистика**

46 ₽ за 1 л + 14 ₽ за каждый доп. литр

**Грузовая доставка (СГТ)**

(46 ₽ за 1 л + 14 ₽ за каждый доп. литр), но не менее 1000 ₽ и не более 3 000 ₽ × Коэффициент склада

**Логистика итого**

**Логистика итого** = ((доля выкупа × прямая логистика) + ((1 - доля выкупа) × (прямая логистика + обратная логистика))) / доля выкупа

Пример расчёта для товара объёмом 0,85 л

Объём товара — **0,85 л**.

Объём 0,85 л попадает в диапазон **0,801–1,000 л**, значит тариф составляет **32 ₽ за литр**.

0,85 × 32 ₽ = 27,20 ₽

Базовая стоимость логистики составляет **27,20 ₽**.

Если товар продаётся со склада с коэффициентом логистики **120%**, индекс локализации равен **1,1**, цена товара — **1000 ₽**, а ИРП — **2%**, то прямая логистика рассчитывается так:

27,20 ₽ × 1,2 × 1,1 + 1000 ₽ × 2% = 35,90 ₽ + 20 ₽ = 55,90 ₽

Если считать обратную логистику, используется только базовая стоимость по объёму. Коэффициент склада, индекс локализации и ИРП в обратной логистике не применяются.

Обратная логистика = 27,20 ₽

Пример расчёта для товара объёмом 1,5 л

Объём товара — **1,5 л**.

Для товаров свыше 1 литра стоимость рассчитывается так:

- **46 ₽** — за первый литр;
- **14 ₽** — за каждый дополнительный литр.

Для товара объёмом 1,5 л расчёт будет таким:

46 ₽ + 0,5 × 14 ₽ = 46 ₽ + 7 ₽ = 53 ₽

Базовая стоимость логистики составляет **53 ₽**.

Если товар продаётся со склада с коэффициентом логистики **120%**, индекс локализации равен **1,1**, цена товара — **1000 ₽**, а ИРП — **2%**, то прямая логистика рассчитывается так:

53 ₽ × 1,2 × 1,1 + 1000 ₽ × 2% = 69,96 ₽ + 20 ₽ = 89,96 ₽

Если считать обратную логистику, используется только базовая стоимость по объёму:

Обратная логистика = 53 ₽

**Важно:** в примерах используются условные тарифы. Актуальные ставки подставляются автоматически из настроек вашей организации в разделе **Настройки → [Цены и акции](https://selsup.ru/application/settings/prices)**.
