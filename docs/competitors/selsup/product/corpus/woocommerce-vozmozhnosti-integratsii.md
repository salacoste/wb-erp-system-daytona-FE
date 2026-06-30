---
title: 'WooCommerce. Возможности интеграции'
slug: woocommerce-vozmozhnosti-integratsii
source: https://selsup.ru/help/woocommerce-vozmozhnosti-integratsii/
chars: 5358
---

# WooCommerce. Возможности интеграции

В этой статье вы узнаете, как подключить интеграцию с WooCommerce, обмениваться заказами, остатками и товарами.

В этой статье:

- 
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#import-kartochek" rel="nofollow">Импорт карточек</a>
- <a href="#sozdanie-kartochek-tovarov-cherez-selsup" rel="nofollow">Создание карточек товаров через Selsup</a>
- <a href="#sinhronizatsiya-ostatkov-s-woocommerce" rel="nofollow">Синхронизация остатков с WooCommerce</a>
- <a href="#rabota-s-zakazami-fbs" rel="nofollow">Работа с заказами FBS</a>

## Настройка интеграции

Подробно про настройку интеграции с Webasyst рассказываем [тут](../integratsiya-s-woocommerce/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Импорт карточек

Чтобы начать работу, перенесите существующие объявления в SelSup.

Подробно про импорт карточек из WooCommerce в SelSup в этой [инструкции](../import-tovarov-iz-woocommerce/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Создание карточек товаров через Selsup

Создание карточек товаров в WooCommerce из SelSup невозможно.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Синхронизация остатков с WooCommerce

Данный функционал реализован в **Модуле Умный склад**. Он обеспечивает синхронизацию, сборку и маршрутизацию товаров, интеграцию со службами доставки, видеофиксацию для защиты от потребительского терроризма и адресное хранение остатков. Подробнее о возможностях модуля читайте [здесь](../../help_cat/modul-umnyj-sklad/index.html).

**Важно:** Напрямую импортировать остатки из WooCommerce в SelSup нельзя. Однако вы можете отправлять актуальные остатки **из SelSup в ваш магазин WooCommerce**.

Не нужно проставлять связь со складом в WooCommerce — у них нет отдельного склада. Все остатки передаются напрямую в карточку товара. SelSup синхронизирует актуальное количество, и этого достаточно для корректного отображения остатков в вашем магазине.

Это можно сделать двумя способами:

**1. Через раздел «Склад» → [«Остатки на складе»](https://selsup.ru/application/stocks/stocks?ascending=false&deleted=false&limit=200&modelId&query=&sortBy=CREATEDDATE&uniqSku=true)**

- Найдите нужный товар в списке и включите переключатель **«Обновлять на маркетплейсе».**

- Укажите актуальное количество в столбце **«Остатки»**.

- Нажмите на **синюю галочку** напротив остатка, чтобы отправить его в WooCommerce.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_10-1.png.webp)

**2. Через карточку товара**

- Откройте карточку нужного товара.

- Перейдите во вкладку **«Остатки»**.

- Укажите остаток и так же нажмите на **синюю галочку** для отправки в WooCommerce.

**3. Через Импорт с обновлением остатков**

- В разделе **Настройки → [Мои организации](https://selsup.ru/application/organizations/)**[ ](https://selsup.ru/application/organizations/)для автоматической синхронизации остатков необходимо активировать опцию **«Синхронизация остатков»**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_5.png.webp)

- После включения этой настройки выполните **Импорт с обновлением остатков**, и остатки товаров будут автоматически переданы из SelSup в WooComerse.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_7-1.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Работа с заказами FBS

**Импорт заказов:**

В разделе **«Настройки» → «Интеграции» → [«WooCommerce»](https://selsup.ru/application/integration/woocommerce)** теперь доступно сопоставление статусов заказов. Вы можете настроить соответствие статусов между вашим магазином WooCommerce и SelSup.

Например, статус **«Ожидает оплаты»** в WooCommerce можно связать со статусом **«Новый»** в SelSup, и аналогично для других статусов.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_9-1.png.webp)

**Как загрузить заказы:**

1.  Перейдите в раздел **«Заказы на отгрузку» → [«Со своего склада (ФБС)»](https://selsup.ru/application/fbsOrders/?ascending=true&limit=100&page=1&sortBy=CREATED&status=CREATED&type=FBS)**[.](https://selsup.ru/application/fbsOrders/?ascending=true&limit=100&page=1&sortBy=CREATED&status=CREATED&type=FBS)

2.  Нажмите кнопку **«Импорт заказов»** для загрузки новых заказов.

В момент импорта заказа товарный остаток по нему **автоматически резервируется**.

**Важно: для корректной работы импорта заказов и синхронизации остатков в разделе\
«Настройки → [Мои организации](https://selsup.ru/application/organizations/)» должны быть включены ОБЕ настройки:**

- **Синхронизировать остатки** — отвечает за передачу остатков в WooCommerce;

- **Автоматический импорт заказов FBS** — отвечает за автоматический импорт заказов.

**Если включена только одна из настроек, импорт заказов и синхронизация остатков не будет работать.**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/image-3.png.webp)

Автоматический импорт заказов выполняется фоновым заданием по расписанию (примерно один раз в 2 минуты).

Как собирать Заказы со своего склада FBS рассказали в [статье](../sborka-fbs/index.html).
