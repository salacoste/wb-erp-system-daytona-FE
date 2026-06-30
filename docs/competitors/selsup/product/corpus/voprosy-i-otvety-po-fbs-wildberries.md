---
title: 'Вопросы и ответы по FBS'
slug: voprosy-i-otvety-po-fbs-wildberries
source: https://selsup.ru/help/voprosy-i-otvety-po-fbs-wildberries/
chars: 4897
---

# Вопросы и ответы по FBS

В этой статье:

- 
- <a href="#pochemu-zakazy-v-liste-sborki-i-v-razdele-zakazy-na-otgruzku-mogut-otl" rel="nofollow"><strong>Почему заказы в листе сборки и  в разделе Заказы на отгрузку могут отличаться количеством?</strong></a>
- <a href="#v-selsup-oprihodovalis-na-sklad-ostatki-ne-na-vse-pozitsii-importirova" rel="nofollow"><strong>В SelSup оприходовались на склад остатки не на все позиции импортированных товаров, почему?</strong></a>
- <a href="#na-stranitse-zakazy-na-otgruzku---so-svoego-sklada-otobrazhaetsya-oshi" rel="nofollow"><strong>На странице Заказы на отгрузку - Со своего склада  отображается ошибка: <em>"Для заказов "123..." не загружены этикетки.</em></strong></a>
- <a href="#pochemu-ostatki-v-razdele-tovary-razlichayutsya-ot-ostatkov-v-razdele-" rel="nofollow"><strong>Почему остатки в разделе Товары различаются от остатков в разделе Остатки на складе?</strong></a>
- <a href="#pochemu-v-razdele-zakazy-na-otgruzku-so-svoego-sklada-fbs-dlya-zakazov" rel="nofollow"><strong>Почему в разделе «Заказы на отгрузку → Со своего склада FBS» для заказов Яндекс.Маркета ставится определенный склад?</strong></a>

#### **Почему заказы в листе сборки и  в разделе [Заказы](https://selsup.ru/application/fbsOrders/?ascending=true&count=true&limit=100&service=OZON&sortBy=DELIVERYDATE&status=CREATED&type=FBS) на отгрузку могут отличаться количеством?**

Если вы столкнулись с тем, что видите разное количество в листе сборки и в новых заказах, вам нужно отфильтровать нужную дату доставки и нажать кнопку "обновить статусы и этикетки заказов".\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/12/obnovit-i-data.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### **В SelSup оприходовались на склад остатки не на все позиции импортированных товаров, почему?**

Такое могло произойти если во время переноса остатков из маркетплейса, через раздел [Приёмка на склад ](https://selsup.ru/application/incomeOrders/) или [Перенос остатков](https://selsup.ru/application/importStocks/) возникали ошибки, необходимо чтоб остатки товаров из маркетплейсов были перенесены без ошибок.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### **На странице [Заказы на отгрузку - Со своего склада  ](https://selsup.ru/application/fbsOrders/)отображается ошибка: *"Для заказов "123..." не загружены этикетки.***

***Отфильтруйте заказы с фильтром Без этикетки и нажмите кнопку "Загрузить этикетки", пока в таблице не останется заказов. После запустите скачивание ленты еще раз."* Но этикетка для этих заказов уже получена, а заказ собран / в пути. Почему такое произошло, как убрать отображение ошибки?\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/12/oshibka.jpg.webp)\**
У заказов в пути загрузить этикетку нельзя, но чтобы убрать отображение ошибки, выберете любой заказ с этикеткой и нажмите кнопку ***"Загрузить этикетки".\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/12/zagruzit-etiketki.png.webp)***

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### **Почему остатки в разделе [Товары](https://selsup.ru/application/products) различаются от остатков в разделе [Остатки на складе?](https://selsup.ru/application/stocks/)**

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/12/screenshot_235.png.webp)\
В разделе [Товары](https://selsup.ru/application/products) остатки временные, поэтому они не должны на 100% совпадать с остатками, которые показаны в разделе [Остатки на складе](https://selsup.ru/application/stocks/).\
Если Вы увидели расхождения, можно обновить остатки в [настройках товаров](https://selsup.ru/application/settings/products/), нажав на "Обновить остатки в товарах".\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2022/12/obnovit-ostatki.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

#### **Почему в разделе «Заказы на отгрузку → Со своего склада FBS» для заказов Яндекс.Маркета ставится определенный склад?**

Для заказов **Яндекс.Маркета** склад в SelSup определяется **по связи склада с организацией**.

Это связано с тем, что для Яндекс.Маркета используется логика:\
**одна организация — один склад**.

Поэтому, если у организации настроена связь со складом, именно этот склад будет автоматически подставляться в заказах Яндекс.Маркета в разделе **«Заказы на отгрузку → Со своего склада FBS»**.

Важно: для такого определения склада **ID магазина** и **ID склада маркетплейса** в связи значения не имеют. SelSup ориентируется именно на **организацию** и настроенную для нее связь со складом.

То есть если связь склада с организацией есть, этот склад и будет отображаться у заказов Яндекс.Маркета по данной организации.
