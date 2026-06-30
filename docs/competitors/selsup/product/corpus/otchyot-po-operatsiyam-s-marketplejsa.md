---
title: 'Отчет по операциям с маркетплейса'
slug: otchyot-po-operatsiyam-s-marketplejsa
source: https://selsup.ru/help/otchyot-po-operatsiyam-s-marketplejsa/
chars: 5722
---

# Отчет по операциям с маркетплейса

В этой статье расскажем вам про Отчет по операциям с маркетплейса в SelSup, как с ним работать и для чего он нужен.

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

В этой статье:

- 
- <a href="#zachem-nuzhen-dannyj-otchet" rel="nofollow">Зачем нужен данный отчет</a>
- <a href="#filtry-i-poisk" rel="nofollow">Фильтры и поиск</a>
- <a href="#interfejs-otcheta" rel="nofollow">Интерфейс отчета</a>
- <a href="#otchet-v-excel" rel="nofollow">Отчет в Excel</a>
- <a href="#gde-otchet-beret-dannye-o-zakupochnoj-tsene" rel="nofollow">Где отчет берет данные о закупочной цене</a>

Чтобы перейти в этот отчет откройте раздел [Аналитика и финансы-Отчёты](https://selsup.ru/application/reports/) и выберите отчет [Отчет по операциям с маркетплейса](https://selsup.ru/application/profitReport/).\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/screenshot_305.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Зачем нужен данный отчет

[Отчет по операциям с маркетплейса](https://selsup.ru/application/profitReport/) нужен для того, чтобы просматривать сырые данные с маркетплейсов, для проверки данных других отчетов, а также для поиска нужной информации - все данные в одном месте со всех площадок.

Данные в отчёт подгружаются автоматически по API. Так же Вы можете самостоятельно импортировать отчёты маркетплейсов, соблюдая все шаги инструкции, через раздел [Аналитика и финансы-Аналитика и финансы-История загрузки отчётов-Импорт](https://selsup.ru/application/analytics/fileImport)

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/screenshot_28.png.webp)![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/screenshot_29.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Фильтры и поиск

Отчет можно фильтровать по:

- Периоду за который хотите просматривать данные;
- Организации;
- Маркетплейсу;
- Типу операции (*продажи, возвраты, Логистика WB, Сервисы Ozon, штрафы, реклама, хранение, удержания, авансовая оплата за товар без движения*), например, если выбрать Хранение, тогда отобразятся только те товары, по которым были совершены операции по хранению.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/skrin-v-rajter.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Интерфейс отчета

Для работы с отчетом укажите нужные фильтры и в таблице ниже отобразятся все операции на маркетплейсах по указанным фильтрам и информация по ним.

‎Операции привязаны к товару, если есть связь карточки товара в SelSup с маркетплейсом. Если связи нет, то привязки не будет и SelSup не обнаружит у себя такой товар, в таком случае включите переключатель ***«‎Без карточки»‎***.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/skrin-v-rajter-bez-kartochki.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Отчет в Excel

Отчет можно просматривать как в интерфейсе, так и в Excel - файле, чтобы скачать файл, нажмите ***«Скачать в Excel‎»***.\
В скачанном файле вы увидите ту же информацию, что и в интерфейсе, но дополнительно через отчет в Excel Вы можете поменять статус заказа на Самовыкуп, если были такие заказы, чтобы по ним не считалась прибыль и аналитика была более точной.\
Для этого в скачанном Excel - файле в колонке «‎Самовыкуп» проставьте ***«‎ДА»***.‎ ‎

Также Вы можете поменять Закупочную цену на момент операции и указать Прочие расходы на момент операции. В Excel - файле в последних зеленых колонках указываются эти данные и загружаются обратно через кнопку – ***«‎Импорт‎»***‎.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/samovikup.png.webp)

Подробно о терминах и формулах, используемых в аналитических отчетах, рассказали в этой **[статье](../terminy-i-formuly-v-analitike/index.html)**.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Где отчет берет данные о закупочной цене

В Отчете по операциям закупочная цена автоматически берется из данных заказа. Разберемся, откуда именно:

**Найдите нужный заказ**

- Возьмите номер заказа изотчета и перейдите в раздел **Заказы на отгрузку → [Со своего склада (FBS)](https://selsup.ru/application/fbsOrders/?ascending=true&limit=100&page=1&sortBy=CREATED&status=CREATED&type=FBS)**[.](https://selsup.ru/application/fbsOrders/?ascending=true&limit=100&page=1&sortBy=CREATED&status=CREATED&type=FBS)
- Откройте заказ, нажав на его номер.

**Проверьте резерв **

- В заказе найдите колонку **Резерв** и кликните на цифру в ней.
- В появившемся окне нажмите на **ID**, чтобы перейти к детальной информации.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/screenshot_17.png.webp)

**Откуда берется закупочная цена?**

- На открывшейся странице вы увидите **«Закупочную цену»** и **«Доп. расходы»**.
- Эти данные и составляют себестоимость, которая затем попадает в **Отчет по операциям**.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2023/09/screenshot_18.png.webp)

Если закупочная цена в отчете не отображается, перейдите в раздел **Настройки - [Мои организации](https://selsup.ru/application/organizations/)** и в столбце **Связи карточек** запустите задачу. Она проставит закупочные цены, если закупочная цена указана в товаре. После выполнения задачи данные подтянутся в отчет.

**[На главную статью по аналитике и финансовому учету в SelSup](../vnutrennyaya-analitika-v-selsup/index.html).**
