---
title: 'Интеграция с WooCommerce'
slug: integratsiya-s-woocommerce
source: https://selsup.ru/help/integratsiya-s-woocommerce/
chars: 3705
---

# Интеграция с WooCommerce

В этой статье мы расскажем вам, как настроить интеграцию с WooCommerce**.**

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

В этой статье:

- 
- <a href="#nastrojka-integratsii" rel="nofollow">Настройка интеграции</a>
- <a href="#sopostavlenie-statusov-zakazov" rel="nofollow">Сопоставление статусов заказов</a>
- <a href="#udalenie-integratsii" rel="nofollow">Удаление интеграции</a>
- <a href="#udalenie-organizatsii" rel="nofollow">Удаление организации</a>
- <a href="#vse-vozmozhnosti-integratsii-s-woocommerce" rel="nofollow">Все возможности интеграции с WooCommerce</a>

## Настройка интеграции

**Шаг 1. Перейдите в раздел интеграций в SelSup**

В личном кабинете **SelSup** откройте раздел **«Настройки» → «Интеграции»**. Найдите в списке **WooCommerce** и нажмите кнопку **«Настроить»**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_2.png.webp)

**Шаг 2. Активируйте интеграцию**

В открывшемся окне просто передвиньте переключатель **«Включить интеграцию с WooCommerce»** в активное положение.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_1.png.webp)

**Шаг 3. Заполните данные из вашего магазина WooCommerce**

Вам понадобятся три элемента данных из админки вашего магазина.

**Домен магазина**

- Зайдите в WordPress: **«Настройки» → «Общие»**.
- Скопируйте **«Адрес WordPress (URL)»** и вставьте его в поле «Домен магазина» в **SelSup**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_4.png.webp)

**Ключ потребителя и Секретный ключ**

- В админке WooCommerce перейдите: **«WooCommerce» → «Настройки» → «Дополнительно» → «REST API»**.
- Нажмите **«Создать API-ключ»** (или «Добавить ключ»).
- Дайте ключу понятное имя (например, «Интеграция с SelSup»).
- **Важно:** Установите права доступа **«Чтение/Запись»**.
- Нажмите **«Генерировать ключ API»**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_4-1.png.webp)

**Шаг 4. Скопируйте и вставьте ключи в SelSup**

После генерации вы увидите два значения:

- **Пользовательский ключ**

- **Секретный код пользователя **

Скопируйте и вставьте их в соответствующие поля в настройках интеграции в **SelSup**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_49-1.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Сопоставление статусов заказов

В разделе **«Настройки» → «Интеграции» → [«WooCommerce»](https://selsup.ru/application/integration/woocommerce)** теперь доступно сопоставление статусов заказов. Вы можете настроить соответствие статусов между вашим магазином WooCommerce и SelSup.

Например, статус **«Ожидает оплаты»** в WooCommerce можно связать со статусом **«Новый»** в SelSup, и аналогично для других статусов.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2025/11/screenshot_9-2.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление интеграции

Как удалить интеграцию с сервисами и маркетплейсами рассказали [тут](../udalenie-klyucha-api/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Удаление организации

Как удалить организацию из SelSup рассказали [здесь](../kak-udalit-organizatsiyu/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Все возможности интеграции с WooCommerce

Если вам интересно узнать обо всех возможностях - [читайте здесь.](../woocommerce-vozmozhnosti-integratsii/index.html)
