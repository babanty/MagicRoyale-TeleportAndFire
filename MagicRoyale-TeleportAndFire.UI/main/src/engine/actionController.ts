import { Engine } from "./engine";

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

        // TODO [delete]
        this.actionsAtEveryStep.push(this.eventsHandlersInitilization);

        // создаем класс, который вызывает главный шаг 60 раз в сек
        this._loopWorker = new LoopWorker(this.mainStep);
        this.eventsHandlersInitilization();

    }

    /** пользовательские функции (действия) выполняющиеся в начале каждого шага (итерации) движка (60 раз в сек) 
     * как сюда добавить: actionsAtEveryStep.push(myFunc);
    */
    public actionsAtEveryStep: OneEngineStep[];


    /** главный шаг, вызывающийся 60 раз в сек */
    private mainStep(){
        // выполнить дополнительный действия каждого цикла
        this.actionsAtEveryStep.forEach(element => {
            element();
        });

        // TODO [NotImpl] - выполнить действие каждого отдельного спрайта

        // TODO [NotImpl] - вызов отрисовки в самом конце
    }

    // TODO [NotImpl] - Добавить  действие на каждый шаг

    /** инициализиуруем обработчики событий, например событий клика мыши */ 
    private eventsHandlersInitilization(){
        // TODO [NotImpl] - перехват масштабирования\перемещения карты
        // TODO [NotImpl] - перенаправлять клики на спрайты
        // TODO [NotImpl] - Обработка событий пересечения
        // TODO [NotImpl] - Обработка событий векторов (вектор начался\окончился)
        // TODO [NotImpl] - Обработка событий горячих клавиш
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