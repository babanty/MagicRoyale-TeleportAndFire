import { Guid } from "guid-typescript";
import { X_Y, EventDistributor, CoordinatesChangedEvent, CoordinatesChangedEventInfo, EventDistributorWithInfo, Size } from "./common";

/** Любой объект на игровой карте */
export class Sprite{

    // Обязательные поля
    /** id. Желательно должен соотвествовать тому, что лежит на сервере */
    public id: Guid;
    /** отображаемые размеры картинки в пикселях при масштае камеры 1 к 1. Оригинальный размер картинки может отличаться */
    public picSize: Size;  
    /** масштаб, где 1 - это 1 к одному */
    public get scale(): number{return this._scale};
    /** путь до картинки.*/
    public get pathPic(): string{return this._pathPic};
    /** Картинка спрайта.*/
    public get image(): HTMLImageElement{return this._image};
    /** слой на котором производится отрисовка. Чем больше тут число, тем выше будет отрисован спрайт. Кто выше всех - тот и виден.
     * всегда определен (не равен null, undef.. etc, по умолчанию 0) */ 
    public get layer(): number{return this._layer};

    // Необязательные поля
    /** координаты объекта */
    public get coordinates(): X_Y{return this._coordinates}; // TODO пробежаться по коду, посмотреть везде ли стоят проверки на null
    /** градус на сколько повернуть изображение */ 
    public rotate: number = 0;
    /** статичные ли у него координаты? Нужно для взаимодействия с камерой. Если статичные, то на изменение масштаба и перемещения камеры реагировать не будет */
    public isStaticCoordinates: boolean = false;
    /** скрыт ли элемент. Если скрыт, то не отрисовывется и не регистируются клики */
    public isHidden: boolean = false;
    /** пропускать ли нажатие. Может отрисовываться выше всех по слою, но при нажатии пропускает клик и отдаем ему того кто ниже */
    public isSkipClick: boolean = false;
    /** геометрическая фигура, нужна для обработки событий мыши. По умолчанию прямоугольник */
    public figure: MaskFigure = MaskFigure.rectangle;
    /** вектор перемещения. Если он задается, то каждый так спрайт изменяет свою координату */
    public get vector(): MovingVector{return this._vector};
    /** просто сюда можно добавить какой-то текст\объект и т.д. по необходимости для личных нужд. На работу движка это поле не влияет */
    public tag: any;
    /** здесь функции что исполняются каждый такт. (!) Принимают на вход спрайт, дествие которого исполяется, то есть этого (this.) */
    public functionsInGameLoop: ActInGameLoop[];
    /** смещение (отклонение) реальной картинки от маски. То есть обработка нажатий на маску и реально отрисовываемая 
     *  картинка могут быть в разных местах.
     *  Это костыль на случай, если лень нормально вырезать в пеинте картинку, чтобы она правильно ложилась на маску */
    public offsetPic: X_Y;
    /** заполнив это поле вы сделаете картинку спрайта анимацией */
    public animation: SpriteAnimation;

    // События
    /** что делать объекту, если на него кликнули */
    public mouseClickEvent: ((event: MouseEvent | TouchEvent) => any);
    /** событие, на спрайт навели мышь */
    public mouseMoveEvent: ((event: MouseEvent | TouchEvent) => any);
    /** событие изменения координат спрайта */
    public coordinatesChangedEvent = new EventDistributorWithInfo<SpriteCoordinatesChangedEvent, SpriteCoordinatesChangedEventInfo>();
    /** событие о достижении конечных координат вектора у спрайта */
    public vectorMovementEndedEvent = new EventDistributorWithInfo<VectorMovementEndedEvent, VectorMovementEndedEventInfo>();

    // Приватные поля
    /** [изменять через scale] масштаб, где 1 - это 1 к одному */
    protected _scale: number;
    /** [изменять через setImage] путь до картинки.*/
    protected _pathPic: string;
    /** картинка спрайта, отрисовывающася на canvas */
    protected _image: HTMLImageElement;
    /** слой на котором производится отрисовка. Чем больше тут число, тем выше будет отрисован спрайт. Кто выше всех - тот и виден */ 
    protected _layer: number;
    /** координаты объекта */
    protected _coordinates: X_Y;
    /** вектор перемещения. Если он задается, то каждый так спрайт изменяет свою координату */
    protected _vector: MovingVector;

    /** Конструктор класса игрового объекта на карте
     * @constructor
     * @param id - id. Желательно должен соотвествовать тому, что лежит на сервере
     * @param layer -слой на котором производится отрисовка
     */
    public constructor(id: Guid, layer: number = 0) {
        this.id = id;
        this.layer = layer;
    }


    /** объеединяющий метод вызвающий прочие методы по созданию html-элемента canvas */
    public set scale (scale: number) {
        if(this.image){
            this.picSize.setNewValues(this.image.width * scale, this.image.height * scale);
        }

        this._scale = scale;
    }

    public set layer(layer: number){
        if(!layer){ // если передали null, undef.. etc
            layer = 0;
            return;
        }

        this._layer = layer;
    }

    // устанавливаем вектор движения. При этом докидываем действие в "действие на каждый шаг", 
    // чтобы актуализировались координаты спрайта, а так же подписываемся на достижения финиша в классе вектора движения
    public set vector(vector: MovingVector){
        this._vector = vector;
        this._vector.endEvent.addSubscriber(this.endEventHandler); // подписываемся на событие вектора о том что движение по нему окончено
        this.functionUpdatingCoorditanesEveryStepId = this.functionsInGameLoop.push(this.updatingCoordinatesByVector);
    }
    protected endEventHandler(){ 
        // передаем подписчикам, что движение по вектору окончено
        this.vectorMovementEndedEvent.invoke(new VectorMovementEndedEventInfo(this));
        // прекращаем актуализировать текущие координаты согласно вектору
        // TODO ?
    }
    /** id (key) в массиве functionsInGameLoop с функцией актуализации координат каждый шаг */
    protected functionUpdatingCoorditanesEveryStepId: number;


    public set coordinates(coordinates: X_Y){
        let oldCoordinates = this.coordinates ? new X_Y(this.coordinates.x, this.coordinates.x) : null;
        this._coordinates = coordinates; // устанавливаем новые координаты
        coordinates.coordinatesChangedEvent.addSubscriber(this.coorditanesChangedEventHandler); // подписываемся на их событие об изменении
        
        // вызваем ф-ю которая должна отрабатывать при изменении координат спрайта
        let eventInfo = new CoordinatesChangedEventInfo();
        eventInfo.newValues = this.coordinates;
        eventInfo.oldValues = oldCoordinates;
        this.coorditanesChangedEventHandler(eventInfo); // вызваем ф-ю которая должна отрабатывать при изменении координат спрайта

    }
    /** ф-ю которая должна отрабатывать при изменении координат как таковых, а не этого спрайта */
    protected coorditanesChangedEventHandler(eventInfo: CoordinatesChangedEventInfo){
        // уведомляем подпсчиков о наступлении события изменении координат спрайта
        let newEventInfo = new SpriteCoordinatesChangedEventInfo();
        newEventInfo.newValues = eventInfo.newValues;
        newEventInfo.oldValues = eventInfo.oldValues;
        newEventInfo.sprite = this;
        this.coordinatesChangedEvent.invoke(newEventInfo);
    }

    /** вставить\заменить картинку спрайту 
     * @param image - собственно, картинка
     * @param scale - изменение ее размера в %, где 1 - это 1 к одному
     * @param figure - указать "фигуру", например согласно ней будет работать реакция на клик мышью
    */
    public setImage (image: HTMLImageElement, scale: number = 1, figure: MaskFigure = MaskFigure.rectangle){
        this._image = image;
        this.scale = scale;
        this._pathPic = this._image.src;
        this.figure = figure;
    }


    /** актуализировать координаты если у спрайта есть вектор движения, согласно его текущему положению по вектору
     */
    public updatingCoordinatesByVector(){
        if(!this.vector){
            return;
        }

        this.coordinates = this.vector.getActualCoordinates();
    }
}


/** геометрическая фигура маски спрайта, нужна для обработки событий мыши */
export enum MaskFigure { 
    rectangle=0, 
    circle=1
    // , hexagon=2 // не реализовано 
    // , polygon=3 // не реализовано 
};


/** Функция что исполняется каждый такт для конкретного спрайта. */
export interface ActInGameLoop {
    (sprite: Sprite): void;
}

/** событие о достижении конечных координат вектора у спрайта*/
export interface VectorMovementEndedEvent {
    (eventInfo: VectorMovementEndedEventInfo): void;
}
export class VectorMovementEndedEventInfo{
    constructor (public sprite: Sprite){
    }
}

/** Событие возникающее при изменении координат спрайта. */
export interface SpriteCoordinatesChangedEvent {
    (eventInfo: SpriteCoordinatesChangedEventInfo): void;
}

/** информация о произошедшем событии */
export class SpriteCoordinatesChangedEventInfo{
    public sprite: Sprite
    public newValues: X_Y;
    public oldValues: X_Y;
}

/** вектор перемещения. Если он задается, то каждый такт спрайт изменяет свою координату */
export class MovingVector{

    // Публичные поля

    /** За какое время в миллисекундах надо преодолеть весь путь.
     * - (ньюанс) с целью оптимизации при обработке "пересечений спрайтов" не проверяется вектор как таковой, а проверяется лишь
     * то, в каких координатах сейчас объект. Для большинства случаев - это не проблема. Однако если скорость движения спрайта так 
     * высока, что за один такт (который происходит 60 раз в сек) он успевает "перелететь" через другой спрайт, и встать за ним, то
     * событие пересечения спрайтов не отработает. Если у Вас имеются сверхбыстрые объекты, например, особенная пуля, то логику
     * пересечения в этом случае необходимо делать самому т.к. в зависимости от потребностей, ресурсоемкость разных обработок
     * будет существенно различаться
    */
    public speed: number;
    /** x,y конечные координаты. Поддерживается динамическое обновление. Например, если сюда передать координаты спрайты, а 
     * затем их поменять, то вектор сменит свое направление */
    public get endCoordinates(): X_Y{return this._endCoordinates};
    /** актуален ли вектор, двигается ли объект */
    public get isMoving(): boolean{return this._isMoving};
    /** кооридинаты откуда ведется расчет. Обновляется автоматически при постановке на паузу или смене конечных координат */
    public get startCoordinates(): X_Y{return this._startCoordinates}; 

    // События
    /** событие о достижении конечных координат.*/
    public endEvent: EventDistributor = new EventDistributor();

    // Сеттеры
    public set endCoordinates(endCoordinates: X_Y){
        // отписываемся от подписки на старые координаты
        if(this.subscribeToEndCoordinatesChangedEventId && this._endCoordinates){
            this._endCoordinates.coordinatesChangedEvent.deleteSubscriber(this.subscribeToEndCoordinatesChangedEventId);
        }
        // меняем конечные координаты на новые
        let eventInfo = new CoordinatesChangedEventInfo();
        eventInfo.newValues = endCoordinates;
        this.endCoordinatesChangedEventHandler(eventInfo);
        // подписываемся на событие изменения новых координат X_Y
        endCoordinates.coordinatesChangedEvent.addSubscriber(this.endCoordinatesChangedEventHandler)
    }

    // Приватные поля
    /** кооридинаты откуда ведется расчет. Обновляется автоматически при постановке на паузу или смене конечных координат */
    protected _startCoordinates: X_Y;
    /** содежрит в себе счетчик времени, как будильник, который прозвенев должен указать, что движение по вектору окончено.
     *  Как получить этот объект: возвращает setInterval*/
    protected alarmClockThatMovingEnded: NodeJS.Timeout;
    /** время старта движения вектора в мс от начала времен. Обновляется автоматически как при 
     * старте вектора, так и после того как сняли вектор с паузы */
    protected _timeStart: number;
    protected _isMoving: boolean;
    /** % пройденного пути (знчение в пределах 0.00 - 1.00) перед тем как поставили на паузу. Идея в том что эта штука все время
     * стремится вверх, кроме случая, когда ей ставят 0 (обнуляют) */
    protected get savedPercentPathBeforePaused(): number{return this._savedPercentPathBeforePaused};
    protected set savedPercentPathBeforePaused(savedPercentPathBeforePaused: number){
        // валидация
        if(!savedPercentPathBeforePaused){
            return;
        }

        // проверяем обнуляется ли он?
        if(savedPercentPathBeforePaused <= 0){
            this._savedPercentPathBeforePaused = 0;
            return;
        }

        if(savedPercentPathBeforePaused >= 1){
            this._savedPercentPathBeforePaused = 1;
            return;
        }

        // проверяем стремится ли он вверх?
        if(savedPercentPathBeforePaused < this._savedPercentPathBeforePaused){
            throw new Error("процент движения по вектору должен стремиться к 1 и не становиться меньше текущего уровеня, кроме обнуления");
        }

        this._savedPercentPathBeforePaused = savedPercentPathBeforePaused;
    }
    /** [Don't use] используйте savedPercentPathBeforePaused даже в приватных методах */
    protected _savedPercentPathBeforePaused: number = 0;
    /** x,y конечные координаты. Поддерживается динамическое обновление. Например, если сюда передать координаты спрайты, а 
     * затем их поменять, то вектор сменит свое направление */
    protected _endCoordinates: X_Y;
    /** id (key) подписки на событие изменение координат */
    protected subscribeToEndCoordinatesChangedEventId: Guid;
    /** обработчик события изменения координат */
    protected endCoordinatesChangedEventHandler(eventInfo: CoordinatesChangedEventInfo){
        // сохраняем текущие координаты и прогресс
        this.savedPercentPathBeforePaused = this.getActualPercentPath();
        this._startCoordinates = this.getActualCoordinates();
        // устанавливаем новую конечную точку
        this._endCoordinates = eventInfo.newValues;
    }


    /** Конструктор класса 
     * @constructor
     * @param speed - за какое время в миллисекундах надо преодолеть весь путь.
     * @param startImmediately - стартовать движение по вектору сразу же при создании
     */
    constructor(startCoordinates: X_Y, endCoordinates: X_Y, speed: number, startImmediately = true) {
        this._startCoordinates = startCoordinates;
        this.endCoordinates = endCoordinates;
        this.speed = speed;
        
        if(startImmediately){
            this.doStart();
        }
    }


    /** рассчитать текущие актуальные координаты движения по вектору */
    public getActualCoordinates() : X_Y{
        if(!this.startCoordinates || !this.endCoordinates || !this._timeStart){
            return null;
        }

        let actualPercentPath = this.getActualPercentPath();

        let result = new X_Y(
            this._startCoordinates.x + (this.endCoordinates.x - this._startCoordinates.x) * actualPercentPath,
            this._startCoordinates.y + (this.endCoordinates.y - this._startCoordinates.y) * actualPercentPath
        );
        
        return result;
    }

    /** рассчитать актуальный % (0.00 - 1.00) пройденого пути */
    public getActualPercentPath() : number{
        // если вовсе не проходит валидацию
        if(!this.speed){
            return 0;
        }

        // если поставили на паузу или движение завершено
        if(!this.isMoving && this.savedPercentPathBeforePaused){
            return this.savedPercentPathBeforePaused;
        }

        // если объект сейчас в движении
        let timeNow = new Date();
        let timeDiff = timeNow.getMilliseconds() - this._timeStart; // разница между стартом и текущим временем
        let result = (timeDiff / this.speed) + this.savedPercentPathBeforePaused; 
        if(result > 1){
            return 1;
        }
        return result;
    }


    /** начать движение "по вектору" до конечных координат. Если ранее уже двигался и встал на паузу, то при вызове отэтого метода
     * пауза будет снята.
     */
    public doStart() {
        // проверяем не ставили ли на паузу. Если не сняли, то вызывает pauseOff
        if(!this.isMoving && this.savedPercentPathBeforePaused && this.savedPercentPathBeforePaused > 0){
            this.pauseOff();
        }

        this.internalStart();
    }

    /** паузнуть вектор. */
    public pauseOn(){
        // сохраняет текущий прогресс
        this.savedPercentPathBeforePaused = this.getActualPercentPath();
        // затираем "будильник"
        clearInterval(this.alarmClockThatMovingEnded);
        this._timeStart = null;
        this._isMoving = false;
    }

    /** снять с паузы вектор. 
     * - если вектор ранее не ставился на паузу, то вернет false
     * - если вектор достиг конца своего движения, то вернет false
     * - если удолось снять с паузы вернет true */
    public pauseOff() : boolean{

        // если вектор ранее не ставился на паузу, то вернет false
        if(this.isMoving || !this.savedPercentPathBeforePaused || this.savedPercentPathBeforePaused === 0){
            return false;
        }

        // если вектор достиг конца своего движения, то вернет false
        if(this.savedPercentPathBeforePaused === 1){
            return false;
        }

        this.internalStart();

        return true;
    }

    /** остановить и "обнулить" вектор на начало */
    public doStop(){
        this.savedPercentPathBeforePaused = 0;
        clearInterval(this.alarmClockThatMovingEnded);
        this._timeStart = null;
        this._isMoving = false;
    }


    protected movingEnded(){
        this._isMoving = false;
        this.savedPercentPathBeforePaused = 1;      
        this.endEvent.invoke();
    }

    /** внутряняя функция стартования. Введена чтобы не дублировать код в start и pause */
    protected internalStart(){
        // указываем что движение началось
        this._timeStart = new Date().getMilliseconds();
        this._isMoving = true;
        // заводим "будильник", который в момент достижения цели "звякнет" и вызовит событие отработки вектора
        let timeLeft = this.savedPercentPathBeforePaused ? (1 - this.savedPercentPathBeforePaused) * this.speed : this.speed; // оставшееся время
        this.alarmClockThatMovingEnded = setInterval(() => this.movingEnded, timeLeft);
    }
}


/** событие о достижении конечных координат вектора*/
export interface EndEvent {
    (): void;
}



/** класс содержащий в себе все необходимой для корректной работы анимации у спрайта */
export class SpriteAnimation{
    /** количество кадров */
    public frameNum: number;
    /** время между кадрами */
    public timeBetweenFrame: number;
    /** ширина нарезного кадра */
    public widthSlicedOneFrame: number;
    /** какой кадр отрисовать следующим. 0 - значит рисовать с первого. Если указать число большее чем frameNum, то будет 0 */
    public frameNumNext: number = 0;
    /** активна ли анимация (true) или она на паузе (false) */
    public get isActive(): boolean{return this._isActive};
    /** наступило ли время отрисовки следующего кадра */
    public get isTimeDrawNextFrame(): boolean{return this._isTimeDrawNextFrame};
    public set isTimeDrawNextFrame(isTimeDrawNextFrame: boolean) {this._isTimeDrawNextFrame = isTimeDrawNextFrame};

    /** активна ли анимация (true) или она на паузе (false) */
    protected _isActive: boolean;
    /** наступило ли время отрисовки следующего кадра */
    protected _isTimeDrawNextFrame: boolean = true;
    /** содежрит в себе счетчик время как часто надо менять isTimeDrawNewFrame на true, зависит от timeBetweenFrame.
     *  Как получить этот объект: возвращает setInterval*/
    protected _counterFrame: NodeJS.Timeout;

    /** Конструктор класса 
     * @constructor
     * @param id - id. Желательно должен соотвествовать тому, что лежит на сервере
     */
    constructor(frameNum: number, timeBetweenFrame: number, 
                widthSlicedOneFrame: number, doStart: boolean = true, frameNumNext: number = 0) {
        this.frameNum = frameNum;
        this.timeBetweenFrame = timeBetweenFrame;
        this.widthSlicedOneFrame = widthSlicedOneFrame;
        
        if(doStart) this.doStart();
    }

    /** стартануть анимацию 1 раз целиком */
    public doStart(){
        this._isActive = true;
        this._isTimeDrawNextFrame = true;
        
        // делаем функцию вызывающую раз внекоторое время вложенную стрелочную ф-ию со сменой кадра
        this._counterFrame = setInterval(() => {
            if(this.frameNumNext === this.frameNum - 1){ // если уже последний кадр, то очищаем интервал
                this.doStop();
            } else { // если все хорошо и анимация еще идет
                this.frameNumNext += 1
                this._isTimeDrawNextFrame = true
            }
            
        }, this.timeBetweenFrame);
    }

    /** зациклить анимацию, то есть она постоянно будет повторяться */
    public doLoop(){
        this._isActive = true;
        this._isTimeDrawNextFrame = true;

        // делаем функцию вызывающую раз внекоторое время вложенную стрелочную ф-ию со сменой кадра
        this._counterFrame = setInterval(() => {this.frameNumNext += 1; this._isTimeDrawNextFrame = true}, this.timeBetweenFrame);
    }

    /** паузнуть анимацию. Снять с паузы - doStart\doLoop */
    public doPause(){
        this._isActive = false;
        clearInterval(this._counterFrame); // удаляем функцию вызывающую раз внекоторое время смену кадра
    }

    /** остановить и "обнулить" анимацию на начало */
    public doStop(){
        this._isActive = false;
        this._isTimeDrawNextFrame = false;
        clearInterval(this._counterFrame); // удаляем функцию вызывающую раз внекоторое время смену кадра
        this.frameNumNext = 0;
    }
}