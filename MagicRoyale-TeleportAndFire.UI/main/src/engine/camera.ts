import { X_Y } from "./common";

/** Класс отвечающий за камеру (глаза игрока) в игре  */
export class Camera{

    /** центральная координата камеры на которую она смотрит. Эта центральная координата ровно по центру canvas-a) */
    public coordinates: X_Y;
    /** масштаб карты, при изменении этого числа можно "приближать" и "удалять" камеру.
     * Значение 1 - значит спрайты будут отрисовываться согласно заданого им размера в px 1 к 1.
     * Ограничение: максимальное приближение: в переменной minScaleMap (т.е. 0.00001), меньше число нельзя
     */
    public get scaleMap(): number{return this._scaleMap};
    public set scaleMap (scaleMap: number){
        if(scaleMap < this.minScaleMap){ // если передали значение меньше минимального, то запишется минимальное
            this._scaleMap = this.minScaleMap;
        }else if(scaleMap >= this.minScaleMap){ // если передали больше минимального, то запишется как есть
            this.scaleMap = scaleMap;
        }
    }
    private _scaleMap: number;
    /** минимальное приближение карты, меньше число нельзя */
    public get minScaleMap(): number{return 0.00001};

    /** Конструктор класса - отвечающего за камеру (глаза игрока) в игре
    * @constructor
    */
    public constructor(coordinates: X_Y, scaleMap) {
        this.coordinates = new X_Y(0, 0);
        this.scaleMap = 1;
    }

// - Камера
//   -- перемещение (у камеры есть "центральная координата" на которую она смотрит. Эта центральная координата ровно по центру canvas-a)
//   -- удаление \ приближение к указанной точке (колесико мыши\движение пальцев)
//   -- фиксация (пока только временная) на указанном объекте (+возможность смещения)
}