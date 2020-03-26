"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Canvas {
    constructor(parrentElement, canvasIsMainElement = true) {
        this.parrentElement = parrentElement;
        this.canvasIsMainElement = canvasIsMainElement;
        this.createCanvas();
        if (this.canvasIsMainElement === true) {
            this.canvasToFullDocument();
        }
    }
    createCanvas() {
        this.createCanvasHtml();
        this.createCanvasCss();
    }
    createCanvasHtml() {
        this.canvasElement = document.createElement('canvas');
        this.parrentElement.appendChild(this.canvasElement);
        this.canvasElement.innerHTML += "Извините, ваш браузер не поддерживает тег canvas";
    }
    createCanvasCss() {
        this.canvasElement.style.zIndex = "1";
    }
    canvasToFullDocument() {
        this.canvasElement.style.position = "absolute";
        this.canvasElement.style.overflow = "hidden";
        this.canvasElement.style.top = "0";
        this.canvasElement.style.left = "0";
        this.canvasElement.style.width = "100%";
        this.canvasElement.style.height = "100%";
    }
}
exports.Canvas = Canvas;
//# sourceMappingURL=canvas.js.map