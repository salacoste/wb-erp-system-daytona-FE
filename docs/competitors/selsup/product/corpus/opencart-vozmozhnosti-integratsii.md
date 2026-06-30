---
title: 'OpenCart. Возможности интеграции'
slug: opencart-vozmozhnosti-integratsii
source: https://selsup.ru/help/opencart-vozmozhnosti-integratsii/
chars: 2893
---

# OpenCart. Возможности интеграции

В этой статье расскажем, какие возможности дает интеграция SelSup с OpenCart.

Интеграция позволяет связать товары SelSup с товарами интернет-магазина на OpenCart, передавать остатки, импортировать заказы и работать с ними в SelSup.

В этой статье:

- 
- <a href="#podklyuchenie-integratsii" rel="nofollow">Подключение интеграции</a>
- <a href="#svyaz-tovarov-selsup-s-tovarami-opencart" rel="nofollow">Связь товаров SelSup с товарами OpenCart</a>
- <a href="#rabota-po-fbs" rel="nofollow">Работа по FBS</a>
- <a href="#peredacha-ostatkov" rel="nofollow">Передача остатков</a>

## Подключение интеграции

Для подключения интеграции с OpenCart нужно установить в OpenCart платное расширение **REST Admin API**.

После установки расширения скопируйте данные для подключения:

- **Адрес сайта**;
- **Ключ API**.

Затем перейдите в SelSup в раздел **Настройки → Интеграции → [OpenCart](https://selsup.ru/application/integration/opencart)** и вставьте **Адрес сайта** и **Ключ API** в соответствующие поля.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2026/06/screenshot_243.png.webp)

После сохранения настроек SelSup сможет обмениваться данными с интернет-магазином на OpenCart.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Связь товаров SelSup с товарами OpenCart

Для корректной работы интеграции нужно связать товары SelSup с товарами OpenCart.

Для проставления связи достаточно запустить импорт товаров из OpenCart на странице **Товары - [Импорт товаров.](https://selsup.ru/application/productsImport/) **

После связи товаров можно работать с остатками и заказами OpenCart в SelSup вместе с другими каналами продаж.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Работа по FBS

С интеграцией OpenCart в SelSup можно работать по схеме FBS.

При работе по FBS товары хранятся на вашем складе. После поступления заказа вы собираете товар и передаете его для дальнейшей доставки покупателю.

В SelSup можно импортировать заказы из OpenCart и обрабатывать их в модуле [**Умный склад**](../../help_cat/modul-umnyj-sklad/index.html): собирать заказы, контролировать остатки и отслеживать обработку.

Подробнее о работе с FBS-заказами рассказали в статье [Как собирать заказы со своего склада по FBS](../sborka-fbs/index.html).

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Передача остатков

Интеграция поддерживает передачу остатков из SelSup в OpenCart.

Это помогает поддерживать актуальное количество товаров в интернет-магазине и управлять остатками в одном окне вместе с другими каналами продаж.

Для корректной передачи остатков нужно настроить склады и связать товары SelSup с товарами OpenCart.

Подробнее о настройке складов и передаче остатков рассказали в статье [Настройка склада и перенос остатков по FBS](../perenos-ostatkov/index.html).
