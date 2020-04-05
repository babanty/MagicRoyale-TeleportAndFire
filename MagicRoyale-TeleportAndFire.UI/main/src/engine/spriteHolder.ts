import { Sprite, MaskFigure } from "./sprite";
import Collections = require('typescript-collections');
import {sleep, X_Y} from "./common";
import { Guid } from "guid-typescript";
import * as geometry from "./geometry";

/** "держатель" игровых объектов. Держит в себе всю карту */
export class SpriteHolder{
    // Публичные поля
    
    /** все игровые объекты на карте */
    public get sprites(): Collections.LinkedList<Sprite> {return this._sprites};


    // Приватные поля
    protected _sprites: Collections.LinkedList<Sprite>;
    protected _pictures: Collections.Dictionary<string, InternalPicture>;


    /** Конструктор класса - "держатель" игровых объектов. Держит в себе всю карту
     * @constructor
     * @param id - id. Желательно должен соотвествовать тому, что лежит на сервере
     * @param layer -слой на котором производится отрисовка
     */
    constructor(pictureConfig: PictureConfig[] = null) {
        this._sprites = new Collections.LinkedList<Sprite>();
        this._pictures = new Collections.Dictionary<string, InternalPicture>()

        if(pictureConfig){
            for(let i of pictureConfig){
                this.DownloadAndCachePictureAsync(i);
            }
        }
    }


    /** создать спрайт на карте, у которого еще не загружена картинка с загрузкой картинки. Если не удалось загрузить картинку - вернет null*/
    CreateSprite(sprite: Sprite, config: PictureConfig) : Sprite{
        // валидаия аргументов
        if(!sprite || !config) return null;

        // выкачиваем картинку с сервера
        let image = this.GetPicture(config.srcPath) // пробуем выкачать их кеша

        if(!image){ // в кеше картинки не оказалось
            image = this.DownloadAndCachePicture(config, 10000); // загружаем картинку с нуля
            if(image == null) return null; // не удалось загрузить в течении отведенного времени
        }
        
        // устанавливаем спрайту картинку
        sprite.setImage(image, config.scale, config.figure);

        // добавляем спрайт в коллекцию объектов держателю объектов
        this.sprites.add(sprite);

        return sprite;
    }


    /** [!!!] добавить спрайт с уже заранее загруженной в ручную картинкой */
    AddSprite(sprite: Sprite){
        this._sprites.add(sprite);
    }


    /** удалить спрайт из мира по его Id */
    DeleteSpriteById(id: Guid){
        let deleteSprites = this.sprites.toArray().filter((i) => i.id === id);
        if(deleteSprites && deleteSprites.length > 0)
        {
            deleteSprites.forEach((i) => this.sprites.remove(i));
        }
    }


    /** загрузить картинку с файлового сервера для дальнейшего использования в sprite. Автоматически кеширует ее.
     * Если нужно заново загрузить картинку с сервера (например, обновить) просто вызовите этот метод повторно
     * @param timeout - время ожидания в мс, до момента, когда выполнение окончится и вернется null
     */
    async DownloadAndCachePictureAsync(config: PictureConfig, timeout: number = 15000) : Promise<HTMLImageElement>{

        let isLoad = false; // загружена ли уже картинка
        let image = this.InternalDownloadPictureAsync(config.srcPath, () => isLoad = true);

        // ждем загрузки объекта, создаем задачу
        let i = 0;
        while (isLoad === false) {
            await sleep(4);
            i++;
            if (i > timeout/4) null;
        };

        // кешируем картинку
        let internalPicture = new InternalPicture();
        internalPicture.image = image;
        internalPicture.scale = config.scale;
        internalPicture.figure = config.figure;
        this._pictures.setValue(config.srcPath, internalPicture);

        return image;
    }


    /** загрузить картинку с файлового сервера для дальнейшего использования в sprite. Автоматически кеширует ее.
     * Если нужно заново загрузить картинку с сервера (например, обновить) просто вызовите этот метод повторно
     * @param timeout - время ожидания в мс, до момента, когда выполнение окончится и вернется null
     */
    DownloadAndCachePicture(config: PictureConfig, timeout: number = 15000) : HTMLImageElement{
        let task = new Promise((result) => this.DownloadAndCachePictureAsync(config, timeout));
        task.then(result => {return result});
        
        return null;
    }


    /** Спрятанная загрузка картинки. Делается "подкапотно асинхронно". Чтобы распаралелить загрузку картинок можно использовать
     * этот метод, однако, когда ф-ия возвращает HTMLImageElement картинка в этот момент еще не загружена. 
     * ЧТобы узнать когда она загурзится надо положить в метод переменную HTMLImageElement.onload ф-ию, которая вызовется по факту завершения
      */
    protected InternalDownloadPictureAsync(srcPath: string, onloadFunc?
        : () => void) : HTMLImageElement{
        let image = new Image();
        image.onload = onloadFunc; // указываем ф-ию которая вызовется по факту завершения загрузки
        image.src = srcPath; // вставляем путь для автоматической загрузки картинки
        return image;
    }

    /** отдает картинку, если она уже ранее загружалась этим холдером. Если ее нет, то вернет null. Чтобы загрузить картинку используйте DownloadPicture */
    GetPicture(srcPath: string) : HTMLImageElement{
        let picture = this._pictures.getValue(srcPath);
        if(picture){
            return picture.image;
        }

        return null;
    }


    /** какой спрайт находится в указанных координатах
     * @param layer - слой на котором смотреть. Если null, то вернет спрайт, который выше всех
     * @param isIgnoreStaticSprites - игрорировать ли спрайты, у который опция isStatic = true (то есть те, что "прибиты" к экрану, по кнопок)
     */
    WhoOnThisPlaceMaxLayer(coordinates: X_Y, isIgnoreStaticSprites: boolean = false, layer: number = null){
        alert("WhoOnThisPlaceMaxLayer - Не сделано :(");
        throw new Error("WhoOnThisPlaceMaxLayer - Не сделано :(");
    }
}


/** конфигурация картинки для спрайта */
export class PictureConfig{
    /** путь до картинки на сервере. Например, './image/myPic.jpg' */
    public srcPath: string;
    /** масштаб, где 1 - это 1 к одному */
    public scale: number = 1;
    /** геометрическая фигура, нужна для обработки событий мыши */
    public figure: MaskFigure = MaskFigure.rectangle;
}

/** [private - не использовать за пределами SpriteHolder-а] загруженная картинка
 * @private
*/
class InternalPicture{
    public image: HTMLImageElement;
    /** масштаб, где 1 - это 1 к одному */
    public scale: number = 1;
    /** геометрическая фигура, нужна для обработки событий мыши */
    public figure: MaskFigure = MaskFigure.rectangle;
}