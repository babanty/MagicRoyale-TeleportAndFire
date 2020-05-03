import { Engine } from "./engine";
import { Sprite, SpriteCoordinatesChangedEventInfo } from "./sprite";
import { EventDistributorWithInfo, EventDistributor, X_Y, Size, getOffsetValues } from "./common";
import { SpriteCreatedEventInfo } from "./spriteHolder";

/** класс отвечающий за все действия выполнящиеся движком */
export class ActionController{

    /** класс отвечающий за главный цикл, который повторяется 60 раз в сек */
    public get loopWorker(): LoopWorker{return this._loopWorker};


    // Приватные поля
    private _loopWorker: LoopWorker;
    private _userInputToolResolver: UserInputToolResolver;

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

        // вызов отрисовки всех спрайтов в самом конце
        this.engine.render.renderSprites(this.engine.spriteHolder.sprites.toArray());
    }

    /** инициализиуруем обработчики событий, например событий клика мыши */ 
    private eventsHandlersInitilization(){
        // TODO [NotImpl] - перехват масштабирования\перемещения карты
        // - сперва надо закинуть события мыши и колесика на канвас
        // - сделать переменную для действия кастомного, которые вызываются при клике на html-канвас
        // - сделать "распределить" клика\2х пальцев вызывая ф-ю клика на спрайт или изменения положения камеры или масштабирования

        // распознает что хотел сделать пользователь
        this._userInputToolResolver = new UserInputToolResolver();

        // TODO [NotImpl] - сейчас мы только отправляем события resolver-у, но при этом у нас должена быть переменная для прочих подписчиков

        this.engine.canvas.canvasElement.onclick = this._userInputToolResolver.canvasOnClick;
        this.engine.canvas.canvasElement.onmousemove = this._userInputToolResolver.canvasOnMouseMove;

        // указываем что делать если зажали экран телефона
        this.engine.canvas.canvasElement.addEventListener("touchstart", this._userInputToolResolver.canvasOnTouchStart, false);
        // указываем что делать если водят пальцем по экрану
        this.engine.canvas.canvasElement.addEventListener("touchmove", this._userInputToolResolver.canvasOnTouchMove, false);
        // указываем что делать если отжали палец от экрана телефона
        this.engine.canvas.canvasElement.addEventListener("touchend", this._userInputToolResolver.canvasOnMouseUp, false);
        this.engine.canvas.canvasElement.addEventListener("touchcancel", this._userInputToolResolver.canvasOnMouseUp, false);

        // указываем что делать если зажали мышь
        this.engine.canvas.canvasElement.onmousedown = this._userInputToolResolver.canvasOnMouseDown;
        // указываем что делать если отжали мышь
        this.engine.canvas.canvasElement.onmouseup = this._userInputToolResolver.canvasOnMouseUp;
        this.engine.canvas.canvasElement.onmouseout = this._userInputToolResolver.canvasOnMouseUp;
    
        // реакция на колесико мыши, масштабирование карты WheelEvent
        this.engine.canvas.canvasElement.onwheel = this._userInputToolResolver.canvasOnWeelMouse;

        // 1111 - canvasOnMouseMove
        // 1273 - стандартные обработчики
        
        // Обработка событий пересечения
        this.intersectionEventInitialization();
        
        // TODO - решить где будут флаги отключающие изменение расположения камеры\масштаба. Скорее всего в engine.configs или в камере. реализовать это
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
// TODO Проблемы: различить зажатие мыши и клик; масштабирование мышью и пальцами; различить зажатый палец от масштабирования

    // событие навели мышь на указанные координаты
    public canvasOnMouseMoveEvent = new EventDistributorWithInfo<EngineMouseEvent, MouseEvent>();
    // событие кликнули мышью\палецем на указанные координаты (+ указать на какой спрайт попали или null)
    // событие изменили масштаб
    // событие проскролили карту

    /** расположение камеры в момент нажатия мыши TODO - оно надо? проверить ссылки*/
    private mouseDownCamera: X_Y;
    /** актуальный номер нажатия. Инкрементируется сразу в момент нажатия.
     *  Нажатие второго пальца не считается и не инкременирует переменную*/
    private touchID: number;
    /** [CanBeNull] стартовые координаты при зажатии мыши\пальца  */
    private startCoordinates: X_Y;
    /** номер стартового нажатия. Присваивается при начале новой "сессии", где сессия это нажатие пальцем\мышью.  */
    private oldTouchID: number;
    /** сохранение параметров предыдущего нажатия двумя пальцами. */
    private twoTouchWrapper: TwoTouchWrapper = new TwoTouchWrapper(new X_Y(0,0), new X_Y(0,0), 0);
    

    /** Конструктор класса - отвечающего за все действия выполнящиеся движком
    * @constructor
    * @param engine - доступ к главному центральному части движка
    */
    constructor(private engine: Engine) {}

    public canvasOnClick(eventInfo: MouseEvent){
        // TODO 
        if (camera.x < mouseDownCamera[0] + 10 && camera.x > mouseDownCamera[0] - 10 // если именно кликнули, а не зажати мышь ибо срабатывает клик и там и там.
            && camera.y < mouseDownCamera[1] + 10  && camera.y > mouseDownCamera[1] -10) { // если именно кликнули, а не зажати мышь ибо срабатывает клик и там и там.
            // магическое число 10, это то на сколько пикселей можно отклониться, тогда все ровно будет засчитан клик, а не перетаскивание. Это если слишком быстро двигают мышью
    
            // вычисляем на какой спрайт нажали
            var spriteClick = engineController.whoOnThisPlaceMaxLayer(event.pageX, event.pageY);
    
            // если спрайт не найден, то вычисляем какой шестиугольник находится в данных координатах
            if (!spriteClick) {
                xyz = getCalculateCoordinateOfGridWhenClickMouse(event.pageX, event.pageY);
                eventClickedOnEmptyHexagon(xyz[0], xyz[1], xyz[2]);
            }
    
            // вызываем функцию, которая должна срабатывать при нажатии на данный спрайт
            if (spriteClick && spriteClick.eventMouseClick) {
                spriteClick.eventMouseClick(event);
            }
        } 
    }

    // TODO может удалить? проверить, invoke-ает ли кто в этом класс еще canvasOnMouseMoveEvent
    public canvasOnMouseMove(eventInfo: MouseEvent){
        this.canvasOnMouseMoveEvent.invoke(eventInfo);
    }


    public canvasOnTouchStart(eventInfo: TouchEvent){
        this.touchID += 1; // указываем, что это новое нажатие
        if (eventInfo.touches[1]) this.touchID -= 1; // отменяем нажатие, если это второй палец
    }


    public canvasOnTouchMove(eventInfo: TouchEvent){
        // для различия зажатия и клика мыши
        this.mouseDownCamera = new X_Y(this.engine.render.camera.coordinates.x, this.engine.render.camera.coordinates.y) // TODO неуверен, что это тут надо, затестить
    
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
            // TODO - передалать на событие, сейчас это не работает
            !.setMapScale(-changeScale / 15, newTwoTouchWrapper.twoTouchCenter.x, newTwoTouchWrapper.twoTouchCenter.y); 
    
        } else { // если палец всего один, то это перемещение камеры по карте (скроллинг)

            // если идентификаторы разные - то новое касание, а значит обнуляем то на сколько скроллить
            if (this.startCoordinates && this.touchID !== this.oldTouchID){
                this.oldTouchID = this.touchID;
                this.startCoordinates = new X_Y(offsetCoordinates.x, offsetCoordinates.y)
            }
    
            // TODO вызываем событие перемещения камеры
            setCamera(
                camera.x - (startXY[0] - event.touches[0].pageX),  // изменяем положение камеры, чтобы перемещаться по карте
                camera.y - (startXY[1] - event.touches[0].pageY));// изменяем положение камеры, чтобы перемещаться по карте 
                
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


    public canvasOnMouseUp(eventInfo: MouseEvent | TouchEvent){
        this.startCoordinates = null;
        this.oldTouchID = this.touchID;

        // TODO не ясно зачем меняли и почему сейчас заменяем на canvasOnMouseMove. В canvasOnMouseDown есть альтертаива
        if (event.pageX) { // если подняли мышь (а не палец от сенсера)
            engineController.privateHolder.canvasHTML.onmousemove = oldOnmousemove ? oldOnmousemove : canvasOnMouseMove; // возвращаем что было раньше при движении мыши, пока она не зажата
        }
    }


    public canvasOnMouseDown(eventInfo: MouseEvent){
        mouseDownCamera[0] = camera.x;
        mouseDownCamera[1] = camera.y;
    
        if (startXY === null) startXY = [event.pageX, event.pageY]; // то, сколько пикселей добавлять при скроллинге
    
        oldOnmousemove = engineController.privateHolder.canvasHTML.onmousemove ? engineController.privateHolder.canvasHTML.onmousemove : canvasOnMouseMove; // сохраняем что было раньше при движении мыши, пока она не зажата
    
        // TODO как альтернатива этой хрени сделать флаг и в зависимости от него будет разное поведение
        engineController.privateHolder.canvasHTML.onmousemove = function (event) { // указываем что делать при движении мыши пока она зажата
            setCamera(
                camera.x - (startXY[0] - event.pageX),    // изменяем положение камеры, чтобы перемещаться по карте
                camera.y - (startXY[1] - event.pageY));   // изменяем положение камеры, чтобы перемещаться по карте
            startXY = [event.pageX, event.pageY];
        };
    }


    public canvasOnWeelMouse(eventInfo: WheelEvent){
        // http://old.ignatiev.su/blog/posts/mouse_wheel_javascript

        var wDelta = -eventInfo.detail / 3; // значение на сколько покрутилось колесо

        // TODO заменить на событие
        setMapScale(wDelta, event.pageX, event.pageY);


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
    (eventInfo: MouseEvent): void;
}

/** реагирует на распознанные команды пользователя (а распознает UserInputToolResolver) */
class UserInputController{
// вызываем функцию, которая должна срабатывать при наведении мыши на данный спрайт
// вызываем функцию, которая должна срабатывать при клике мыши\пальца на данный спрайт
}