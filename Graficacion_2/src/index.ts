import { CanvasLocal } from "./canvasLocal.js";

// 1. Obtener el canvas con el ID exacto de tu HTML: "circlechart"
const canvas = document.getElementById('circlechart') as HTMLCanvasElement;
const graphics = canvas.getContext('2d');

if (graphics) {
    const plotter = new CanvasLocal(graphics, canvas);
    plotter.paint(); // Dibujo inicial

    document.getElementById('graficar').addEventListener('click', () => {
        const input = document.getElementById('funInput') as HTMLInputElement;
        if (input.value) {
            plotter.setFunction(input.value);
        }
    });

    // 3. Botones de Zoom: IDs "btnZoomIn" y "btnZoomOut"
    document.getElementById('acercar').addEventListener('click', () => {
        plotter.setZoom(0.8);
    });

    document.getElementById('alejar').addEventListener('click', () => {
        plotter.setZoom(1.2);
    });
}