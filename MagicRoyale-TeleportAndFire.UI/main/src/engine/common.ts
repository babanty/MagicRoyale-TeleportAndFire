import { Guid } from "guid-typescript";

/** координаты x и y в едином объекте для удобства работы с координатами */
export class X_Y{
    public get x(): number{return this._x};
    public get y(): number{return this._y};

    /** событие изменения координат.*/
    public coordinatesChangedEvent = new EventDistributorWithInfo<CoordinatesChangedEvent, CoordinatesChangedEventInfo>();

    public constructor(x: number, y: number) {
        this.setNewValues(x, y);
    }

    /** вставить новые значения координат */
    public setNewValues(x: number, y: number){
        // записываем старые значения для события
        let oldValues = new X_Y(this.x, this.y);

        // перезапизаписываем значения на новые
        this._x = x;
        this._y = y;

        // вызываем отработку события изменения координат
        let eventInfo = new CoordinatesChangedEventInfo();
        eventInfo.newValues = this;
        eventInfo.oldValues = oldValues;
        this.coordinatesChangedEvent.invoke(eventInfo);
    }

    private _x:number;
    private _y:number;
}

/** событие изменения координат */
export interface CoordinatesChangedEvent {
    (eventInfo: CoordinatesChangedEventInfo): void;
}

/** информация о произошедшем событии */
export class CoordinatesChangedEventInfo{
    public newValues: X_Y;
    public oldValues: X_Y;
}


/** "усыпить исполнение кода" 
 * @param ms - время в мс
*/
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** распространитель события с информацией. В момент возникнвения события вызывает методы которые ему передали (подписались на 
 * событие и передает им информацию о событии).
 * 
 *  Пример создания: 
 * 
 * public CoorditanesChangedEvent: EventDistributor<CoorditanesChangedEvent, CoorditanesChangedEventInfo>;
 * 
 * export interface CoorditanesChangedEvent {(eventInfo: CoorditanesChangedEventInfo): void;}
 * 
 * export class CoorditanesChangedEventInfo { public newValues: X_Y; public oldValues: X_Y; }
 * 
 *  <Func - функция вызывающаяся при возникновении события, EventArgs - класс, который передается подписчику и содержит
 *  информацию о событии
 * 
 *  Реализует паттерн издатель-подписчик. Главные 3 метода:
 * - добавить функцию, которую вызывать при возникновении события - addSubscriber;
 * - удалить функцию, которую вызывалась при возникновении события - deleteSubscriber; 
 * - вызвать событие (сообщить о том, что событие наступило) - Invoke; */
export class EventDistributorWithInfo<Func extends (eventArgs: EventArgs) => void, EventArgs>{
    private subscribes: Map<Guid, Func> = new Map<Guid, Func>();

    /** добавить функцию, которую вызывать при возникновении события. Возвращает id функции, чтобы ее можно было удалить по id  */
    public addSubscriber(subscriber: Func) : Guid{
        let id = Guid.create();
        this.subscribes.set(id, subscriber);
        return id;
    }

    /** удалить функцию, которую вызывалась при возникновении события по ее id, который отдавался при вызове метода addSubscriber */
    public deleteSubscriber(id: Guid){
        if(this.subscribes.has(id)){
            this.subscribes.delete(id)
        }
    }

    /** вызвать событие (сообщить подсчикам о том, что событие наступило) - вызвать ф-ии что сюда передали через addSubscriber 
     * @param eventArgs - информация о произошедшем событии
    */
    public invoke(eventArgs: EventArgs){
        this.subscribes.forEach(subscriber => {if(subscriber) subscriber(eventArgs)});
    }
}


/** распространитель события. В момент возникнвения события вызывает методы которые ему передали (подписались на событие).
 * 
 * Не передает ни какой информации о событии. Если нужно не только сообщить о событии но и передать инфу о нем 
 * используйте EventDistributorWithInfo
 * 
 *  Реализует паттерн издатель-подписчик. Главные 3 метода:
 * - добавить функцию, которую вызывать при возникновении события - addSubscriber;
 * - удалить функцию, которую вызывалась при возникновении события - deleteSubscriber; 
 * - вызвать событие (сообщить о том, что событие наступило) - Invoke; */
export class EventDistributor{
    private subscribes: Map<Guid, SubscriberFunc> = new Map<Guid, SubscriberFunc>();

    /** добавить функцию, которую вызывать при возникновении события. Возвращает id функции, чтобы ее можно было удалить по id  */
    public addSubscriber(subscriber: SubscriberFunc) : Guid{
        let id = Guid.create();
        this.subscribes.set(id, subscriber);
        return id;
    }

    /** удалить функцию, которую вызывалась при возникновении события по ее id, который отдавался при вызове метода addSubscriber */
    public deleteSubscriber(id: Guid){
        if(this.subscribes.has(id)){
            this.subscribes.delete(id)
        }
    }

    /** вызвать событие (сообщить подсчикам о том, что событие наступило) - вызвать ф-ии что сюда передали через addSubscriber */
    public invoke(){
        this.subscribes.forEach(subscriber => {if(subscriber) subscriber()});
    }
}
/** функция подписчика, которая автоматически вызвается при наступлении события. Ей на вход ни какой инфы не приходит, 
 * если нужно чтобы приходило, используйте EventDistributorWithInfo */
export interface SubscriberFunc { (): void; }


/** размеры в 2D - ширина и высота */
export class Size{
    /** ширина */
    public get width(): number{return this._width};
    /** высота */
    public get height(): number{return this._height};

    /** событие изменения размера.*/
    public sizeChangedEvent = new EventDistributorWithInfo<SizeChangedEvent, SizeChangedEventInfo>();

    public constructor(width: number, height: number) {
        this.setNewValues(width, height);
    }

    /** вставить новые значения размера */
    public setNewValues(width: number, height: number){
        // записываем старые значения для события
        let oldValues = new Size(this.width, this.height);

        // перезапизаписываем значения на новые
        this._width = width;
        this._height = height;

        // вызываем отработку события изменения размеров
        let eventInfo = new SizeChangedEventInfo();
        eventInfo.newValues = this;
        eventInfo.oldValues = oldValues;
        this.sizeChangedEvent.invoke(eventInfo);
    }

    private _width:number;
    private _height:number;
}

/** событие изменения размеров */
export interface SizeChangedEvent {
    (eventInfo: SizeChangedEventInfo): void;
}

/** информация о произошедшем событии */
export class SizeChangedEventInfo{
    public newValues: Size;
    public oldValues: Size;
}

/** возвращает координаты отнсительно html-элемента на который нажали. Как offsetX\Y для MouseEvent-а  */
export function getOffsetValues(event: TouchEvent, element: HTMLElement, touchNum = 0) : X_Y {
    let rect = element.getBoundingClientRect();
    let bodyRect = document.body.getBoundingClientRect();
    let x = event.changedTouches[touchNum].pageX - (rect.left - bodyRect.left);
    let y = event.changedTouches[touchNum].pageY - (rect.top - bodyRect.top);

    return new X_Y(x, y);
}