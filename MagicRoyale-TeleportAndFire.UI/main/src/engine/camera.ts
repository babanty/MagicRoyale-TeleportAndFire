import { X_Y } from "./common";
import { Canvas } from "./canvas";

/** Класс отвечающий за камеру (глаза игрока) в игре  */
export class Camera{

    /** центральная координата камеры на которую она смотрит. Эта центральная координата ровно по центру canvas-a). */
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
            this._scaleMap = scaleMap;
        }
    }
    private _scaleMap: number;
    /** минимальное приближение карты, меньше число нельзя */
    public get minScaleMap(): number{return 0.00001};

    /** Конструктор класса - отвечающего за камеру (глаза игрока) в игре
    * @constructor
    */
    public constructor( private canvas: Canvas,
                        coordinates: X_Y = new X_Y(0, 0), scaleMap = 1) {
        this.coordinates = coordinates;
        this.scaleMap = scaleMap;
    }

    /** установить новый масштаб карты отностельно текущего
     * @param howMuchToChangeScaleMap - то на сколько изменить масштаб карты, где 1.00 - это приблизить на 100% от текущего положения. 
     *      Масштаб будет изменен относительно того что есть сейчас
     * @param target - то куда приближать. Если null, то приближать будет к текущему положения камеры
    */
    public setScaleMap(howMuchToChangeScaleMap: number, target: X_Y = null){

        if(!target) target = new X_Y(this.coordinates.x, this.coordinates.y);

        let numAdd = 1 + howMuchToChangeScaleMap;
        this.scaleMap*= numAdd; // изменяем масштаб карты

        if (numAdd - 1 > 0) { // если мы приближаем
            this.coordinates = new X_Y(numAdd * this.coordinates.x + target.x * (1 - numAdd),
                                        numAdd * this.coordinates.y + target.y * (1 - numAdd));
        } else { // если камера удаляется
            this.coordinates = new X_Y( this.canvas.canvasElement.width * (1 - numAdd) / 2 + numAdd * this.coordinates.x,
                                        this.canvas.canvasElement.height * (1 - numAdd) / 2 + numAdd * this.coordinates.y);
        }
    }

// - Камера
//   -- перемещение (у камеры есть "центральная координата" на которую она смотрит. Эта центральная координата ровно по центру canvas-a)
//   -- удаление \ приближение к указанной точке (колесико мыши\движение пальцев)
//   -- фиксация (пока только временная) на указанном объекте (+возможность смещения)
}