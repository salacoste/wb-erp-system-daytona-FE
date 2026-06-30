---
title: 'Динамика остатков'
slug: dinamika-ostatkov
source: https://selsup.ru/help/dinamika-ostatkov/
chars: 5284
---

# Динамика остатков

В этой статье расскажем Вам об отчете [Динамика остатков](https://selsup.ru/application/productDynamic/), его функциях и особенностях.

Что-то сломалось, уже чиним Перезагрузите страницу или попробуйте позже

[Ссылка на видео в ВК](https://vk.com/video-226498315_456239334)\

В этой статье:

- 
- <a href="#zachem-nuzhen-dannyj-otchet" rel="nofollow">Зачем нужен данный отчет</a>
- <a href="#" rel="nofollow"></a>
- <a href="#filtry-i-poisk" rel="nofollow">Фильтры и поиск</a>
- <a href="#interfejs-otcheta" rel="nofollow">Интерфейс отчета</a>
- <a href="#otchet-v-excel" rel="nofollow">Отчет в Excel</a>

## Зачем нужен данный отчет

[Динамика остатков](https://selsup.ru/application/productDynamic/) - один из трех отчетов, входящий в отчет [Товарный остаток](https://selsup.ru/application/productCurrent/).\
В этом отчете вы сможете увидеть ваш товарный остаток, как он изменялся в динамике.

С маркетплейсов Wildberries, Ozon остатки могут забираться по API автоматически, но иногда даже у этих маркетплейсов по API отдаются неактуальные остатки на складах маркетплейсов FBO. В этом случае вы можете скачать остатки файлом и загрузить в SelSup. О том, как Вы  можете это сделать, написано в нашей статье ["Выгрузка остатков FBO файлом с маркетплейсов"](../vygruzka-ostatkov-fbo-fajlom-s-marketplejsov/index.html)

Чтобы перейти в этот отчет откройте раздел [Аналитика и финансы-Отчёты](https://selsup.ru/application/reports/) и выберите отчет [Товарный остаток](https://selsup.ru/application/productCurrent/), вкладка Динамика остатков

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/screenshot_303.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## ![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/screenshot_20-e1748252499685.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Фильтры и поиск

- Можно выбрать интересующий вас период, в котором вы хотите проанализировать продажи. Но выбрать можно период не больше 12 дней / недель / месяцев.
- Отчетность вы можете посмотреть как по определенной организации, так и по всем.
- Можно выбрать, в каком разрезе вы хотите посмотреть аналитику на интерфейсе: по дням, неделям или месяцам.
- Также можно "схлопывать" или "не схлопывать" дубли карточек товаров, если у вас есть одинаковые товары на разных организациях или карточки объеденины по остатку.

![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/filtri-dinamiks.png.webp)

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Интерфейс отчета

— Отчет можно смотреть только в Excel, в разрезе по ШК, цветомодели, артикулу, категории, бренду.

— Сортировка  в Excel происходит по организации.

— Каждый день происходит запись в базу данных о количестве остатков по FBS и по FBO. Эти данные потом попадают в этот отчет.

— Попадают все товары, по которым хотя бы в каком-то из дней выбранного периода был остаток по FBS или по FBO.

— Остатки по FBO и FBS доступны только для WB и Ozon.

<a href="#tocmenu" class="kamatoc-gotop" rel="nofollow">Вверх <em></em></a>

## Отчет в Excel

Чтобы скачать файл с отчетом нажмите "Скачать в Excel".\
В скачанном файле выберите по какому параметру просматривать остаток товаров:\
- по ШК;\
- по цветомодели;\
- по артикулу;\
- по бренду;\
- по категории.\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/param.png.webp)\
Здесь вы можете просматривать:\
Закупочную цену + стоимость доставки по товару;\
Динамику **остатков FBS+FBO** (на вашем складе и на складах маркетплейсов в сумме) в штуках и в рублях;\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/fbo-i-fbs-v-shtukah-e1719586674731.png.webp)\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/fbo-i-fbs-v-rub.png.webp)\
Динамику **остатков только по складу FBS** в штуках и в рублях;\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/fbs-v-sht.png.webp)\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/fbs-v-rub.png.webp)\
**Остатки FBO** полученные по API со складов маркетплейсов в штуках и рублях;\
Wildberries:\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/wb-sht.png.webp)\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/wb-rub.png.webp)

Ozon:![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/ozon-sht.png.webp)\
![](../../out/selsup.ru/_kage/selsup.ru/wp-content/webp-express/webp-images/uploads/2024/06/ozon-rub.png.webp)

------------------------------------------------------------------------

Подробнее про отчет [Текущий остаток](https://selsup.ru/application/productCurrent/) рассказали [здесь](../tekushhij-ostatok/index.html).\
Про отчет [Остаток по складам](https://selsup.ru/application/stockReport/) можете прочитать [тут](../ostatok-po-skladam/index.html).

**[На главную статью по аналитике и финансовому учету в SelSup](../vnutrennyaya-analitika-v-selsup/index.html).**
