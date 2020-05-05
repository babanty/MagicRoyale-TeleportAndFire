import { EventDistributorWithInfo } from "./common";

/** Класс, отвечающий за canvas (html5) внутри которого все отрисовывается */
export class Canvas {

    /** canvas - html5-элемент внутри которого все отрисовывается */
    public canvasElement: HTMLCanvasElement;

    // Переопределенные DOM события. Если они понадобятся, то надо подписываться на них здесь
    /** аналог события клика canvasElement.onclick. 
     * - Т.к. DOM-событие canvasElement.onclick занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onclick не сломав движок. */
    public onclick = new EventDistributorWithInfo<IMouseEvent, MouseEvent>();
    /** аналог события клика canvasElement.onmousemove. 
     * - Т.к. DOM-событие canvasElement.onmousemove занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onmousemove не сломав движок. */
    public onmousemove = new EventDistributorWithInfo<IMouseEvent, MouseEvent>();
    /** аналог события клика canvasElement.onmousedown. 
     * - Т.к. DOM-событие canvasElement.onmousedown занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onmousedown не сломав движок. */
    public onmousedown = new EventDistributorWithInfo<IMouseEvent, MouseEvent>();
    /** аналог события клика canvasElement.onmouseup. 
     * - Т.к. DOM-событие canvasElement.onmouseup занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onmouseup не сломав движок. */
    public onmouseup = new EventDistributorWithInfo<IMouseEvent, MouseEvent>();
    /** аналог события клика canvasElement.onmouseout. 
     * - Т.к. DOM-событие canvasElement.onmouseout занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onmouseout не сломав движок. */
    public onmouseout = new EventDistributorWithInfo<IMouseEvent, MouseEvent>();
    /** аналог события клика canvasElement.touchstart. 
     * - Т.к. DOM-событие canvasElement.touchstart занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.touchstart не сломав движок. */
    public touchstart = new EventDistributorWithInfo<ITouchEvent, TouchEvent>();
    /** аналог события клика canvasElement.touchmove. 
     * - Т.к. DOM-событие canvasElement.touchmove занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.touchmove не сломав движок. */
    public touchmove = new EventDistributorWithInfo<ITouchEvent, TouchEvent>();
    /** аналог события клика canvasElement.touchend. 
     * - Т.к. DOM-событие canvasElement.touchend занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.touchend не сломав движок. */
    public touchend = new EventDistributorWithInfo<ITouchEvent, TouchEvent>();
    /** аналог события клика canvasElement.touchcancel. 
     * - Т.к. DOM-событие canvasElement.touchcancel занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.touchcancel не сломав движок. */
    public touchcancel = new EventDistributorWithInfo<ITouchEvent, TouchEvent>();
    /** аналог события клика canvasElement.onwheel. 
     * - Т.к. DOM-событие canvasElement.onwheel занято движком, то тут его аналог, чтобы можно было подписаться на canvasElement.onwheel не сломав движок. */
    public onwheel = new EventDistributorWithInfo<IWheelEvent, WheelEvent>();


    /** element - html-элемент (div) внутри которого будет создан canvas */
    private parrentElement: HTMLElement;
    /** является ли canvas главным элементом на странице, что обозначает, что он должен быть во весь экран */
    private canvasIsMainElement: boolean;
    

    /** Конструктор класса отвечающего за canvas
     * @constructor
     * @param parrentElement - html-элемент (div) внутри которого будет создан canvas
     * @param canvasIsMainElement - является ли canvas главным элементом на странице, что обозначает, что он должен быть во весь экран 
     */
    public constructor(parrentElement: HTMLElement, canvasIsMainElement: boolean = true) {
        this.parrentElement = parrentElement;
        this.canvasIsMainElement = canvasIsMainElement;

        this.createCanvas();

        if (this.canvasIsMainElement === true) {
            this.canvasToFullDocument();
        }
    }

    /** объеединяющий метод вызвающий прочие методы по созданию html-элемента canvas */
    protected createCanvas() {
        this.createCanvasHtml();
        this.createCanvasCss();
    }

    /** метод по созданию html-тега на странице */
    protected createCanvasHtml() {
        this.canvasElement = document.createElement('canvas');
        this.parrentElement.appendChild(this.canvasElement);
        this.canvasElement.innerHTML += "Извините, ваш браузер не поддерживает тег canvas"; // фраза по умолчанию вырисовыается, если не отрисовался канвас
    }

    /** метод по наполнению canvas-элемента стартартному css-свойствами */
    protected createCanvasCss() {
        this.canvasElement.style.zIndex = "1"; // z - координата элемента (глубина, уровень на котором располагается элемент)
    }

    /** метод по наполнению canvas-элемента css-свойствами если сказали сделать его на весь экран браузера */
    protected canvasToFullDocument() {
        this.canvasElement.style.position = "absolute"; // чтобы элемент располагался по абсолютным координатам
        this.canvasElement.style.overflow = "hidden";   // TODO [refactor] - не известно для чего, возможно удалить
        this.canvasElement.style.top = "0";             // чтобы элемент был в упор к левому верхнему краю браузера
        this.canvasElement.style.left = "0";            // чтобы элемент был в упор к левому верхнему краю браузера
        this.canvasElement.style.width = "100%";        // чтобы элемент был на весь экран браузера (но не на весь чисто экран)
        this.canvasElement.style.height = "100%";       // чтобы элемент был на весь экран браузера (но не на весь чисто экран)
    }
}


/** событие мыши */
export interface IMouseEvent {
    (eventInfo: MouseEvent): void;
}
/** событие касания по сенсорному экрану */
export interface ITouchEvent {
    (eventInfo: TouchEvent): void;
}
/** событие прокрутки колесика */
export interface IWheelEvent {
    (eventInfo: WheelEvent): void;
}