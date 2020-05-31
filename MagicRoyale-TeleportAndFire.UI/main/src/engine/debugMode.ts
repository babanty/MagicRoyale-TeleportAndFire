import { Engine } from "./engine";
import { getOffsetValues, X_Y, Size } from "./common";
import { Guid } from "guid-typescript";
import { Figure, Sprite } from "./sprite";

/** Класс отвечающий за дебаг-режим (режим разработчика) в игре. Выводит на экран кучу дополнительный инфы  */
export class DebugMode{

    /** включен ли режим дебага */
    public get debugModeEnable(): boolean{return this._debugModeEnable};
    public set debugModeEnable(debugModeEnable: boolean){
        // включаем режим дебага (при том проверяем, что бы ранее он был выключен)
        if(debugModeEnable && !this._debugModeEnable){ 
            this.debugInfoInitialization();
        }

        // выключаем режим дебага (при том проверяем, что бы ранее он был ключен)
        if(!debugModeEnable && this._debugModeEnable){
            this.dispose();
        }
    }
    private _debugModeEnable: boolean = false;

    /** сколько всего строк зарезервированно под дебаг-инфу 
     * - [0] - координаты мыши над канвасом
     * - [1] - игровые координаты мыши с учетом масштабирования и перемещения карты
     * - [2] - текущий fps движка, а не отрисовки
     * - [3] - текущий fps отрисовки (но не движка)
     * - [4] - id спрайта, на которого навели мышью
     * - [5] - камера: положение и масштаб
     * - [последний - reservedLinesNum-1] - просто сообщение (this.message)
    */
    public get reservedLinesNum(): number {return 7};
    /** все что построчно выводится в режиме дебага. Чтобы добавить дополнительную строку: debugInfoLines.push("моя инфа") */
    public debugInfoLines = new Array<string>(this.reservedLinesNum);
    /** размер шрифта информации выводящейся на экран в pt */
    public debugInfoFontSize = 10;
    /** hex-цвет информации выводящейся на экран. По умолчанию красный */
    public debugInfoColor = "#ff0000";
    /** как часто обновляется информация в мс */
    public delay: number = 20;
    /** видна ли информация от движка (все что строки reservedLinesNum) */
    public isEngineInfoVisible: boolean = true;

    /** просто любое сообщение выводимое на экран */
    public message: string;

    // Приватные поля
    /** вызывает функцию обновления инфы независимо от рендера движка */
    private updateTimerId: NodeJS.Timeout;
    // id подписок на разные события
    private onmousemoveSubscribeId: Guid;
    private touchmoveSubscribeId: Guid;
    private onGameMouseMoveSubscribeId: Guid;
    private gameTouchMoveSubscribeId: Guid;
    private onSpriteMouseSubscribeId: Guid;
    private onSpriteTouchSubscribeId: Guid;
    private frameRenderedSubscribeId: Guid;

    // для просчета fps
    private engineTaktsCounter: number = 0;
    private frameCounter: number = 0;
    private engineTaktsSubscribeId: Guid;
    private drawCounterSubscribeId: Guid;
    private engineTaktsTimerId: NodeJS.Timeout;
    private drawCounterTimerId: NodeJS.Timeout;
    private engineTaktsPs: number = 0;
    private drowFps: number = 0;

    /** Конструктор класса - отвечающего  за дебаг-режим (режим разработчика) в игре. Выводит на экран кучу дополнительный инфы
    * @constructor
    * @param engine - доступ к главному центральному части движка
    */
    constructor(private engine: Engine){ }

    /** переключить режим отладки (если раньше был включен - выключить и наоборот) */
    public switchDebugModeEnable(){
        if(this.debugModeEnable){
            this.debugModeEnable = false;
        }else{
            this.debugModeEnable = true;
        }
    }


    /** обновить дебаг-информацию */
    public updateDebugInfo(){
        // текущий fps движка, а не отрисовки
        this.debugInfoLines[2] = this.engineTaktsPs.toString();
        // текущий fps отрисовки (но не движка)
        this.debugInfoLines[3] = this.drowFps.toString();

        // пишем показатели камеры
        let camera = this.engine.render.camera;
        this.debugInfoLines[5] = `Camera - x: ${camera.coordinates.x}; y: ${camera.coordinates.y}; scale: ${camera.scaleMap}`;

        // последним пишем сообщение
        this.debugInfoLines[this.reservedLinesNum - 1] = this.message;

        // отрисовываем маски спрайтов
        this.displaySpriteMask();

        // перерисовываем информацию
        this.displayDebugInfo();
    }

    /** инициализируем дебаг информацию */
    public debugInfoInitialization(){

        // координаты мыши\касания над канвасом. Подписываемся на изменение координат и формируем сообщение
        this.onmousemoveSubscribeId = this.engine.canvas.onmousemove.addSubscriber((event) => this.debugInfoLines[0] = 
                                                                            `Mouse - x: ${event.offsetX}; y: ${event.offsetY};`);
        this.touchmoveSubscribeId = this.engine.canvas.touchmove.addSubscriber((event) => {
                        let offsetCoordinates1 = getOffsetValues(event, this.engine.canvas.canvasElement, 0);
                        this.debugInfoLines[0] = `Touch1 - x: ${Math.round(offsetCoordinates1.x)}; y: ${Math.round(offsetCoordinates1.y)};`;
                        if(event.changedTouches[1]){ // если есть второе нажатие
                            let offsetCoordinates2 = getOffsetValues(event, this.engine.canvas.canvasElement, 1);
                            this.debugInfoLines[0] += ` Touch2 - x: ${Math.round(offsetCoordinates2.x)}; y: ${Math.round(offsetCoordinates2.y)};`
                        }
                    });

        // игровые координаты мыши\касания с учетом масштабирования и перемещения карты
        this.onGameMouseMoveSubscribeId = this.engine.canvas.onmousemove.addSubscriber((event) => {
            let gameCoordinates = this.engine.render.absoluteCoordinatesToGameCoordinates(new X_Y(event.offsetX, event.offsetY));
            this.debugInfoLines[1] = `GameMouse - x: ${gameCoordinates?.x}; y: ${gameCoordinates?.y};`;
        });
        this.gameTouchMoveSubscribeId = this.engine.canvas.touchmove.addSubscriber((event) => {
            let offsetCoordinates1 = getOffsetValues(event, this.engine.canvas.canvasElement, 0);
            let gameCoordinates1 = this.engine.render.absoluteCoordinatesToGameCoordinates(offsetCoordinates1);
            this.debugInfoLines[0] = `GameTouch1 - x: ${Math.round(gameCoordinates1.x)}; y: ${Math.round(gameCoordinates1.y)};`;
            if(event.changedTouches[1]){ // если есть второе нажатие
                let offsetCoordinates2 = getOffsetValues(event, this.engine.canvas.canvasElement, 1);
                let gameCoordinates2 = this.engine.render.absoluteCoordinatesToGameCoordinates(offsetCoordinates2);
                this.debugInfoLines[0] += ` GameTouch2 - x: ${Math.round(gameCoordinates2.x)}; y: ${Math.round(gameCoordinates2.y)};`
            }
        });

        // id спрайта, на которого навели мышью
        this.onSpriteMouseSubscribeId = this.engine.actionController.userInputToolResolver.engineOnMouseMoveEvent.addSubscriber((event) => 
                                                            this.debugInfoLines[4] = event.sprite?.id.toString())
        // id спрайта, на которого нажали
        this.onSpriteTouchSubscribeId = this.engine.actionController.userInputToolResolver.engineOnClickEvent.addSubscriber((event) => 
                                                            this.debugInfoLines[4] = event.sprite?.id.toString())

        // Расчет фпс движка
        // подписываемся на событие, что "логика рассчитана" в actionController
        this.engineTaktsSubscribeId = this.engine.actionController.logicExecutedEvent.addSubscriber(() => {this.engineTaktsCounter++});
        // создаем таймер, который сбрасывает счетчик каждую секунду
        this.engineTaktsTimerId = setInterval(() => {
            this.engineTaktsPs = this.engineTaktsCounter;
            this.engineTaktsCounter = 0;
        }, 1000);

        // Расчет фпс картинки
        // подписываемся на событие, что "кадр отрисован" в render
        this.drawCounterSubscribeId = this.engine.render.frameRenderedEvent.addSubscriber(() => this.frameCounter++);
        // создаем таймер, который сбрасывает счетчик каждую секунду
        this.drawCounterTimerId = setInterval(() => {
            this.drowFps = this.frameCounter;
            this.frameCounter = 0;
        }, 1000);

        // подписаться на событие от рендера, что он отрисовал кадр и прорисовать дебаг инфу поверх
        this.frameRenderedSubscribeId = this.engine.render.frameRenderedEvent.addSubscriber((this.updateDebugInfo.bind(this)));
        // обновлять инфу независимо от движка (т.к. движок может тупить, а данные дебага нужны актуальные)
        this.updateTimerId = setInterval (this.updateDebugInfo.bind(this), this.delay);
    }

    /** освободить ресурсы и больше не отображать инфомрацию */
    private dispose(){
        // отписаться от событий на которые подписывались в debugInfoInitialization
        this.engine.canvas.onmousemove.deleteSubscriber(this.onmousemoveSubscribeId);
        this.engine.canvas.touchmove.deleteSubscriber(this.touchmoveSubscribeId);

        this.engine.canvas.onmousemove.deleteSubscriber(this.onGameMouseMoveSubscribeId);
        this.engine.canvas.touchmove.deleteSubscriber(this.gameTouchMoveSubscribeId);

        this.engine.actionController.userInputToolResolver.engineOnMouseMoveEvent.deleteSubscriber(this.onSpriteMouseSubscribeId);
        this.engine.actionController.userInputToolResolver.engineOnClickEvent.deleteSubscriber(this.onSpriteTouchSubscribeId);

        this.engine.render.frameRenderedEvent.deleteSubscriber(this.frameRenderedSubscribeId);

        this.engine.actionController.logicExecutedEvent.deleteSubscriber(this.engineTaktsSubscribeId);
        this.engine.render.frameRenderedEvent.deleteSubscriber(this.drawCounterSubscribeId);

        if(this.updateTimerId) clearTimeout(this.updateTimerId);
        if(this.engineTaktsTimerId) clearTimeout(this.engineTaktsTimerId);
        if(this.drawCounterTimerId) clearTimeout(this.drawCounterTimerId);
    }

    private displayDebugInfo(){
        let canvas = this.engine.canvas.canvasElement.getContext('2d'); // Создаем 2d пространство, с ним далее работаем

        canvas.fillStyle = this.debugInfoColor;
        canvas.font = `${this.debugInfoFontSize}pt Arial`;
        for (let i = 0; i < this.debugInfoLines.length; i++) {
            canvas.fillText( this.debugInfoLines[i], 0, (this.debugInfoFontSize+7) * (i + 1));
        }
    }

    /** отрисовываем маски спрайтов */
    private displaySpriteMask(){

        this.engine.spriteHolder.sprites.forEach(sprite => {
            
            let spriteWrapper = this.engine.render.getSpriteWrapper(sprite);
            // расчет координат с учетом смещения
            let coordinates = new X_Y(spriteWrapper.x + sprite.mask.offset.x, spriteWrapper.y + sprite.mask.offset.y);
            // расчет шири\высоты с учетом того как изменился wrapper относительно нормального размера спрайта
            let width = (spriteWrapper.width / sprite.picSize.width) * sprite.mask.size.width;
            let height = (spriteWrapper.height / sprite.picSize.height) * sprite.mask.size.height;
            let size = new Size(width, height);

            if(sprite.mask.figure === Figure.circle){
                this.drawCircle(coordinates, size.width / 2, "rgba(255, 0, 0, 0.2)");
            }

            if(sprite.mask.figure === Figure.rectangle){
                this.drawRectangle(coordinates, size, "rgba(255, 0, 0, 0.2)");
            }
        });
    }

    /**
     * Нарисовать круг, пример: drawCircle(5,10, 3, rgba(0, 0, 255, 0.2)).
     * @param coordinates - координаты где рисовать (предварительно их можно перевести в игровые с использвоанием класса render)
     * @param radius - радиус круга
     * @param color - цвет RGBA
     */
    private drawCircle(coordinates: X_Y, radius: number, color: string | CanvasGradient | CanvasPattern){
        let canvas = this.engine.canvas.canvasElement.getContext('2d'); // Создаем 2d пространство, с ним далее работаем

        canvas.beginPath();
        canvas.arc(coordinates.x+radius, coordinates.y+radius, radius, 0, 2 * Math.PI, false);
        canvas.fillStyle = color;
        canvas.fill();
        canvas.lineWidth = 1;
        canvas.strokeStyle = color;
        canvas.stroke();
    }

    /**
     * Нарисовать прямоугольник drawRectangle(mask.coordinates, mask.size, "rgba(0, 0, 255, 0.5)");
     * @param coordinates - коориднаты прямоуголньика
     * @param size - размер прямоугольника
     * @param color - цвет RGBA
     */
    private drawRectangle(coordinates: X_Y, size: Size,  color: string | CanvasGradient | CanvasPattern){
        let canvas = this.engine.canvas.canvasElement.getContext('2d'); // Создаем 2d пространство, с ним далее работаем
        canvas.fillStyle = color;
        canvas.fillRect(coordinates.x, coordinates.y, size.width, size.height);
    }

// - Режим разработчика:
//   -- переключать дебаг\нормальный режим по горячей клавиши
//   -- логгирование (в консоль)
//   -- [v.2] добавлять\удалять объекты на карте, сохранять карту
//   -- иметь вывод текста на UI для дебага
//      -- просто текст, который кинули в лог
//      -- где сейчас мышь + текущий масштаб
//      -- fps движка (а не отрисовки)
//      -- связь с сервером (пинг)
//      -- событие игрока воспринятое движком
//      -- при нажатии на объект выводится информация об объекте
//      -- видеть "маску"(рамку) спрайтов, чтобы понимать где они реагируют на клик мышью
//         -- зеленым цветом - значит пропускат клик
//         -- фиолетовым цветом - значит на клик должен откликаться
}