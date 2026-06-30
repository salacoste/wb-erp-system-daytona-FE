---
title: 'Интеграция с 1C'
slug: integratsiya-s-1c
source: https://selsup.ru/help/integratsiya-s-1c/
chars: 3827
---

# Интеграция с 1C

В этой статье расскажем вам, какие способы интеграций с 1С существуют в SelSup, как ее настраивать, какие особенности и возможности есть при интеграции SelSup с 1С.\

В этой статье:

- 
- <a href="#sposoby-integratsij" rel="nofollow">Способы интеграций</a>
- <a href="#1s-upravlenie-torgovlej-10-3" rel="nofollow">1с Управление торговлей 10.3</a>
- <a href="#1s-upravlenie-torgovlej-s-11" rel="nofollow">1с Управление торговлей с 11</a>
- <a href="#1s-upravlenie-nashej-firmoj-do-3-0" rel="nofollow">1с Управление нашей фирмой до 3.0</a>
- <a href="#1c-upravlenie-nashej-firmoj-ot-3-0" rel="nofollow">1C Управление нашей фирмой от 3.0</a>
- <a href="#1s-buhgaletriya-3-0" rel="nofollow">1с Бухгалетрия 3.0</a>
- <a href="#opisanie-protokola" rel="nofollow">Описание протокола</a>

## Способы интеграций

Настройте обмен данными между 1С и SelSup, чтобы передавать товары в SelSup и обмениваться остатками, ценами и заказами.

**1 способ:** интеграция SelSup с 1С с использованием модуля, т.е. вы можете использовать специальное расширение SelSup для вашей конфигурации 1С. [Подробная помощь по расширению SelSup для 1С на странице](../../help_cat/modul-1c/index.html)

**2 способ:** SelSup поддерживает обмен по стандартному протоколу CommerceML версий 1 и 2. SelSup подключается к 1С как интернет-сайт.  Мы не рекомендуем использовать данный обмен, из-за проблем с резервированием остатков (модуль 1с сообщает в SelSup о создании заказа и необходимости не учитывать резерв при последующих передачах остатков в отличие от интеграции с сайтом) и проблем с автоматическим созданием реализаций в 1С и отмены заказов в 1С (автоматическое создание реализаций не поддерживается, как и отмены заказов).

Этот способ подходит **только для устаревших, давно не обновляемых или сильно кастомизированных конфигураций 1С**, где невозможно установить модуль SelSup.

В статье ниже приведены версии 1С и ссылки на инструкции по подключению именно **2 способа.**

Внимание! Если вы настраиваете регулярный обмен товарами, необходимо настроить отправку только изменяющихся данных и обмен должен быть не чаще 1 раза в час. При создании избыточной нагрузки ваш ключ может быть отозван автоматически

**Выберите вашу конфигурацию 1С и настройте интеграцию:**

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### [1с Управление торговлей 10.3](../integratsiya-s-1s-upravlenie-torgovlej-10-3/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### [1с Управление торговлей с 11](../integratsiya-s-1s-upravlenie-torgovlej-11/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### [1с Управление нашей фирмой до 3.0](../integratsiya-s-1s-upravlenie-nashej-firmoj/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### [1C Управление нашей фирмой от 3.0](../integratsiya-s-1s-upravlenie-nashej-firmoj-ot-3-0/index.html)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### 1с Бухгалетрия 3.0

Перейдите в раздел Администрирование, Настройка обмена с интернет-сайтом или выберите в меню Сервис - Настройка обмена с WEB-сайтом.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/09/snimok.png.webp)

В открывшейся форме выберите CMS Магазина: Прочее, Адрес сайта, Логин и Пароль скопируйте из формы выше.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/09/snimok2.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

### Описание протокола

https://v8.1c.ru/tekhnologii/obmen-dannymi-i-integratsiya/standarty-i-formaty/protokol-obmena-s-saytom/

https://v8.1c.ru/tekhnologii/obmen-dannymi-i-integratsiya/standarty-i-formaty/standarty-commerceml/commerceml-2/
