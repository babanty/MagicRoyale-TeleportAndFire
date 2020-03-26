"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const canvas_1 = require("./engine/canvas");
function initialize() {
    let el = document.getElementById('content');
    let canvas = new canvas_1.Canvas(el);
}
window.onload = () => {
    initialize();
};
//# sourceMappingURL=app.js.map