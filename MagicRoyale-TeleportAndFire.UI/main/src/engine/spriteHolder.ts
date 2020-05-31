import { Sprite, Figure, Mask } from "./sprite";
import * as Collections from "typescript-collections";
import {sleep, X_Y, EventDistributorWithInfo, Size} from "./common";
import { Guid } from "guid-typescript";
import * as geometry from "./geometry";
import { Engine } from "./engine";

/** "держатель" игровых объектов. Держит в себе всю карту */
export class SpriteHolder{
    // Публичные поля
    
    /** все игровые объекты на карте. Для добавления и удаления объектов используйте createSprite\deleteSpriteById, а не эту коллекцию */
    public get sprites(): Collections.LinkedList<Sprite> {return this._sprites};

    /** События создания спрайта */ 
    public spriteCreatedEvent = new EventDistributorWithInfo<SpriteCreatedEvent, SpriteCreatedEventInfo>();

    // Приватные поля
    protected _sprites: Collections.LinkedList<Sprite>;
    protected _pictures: Collections.Dictionary<string, InternalPicture>;
    protected _engine: Engine;


    /** Конструктор класса - "держатель" игровых объектов. Держит в себе всю карту
     * @constructor
     * @param pictureConfig - id. Желательно должен соотвествовать тому, что лежит на сервере
     * @param layer -слой на котором производится отрисовка
     */
    public constructor(engine: Engine) {
        this._sprites = new Collections.LinkedList<Sprite>();
        this._pictures = new Collections.Dictionary<string, InternalPicture>();
        this._engine = engine;
    }


    /** создать спрайт на карте, у которого еще не загружена картинка с загрузкой картинки. 
     * Если не удалось загрузить картинку выкинет Error*/
    public async createSpriteAsync(id: string, config: PictureConfig) : Promise<Sprite>{
        // валидаия аргументов
        if(!config) throw new Error("config: PictureConfig can't be null.");

        // пробуем выкачать из кеша
        let image = this.getPicture(config.srcPath) 

        // загружаем картинку с нуля
        if(!image){ // в кеше картинки не оказалось
            image = await this.downloadAndCachePictureAsync(config, 10000); 
            if(image == null) throw new Error("Image upload failed."); // не удалось загрузить в течении отведенного времени
        }
        
        let sprite = new Sprite(id, image);
        sprite.scale = config.scale;

        sprite.setImage(image, config.scale);

        // добавляем спрайт в коллекцию объектов держателю объектов
        this.addSprite(sprite);

        return sprite;
    }


    /** добавить спрайт с уже [!!!] заранее загруженной с сервера в ручную картинкой. Рекомендуется использовать вместо этого метода createSprite */
    public addSprite(sprite: Sprite){
        this._sprites.add(sprite);

        let eventInfo = new SpriteCreatedEventInfo(sprite);
        this.spriteCreatedEvent.invoke(eventInfo);
    }


    /** удалить спрайт из мира по его Id */
    public deleteSpriteById(id: string){
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
    public async downloadAndCachePictureAsync(config: PictureConfig, timeout: number = 15000) : Promise<HTMLImageElement>{

        let isLoad = false; // загружена ли уже картинка
        let image = this.internalDownloadPictureAsync(config.srcPath, () => isLoad = true);

        // ждем загрузки объекта, создаем задачу
        let i = 0;
        while (isLoad === false) {
            await sleep(4);
            i++;
            if (i > timeout/4) return null;
        };

        // кешируем картинку
        let internalPicture = new InternalPicture();
        internalPicture.image = image;
        internalPicture.scale = config.scale;
        this._pictures.setValue(config.srcPath, internalPicture);

        return image;
    }


    // /** загрузить картинку с файлового сервера для дальнейшего использования в sprite. Автоматически кеширует ее.
    //  * Если нужно заново загрузить картинку с сервера (например, обновить) просто вызовите этот метод повторно
    //  * @param timeout - время ожидания в мс, до момента, когда выполнение окончится и вернется null
    //  */
    // public downloadAndCachePicture(config: PictureConfig, timeout: number = 15000) : HTMLImageElement{
    //     // TODO порешать эту хрень. Удалить или придумать как асинхронный метод сделать синхронным 
    //     let lool = "kkk";
    //     let task = new Promise(() => this.downloadAndCachePictureAsync(config, timeout));
    //     task.then(result => {
    //         let loooool = "sd";
    //         return result;
    //     });
        
    //     return null;
    // }


    /** Спрятанная загрузка картинки. Делается "подкапотно асинхронно". Чтобы распаралелить загрузку картинок можно использовать
     * этот метод, однако, когда ф-ия возвращает HTMLImageElement картинка в этот момент еще не загружена. 
     * ЧТобы узнать когда она загурзится надо положить в метод переменную HTMLImageElement.onload ф-ию, которая вызовется по факту завершения
      */
    protected internalDownloadPictureAsync(srcPath: string, onloadFunc?
        : () => void) : HTMLImageElement{
        let image = new Image();
        image.onload = onloadFunc; // указываем ф-ию которая вызовется по факту завершения загрузки
        image.src = srcPath; // вставляем путь для автоматической загрузки картинки
        return image;
    }

    /** отдает картинку, если она уже ранее загружалась этим холдером. Если ее нет, то вернет null. Чтобы загрузить картинку используйте DownloadPicture */
    public getPicture(srcPath: string) : HTMLImageElement{
        let picture = this._pictures.getValue(srcPath);
        if(picture){
            return picture.image;
        }

        return null;
    }


    /** какие спрайты находится в указанных координатах
     * @param getFromMaxLayer - получить спрайты с самого "высокого" уровня (те, что выше всех)
     * @param isIgnoreStaticSprites - игнорировать ли спрайты, у который опция isStatic = true (то есть те, что "прибиты" к экрану, 
     * типо кнопок, если isIgnoreStaticSprites = true, то такие спрайты не будут в конечной выборке)
     * @param layer - слой на котором смотреть. Если null, то вернет все спрайты на указанном месте. Если getFromMaxLayer = true, 
     * то значение аргумента layer проигнорируется
     */
    public whoOnThisPlace(coordinates: X_Y, getFromMaxLayer: boolean = true, 
                    isIgnoreStaticSprites: boolean = false, layer: number = null) : Sprite[] {
        // преобразовываем координаты нажатия мыши:
        let preparedCoordinates = this._engine.render.absoluteCoordinatesToGameCoordinates(coordinates);

        // создаем массив совпадений
        let suitableSprites = new Collections.LinkedList<Sprite>();

        // проходимся по всем спрайтам, чтобы выяснить кто располагается в казанных координатах независимо от слоя
        this.sprites.forEach(sprite => {

            // валидация спрайта
            if(sprite.isHidden || sprite.isSkipClick){ // игнорируем скрытых и тех, кто должен пропускать клик
                return;
            }

            if(isIgnoreStaticSprites && sprite.isStaticCoordinates){ // если указали игнорирровать статические спрайты
                return;
            }

            // преобразовываем те координаты, в которых мы что-то должны с учетом того статический спрайт или нет
            let usePointCoordinates = sprite.isStaticCoordinates ? coordinates : preparedCoordinates; 

            // получаем маску, по которой проверять пересечения (например клика мышки или пересечения спрайтов)
            let mask = this.getMaskBody(sprite);

            // сперва отсеиваем всех у кого не совпадает прямоугольная область т.к. это дешевая операция
            if(!geometry.IsBelongingPointToRectangle(usePointCoordinates, mask.coordinates, mask.size.width, mask.size.height)){
                return;
            }

            // затем проверяем на совпадение с учетом маски и вычитаем из массива совпадений тех, кто не подходит
            if(sprite.mask.figure === Figure.circle){ // если у спрайта фигура - круг, то смотрим входи ли точка в круг
                if(!geometry.IsBelongingPointToCirle(usePointCoordinates, 
                                                    new X_Y(mask.coordinates.x + mask.size.width / 2, mask.coordinates.y + mask.size.height / 2), // считаем центр круга
                                                    mask.size.width / 2)){ // считаем радиус
                    return;
                }
            }

            suitableSprites.add(sprite);
        });



        // Cелектим соглавно настройки слоя
        if(!getFromMaxLayer && layer === null){ // если отдать все
            return suitableSprites.toArray();
        }

        // если указали, что отдать спрайты с самого высокого слоя
        if(getFromMaxLayer){
            return this.GetSpritesFromLayer(suitableSprites).toArray();
        }

        return this.GetSpritesFromLayer(suitableSprites, layer).toArray();
    }

    /** вернуть все спрайты, с которыми пересекается указанный спрайт */
    public getAllIntersection(checkedSprite: Sprite) : Sprite[]{

        // создаем массив совпадений
        let suitableSprites = new Collections.LinkedList<Sprite>(); 

        // сперва проверяем пересечения под прямоугольнику т.к. это дешевая операция
        this.sprites.forEach(sprite => {
            if(this.isSpritesIntersected(checkedSprite, sprite, true)
                && sprite.id !== checkedSprite.id) { // если спрайт пересекся сам с собой, то в этом случае исключаем его из выборки){
                
                    suitableSprites.add(sprite);
            }
        })

        let result = new Collections.LinkedList<Sprite>(); 

        // теперь полноценно проверяем пересечения согласно указанным фигурам
        suitableSprites.forEach(sprite =>{ // проходимся по каждому спрайту с которым совпала прямоугольная область
            let isIntersection = this.isSpritesIntersected(checkedSprite, sprite);
            if(isIntersection){
                result.add(sprite);
            }
        })

        return result.toArray();
    }

    /** пересеклись ли эти два конкретных спрайта?
     * 
     * Если необходимо узнать с кем вообще пересекается спрайт используйте: getAllIntersection
     * @param checkOnlyByRectagle - если true, то проигнорирует фигуры спрайтов и будет проверять только по пересечению 
     * прямоугольных областей. Проверка по прямугольной области - дешевая операция по тактам процессора.
     */
    public isSpritesIntersected(first: Sprite, second: Sprite, checkOnlyByRectagle = false) : boolean{            

        let one = this.getMaskBody(first);
        let two = this.getMaskBody(second);

        // если оба спрайта - прямоугольники
        if( first.mask.figure === Figure.rectangle && second.mask.figure === Figure.rectangle
            || checkOnlyByRectagle){
            
            let isIntersection = geometry.IntersectionFigures_RectangleAndRectangle(
                                                            one.coordinates, one.size,
                                                            two.coordinates, two.size);
            return isIntersection;
        }
        
        // если проверяемый-спрайт - круг, а подошедший по прямоугольной области - прямоугольник
        if(first.mask.figure === Figure.circle && second.mask.figure === Figure.rectangle){
            let isIntersection = geometry.IntersectionFigures_RectangleAndCirce(
                                            geometry.getRectangleCenter(two.coordinates, two.size),
                                            two.size,
                                            geometry.getRectangleCenter(one.coordinates, one.size),
                                            geometry.getRadiusByRectangle(one.size));
            return isIntersection;
        }
        // если проверяемый-спрайт - прямоугольник, а подошедший по прямоугольной области - круг
        if(first.mask.figure === Figure.rectangle && second.mask.figure === Figure.circle){
            let isIntersection = geometry.IntersectionFigures_RectangleAndCirce(
                                            geometry.getRectangleCenter(one.coordinates, one.size),
                                            one.size,
                                            geometry.getRectangleCenter(two.coordinates, two.size),
                                            geometry.getRadiusByRectangle(two.size));
            return isIntersection;
        }

        // если проверяемый-спрайт - круг, и подошедший по прямоугольной области - круг
        if(first.mask.figure === Figure.circle && second.mask.figure === Figure.circle){
            let isIntersection = geometry.IntersectionFigures_CirceAndCirce(
                geometry.getRectangleCenter(one.coordinates, one.size), 
                geometry.getRadiusByRectangle(one.size),
                geometry.getRectangleCenter(two.coordinates, two.size),
                geometry.getRadiusByRectangle(two.size));
            return isIntersection;
        }
    }


    /** отдать спрайты с указанного слоя или с самого высокого слоя. Всегда возвращает коллекцию, даже пустую
     * @param layer - номер слоя с которого отдать спрайты. Если null, то сам вычислит самый высокий и отдаст с него
    */
    protected GetSpritesFromLayer(sprites: Collections.LinkedList<Sprite>, layer: number = null) : Collections.LinkedList<Sprite>{
        let result = new Collections.LinkedList<Sprite>();

        if(!sprites || sprites.isEmpty()){ // если ни чего не передали
            return result;
        }

        if(layer === null){ // если указали забрать с самого высокого слоя, то вычисляем его
            layer = sprites.first().layer; // задаем любой начальный номер слоя

            sprites.forEach(sprite => { // перебираем все спрайты
                if(sprite.layer > layer){ // если у кого-то слой выше чем текущий выбранный
                    layer = sprite.layer; // то заменяем выбранный
                }
            });
        }

        // выбираем спрайты с нужного слоя
        sprites.forEach(sprite => {
            if(sprite.layer === layer){
                result.add(sprite);
            }
        });

        return result;
    }

    /** возвращает маску, по которой проверять пересечения (например клика мышки или пересечения спрайтов) */
    public getMaskBody(sprite: Sprite) : MaskBody {

        // расчет координат с учетом смещения
        let x = sprite.coordinates.x + sprite.mask.offset.x;
        let y = sprite.coordinates.y + sprite.mask.offset.y;

        // расчет ширины и высоты исходя из того, статический ли спрайт
        let width = sprite.mask.size.width; 
        let height = sprite.mask.size.height; 

        return new MaskBody( new X_Y(x, y), new Size(width, height) );
    }
}


/** конфигурация картинки для спрайта */
export class PictureConfig{

    /** конфигурация картинки для спрайта 
     * @param srcPath - путь до картинки на сервере. Например, './image/myPic.jpg'
     * @param scale - масштаб, где 1 - это 1 к одному
    */
    public constructor(public srcPath: string,
        public scale: number = 1){
    }
}

/** [private - не использовать за пределами SpriteHolder-а] загруженная картинка
 * @private
*/
class InternalPicture{
    public image: HTMLImageElement;
    /** масштаб, где 1 - это 1 к одному */
    public scale: number = 1;
}


/** событие вызывающеся при создании нового спрайта */
export interface SpriteCreatedEvent {
    (eventInfo: SpriteCreatedEventInfo): void;
}
/** информация о событии создания нового спрайта в spriteHolder-e */
export class SpriteCreatedEventInfo {
    /** @param createdSprite - собственно, тот кто был создан */
    public constructor(public createdSprite: Sprite){
    }
}

class MaskBody{
    constructor(public coordinates: X_Y,
                public size: Size){}
}