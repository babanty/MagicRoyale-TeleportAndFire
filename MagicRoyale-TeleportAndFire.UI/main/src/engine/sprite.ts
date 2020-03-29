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

import { Guid } from "guid-typescript";
import { X_Y } from "./common";

export default abstract class Sprite{

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

    // Необязательные поля
    /** координаты объекта в канвасе */
    public coordinates: X_Y;
    /** слой на котором производится отрисовка */ 
    public layer: number;
    /** градус на сколько повернуть изображение */ 
    public rotate: number;
    /** статичные ли у него координаты? Нужно для взаимодействия с камерой. Если статичные, то на изменение масштаба и перемещения камеры реагировать не будет */
    public isStaticCoordinates: boolean;
    /** скрыт ли элемент. Если скрыт, то не отрисовывется и не регистируются клики */
    public isHidden: boolean;
    /** пропускать ли нажатие. Может отрисовываться выше всех по слою, но при нажатии пропускает клик и отдаем ему того кто ниже */
    public isSkipClick: boolean;
    /** геометрическая фигура, нужна для обработки событий мыши */
    public figure: MaskFigure;
    /** вектор перемещения. Если он задается, то каждый так спрайт изменяет свою координату */
    public vector: Vector;
    /** просто сюда можно добавить какой-то текст по необходимости */
    public tag: string;
    /** здесь функции что исполняются каждый такт. (!) Принимают на вход спрайт, дествие которого исполяется, то есть этого (this.) */
    public functionsInGameLoop: ActInGameLoop[];
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

    /** Конструктор класса отвечающего за canvas
     * @constructor
     * @param id - id. Желательно должен соотвествовать тому, что лежит на сервере
     * @param canvasIsMainElement - путь до картинки. Например './image/myPic.jpg'
     * @param scale - масштаб (размер относительно реального), где 1 - это 1 к одному
     */
    constructor(id: Guid, layer: number) {
        this.id = id;
        this.layer = layer;
    }


    /** объеединяющий метод вызвающий прочие методы по созданию html-элемента canvas */
    public set scale (scale: number) {
        if(this.image){
            this.width = this.image.width * scale;
            this.height = this.image.height * scale;
        }
    }

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


/** вектор перемещения. Если он задается, то каждый так спрайт изменяет свою координату */
export class Vector{
    /** актуален ли вектор, двигается ли объект */
    isGo: boolean;
    /** x,y стартовые (пересчитывается при изменении масштаба) */
    startCoordinates: X_Y; 
    /** x,y конечные (пересчитывается при изменении масштаба) */
    endCoordinates: X_Y;
    /** скорость % от всего пути в секунду */
    speed: number;
    /** время старта движения вектора. Здесь мс секунды от начала времен */
    timeStart: number
}


export class SpriteAnimation{
    /** количество кадров */
    public frameNum: number;
    /** время между кадрами */
    public timeBetweenFrame: number;
    /** ширина нарезного кадра */
    public widthSlicedOneFrame: number;
    /** наступило ли время отрисовки следующего кадра */
    public isTimeDrawNewFrame: boolean = true;
    /** содежрит в себе счетчик время как часто надо менять isTimeDrawNewFrame на true, зависит от timeBetweenFrame */
    public counterFrame: number;
    /** какой кадр отрисовался последним */
    public frameNumNow: number = -1;
}