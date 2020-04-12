/** координаты x и y в едином объекте для удобства работы с координатами */
export class X_Y{
    public get x(): number{return this._x};
    public get y(): number{return this._y};

    /** событие изменения координат. (добавьте в массив функцию для подписки на событие, при возникновении события эта ф-я будет вызвана)*/
    public coorditanesChangedEvent: CoorditanesChangedEvent[];

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
        this.coorditanesChangedEvent.forEach(subscriber => {if(subscriber) subscriber(this, oldValues)});
    }

    private _x:number;
    private _y:number;
}

/** событие изменения координат */
export interface CoorditanesChangedEvent {
    (newValues: X_Y, oldValues: X_Y): void;
}


/** "усыпить исполнение кода" 
 * @param ms - время в мс
*/
export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}