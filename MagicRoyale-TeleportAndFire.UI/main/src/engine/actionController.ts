import { Engine } from "./engine";
import { Sprite } from "./sprite";
import { EventDistributorWithInfo, EventDistributor } from "./common";

/** класс отвечающий за все действия выполнящиеся движком */
export class ActionController{

    /** класс отвечающий за главный цикл, который повторяется 60 раз в сек */
    public get loopWorker(): LoopWorker{return this._loopWorker};


    // Приватные поля
    private _loopWorker: LoopWorker;

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
            sprite.functionsInGameLoop.forEach(func =>{
                func(sprite);
            })
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

        // TODO [NotImpl] - перенаправлять клики на спрайты
        // TODO [NotImpl] - перенаправлять наведение мыши на спрайты
        // TODO [NotImpl] - изменения положения камеры
        // TODO [NotImpl] - изменения или масштабирования

        // 1111 - canvasOnMouseMove
        // 1273 - стандартные обработчики
        
        // Обработка событий пересечения
        this.intersectionEventInitialization();
        
        // TODO - решить где будут флаги отключающие изменение расположения камеры\масштаба. Скорее всего в engine.configs. реализовать это
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
    private sriteCreatedEventHandler(createdSprite: Sprite){
        // Действия для метода intersectionEventInitialization (см. там зачем)
        // подписываеся на событие изменения координат
        createdSprite.coordinatesChangedEvent.addSubscriber(this.spriteCoordinatesChangedEventHandler);
        // проверяем, если у нового спрайта уже заданы координаты, то считаем, что "координаты изменились" и вызываем соотвествующую ф-ю
        if(createdSprite.coordinates){
            this.spriteCoordinatesChangedEventHandler(createdSprite);
        }
    };


    private spriteCoordinatesChangedEventHandler(sprite: Sprite){
        // Действия для метода intersectionEventInitialization (см. там зачем)
        // проверка пересечения спрайтов и если спрайт с кем-то пересекается, то генерируется событие intersectionEvent
        let intersectionSprites = this.engine.spriteHolder.getAllIntersection(sprite);
        if(intersectionSprites.length > 0){
            let eventInfo = new IntersectionEventInfo(sprite, intersectionSprites)
            this.intersectionEvent.invoke(eventInfo);
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