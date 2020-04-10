/** Класс, отвечающий за canvas (html5) внутри которого все отрисовывается */
export class Canvas {

    /** canvas - html5-элемент внутри которого все отрисовывается */
    public canvasElement: HTMLCanvasElement;

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