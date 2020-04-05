// - Рендеринг:
//   -- [может быть] делать возможным смещение при отрисовке 
//   -- пропускать клик по объекту.  Может отрисовываться выше всех по слою, но при нажатии пропускает клик и отдаем ему того кто ниже
//   -- [может быть] возможность рисовать фигуры
//   -- [может быть] писать текст поверх картинки спрайта
//   -- [v1] назначать фон (отличается тем, что не является спрайтом)
//      -- замостить некий фот
//      -- [может быть] получить массив координат блоков фона и отрисовывать их

import { Sprite, MaskFigure } from "./sprite";
import { Camera } from "./camera";
import { Guid } from "guid-typescript";
import { X_Y } from "./common";

/** класс отвечающий за "отрисовку" на канвасе объектов */
export class Render{

    // Публичные поля
    /** canvas - html5-элемент внутри которого все отрисовывается */
    public get canvasElement(): HTMLCanvasElement{return this._canvasElement};
    /** класс отвечающий за камеру (глаза игрока) в игре */
    public get camera(): Camera{return this._camera};
    

    // Приватные поля
    /** контекст холста. Именно с помощью него можно все рисовать, а не html-элемента. */
    protected canvasContext: CanvasRenderingContext2D;
    /** [изменять через canvasElement] canvas - html5-элемент внутри которого все отрисовывается */
    protected _canvasElement: HTMLCanvasElement;
    /** класс отвечающий за камеру (глаза игрока) в игре */
    protected _camera: Camera;

    // Setter-ы свойств
    /** установить canvas - html5-элемент внутри которого все отрисовывается */
    public set canvasElement (canvasElement: HTMLCanvasElement) {
        this.canvasContext = canvasElement.getContext('2d'); // Создаем 2d пространство, с ним далее работаем
        this._canvasElement = canvasElement;
    }
    /** установить камеру (глаза игрока) в игре */
    public set camera (camera: Camera){
        this._camera = camera;
    }


    /** Конструктор класса -отвечающего за "отрисовку" на канвасе объектов
     * @constructor
     * @param canvasElement - [NotNull] canvas - html5-элемент внутри которого все отрисовывается
     * @param camera - [NotNull] класс отвечающий за камеру (глаза игрока) в игре
     */
    public constructor(canvasElement: HTMLCanvasElement, camera: Camera) {
        // валидация
        if(!canvasElement || !camera){
            throw new Error("Класс Render неверно проинициализирован. Аргумент конструктора null.");
        }

        this.canvasElement = canvasElement;
        this.camera = camera;
    }


    /** Отрисовать указанные спрайты.
     *  Как отрисовывает?
     *  - не рисует "скрытых" (sprite.isHidden)
     *  - поддерживает слои (sprite.layer)
     *  - рисует "сверху-вниз" по y-координате правого нижнего края картинки
     *  - поддерживает анимацию (sprite.animation)
     *  - поддерживает статические спрайты (sprite.isStaticCoordinates)
     *  - поддерживает смещение (sprite.offsetPic)
    */
    public renderSprites(sprites: Sprite[]){

        this.clearCanvas() // очищаем холст
        
        // очищаем от спрайтов, которые не нужно рисовать (например, у которых стоит isHidden === true)
        let clearedSprites = this.clearSrpites(sprites);

        // получаем готовые к отрисовке "обертки спрайта" (например координаты, с учетом камеры, нарезанная анимация и т.д.)
        let spriteWrappers: SpriteWrapper[];
        for(let sprite of clearedSprites){
            spriteWrappers.push(this.getSpriteWrapper(sprite));
        }

        // сортируем спрайты
        let sortedSpriteWrappers = this.sortSritesForRender(spriteWrappers);

        // отрисовываем подготовленные спрайты
        for(let sprite of sortedSpriteWrappers){
            this.drawSrpiteWrapperOnCanvas(sprite);
        }
    }


    /** отрисовать статические картинки, например фон */
    public renderStaticPicture(picture: HTMLImageElement, x: number, y: number){
        alert("RenderStaticPucture - Не сделано :(");
        throw new Error("RenderStaticPucture - Не сделано :(");
    }


    /** Замостить фон некоторой картинкой (желательно безшовной) */
    public backgroundRepeat(){
        alert("BackgroundRepeat - Не сделано :(");
        throw new Error("BackgroundRepeat - Не сделано :(");        
    }


    /** очищаем холст (делаем полностью белым) */
    protected clearCanvas(){
        this.canvasContext.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height); 
    }


    /** сортируем спрайты: 
     * 1. согласно слою;
     * 2. "сверху-вниз" по нижней y-кооридинате спрайта; */
    protected sortSritesForRender(sprites: SpriteWrapper[]) : SpriteWrapper[] {
        sprites.sort((a, b) => { // используем встроенную в массивы ф-ию сортировки https://habr.com/ru/post/279867/
            if (a.layer == b.layer) { // если у спрайтов одинаковые слои
                // сортировка по возростанию координаты
                return (a.coordinates.y + a.height) - (b.coordinates.y + b.height);
            } else { // если у спрайтов разные слои
                // сортировка по возростанию слоя
                return a.layer - b.layer;
            }
        });
    
        return sprites;
    }


    /** очищаем массив спрайтов от тех, которые не нужно рисовать: 
     * 1. спрайты, у которых стоит isHidden === true;  */
    protected clearSrpites(sprites: Sprite[]) : Sprite[] {
        return sprites.filter(sprite => sprite.isHidden !== true)
    }


    /** получаем готовый к отрисовке переработанную "обертку спрайта"
     * 1. координаты изменены, с учетом камеры
     * 2. если спрайт - анимация, то тут уже нужных срез картинки 
     * 3. если у спрайта указано смещение, то изменяем координаты согласно смещению */
    protected getSpriteWrapper(sprite: Sprite) : SpriteWrapper{
        let result: SpriteWrapper;
        result.spriteId = sprite.id;
        result.layer = sprite.layer;
        result.picture = sprite.image;
        result.rotate = sprite.rotate;

        !; тут не сделали
        result.coordinates;
        result.width
        result.height;

        return result;
    }

    /** отрисовать обернутый спрайт на холсте 
     * 1. поддерживает кручение
    */
    protected drawSrpiteWrapperOnCanvas(sprite: SpriteWrapper){
        // сохраняем нормальные настройки канваса манипуляциями (например, кручением)
        this.canvasContext.save(); 

        // крутим канвас если у картинку указано, что ее нужно крутануть 
        if(sprite.rotate && sprite.rotate !== 0){
            this.canvasContext.translate(sprite.coordinates.x, sprite.coordinates.y); // делаем центр холста у этой картинки
            this.canvasContext.translate(sprite.width / 2, sprite.height / 2); // делаем центр холста у этой картинки
            this.canvasContext.rotate(inRadians(sprite.rotate)); // поворачиаем все что дальше будет отрисовано
        }

        // рисуем картинку
        this.canvasContext.drawImage(sprite.picture, sprite.coordinates.x, 
                                    sprite.coordinates.y, sprite.width, sprite.height)

         // сбрасываем настройки канваса после всех манипуляций (например, кручения)
        this.canvasContext.restore();
    }
}


/** обертка спрайта для отрисовки. Нужен чтобы менять поля с учетом, например камеры, не боясь испортить сам спрайт */
class SpriteWrapper{

    // Публичные поля
    /** id оригинально спрайта. Поддержана иммутабельность приходящего значения (здесь записывается новый класс) */
    public get spriteId(): Guid{return this._spriteId};
    /** координаты спрайта для канваса. */
    public coordinates: X_Y;
    /** готовая картинка */
    public picture: CanvasImageSource;
    /** ширина отрисовываемой картинки в px*/
    public width: number;
    /** высота отрисовываемой картинки в px*/
    public height: number;
    /** градус на сколько повернуть изображение */
    public rotate: number;
    /** слой спрайта, кто выше всех (самое большое число), тот и будет видным */
    public layer: number

    // Приватные поля
    private _spriteId: Guid;

    // Setter-ы свойств
    public set spriteId (spriteId: Guid){
        this._spriteId = Guid.parse(spriteId.toString());
    }
}


/** градусы в радианы */
function inRadians(degree: number) : number {
    return degree * Math.PI / 180;
}