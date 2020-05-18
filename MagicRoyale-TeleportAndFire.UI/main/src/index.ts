// import Post from './Post' // заимпортить класс
import './styles.css' 
// import './testBabel.ts'
import { Test1 } from './test1';
import { Engine } from "./engine/engine";
import { Guid } from 'guid-typescript';
import { PictureConfig } from './engine/spriteHolder';
import { Size, X_Y } from './engine/common';
import { SpriteAnimation, MaskFigure, MovingVector, Sprite } from './engine/sprite';
import { onFullScreen } from './engine/tools';

async function initialize() {
    let gameCanvasParrentElement = document.getElementById('gameContent');
    let engine = new Engine(gameCanvasParrentElement);
    engine.debugMode.debugModeEnable = true;
    engine.debugMode.message = "Нет сообщений.";

    // инициализация центральныйх линий
    engine.render.frameRenderedEvent.addSubscriber(() => drowCenterLines(engine));


    // делаем тян
    let tyan = await addTyan(engine);

    // делаем кнопку на "весь экран"
    let fullScreenButton = await addFullScreenButton(engine);

    // let test1 = new Test1();
    // test1.WriteLol();
}

// TODO
1.остановились на том что в мобильной версии не правильно работает масштабирование, вероятно из-за не правильного Target.
Target должен быть как неигровая координата - центр между пальцев
2.скролл при большом масштабе слишком маленький. Сейчас он просто разница координат. Переделать его на "разница переведенная в игровую длинну"
// заменить везде if(!myVar) на check т.к. если myVar это number, то 0 тоже засчитает за "нет". Так же сделать и для просто if(что-то). Проще всего пройтись по всем if-ам
// сделать так чтобы камера при клике (+-10 пикселей) не сдигалась и засчитывался именно клик
// криво работает масштабирование, картинка с правого нижнего угла улетает в левый верхний
// куча TODO при создании тян 
// не работает клик по спрайту и mouseMove и вообще заменить его на нормальное событие наше современное

/** добавить барышню */
async function addTyan(engine: Engine) : Promise<Sprite>{
    /*done*/ let tyanId = Guid.create();
    /*done*/ let tyanPicConfig = new PictureConfig('./images/tyan.png');    
    /*done*/ let tyan = await engine.spriteHolder.createSpriteAsync(tyanId, tyanPicConfig);
    /*done*/ tyan.coordinates.setNewValues(300, 50);
    /*done*/ tyan.picSize = new Size(200, 200);
    /*done*/ tyan.scale = 0.3;
    /*done*/ tyan.functionsInGameLoop.addSubscriber(() => tyan.rotate++); // кружимся
    /*done*/ tyan.mouseClickEvent.addSubscriber((event) => console.log(`Приветушки, кликнули на меня в координатах: ${event.x, event.y}`));
    /*done*/ tyan.isSkipClick = false;
    /*done*/ tyan.isStaticCoordinates = false;
    /*done*/ tyan.isHidden = false;
    /* :c */ //tyan.animation = new SpriteAnimation(2, 500, tyan.image.width / 2, true, 0); // TODO тут не работает потому что 3 кадра рисует вместо 2х
    /* :c */ //tyan.animation.doLoop();
    /* no tests */ tyan.figure = MaskFigure.circle; // TODO - протестировать как работают пересечения
    /* no tests */ tyan.layer = 2; // TODO - протестировать как работает отрисовка по слоям (разные слои и на одном слое тот кто выше первее)
    /* :c */ tyan.mouseMoveEvent.addSubscriber((event) => console.log(`Приветушки, нетрож меня в координатах: ${event.x, event.y}`));
    /* new tests */ //tyan.offsetPic = new X_Y(100, 200); // TODO - протестировать действиетльно ли клик по маске в другом месте. Отрисовывается правильно
    /* :c */ // tyan.vector = new MovingVector(tyan.coordinates, new X_Y(tyan.coordinates.x + 400, tyan.coordinates.x - 100), 5000, true); // TODO вектор вообще все сломал
    /* no tests */ tyan.vectorMovementEndedEvent.addSubscriber(() => console.log(`Я прилетела в координаты: ${tyan.coordinates.x};${tyan.coordinates.y}`));

    return tyan;
}

/** добавить кнопку "на весь экран" */
async function addFullScreenButton(engine: Engine) : Promise<Sprite>{
    let fullScreenButton = await engine.spriteHolder.createSpriteAsync(Guid.create(), new PictureConfig('./images/fullScreenButton.png'));
    fullScreenButton.coordinates = new X_Y(30, 30);
    fullScreenButton.isStaticCoordinates = true;
    fullScreenButton.mouseClickEvent.addSubscriber(() => onFullScreen(engine.canvas.canvasElement));
    fullScreenButton.isHidden = false;

    return fullScreenButton;
}


/** инициализация центральныйх линий */
function drowCenterLines(engine: Engine){

    const cnvsCtx = engine.render.canvasContext;
    const lineWidth = 1;
    const lineColor = 'purple';
    let cnvsWidth = engine.render.canvasElement.width;
    let cnvsHeight = engine.render.canvasElement.height;
    
    // горизонтальная линия
    cnvsCtx.beginPath();
	cnvsCtx.lineWidth = lineWidth;
	cnvsCtx.strokeStyle = lineColor;
	cnvsCtx.moveTo(0, cnvsHeight / 2);
	cnvsCtx.lineTo(cnvsWidth, cnvsHeight / 2);
    cnvsCtx.stroke();
    
    // вертиклаьная линия
    cnvsCtx.beginPath();
	cnvsCtx.lineWidth = lineWidth;
	cnvsCtx.strokeStyle = lineColor;
	cnvsCtx.moveTo(cnvsWidth / 2, 0);
	cnvsCtx.lineTo(cnvsWidth / 2, cnvsHeight);
    cnvsCtx.stroke();
}



window.onload = () => {
    initialize();
};

// САМ ДВИЖОК
// - Каждыйе n-мс выполнять цикл, отдельно от отрисовки
// - Режим разработчика:
//   -- переключать дебаг\нормальный режим по горячей клавиши
//   -- логгирование (в консоль)
//   -- [v.2] добавлять\удалять объекты на карте, сохранять карту
//   -- иметь вывод текста на UI для дебага
//      -- просто текст, который кинули в лог
//      -- где сейчас мышь + текущий масштаб
//      -- fps движка (а не отрисовки)
//      -- связь с сервером (пинг)
//      -- событие игрока воспринятое движком
//      -- при нажатии на объект выводится информация об объекте
//      -- видеть "маску"(рамку) спрайтов, чтобы понимать где они реагируют на клик мышью
//         -- зеленым цветом - значит пропускат клик
//         -- фиолетовым цветом - значит на клик должен откликаться
// - Камера
//   -- перемещение
//   -- удаление \ приближение к указанной точке (колесико мыши\движение пальцев)
//   -- фиксация (пока только временная) на указанном объекте (+возможность смещения)
// - Манипуляции с объектом:
//   -- отрисовать спрайт
//   -- типизация спрайта
//   -- крутить спрайт на 360 градусов
//   -- менять ширину, высоту, x,y координаты
//   -- масштабировать картинку (уменьшать\увеличивать)
//   -- указывать фигуру, чтобы пропускать клики в пустоту
//   -- задавать вектор движения
//   -- принимать функции:
//     -- реакция на события:
//        -- начался новый шаг
//        -- навели мышь
//        -- кликнули мышью\пальцем
//        -- [может быть]: нажали\отжали мышь\ зажали
// - Рендеринг:
//   -- отрисовывать\прятать спрайт
//   -- поддерживать слои
//   -- поддерживать поддерживать прозрачность и svg 
//   -- поддерживать анимацию
//   -- сделать координаты спрайта статическими
//   -- [может быть] делать возможным смещение при отрисовке 
//   -- пропускать клик по объекту.  Может отрисовываться выше всех по слою, но при нажатии пропускает клик и отдаем ему того кто ниже
//   -- [может быть] возможность рисовать фигуры
//   -- [может быть] писать текст поверх картинки спрайта
//   -- [v1] назначать фон (отличается тем, что не является спрайтом)
//      -- замостить некий фот
//      -- [может быть] получить массив координат блоков фона и отрисовывать их
// - Держатель объектов:
//   -- возможность получить\добавить\удалить\заменить спрайт
//   -- кеширование картинок
//   -- узнать кто выше всего по слою в указанных координатах
//   -- проверит вхождение указанных координат в объект\маску (отдельная сборка геометрия)
// - Движок (+actionController):
//   -- инициализирует все для работы
//   -- доступ к настройкам самого движка
//   -- дает взаимодействовать с камерой
//   -- возможноть добавлять действия на каждый шаг 
//      -- в целом по движку
//      -- [может быть] накидывать на каждый отдельный объект (т.е. когда доходит до него очередь)
//   -- дает взаимодействовать с режимом разработчика
//   -- дает взаимодействовать с держателем объектов
//   -- (v1) Сопоставление "игровых событий" с их обработчиками. Типо шина событий и подписанты на очереди (добавить переменную-коллекцию с делегатами, которые вызываются после того как вызовится главный обработчик события. Главный обработчик отдельно живет от этой коллекции, его можно толкьо задизейблить )
//   -- (v1) Игровая пауза, при том с выбором "застопить" все объекты или только не статические спрайты или конкретные анимации\вектора

// Взаимодействие с сервером
// - 

// Дополнительные фичи
// - Усыпить движок
// - Получить\вставить\удалить куки
// - Проверка телефон или компьютер
// - Сенсорный экран или нет
// - Сделать на весь экран




// Что у нас тут осталось?
// - в actionController сделать главный шаг и подписку на события
// - сделать дебаг режим
// - продебажить
// - сделать mindmap с функционалом (дописывая какие примеры еще надо сделать)
// - сделать включение полноценной проверки пересечения фигур. Сделать это можно если при движении перемещать не на % а закидывая на каждую точку спрайт
// - пройтись везде и глануть где я написал var вместо let
// - пройтись везде и глянуть где pageX заменить на offsetX
// - глянуть TODO-хи
// - v0,5 сделать размер и относительное положение маски, по которой проверяется пересечение

// Сделать примеры:
// -- просто отрисовка спрайта
// -- просто отрисовка анимации
// -- закрутить замедленную анимацию 
// -- статический спрайт + обработчик мыши
// -- действие на каждый шаг: создать 2 объекта
// -- добавляем вектор этим двум объектам
// -- добавляем событие пересечения, когда они взрываются
