import { ActionController } from "./actionController";
import { Canvas } from "./canvas";
import { Render } from "./render";
import { DebugMode } from "./debugMode";
import { SpriteHolder } from "./spriteHolder";
import { Camera } from "./camera";
import { X_Y } from "./common";

/** Главный класс игрового движка, через него осуществляется доступ ко всем функциям связанным со спрайтами и их отрисовкой.
 * А точнее, тут доступ к: держателю (массиву) спрайтов, камере, контроллеру действий, режиму разработчика (дебаг-режим), 
 * настройкам движка, холсту на котором все рисуется (html5-canvas) 
 */
export class Engine{

    /** класс отвечающий за все действия выполнящиеся движком */
    public get actionController(): ActionController{return this._actionController;}
    private _actionController: ActionController;

    /** Класс, отвечающий за canvas (html5) внутри которого все отрисовывается */
    public get canvas(): Canvas{return this._canvas;}
    private _canvas: Canvas;

    /** класс отвечающий за "отрисовку" на канвасе объектов */
    public get render(): Render{return this._render;}
    private _render: Render;

    /** "держатель" игровых объектов. Держит в себе всю карту */
    public get spriteHolder(): SpriteHolder{return this._spriteHolder;}
    private _spriteHolder: SpriteHolder;

    /** Класс отвечающий за дебаг-режим (режим разработчика) в игре. Выводит на экран кучу дополнительный инфы  */
    public get debugMode(): DebugMode{return this._debugMode;}
    private _debugMode: DebugMode;


    /** Конструктор Главного класса игрового движка, через него осуществляется доступ ко всем функциям связанным со спрайтами и их отрисовкой.
    * А точнее, тут доступ к: держателю (массиву) спрайтов, камере, контроллеру действий, режиму разработчика (дебаг-режим), 
    * настройкам движка, холсту на котором все рисуется (html5-canvas) 
    * @constructor
    * @param parrentElement - html-элемент (div) внутри которого будет создан canvas. Пример document.getElementById('myDiv');
    */
    constructor(parrentElement: HTMLElement) {
        this._canvas = new Canvas(parrentElement, true);
        this._spriteHolder = new SpriteHolder(this);
        let camera = new Camera(new X_Y(0, 0), 1);
        this._render = new Render(this._canvas.canvasElement, camera);
        this._debugMode = new DebugMode();
        this._actionController = new ActionController(this);
    }

    // TODO сделать конструктор принимающий уже готовый канвас, а так же придумть как делать возможность настраивать канвас разного размера
}