---
title: 'Настройка интеграции сайта на 1С Bitrix с SelSup'
slug: nastrojka-integratsii-sajta-na-1s-bitrix-s-selsup
source: https://selsup.ru/help/nastrojka-integratsii-sajta-na-1s-bitrix-s-selsup/
chars: 9075
---

# Настройка интеграции сайта на 1С Bitrix с SelSup

В данной инструкции вы найдете как настроить интеграцию интернет-магазина на 1С Битрикс с SelSup, для автоматического обновления каталогом товаров, остатками и ценами. Интеграция происходит по стандартному протоколу CommerceML, которая поддерживается большинством версий 1С

Для настройки интеграции у вас должна быть версия 1С Битрикс, которая поддерживает интернет-магазин.

В этой статье:

- 
- <a href="#chto-vazhno-znat-pered-nastrojkoj" rel="nofollow">Что важно знать перед настройкой</a>
- <a href="#sozdanie-gruppy-i-polzovatelya-v-1s-bitriks" rel="nofollow">Создание группы и пользователя в 1С-Битрикс</a>
- <a href="#nastrojka-integratsii-v-selsup" rel="nofollow">Настройка интеграции в SelSup</a>
- <a href="#nastrojka-obmena-v-1s-bitriks-commerceml" rel="nofollow">Настройка обмена в 1С-Битрикс (CommerceML)</a>
- <a href="#kak-proishodit-sopostavlenie-tovarov" rel="nofollow">Как происходит сопоставление товаров</a>
- <a href="#kak-zagruzit-kartochki-iz-bitrix-v-selsup-cherez-yml" rel="nofollow">Как загрузить карточки из Bitrix в SelSup (через YML)</a>
- <a href="#vygruzka-zakazov-v-selsup" rel="nofollow">Выгрузка заказов в SelSup</a>
- <a href="#gde-posmotret-zakazy-iz-internet-magazina-v-selsup" rel="nofollow">Где посмотреть заказы из интернет-магазина в SelSup?</a>
- <a href="#kak-ustroena-rabota-s-bitriks" rel="nofollow">Как устроена работа с Битрикс?</a>
- <a href="#oshibki-obmena" rel="nofollow">Ошибки обмена</a>

## Что важно знать перед настройкой

- В разделе **SelSup → Настройки → Интеграции → 1С Bitrix** работает **выгрузка карточек из SelSup в Bitrix** (чтобы карточки связались и по ним дальше передавались **остатки и заказы**).

- **Выгрузить карточки из Bitrix в SelSup через CommerceML нельзя** — загрузка карточек из Bitrix в SelSup выполняется **только по YML**.

- Чтобы обмен был корректным, необходимо настроить **сопоставление карточек** на стороне Bitrix (см. раздел 5).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Создание группы и пользователя в 1С-Битрикс

**Создайте группу пользователей**

В административной панели сайта перейдите в раздел **Настройки → Группы пользователей → нажмите Добавить группу**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-13.13.54.png.webp)

Заполните название новой группы пользователей, например SelSup и нажмите сохранить

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-13.15.44.png.webp)

**Создайте пользователя**

В административной панели ваше сайта перейдите в раздел **Настройки → Список пользователей → ** нажмите **Добавить пользователя**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-12.27.17.png.webp)

Заполните данные нового пользователя, запомните логин и пароль - их необходимо будет указать на странице интеграции в SelSup. Укажите группу новому пользователю, которую вы добавили на первом шаге, чтобы добавить пользователя в эту группу

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-12.29.50.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка интеграции в SelSup

На [странице интеграции с 1С Bitrix](https://selsup.ru/application/integration/bitrix) в SelSup, укажите адрес, логин и пароль, которые вы заполнили в форме добавления нового пользователя Bitrix. Адрес сайта указывается в следующем формате: {ваш домен}/bitrix/admin/1c_exchange.php Например для домена https://test.ru необходимо указать https://test.ru/bitrix/admin/1c_exchange.php

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-12.34.11.png.webp)

На странице интеграции SelSup **обязательно заполните поле “Название инфо-блока”**.\
Если вы не знаете точное название — уточните его у ваших разработчиков / администратора Bitrix.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2026/02/screenshot_116.png.webp)

Включите переключатели Выгружать каталог товаров или Выгружать цены и остатки, в зависимости от того, какие данные вы хотите выгружать на сайт.

Не включайте Выгружать каталог товаров - если сайт уже действующий, пока не настроете полностью работу с Bitrix.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Настройка обмена в 1С-Битрикс (CommerceML)

Далее переходим в раздел Магазин -\> Интеграция с 1С в панели администрирования Bitrix

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-12.36.48.png.webp)

**Настройка импорта**

Настройте, как вы хотите импортировать товары, если хотите создавать новые товары в 1С из SelSup. Выберите группу пользователей, которую вы до этого добавили в поле "Разрешить загрузку группам пользователей"

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-13.18.20.png.webp)

На вкладке Экспорт каталога выполните настройку, если вы хотите загружать в SelSup карточки из 1С Bitrix и как из загружать, в какой инфо-блок

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-13.22.05.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как происходит сопоставление товаров

Сопоставление — ключевой момент для корректной передачи остатков и заказов.

- SelSup передаёт в 1С-Битрикс данные по товарам по **ID товара**.

- На стороне 1С-Битрикс необходимо **настроить сопоставление карточек** (чтобы Bitrix понимал, какой товар SelSup соответствует товару на сайте).

- После настройки сопоставления обмен будет происходить **по установленным связям**.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как загрузить карточки из Bitrix в SelSup (через YML)

Если вам нужно **загрузить товары из Bitrix в SelSup**, это делается **не через интеграцию CommerceML**, а через **YML**.

В SelSup откройте: **Товары → Импорт товаров → [YML](https://selsup.ru/application/productsImport/yml)**

**Что нужно сделать:**

1.  Сформировать **YML-ссылку с каталогом товаров** в панели администрирования 1С-Битрикс

2.  Вставить эту ссылку в SelSup в разделе импорта YML и выполнить импорт

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Выгрузка заказов в SelSup

Далее необходимо настроить выгрузку заказов, если вы хотите, чтобы новые заказы с интернет-магазина поступали в SelSup, резервировали остатки

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-21-v-13.23.54.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Где посмотреть заказы из интернет-магазина в SelSup?

Чтобы видеть розничные заказы в SelSup, сначала нужно сделать настройки.

Зайти в  — Настройки - [Заказы](https://selsup.ru/application/settings/orders).

Включить тумблер Работать с розничными заказами.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/04/screenshot_95.png.webp)

После этого в Заказах на отгрузку появится новый раздел — Розничный.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/04/screenshot_96.png.webp)

В этом разделе отображаются заказы из интернет-магазина.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Как устроена работа с Битрикс?

Порядок работы с Битрикс аналогичный с 1С. SelSup отправляет остатки. На сайте они изменяются. В ответ SelSup получает заказы с сайта — интернет-магазина, который работает на Битрикс.

С Битрикс используется тот же протокол, что с 1С.

При синхронизации с 1С SelSup выступает в роли сайта. При интеграции с интернет-магазином SelSup выполняет роль 1С: он передаёт остатки на сайт и получает оттуда заказы.

Если у пользователя была прямая интеграция 1С и Битрикс, то SelSup можно добавить в качестве промежуточного звена. Тогда из 1С в SelSup будут поступать остатки. Быстрая интеграция с маркетплейсами и с интернет-магазином будет через SelSup.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Ошибки обмена

Если при обмене возникли следующие ошибки:

**Ошибка проверки источника запроса. обновите модуль обмена**

Зайдите в административную панель Bitrix, Настройки -\> Командная php-строка

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-23-v-09.05.49.png.webp)

Вставьте и нажмите выполнить следующий код:

> COption::SetOptionString("catalog", "DEFAULT_SKIP_SOURCE_CHECK", "Y"); 
>     COption::SetOptionString("sale", "secure_1c_exchange", "N");

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/06/snimok-ekrana-2023-06-23-v-09.05.38.png.webp)
