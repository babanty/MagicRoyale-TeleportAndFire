import { Canvas } from "./engine/canvas";

function initialize() {
    let el = document.getElementById('content');
    let canvas = new Canvas(el);
}


window.onload = () => {
    initialize();
}