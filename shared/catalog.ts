// Stable Italian values preserve merchant data; labels are localized at display time.
export type Composition = {material:string;percent:number}
export type ProductAttributes = {values:Record<string,string[]>;compositions:Record<string,Composition[]>;translations?:Record<string,Record<string,string>>}
export const categoryList=['Abiti','Pantaloni','Jeans','Maglieria','Top','Giacche','Blazer','Completi','Cappotti','Pellicce','Accessori','Bigotteria']
const translations:Record<string,string[]>={}
function rows(input:string){for(const line of input.trim().split('\n')){const [it,...rest]=line.split('|');translations[it]=rest}}
rows(`Dettagli|Details|Details|Деталі|Детали
Materiali e cura|Materials and care|Materialien und Pflege|Матеріали та догляд|Материалы и уход
Lavorazione e decorazioni|Craft and decorations|Verarbeitung und Verzierungen|Виготовлення та оздоблення|Изготовление и декор
Modello|Style|Modell|Модель|Модель
Lunghezza|Length|Länge|Довжина|Длина
Lunghezza maniche|Sleeve length|Ärmellänge|Довжина рукавів|Длина рукавов
Tipo di scollo|Neckline / collar|Ausschnitt / Kragen|Виріз / комір|Вырез / воротник
Vestibilità|Fit|Passform|Посадка|Посадка
Altezza vita|Rise|Leibhöhe|Висота талії|Высота талии
Taglio della gamba|Leg shape|Beinform|Форма штанини|Форма брючины
Chiusura|Closure|Verschluss|Застібка|Застёжка
Fodera|Lining|Futter|Підкладка|Подкладка
Spacco|Slit|Schlitz|Розріз|Разрез
Occasione d’uso|Occasion|Anlass|Нагода|Повод
Tasche|Pockets|Taschen|Кишені|Карманы
Lavorazione|Craft|Verarbeitung|Виготовлення|Изготовление
Decorazione|Decoration|Verzierung|Оздоблення|Декор
Tipo di pelo|Pile length|Florlänge|Тип ворсу|Тип ворса
Cura|Care|Pflege|Догляд|Уход
Materiale|Material|Material|Матеріал|Материал
Composizione|Composition|Zusammensetzung|Склад|Состав
Esterno|Outer|Obermaterial|Зовнішній матеріал|Внешний материал
Imbottitura|Padding|Füllung|Утеплювач|Утеплитель
Finitura|Finish|Oberfläche|Покриття|Покрытие
Colore del metallo|Metal colour|Metallfarbe|Колір металу|Цвет металла
Tipo di pietra|Stone type|Steinart|Тип каменю|Тип камня
Colore della pietra|Stone colour|Steinfarbe|Колір каменю|Цвет камня
Taglio della pietra|Stone cut|Steinschliff|Огранка|Огранка
Dimensioni (mm / cm)|Dimensions (mm / cm)|Maße (mm / cm)|Розміри (мм / см)|Размеры (мм / см)
Peso (g)|Weight (g)|Gewicht (g)|Вага (г)|Вес (г)
Abiti|Dresses|Kleider|Сукні|Платья
Pantaloni|Trousers|Hosen|Штани|Брюки
Maglieria|Knitwear|Strickwaren|Трикотаж|Трикотаж
Giacche|Jackets|Jacken|Куртки|Куртки
Completi|Sets|Sets|Комплекти|Комплекты
Cappotti|Coats|Mäntel|Пальта|Пальто
Pellicce|Fur coats|Pelzmäntel|Шуби|Шубы
Accessori|Accessories|Accessoires|Аксесуари|Аксессуары
Bigotteria|Jewellery|Modeschmuck|Біжутерія|Бижутерия
Cotone|Cotton|Baumwolle|Бавовна|Хлопок
Lino|Linen|Leinen|Льон|Лён
Seta|Silk|Seide|Шовк|Шёлк
Viscosa|Viscose|Viskose|Віскоза|Вискоза
Poliestere|Polyester|Polyester|Поліестер|Полиэстер
Poliammide|Polyamide|Polyamid|Поліамід|Полиамид
Elastan|Elastane|Elastan|Еластан|Эластан
Lana|Wool|Wolle|Вовна|Шерсть
Cashmere|Cashmere|Kaschmir|Кашемір|Кашемир
Acrilico|Acrylic|Acryl|Акрил|Акрил
Velluto|Velvet|Samt|Оксамит|Бархат
Raso|Satin|Satin|Атлас|Атлас
Pizzo|Lace|Spitze|Мереживо|Кружево
Tulle|Tulle|Tüll|Тюль|Тюль
Maglia|Knit|Strick|В’язане полотно|Вязаное полотно
Pelle|Leather|Leder|Шкіра|Кожа
Ecopelle|Faux leather|Kunstleder|Екошкіра|Экокожа
Pelliccia naturale|Natural fur|Naturpelz|Натуральне хутро|Натуральный мех
Pelliccia sintetica|Faux fur|Kunstpelz|Штучне хутро|Искусственный мех
Ecopelliccia|Eco-fur|Kunstpelz|Екохутро|Экомех
Montone|Shearling|Lammfell|Овчина|Овчина
Lana e cashmere|Wool and cashmere|Wolle und Kaschmir|Вовна і кашемір|Шерсть и кашемир
Misto lana|Wool blend|Wollmischung|Вовняна суміш|Смесь шерсти
Corto|Short|Kurz|Коротка|Короткая
Al ginocchio|Knee-length|Knielang|До коліна|До колена
Sopra il ginocchio|Above the knee|Oberhalb des Knies|Вище коліна|Выше колена
Sotto il ginocchio|Below the knee|Unterhalb des Knies|Нижче коліна|Ниже колена
Al polpaccio|Calf-length|Wadenlang|До литки|До середины икры
Alla caviglia|Ankle-length|Knöchellang|До щиколотки|До щиколотки
Lungo|Long|Lang|Довга|Длинная
Lungo fino a terra|Floor-length|Bodenlang|До підлоги|До пола
Asimmetrico|Asymmetric|Asymmetrisch|Асиметрична|Асимметричная
Al fianco|Hip-length|Hüftlang|До стегон|До бёдер
Senza maniche|Sleeveless|Ärmellos|Без рукавів|Без рукавов
Corte|Short sleeves|Kurzarm|Короткі рукави|Короткие рукава
Lunghe|Long sleeves|Langarm|Довгі рукави|Длинные рукава
Al gomito|Elbow sleeves|Ellenbogenlang|До ліктя|До локтя
A palloncino|Balloon sleeves|Ballonärmel|Рукави-ліхтарики|Рукава-фонарики
A sbuffo|Puff sleeves|Puffärmel|Об’ємні рукави|Объёмные рукава
A campana|Flared sleeves|Ausgestellte Ärmel|Розкльошені рукави|Расклешённые рукава
Ampie|Wide sleeves|Weite Ärmel|Широкі рукави|Широкие рукава
Aderente|Body-hugging|Eng anliegend|Облягаюча|Облегающая
Comfort fit|Comfort fit|Bequeme Passform|Комфортний крій|Комфортный крой
Relaxed fit|Relaxed fit|Lockere Passform|Вільний крій|Свободный крой
Loose fit|Loose fit|Weite Passform|Широкий крій|Широкий крой
Slim fit|Slim fit|Schmale Passform|Приталений крій|Приталенный крой
Regular fit|Regular fit|Normale Passform|Стандартний крій|Стандартный крой
Oversize|Oversized|Oversize|Оверсайз|Оверсайз
A tubino|Sheath|Etui|Футляр|Футляр
Svasato|Flared|Ausgestellt|Розкльошений|Расклешённый
A sirena|Mermaid|Meerjungfrau|Русалка|Русалка
A portafoglio|Wrap|Wickel|На запах|На запах
Chemisier|Shirt dress|Hemdkleid|Сукня-сорочка|Платье-рубашка
Impero|Empire|Empire|Ампір|Ампир
A vestaglia|Robe style|Bademantelstil|На запах|На запах
Classico|Classic|Klassisch|Класичний|Классический
Rotondo|Round|Rund|Круглий|Круглый
Quadrato|Square|Quadratisch|Квадратний|Квадратный
A V|V-neck|V-Ausschnitt|V-подібний|V-образный
A barca|Boat|U-Boot-Ausschnitt|Човник|Лодочка
A cuore|Sweetheart|Herzausschnitt|Серцеподібний|Сердцевидный
Dritto|Straight|Gerade|Прямий|Прямой
All’americana|Halter|Neckholder|Халтер|Халтер
Monospalla|One-shoulder|One-Shoulder|На одне плече|На одно плечо
Spalle scoperte|Off-shoulder|Schulterfrei|Відкриті плечі|Открытые плечи
Schiena scoperta|Open back|Rückenfrei|Відкрита спина|Открытая спина
Collo alto|High neck|Hoher Kragen|Високий комір|Высокий воротник
A cascata|Cowl|Wasserfallausschnitt|Драпірований|Драпированный
Collo alla coreana|Mandarin collar|Stehkragen|Комір-стійка|Воротник-стойка
Collo a revers|Notched lapel|Reverskragen|Комір з лацканами|Воротник с лацканами
Collo sciallato|Shawl collar|Schalkragen|Шалевий комір|Шалевый воротник
Con cappuccio|Hooded|Mit Kapuze|З капюшоном|С капюшоном
Collo ampio|Wide collar|Breiter Kragen|Широкий комір|Широкий воротник
Senza colletto|Collarless|Ohne Kragen|Без коміра|Без воротника
Collo con pelliccia|Fur collar|Pelzkragen|Хутряний комір|Меховой воротник
Vita bassa|Low rise|Niedrige Leibhöhe|Низька талія|Низкая талия
Vita media|Mid rise|Mittlere Leibhöhe|Середня талія|Средняя талия
Vita alta|High rise|Hohe Leibhöhe|Висока талія|Высокая талия
Vita altissima|Super high rise|Sehr hohe Leibhöhe|Дуже висока талія|Очень высокая талия
Ampio|Wide|Weit|Широкий|Широкий
A zampa|Flared|Ausgestellt|Кльош|Клёш
Affusolato|Tapered|Zulaufend|Завужений|Зауженный
Sigaretta|Cigarette|Zigarettenhose|Сигарети|Сигареты
Cerniera|Zipper|Reißverschluss|Блискавка|Молния
Bottoni|Buttons|Knöpfe|Ґудзики|Пуговицы
Automatici|Snap buttons|Druckknöpfe|Кнопки|Кнопки
Lacci|Ties|Bänder|Зав’язки|Завязки
Ganci|Hooks|Haken|Гачки|Крючки
Elastico|Elastic waist|Gummizug|Гумка|Резинка
Coulisse|Drawstring|Tunnelzug|Куліска|Кулиска
Cintura|Belt|Gürtel|Пояс|Пояс
Senza chiusura|No closure|Ohne Verschluss|Без застібки|Без застёжки
Con fodera|Lined|Mit Futter|З підкладкою|С подкладкой
Senza fodera|Unlined|Ohne Futter|Без підкладки|Без подкладки
Fodera parziale|Partially lined|Teilgefüttert|Часткова підкладка|Частичная подкладка
Fodera trapuntata|Quilted lining|Gestepptes Futter|Стьобана підкладка|Стёганая подкладка
Senza spacco|No slit|Ohne Schlitz|Без розрізу|Без разреза
Laterale|Side slit|Seitenschlitz|Бічний розріз|Боковой разрез
Frontale|Front slit|Vorderschlitz|Спереду|Спереди
Posteriore|Back slit|Rückenschlitz|Ззаду|Сзади
Elegante|Elegant|Elegant|Елегантний|Элегантный
Da sera|Evening|Abend|Вечірній|Вечерний
Da cerimonia|Formal occasion|Festlich|Урочистий|Торжественный
Da cocktail|Cocktail|Cocktail|Коктейльний|Коктейльный
Da ufficio|Office|Büro|Офісний|Офисный
Da festa|Party|Party|Святковий|Праздничный
Da matrimonio|Wedding|Hochzeit|Весільний|Свадебный
Da vacanza|Holiday|Urlaub|Для відпочинку|Для отпуска
Senza tasche|No pockets|Ohne Taschen|Без кишень|Без карманов
Laterali|Side pockets|Seitentaschen|Бічні кишені|Боковые карманы
Posteriori|Back pockets|Gesäßtaschen|Задні кишені|Задние карманы
A filetto|Welt pockets|Leistentaschen|Прорізні кишені|Прорезные карманы
Artigianale|Handmade|Handarbeit|Ручна робота|Ручная работа
Sartoriale|Tailored|Schneiderarbeit|Індивідуальне пошиття|Индивидуальный пошив
Industriale|Industrial|Industrielle Fertigung|Фабричне виробництво|Фабричное производство
Plissettato|Pleated|Plissiert|Плісирований|Плиссированный
Drappeggiato|Draped|Drapiert|Драпірований|Драпированный
Ricamato a mano|Hand-embroidered|Handbestickt|Вишито вручну|Вышито вручную
Decorato a mano|Hand-decorated|Von Hand verziert|Оздоблено вручну|Украшено вручную
Trapuntata|Quilted|Gesteppt|Стьобаний|Стёганый
Reversibile|Reversible|Wendbar|Двосторонній|Двусторонний
Lavaggio speciale|Special wash|Spezialwaschung|Спеціальне прання|Специальная стирка
Ricami|Embroidery|Stickerei|Вишивка|Вышивка
Perline|Beads|Perlen|Бісер|Бисер
Perline applicate a mano|Hand-applied beads|Von Hand aufgenähte Perlen|Бісер нашито вручну|Бисер пришит вручную
Strass|Rhinestones|Strasssteine|Стрази|Стразы
Paillettes|Sequins|Pailletten|Паєтки|Пайетки
Applicazioni|Appliqués|Applikationen|Аплікації|Аппликации
Fiocchi|Bows|Schleifen|Банти|Банты
Volant|Ruffles|Volants|Волани|Воланы
Frange|Fringes|Fransen|Бахрома|Бахрома
Borchie|Studs|Nieten|Заклепки|Заклёпки
Inserti|Inserts|Einsätze|Вставки|Вставки
Cuciture decorative|Decorative seams|Ziernähte|Декоративні шви|Декоративные швы
Bottoni gioiello|Jewel buttons|Schmuckknöpfe|Декоративні ґудзики|Декоративные пуговицы
Cintura decorativa|Decorative belt|Dekorativer Gürtel|Декоративний пояс|Декоративный пояс
Inserti in pelliccia|Fur inserts|Pelzbesätze|Хутряні вставки|Меховые вставки
Pelo corto|Short pile|Kurzer Flor|Короткий ворс|Короткий ворс
Pelo medio|Medium pile|Mittlerer Flor|Середній ворс|Средний ворс
Pelo lungo|Long pile|Langer Flor|Довгий ворс|Длинный ворс
Lavaggio 30°C|Wash at 30°C|Waschen bei 30°C|Прання 30°C|Стирка 30°C
Lavaggio a mano|Hand wash|Handwäsche|Ручне прання|Ручная стирка
Non lavare|Do not wash|Nicht waschen|Не прати|Не стирать
Non candeggiare|Do not bleach|Nicht bleichen|Не відбілювати|Не отбеливать
Asciugare appeso|Hang dry|Hängend trocknen|Сушити підвішеним|Сушить на вешалке
Non usare asciugatrice|Do not tumble dry|Nicht im Trockner trocknen|Не сушити в машині|Не сушить в машине
Stirare a bassa temperatura|Iron on low|Bei niedriger Temperatur bügeln|Прасувати за низької температури|Гладить при низкой температуре
Non stirare|Do not iron|Nicht bügeln|Не прасувати|Не гладить
Lavaggio a secco|Dry clean|Chemische Reinigung|Хімчистка|Химчистка
Acciaio inox|Stainless steel|Edelstahl|Нержавіюча сталь|Нержавеющая сталь
Acciaio chirurgico|Surgical steel|Chirurgenstahl|Хірургічна сталь|Хирургическая сталь
Argento 925|Sterling silver|Sterlingsilber|Срібло 925|Серебро 925
Oro|Gold|Gold|Золото|Золото
Ottone|Brass|Messing|Латунь|Латунь
Rame|Copper|Kupfer|Мідь|Медь
Lega metallica|Metal alloy|Metalllegierung|Металевий сплав|Металлический сплав
Metallo|Metal|Metall|Метал|Металл
Perle|Pearls|Perlen|Перли|Жемчуг
Perle sintetiche|Synthetic pearls|Kunstperlen|Штучні перли|Искусственный жемчуг
Cristallo|Crystal|Kristall|Кришталь|Хрусталь
Vetro|Glass|Glas|Скло|Стекло
Resina|Resin|Harz|Смола|Смола
Plastica|Plastic|Kunststoff|Пластик|Пластик
Ceramica|Ceramic|Keramik|Кераміка|Керамика
Pietre naturali|Natural stones|Natursteine|Натуральне каміння|Натуральные камни
Zirconia cubica|Cubic zirconia|Zirkonia|Фіаніт|Фианит
Tessuto|Fabric|Stoff|Тканина|Ткань
Dorato|Gold-tone|Goldfarben|Золотисте|Золотистое
Argentato|Silver-tone|Silberfarben|Сріблясте|Серебристое
Placcato oro|Gold-plated|Vergoldet|Позолочене|Позолоченное
Placcato argento|Silver-plated|Versilbert|Посріблене|Посеребрённое
Smaltato|Enamelled|Emailliert|Емальоване|Эмалированное
Opaco|Matte|Matt|Матове|Матовое
Lucido|Polished|Glänzend|Глянцеве|Глянцевое
Martellato|Hammered|Gehämmert|Коване|Кованое
Anticato|Antique|Antik|Вінтажне|Винтажное
Argento|Silver|Silber|Срібло|Серебро
Oro rosa|Rose gold|Roségold|Рожеве золото|Розовое золото
Nero|Black|Schwarz|Чорний|Чёрный
Bianco|White|Weiß|Білий|Белый
Beige|Beige|Beige|Бежевий|Бежевый
Rosa|Pink|Rosa|Рожевий|Розовый
Rosso|Red|Rot|Червоний|Красный
Blu|Blue|Blau|Синій|Синий
Verde|Green|Grün|Зелений|Зелёный
Marrone|Brown|Braun|Коричневий|Коричневый
Grigio|Grey|Grau|Сірий|Серый
Trasparente|Clear|Transparent|Прозорий|Прозрачный
Azzurro|Light blue|Hellblau|Блакитний|Голубой
Verde smeraldo|Emerald|Smaragdgrün|Смарагдовий|Изумрудный
Turchese|Turquoise|Türkis|Бірюзовий|Бирюзовый
Viola|Purple|Violett|Фіолетовий|Фиолетовый
Lilla|Lilac|Lila|Бузковий|Сиреневый
Giallo|Yellow|Gelb|Жовтий|Жёлтый
Arancione|Orange|Orange|Помаранчевий|Оранжевый
Ambra|Amber|Bernstein|Бурштиновий|Янтарный
Iridescente|Iridescent|Schillernd|Переливчастий|Переливчатый
Multicolore|Multicolour|Mehrfarbig|Різнокольоровий|Разноцветный
Bicolore|Two-tone|Zweifarbig|Двоколірний|Двухцветный
Senza pietre|No stones|Ohne Steine|Без каміння|Без камней
Ovale|Oval|Oval|Овальний|Овальный
Goccia|Teardrop|Tropfen|Крапля|Капля
Cuore|Heart|Herz|Серце|Сердце`)
export function catalogLabel(value:string,locale:string,custom?:ProductAttributes['translations']){return custom?.[locale]?.[value]||translations[value]?.[({en:0,de:1,uk:2,ru:3} as Record<string,number>)[locale]]||value}
export const fieldLabels:Record<string,string>={model:'Modello',length:'Lunghezza',sleeves:'Lunghezza maniche',neckline:'Tipo di scollo',fit:'Vestibilità',rise:'Altezza vita',leg:'Taglio della gamba',closure:'Chiusura',lining:'Fodera',slit:'Spacco',occasion:'Occasione d’uso',pockets:'Tasche',craft:'Lavorazione',decoration:'Decorazione',pile:'Tipo di pelo',care:'Cura',finish:'Finitura',metalColor:'Colore del metallo',stoneType:'Tipo di pietra',stoneColor:'Colore della pietra',stoneCut:'Taglio della pietra',dimensions:'Dimensioni (mm / cm)',weight:'Peso (g)'}
const split=(s:string)=>s.split('|')
export const materialOptions=split('Cotone|Lino|Seta|Raso|Viscosa|Poliestere|Poliammide|Elastan|Lana|Cashmere|Modal|Lyocell|Acrilico|Velluto|Denim|Twill|Pizzo|Tulle|Jersey|Maglia|Alpaca|Misto lana|Lana e cashmere|Pelle|Ecopelle|Pelliccia naturale|Pelliccia sintetica|Ecopelliccia|Montone')
export const jewelryMaterials=split('Acciaio inox|Acciaio chirurgico|Argento 925|Oro|Ottone|Rame|Lega metallica|Metallo|Perle|Perle sintetiche|Cristallo|Strass|Vetro|Resina|Plastica|Ceramica|Pietre naturali|Zirconia cubica|Tessuto|Pelle')
const commonOptions:Record<string,string[]>={fit:split('Aderente|Slim fit|Regular fit|Comfort fit|Relaxed fit|Loose fit|Oversize|A-line'),sleeves:split('Senza maniche|Corte|Al gomito|3/4|Lunghe|A palloncino|A sbuffo|A campana|Ampie|Raglan|Kimono'),neckline:split('Rotondo|A V|A barca|Quadrato|A cuore|Dritto|All’americana|Monospalla|Spalle scoperte|Schiena scoperta|Collo alto|A cascata|Collo alla coreana|Collo a revers|Collo sciallato|Con cappuccio|Collo ampio|Senza colletto|Collo con pelliccia'),closure:split('Cerniera|Bottoni|Automatici|Lacci|Ganci|Elastico|Coulisse|Cintura|Senza chiusura'),lining:split('Con fodera|Senza fodera|Fodera parziale|Fodera trapuntata'),craft:split('Artigianale|Sartoriale|Industriale|Plissettato|Drappeggiato|Ricamato a mano|Decorato a mano|Trapuntata|Reversibile|Lavaggio speciale'),decoration:split('Ricami|Perline|Perline applicate a mano|Strass|Paillettes|Pizzo|Applicazioni|Fiocchi|Volant|Frange|Borchie|Inserti|Cuciture decorative|Bottoni gioiello|Cintura decorativa|Inserti in pelliccia'),care:split('Lavaggio 30°C|Lavaggio a mano|Non lavare|Non candeggiare|Asciugare appeso|Non usare asciugatrice|Stirare a bassa temperatura|Non stirare|Lavaggio a secco'),occasion:split('Casual|Elegante|Da sera|Da cerimonia|Da cocktail|Da ufficio|Da festa|Da matrimonio|Da vacanza'),rise:split('Vita bassa|Vita media|Vita alta|Vita altissima'),leg:split('Aderente|Dritto|Ampio|Svasato|A zampa|Affusolato'),pockets:split('Senza tasche|Laterali|Posteriori|Cargo|A filetto'),slit:split('Senza spacco|Laterale|Frontale|Posteriore'),pile:split('Pelo corto|Pelo medio|Pelo lungo'),finish:split('Dorato|Argentato|Placcato oro|Placcato argento|Smaltato|Opaco|Lucido|Martellato|Anticato'),metalColor:split('Oro|Argento|Oro rosa|Nero|Bianco|Champagne|Rainbow|Bicolore'),stoneType:split('Zirconia cubica|Cristallo|Pietre naturali|Perle|Vetro|Senza pietre'),stoneColor:split('Trasparente|Bianco|Nero|Rosso|Rosa|Fucsia|Blu|Azzurro|Verde|Verde smeraldo|Turchese|Viola|Lilla|Giallo|Arancione|Marrone|Champagne|Ambra|Grigio|Iridescente|Multicolore|Senza pietre'),stoneCut:split('Rotondo|Ovale|Goccia|Cuore')}
export function family(category:string){return /pantalon|jeans/i.test(category)?'trousers':/abiti|vestit/i.test(category)?'dresses':/pellic|cappott|giacc|blazer/i.test(category)?'outer':/bigiot|gioiell/i.test(category)?'jewelry':'clothing'}
export function fieldsFor(category:string){const f=family(category);return f==='jewelry'?split('finish|metalColor|stoneType|stoneColor|stoneCut|dimensions|weight|care'):f==='trousers'?split('model|rise|length|fit|leg|closure|pockets|lining|craft|decoration|care'):f==='dresses'?split('model|length|sleeves|neckline|fit|closure|lining|slit|occasion|craft|decoration|care'):f==='outer'?split('model|length|sleeves|neckline|fit|pile|lining|closure|pockets|craft|decoration|care'):split('model|length|sleeves|neckline|fit|closure|lining|occasion|craft|decoration|care')}
export function filtersFor(category:string){const f=family(category);return f==='trousers'?['model','length']:f==='dresses'?['length','occasion']:f==='jewelry'?['finish','metalColor','stoneType','stoneColor']:f==='outer'?['length','fit','pile','lining','craft','decoration']:['length','occasion']}
export function optionsFor(field:string,category:string){const f=family(category);if(field==='model')return f==='trousers'?split('Palazzo|Sigaretta|Skinny|Slim|Straight|Wide leg|Cargo|Jogger|Culotte|Flare|Bootcut|Leggings|Chino|Sartoriale|Pull-on'):f==='outer'?split('A vestaglia|Classico|Aderente|Peplum|Oversize|A-line|Bomber|Corto'):split('A tubino|A-line|Svasato|A sirena|A portafoglio|Chemisier|Impero|Oversize|Aderente');if(field==='length')return f==='trousers'?split('Corto|Bermuda|Capri|Alla caviglia|Regular|Lungo'):split('Mini|Corto|Al fianco|Sopra il ginocchio|Al ginocchio|Midi|Sotto il ginocchio|Al polpaccio|Alla caviglia|Lungo|Maxi|Lungo fino a terra|Asimmetrico');return commonOptions[field]||[]}
export function validateAttributes(input:unknown):ProductAttributes{
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Caratteristiche non valide')
 const b=input as any,values:Record<string,string[]>={},compositions:Record<string,Composition[]>={},translations:Record<string,Record<string,string>>={}
 for(const [k,v]of Object.entries(b.values||{})){if(!Object.hasOwn(fieldLabels,k)||!Array.isArray(v)||v.length>25||v.some(x=>typeof x!=='string'||!x.trim()||x.length>120))throw new Error('Valori delle caratteristiche non validi');values[k]=[...new Set(v.map(x=>x.trim()))]}
 for(const [layer,parts]of Object.entries(b.compositions||{})){if(!['Composizione','Esterno','Fodera','Imbottitura','Dettagli'].includes(layer)||!Array.isArray(parts)||parts.length>20)throw new Error('Composizione non valida');if(!parts.length)continue;let total=0;compositions[layer]=parts.map((p:any)=>{if(typeof p?.material!=='string'||!p.material.trim()||p.material.length>100||!Number.isFinite(p.percent)||p.percent<=0||p.percent>100)throw new Error('Inserisci materiale e percentuale positiva');total+=p.percent;return{material:p.material.trim(),percent:p.percent}});if(Math.abs(total-100)>.001)throw new Error(`La composizione ${layer} deve avere totale 100%`)}
 for(const [lang,entries]of Object.entries(b.translations||{})){if(!['en','de','uk','ru','fr','es'].includes(lang)||!entries||typeof entries!=='object'||Object.keys(entries).length>150)throw new Error('Traduzioni non valide');translations[lang]={};for(const [key,value]of Object.entries(entries)){if(key.length>120||typeof value!=='string'||value.length>200)throw new Error('Traduzione non valida');translations[lang][key]=value.trim()}}
 return{values,compositions,translations}
}

export function colorSwatch(value:string){const colors:Record<string,string>={nero:'#161518',bianco:'#fff',crema:'#eee4cf',beige:'#d8c1a3',cammello:'#bd9070',camel:'#bd9070',rosa:'#edb5cb',rosso:'#b42336',bordeaux:'#68273b',blu:'#233b6c',azzurro:'#8ac6ee',verde:'#4c7661','verde smeraldo':'#168669',marrone:'#765044',grigio:'#99969d',oro:'linear-gradient(135deg,#c09337,#f6e1a5,#a5741a)',argento:'linear-gradient(135deg,#8b8d91,#f3f4f5,#9da0a6)','oro rosa':'linear-gradient(135deg,#ad7164,#f2c2a9,#ac7160)',champagne:'#d5b98e',fucsia:'#c91c78',viola:'#7844a1',lilla:'#b89bda',giallo:'#e5bd3c',arancione:'#df8136',turchese:'#31aab0',ambra:'#b77a28',trasparente:'linear-gradient(135deg,#fff,#dce6eb,#fff)',bicolore:'linear-gradient(90deg,#cda942 50%,#c9c9cf 50%)',rainbow:'conic-gradient(#e96584,#e5ce66,#6ed9be,#7c96df,#e96584)',iridescente:'conic-gradient(#f7d6eb,#b9ebec,#e7dbf8,#f7d6eb)',multicolore:'conic-gradient(#e96584,#e5ce66,#6ed9be,#7c96df,#e96584)'};return colors[value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('it-IT')]}
