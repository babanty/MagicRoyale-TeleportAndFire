import { Guid } from "guid-typescript";
import { X_Y } from "./common";

/** Любой объект на игровой карте */
export class Sprite{

    // Обязательные поля
    /** id. Желательно должен соотвествовать тому, что лежит на сервере */
    public id: Guid;
    /** ширина картинки */
    public width: number;      
    /** высота картинки */
    public height: number;     
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
    public coordinates: X_Y;
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
    public vector: Vector;
    /** просто сюда можно добавить какой-то текст\объект и т.д. по необходимости для личных нужд. На работу движка это поле не влияет */
    public tag: any;
    /** здесь функции что исполняются каждый такт. (!) Принимают на вход спрайт, дествие которого исполяется, то есть этого (this.) */
    public functionsInGameLoop: ActInGameLoop[];
    /** смещение (отклонение) реальной картинки от маски. То есть обработка нажатий на маску и реально отрисовываемая 
     *  картинка могут быть в разных местах.
     *  Это костыль на случай, если лень нормально вырезать в пеинте картинку, чтобы она правильно ложилась на маску */
    public offsetPic: X_Y;
    /** что делать объекту, если на него кликнули */
    public eventMouseClick: ((event: MouseEvent | TouchEvent) => any);
    /** событие, на спрайт навели мышь */
    public eventMouseMove: ((event: MouseEvent | TouchEvent) => any);
    /**  */
    public animation: SpriteAnimation;

    // Приватные поля
    /** [изменять через scale] масштаб, где 1 - это 1 к одному */
    protected _scale: number;
    /** [изменять через setImage] путь до картинки.*/
    protected _pathPic: string;
    /** картинка спрайта, отрисовывающася на canvas */
    protected _image: HTMLImageElement;
    /** слой на котором производится отрисовка. Чем больше тут число, тем выше будет отрисован спрайт. Кто выше всех - тот и виден */ 
    protected _layer: number;

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
            this.width = this.image.width * scale;
            this.height = this.image.height * scale;
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


/** вектор перемещения. Если он задается, то каждый такт спрайт изменяет свою координату */
export class Vector{
    /** актуален ли вектор, двигается ли объект */
    public isGo: boolean;
    /** x,y стартовые (пересчитывается при изменении масштаба) */
    public startCoordinates: X_Y; 
    /** x,y конечные (пересчитывается при изменении масштаба) */
    public endCoordinates: X_Y;
    /** скорость % от всего пути в секунду */
    public speed: number;
    /** время старта движения вектора. Здесь мс секунды от начала времен */
    public timeStart: number
}


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
    /** наступило ли время отрисовки следующего кадра */
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
    doStart(){
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
    doLoop(){
        this._isActive = true;
        this._isTimeDrawNextFrame = true;

        // делаем функцию вызывающую раз внекоторое время вложенную стрелочную ф-ию со сменой кадра
        this._counterFrame = setInterval(() => {this.frameNumNext += 1; this._isTimeDrawNextFrame = true}, this.timeBetweenFrame);
    }

    /** паузнуть анимацию. Снять с паузы - doStart\doLoop */
    doPause(){
        this._isActive = false;
        clearInterval(this._counterFrame); // удаляем функцию вызывающую раз внекоторое время смену кадра
    }

    /** остановить и "обнулить" анимацию на начало */
    doStop(){
        this._isActive = false;
        this._isTimeDrawNextFrame = false;
        clearInterval(this._counterFrame); // удаляем функцию вызывающую раз внекоторое время смену кадра
        this.frameNumNext = 0;
    }
}