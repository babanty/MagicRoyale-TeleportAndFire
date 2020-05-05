import { Engine } from "./engine";
import { Sprite, SpriteCoordinatesChangedEventInfo } from "./sprite";
import { EventDistributorWithInfo, EventDistributor, X_Y, Size, getOffsetValues } from "./common";
import { SpriteCreatedEventInfo } from "./spriteHolder";

/** класс отвечающий за все действия выполнящиеся движком */
export class ActionController{

    /** класс отвечающий за главный цикл, который повторяется 60 раз в сек */
    public get loopWorker(): LoopWorker{return this._loopWorker};
    /** реагирует на распознанные команды пользователя (а распознает UserInputToolResolver) */
    public get userInputController(): UserInputController{return this._userInputController};
    /** реагирует на ввод пользователя через разные устройства (мышь, клавиатура, сенсорный экран) и понимает что 
     * пользователь хотел сделать (какую конкретно команду вызывать. Пример: переместить что-то зажав мышь или сделать скролл экрана) */
    public get userInputToolResolver(): UserInputToolResolver{return this._userInputToolResolver};
    /** событие, что движок закончил отрабатывать логику всех действий в текущем такте, но еще не приступил к отрисовке */
    public logicExecutedEvent = new EventDistributor();

    // Приватные поля
    private _loopWorker: LoopWorker;
    private _userInputToolResolver: UserInputToolResolver;
    /** реагирует на распознанные команды пользователя (а распознает UserInputToolResolver) */
    private _userInputController: UserInputController;

    /** Конструктор класса - отвечающего за все действия выполнящиеся движком
     * @constructor
     * @param engine - доступ к главному центральному части движка
     */
    constructor(private engine: Engine) {

        // создаем класс, который вызывает главный шаг 60 раз в сек
        this._loopWorker = new LoopWorker(this.mainStep);
        this.eventsHandlersInitilization();

    }

    /** сюда можно добавить функции (действия) выполняющиеся в начале каждого шага (итерации) движка (60 раз в сек) */
    public actionsAtEveryStep = new EventDistributor();

    /** Действия, которы выполнятся при событии пересечения двух спрайтов. Отправляет функции-подписчику спрайты, 
     * которые пересеклись. 
    * - где первый спрайт - это тот кто двинулся, а второй - кто стоял (двинулись на него). 
    * - событие вызывается после того как координаты изменились, но до того как картинка отрисовалась*/
    public intersectionEvent = new EventDistributorWithInfo<IntersectionEvent, IntersectionEventInfo>();


    /** главный шаг, вызывающийся 60 раз в сек */
    private mainStep(){
        // выполнить дополнительный действия каждого цикла
        this.actionsAtEveryStep.invoke()

        // выполнить действие каждого отдельного спрайта
        this.engine.spriteHolder.sprites.forEach(sprite =>{
            sprite.functionsInGameLoop.invoke(sprite);
        })

        this.logicExecutedEvent.invoke();

        // вызов отрисовки кадра в самом конце
        this.engine.render.renderFrame(this.engine.spriteHolder.sprites.toArray());
    }

    /** инициализиуруем обработчики событий, например событий клика мыши */ 
    private eventsHandlersInitilization(){

        // распознает что хотел сделать пользователь
        this._userInputToolResolver = new UserInputToolResolver(this.engine);
        // TODO [NotImpl] - сейчас мы только отправляем события resolver-у, но при этом у нас должена быть переменная для прочих подписчиков
        // 1111 - canvasOnMouseMove
        // 1273 - стандартные обработчики

        let canvas = this.engine.canvas;

        canvas.onclick.addSubscriber(this._userInputToolResolver.canvasOnClick);
        canvas.canvasElement.onclick = (event) => canvas.onclick.invoke(event);

        canvas.onmousemove.addSubscriber(this._userInputToolResolver.canvasOnMouseMove);
        canvas.canvasElement.onmousemove = (event) => canvas.onmousemove.invoke(event);

        // указываем что делать если зажали экран телефона
        canvas.touchstart.addSubscriber(this._userInputToolResolver.canvasOnTouchStart);
        canvas.canvasElement.addEventListener("touchstart", (event) => canvas.touchstart.invoke(event), false);

        // указываем что делать если водят пальцем по экрану
        canvas.touchmove.addSubscriber(this._userInputToolResolver.canvasOnTouchMove);
        canvas.canvasElement.addEventListener("touchmove", (event) => canvas.touchmove.invoke(event), false);

        // указываем что делать если отжали палец от экрана телефона
        canvas.touchend.addSubscriber(this._userInputToolResolver.canvasOnClickUp);
        canvas.canvasElement.addEventListener("touchend", (event) => canvas.touchend.invoke(event), false);
        canvas.touchcancel.addSubscriber(this._userInputToolResolver.canvasOnClickUp);
        canvas.canvasElement.addEventListener("touchcancel", (event) => canvas.touchcancel.invoke(event), false);

        // указываем что делать если зажали мышь
        canvas.onmousedown.addSubscriber(this._userInputToolResolver.canvasOnMouseDown);
        canvas.canvasElement.onmousedown = (event) => canvas.onmousedown.invoke(event);

        // указываем что делать если отжали мышь
        canvas.onmouseup.addSubscriber(this._userInputToolResolver.canvasOnClickUp);
        canvas.canvasElement.onmouseup = (event) => canvas.onmouseup.invoke(event);
        canvas.onmouseout.addSubscriber(this._userInputToolResolver.canvasOnClickUp);
        canvas.canvasElement.onmouseout = (event) => canvas.onmouseout.invoke(event);
    
        // реакция на колесико мыши, масштабирование карты WheelEvent
        canvas.onwheel.addSubscriber(this._userInputToolResolver.canvasOnWeelMouse);
        canvas.canvasElement.onwheel = (event) => canvas.onwheel.invoke(event);

        // указываем, кто будет обрабатывать все эти события с мыши\тача
        this._userInputController = new UserInputController(this.engine, this._userInputToolResolver);

        // Обработка событий пересечения
        this.intersectionEventInitialization();
    }

    /** отдельно вынесеная логика создания события перересечения спрайтов */
    private intersectionEventInitialization(){
        // подписываемся на событие в холдере о появлении нового спрайта
        this.engine.spriteHolder.spriteCreatedEvent.addSubscriber(this.sriteCreatedEventHandler);
        // sriteCreatedEventHandler подписывается на событие изменения координат у нового спрайта

        // что происходит далее:
        // если у нового спрайта меняется координаты (или если они заранее были заданы), то вызывается 
        // ф-ия spriteCoordinatesChangedEventHandler (обработчик собитыя изменения координат). 
        // Внутри нее вызывается ф-ия проверки пересечения спрайтов и если
        // спрайт с кем-то пересекается, то генерируется событие intersectionEvent        
        

        // размышления, как делать этот метод
        // - в случае пересечения исполняются все делегаты подписанные на это событие и им на вход передается два спрайта, которые пересеклись
        // - как это сделать оптимизированно? 
        // --- Если делать в тупую, просто перебирая каждый спрайт каждый такт на пересечение с другим спрайтом, то лучшая скорость 
        // --- это парабола x/2(x+1), где x - количество спрайтов. При тысяче объектов надо перебирать 500500 комбинаций.
        // --- Если это делать оптимизированно, то у спрайта на coordinates поставить setter, который вызывает событие движения,
        // --- а оно в свою очередь вызывает пересчет на пересечения и вызывает событие пересечения до того, как оно произошло
        // --- так намного лучше, можно сделать подписку на пересечение как до того как это случилось так и после
    }


    /** функция вызывающаяся при наступлении события создания спрайта  */
    private sriteCreatedEventHandler(eventInfo: SpriteCreatedEventInfo){
        // Действия для метода intersectionEventInitialization (см. там зачем)
        // подписываеся на событие изменения координат
        eventInfo.createdSprite.coordinatesChangedEvent.addSubscriber(this.spriteCoordinatesChangedEventHandler);
        // проверяем, если у нового спрайта уже заданы координаты, то считаем, что "координаты изменились" и вызываем соотвествующую ф-ю
        if(eventInfo.createdSprite.coordinates){
            let spriteCoordinatesChangedEventInfo = new SpriteCoordinatesChangedEventInfo();
            spriteCoordinatesChangedEventInfo.sprite = eventInfo.createdSprite
            this.spriteCoordinatesChangedEventHandler(spriteCoordinatesChangedEventInfo);
        }
    };


    private spriteCoordinatesChangedEventHandler(eventInfo: SpriteCoordinatesChangedEventInfo){
        // Действия для метода intersectionEventInitialization (см. там зачем)
        // проверка пересечения спрайтов и если спрайт с кем-то пересекается, то генерируется событие intersectionEvent
        let intersectionSprites = this.engine.spriteHolder.getAllIntersection(eventInfo.sprite);
        if(intersectionSprites.length > 0){
            let intersectionEventInfo = new IntersectionEventInfo(eventInfo.sprite, intersectionSprites)
            this.intersectionEvent.invoke(intersectionEventInfo);
        }
    }
}

/** Событие пересечения двух спрайтов. Отправляет функции-подписчику спрайты, которые пересеклись. 
 * - событие вызывается после того как координаты изменились, но до того как картинка отрисовалась*/
export interface IntersectionEvent {
    (eventInfo: IntersectionEventInfo): void;
}
/** Информация о событии пересечения двух спрайтов. 
 * - где первый спрайт - это тот кто двинулся и "врезался", а вторые - те кто стоял. 
 * - событие вызывается после того как координаты изменились, но до того как картинка отрисовалась*/
export class IntersectionEventInfo{
    /** Информация о событии пересечения двух спрайтов. 
    * @param moovingSprite - тот кто двинулся и "врезался"
    * @param standingSprites - те кто стояли и двинулись на них*/
    public constructor (public moovingSprite: Sprite, public standingSprites: Sprite[]){
    }
}


/** класс отвечающий за главный цикл, который повторяется 60 раз в сек */
class LoopWorker{
    /** поставить на паузу движок, где true - на паузе. Внимание, это не игровая пауза, движок, отрисовка и проч.
     *  полностью остановятся.
     */
    public isEnginePause: boolean;


    // Приватные поля
    /** Главная ф-ия движка в которая повтораяется каждый шаг зациклено раз в n-мс (обычно 60 раз в секунду) */
    private oneEngineStep: OneEngineStep;

    /** Конструктор класса - отвечающий за главный цикл, который повторяется 60 раз в сек
     * @constructor
     * @param oneEngineStep - Главная ф-ия движка в которая повтораяется каждый шаг зациклено раз в n-мс (обычно 60 раз в секунду)
     */
    constructor(oneEngineStep: OneEngineStep) {
        this.isEnginePause = false;
        this.oneEngineStep = oneEngineStep;

        this.engineActionsInitialization(); // заводим движок
    }

    /** инициализация шагов движка. То есть тут мы заводим заводим движок как машину. На вечный цикл 60 раз\сек */
    private engineActionsInitialization() : void{
        this.recursionEngineStep(); // вызываем первый шаг, который потом рекурсивно сам себя вызывает
    }

    /** один шаг движка, который 60 раз в секунду вызывает сам себя */
    private recursionEngineStep(){
        if(!this.isEnginePause){ // если не на паузе
            this.oneEngineStep(); // вызов главной ф-ии движка, которая все заставляет работать.
        }

        this.animationFrame(this.recursionEngineStep); // делаем рекурсию - вызываем самого себя, только через 
                                                       // метод-прослойку, чтобы не словить переполнение стека
    }

    /** специальная оптимизированная ф-ия по отрисовке кадров в браузерах */
    private animationFrame(oneEngineStep: OneEngineStep) : void{
        // если реализован этот метод для отрисовки
        if(requestAnimationFrame){
            requestAnimationFrame(oneEngineStep);
            return;
        }

        // если реализован этот метод для отрисовки
        if(webkitRequestAnimationFrame){
            webkitRequestAnimationFrame(oneEngineStep);
            return;
        }

        // если ни каких оптимизированных методов не найдено, то просто вызываем ф-ю шага сами
        setTimeout(oneEngineStep, 1000 / 60);
    }    
}

/** Ф-ия движка в которая повтораяется каждый шаг зациклено раз в n-мс (обычно 60 раз в секунду) */
interface OneEngineStep {
    (): void;
}

/** реагирует на ввод пользователя через разные устройства (мышь, клавиатура, сенсорный экран) и понимает что пользователь
 * хотел сделать (какую конкретно команду вызывать. Пример: переместить что-то зажав мышь или сделать скролл экрана)
 */
class UserInputToolResolver{
// Разрешает проблемы: различить зажатие мыши и клик; масштабирование мышью и пальцами; различить зажатый палец от масштабирования
// TODO зарефакторить это при дебаге

    /** событие навели мышь на указанные координаты */
    public engineOnMouseMoveEvent = new EventDistributorWithInfo<EngineMouseEvent, EngineMouseEventInfo>();
    /** событие кликнули мышью\палецем на указанные координаты (+ указать на какой спрайт попали или null) */
    public engineOnClickEvent = new EventDistributorWithInfo<EngineMouseEvent, EngineMouseEventInfo>();
    /** событие о необходимости изменить масштаб */
    public setMapScaleEvent = new EventDistributorWithInfo<SetScaleEvent, SetScaleEventInfo>();
    /** событие о необходимости проскролить карту */
    public setScrollMapEvent = new EventDistributorWithInfo<SetScrollMapEvent, SetScrollMapEventInfo>();


    /** актуальный номер нажатия. Инкрементируется сразу в момент нажатия.
     *  Нажатие второго пальца не считается и не инкременирует переменную*/
    private touchID: number;
    /** [CanBeNull] стартовые координаты при зажатии мыши\пальца  */
    private startCoordinates: X_Y;
    /** номер стартового нажатия. Присваивается при начале новой "сессии", где сессия это нажатие пальцем\мышью.  */
    private oldTouchID: number;
    /** сохранение параметров предыдущего нажатия двумя пальцами. */
    private twoTouchWrapper: TwoTouchWrapper = new TwoTouchWrapper(new X_Y(0,0), new X_Y(0,0), 0);
    /** зажата ли сейчас левая кнопка мыши над канвасом */
    private isCanvasOnMouseDown = false;
    

    /** Конструктор класса - отвечающего за все действия выполнящиеся движком
    * @constructor
    * @param engine - доступ к главному центральному части движка
    */
    constructor(private engine: Engine) {}


    public canvasOnClick(eventInfo: MouseEvent){
        // TODO глянуть в Desktop js - 1060 строка
        // if (camera.x < mouseDownCamera[0] + 10 && camera.x > mouseDownCamera[0] - 10 // если именно кликнули, а не зажати мышь ибо срабатывает клик и там и там.
        //     && camera.y < mouseDownCamera[1] + 10  && camera.y > mouseDownCamera[1] -10) { // если именно кликнули, а не зажати мышь ибо срабатывает клик и там и там.
            // магическое число 10, это то на сколько пикселей можно отклониться, тогда все ровно будет засчитан клик, а не перетаскивание. Это если слишком быстро двигают мышью
    
            // вычисляем на какой спрайт нажали
            let engineOnMouseMoveEvent = new EngineMouseEventInfo()
        
            engineOnMouseMoveEvent.mouseEventInfo = eventInfo;
    
            let coordinates = new X_Y(eventInfo.offsetX, eventInfo.offsetY)
            let sprite = this.engine.spriteHolder.whoOnThisPlace(coordinates, true, false);
            engineOnMouseMoveEvent.sprite = sprite.length >= 0 ? sprite[0] : null;
    
            this.engineOnMouseMoveEvent.invoke(engineOnMouseMoveEvent);
        // } 
    }


    public canvasOnMouseMove(eventInfo: MouseEvent){
        // особенный сценарий, который перебивает основную работу этого события - мы не просто ведем мышь, но еще и при этом с 
        //    зажатой левой кнопкой мыши
        if(this.isCanvasOnMouseDown){
            // вызываем событие перемещения камеры
            let setScrollMapEventInfo = new SetScrollMapEventInfo();
            setScrollMapEventInfo.scroll = new Size(-(this.startCoordinates.x - eventInfo.offsetX), 
                                                    -(this.startCoordinates.y - eventInfo.offsetY));
            this.setScrollMapEvent.invoke(setScrollMapEventInfo);

            this.startCoordinates = new X_Y(eventInfo.offsetX, eventInfo.offsetY)
            return; // прерываем дальнейшую обработку события
        }


        let engineOnMouseMoveEvent = new EngineMouseEventInfo()
        
        engineOnMouseMoveEvent.mouseEventInfo = eventInfo;

        let coordinates = new X_Y(eventInfo.offsetX, eventInfo.offsetY)
        let sprite = this.engine.spriteHolder.whoOnThisPlace(coordinates, true, false);
        engineOnMouseMoveEvent.sprite = sprite.length >= 0 ? sprite[0] : null;

        this.engineOnMouseMoveEvent.invoke(engineOnMouseMoveEvent);
    }


    public canvasOnTouchStart(eventInfo: TouchEvent){
        if (eventInfo.touches[1]) return // если это второй палец, то не реагируем

        this.touchID += 1; // указываем, что это новое нажатие
    }


    public canvasOnTouchMove(eventInfo: TouchEvent){
        // для различия зажатия и клика мыши
    
        let offsetCoordinates = getOffsetValues(eventInfo, this.engine.canvas.canvasElement, 0);

        if (eventInfo.touches[1]) { // если более двух пальцев касаются экрана, то это масштабирование экрана

            let newTwoTouchWrapper = new TwoTouchWrapper(
                offsetCoordinates,
                getOffsetValues(eventInfo, this.engine.canvas.canvasElement, 1),
                this.touchID
            )
    
            // насколько изменилось расстояние между пальцами, на плюс или минус 
            let changeScale = 0;

            if (touchID === this.twoTouchWrapper.touchID) { // если это продолжение нажатия двумя пальцами, которое началось в предыдущих событиях
                changeScale = this.twoTouchWrapper.twoTouchDelta.width - newTwoTouchWrapper.twoTouchDelta.width
                                + this.twoTouchWrapper.twoTouchDelta.height - newTwoTouchWrapper.twoTouchDelta.height; 
            }

            // обновляем дельту, что бы в будущем от нее отталкиваться
            this.twoTouchWrapper = newTwoTouchWrapper;
    
            // изменяем масштаб, 1 - на сколько изменяем, 2,3 - координаты центра к которому приблежать
            // TODO - не знаю что за магическое число 15. Скорее всего оно подобрано с учетом того числа, которое отправляет колесико 
            let setMapScaleEventInfo = new SetScaleEventInfo();
            setMapScaleEventInfo.scaleTarget = new X_Y(newTwoTouchWrapper.twoTouchCenter.x, newTwoTouchWrapper.twoTouchCenter.y);
            setMapScaleEventInfo.scaleValue = -changeScale / 15;
            this.setMapScaleEvent.invoke(setMapScaleEventInfo);
    
        } else { // если палец всего один, то это перемещение камеры по карте (скроллинг)

            // если идентификаторы разные - то новое касание, а значит обнуляем то на сколько скроллить
            if (this.startCoordinates && this.touchID !== this.oldTouchID){
                this.oldTouchID = this.touchID;
                this.startCoordinates = new X_Y(offsetCoordinates.x, offsetCoordinates.y)
            }
    
            // вызываем событие перемещения камеры
            let setScrollMapEventInfo = new SetScrollMapEventInfo();
            setScrollMapEventInfo.scroll = new Size(-(this.startCoordinates.x - offsetCoordinates.x), 
                                                    -(this.startCoordinates.y - offsetCoordinates.y));
            this.setScrollMapEvent.invoke(setScrollMapEventInfo);
            
            this.oldTouchID = this.touchID;
            this.startCoordinates = new X_Y(offsetCoordinates.x, offsetCoordinates.y)
        }
    
        // и заботимся о том, чтобы прокручивание колесика над элементом, не прокручивала скроллы страницы или еще что
        if (event.preventDefault) {
            event.preventDefault();
        }

        // скорее всего запрещаем передачу обработку сообщения дальше кишкам js.
        eventInfo.returnValue = false;
    }

    /** если отжали мышь или палец */
    public canvasOnClickUp(eventInfo: MouseEvent | TouchEvent){
        this.startCoordinates = null;
        this.oldTouchID = this.touchID;

        // если подняли мышь (а не палец от сенсера)
        if (eventInfo instanceof MouseEvent) {
            this.isCanvasOnMouseDown = false;
        }
    }


    public canvasOnMouseDown(eventInfo: MouseEvent){
        // TODO точно ли? - this.touchID инкрементится в canvasOnClick т.к. он тоже одновременно срабатывает 
    
        // указываем начальную координату при скроллинге, чтобы знать в какую сторону отведут мышь в следующий момент времени
        if (this.startCoordinates === null) 
            this.startCoordinates = new X_Y(eventInfo.offsetX, eventInfo.offsetY); 

        this.isCanvasOnMouseDown = true;
    }


    public canvasOnWeelMouse(eventInfo: WheelEvent){
        // http://old.ignatiev.su/blog/posts/mouse_wheel_javascript

        var wDelta = -eventInfo.detail / 3; // значение на сколько покрутилось колесо

        let setMapScaleEventInfo = new SetScaleEventInfo();
        setMapScaleEventInfo.scaleTarget = new X_Y(eventInfo.offsetX, eventInfo.offsetY);
        setMapScaleEventInfo.scaleValue = wDelta;
        this.setMapScaleEvent.invoke(setMapScaleEventInfo);

        // и заботимся о том, чтобы прокручивание колесика над элементом, не прокручивала скроллы страницы или еще что
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.returnValue = false;
    }
}

/** класс -контейнер с данным по дельте между пальцами на экране */
class TwoTouchWrapper{
    /** дельта между пальцами */
    public get twoTouchDelta(): Size{return this._twoTouchDelta};
    /** центра между двумя пальцами */
    public get twoTouchCenter(): X_Y{return this._twoTouchCenter};

    private _twoTouchDelta: Size;
    private _twoTouchCenter: X_Y;

    constructor(public firstTouch: X_Y,
                public secondTouch: X_Y,
                public touchID: number){

        this._twoTouchCenter = new X_Y(
                Math.abs(firstTouch.x + (secondTouch.x - firstTouch.x) / 2),
                Math.abs(firstTouch.y + (secondTouch.y - firstTouch.y) / 2));

        this._twoTouchDelta = new Size(
                Math.abs(secondTouch.x - firstTouch.x),
                Math.abs(secondTouch.y - firstTouch.y));
    }
}

/** событие связанное с мышью обработанное движком после обработки браузером */
export interface EngineMouseEvent {
    (eventInfo: EngineMouseEventInfo): void;
}
/** информация о событии связанное с мышью обработанное движком после обработки браузером */
export class EngineMouseEventInfo{
    /** информация о событии мыши */
    public mouseEventInfo: MouseEvent;
    /** какой спрайт находится в указанных координатах и "примет на себя" это событие */
    public sprite: Sprite;
}

/** событие уведомляющее о необходимости изменить масштаб карты */
export interface SetScaleEvent {
    (eventInfo: SetScaleEventInfo): void;
}
/** информация о событии уведомляющее о необходимости изменить масштаб карты */
export class SetScaleEventInfo{
    /** то на сколько поменять масштаб карты */
    public scaleValue: number;
    /** "центр" к которому приближать или от которого отдалять */
    public scaleTarget: X_Y;
}

/** событие о необходимости проскролить карту */
export interface SetScrollMapEvent {
    (eventInfo: SetScrollMapEventInfo): void;
}
/** информация по событию о необходимости проскролить карту */
export class SetScrollMapEventInfo {
    /** то на сколько проскролить карту относительно текущего положения */
    public scroll: Size;
}

/** реагирует на распознанные команды пользователя (а распознает UserInputToolResolver) */
export class UserInputController{

    /** можно ли движением мыши менять положение камеры (изменять ее координаты) */
    public mouseScrollingEnable: boolean = true;
    /** можно ли изменять масштаб карты колесиком мыши или двумя пальцами */
    public touchOrWheelMapScalingEnable: boolean = true;
    /** можно ли изменять положение камеры (изменять ее координаты) при масштабировании */
    public scrollinWithScalingEnable: boolean = true;
    /** реагироавть ли как-либо на клик мышью\пальцем (то есть если нажали на спрайт, то вызывается ф-я предназначенная для этого спрайта) */
    public clickReactionEnable: boolean = true;
    /** реагироавть ли как-либо на наведение мышью (то есть если нажали на спрайт, то вызывается ф-я предназначенная для этого спрайта) */
    public mouseMoveReactionEnable: boolean = true;

    /** Конструктор класса - отвечающего за реагирцию на распознанные команды пользователя (а распознает UserInputToolResolver)
    * @constructor
    * @param engine - доступ к главному центральному части движка
    */
    constructor(private engine: Engine,
                userInputToolResolver: UserInputToolResolver) {

        // подписываемся на все события UserInputToolResolver, чтобы на них реагировать
        userInputToolResolver.engineOnClickEvent.addSubscriber(this.engineOnMouseClickEventHandler);
        userInputToolResolver.engineOnMouseMoveEvent.addSubscriber(this.engineOnMouseMoveEventHandler);
        userInputToolResolver.setMapScaleEvent.addSubscriber(this.setMapScaleEventHandler);
        userInputToolResolver.setScrollMapEvent.addSubscriber(this.setScrollMapEventHandler);
    }

    public engineOnMouseClickEventHandler(eventInfo: EngineMouseEventInfo){
        // вызываем функцию, которая должна срабатывать при нажатии на данный спрайт
        if(this.clickReactionEnable) eventInfo.sprite?.mouseClickEvent(eventInfo.mouseEventInfo);
    }

    public engineOnMouseMoveEventHandler(eventInfo: EngineMouseEventInfo){
        // вызываем функцию, которая должна срабатывать при наведении на данный спрайт
        if(this.mouseMoveReactionEnable) eventInfo.sprite?.mouseMoveEvent(eventInfo.mouseEventInfo);
    }

    public setMapScaleEventHandler(eventInfo: SetScaleEventInfo){
        // изменяем масштаб карты
        if(this.touchOrWheelMapScalingEnable && this.scrollinWithScalingEnable) {
            this.engine.render.camera.setScaleMap(eventInfo.scaleValue, eventInfo.scaleTarget);
        }
        if(this.touchOrWheelMapScalingEnable && this.scrollinWithScalingEnable === false){
            this.engine.render.camera.setScaleMap(eventInfo.scaleValue, null);
        }
    }

    public setScrollMapEventHandler(eventInfo: SetScrollMapEventInfo){
        if(this.mouseScrollingEnable){
            let cameraCoord = this.engine.render.camera.coordinates;

            // скроллим карту (перемещаемся по ней)
            cameraCoord.setNewValues(cameraCoord.x + eventInfo.scroll.width, cameraCoord.y + eventInfo.scroll.height);
        }
    }

}