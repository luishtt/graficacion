import { BarItem, CanvasLocal } from './canvasLocal.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');
graphics = <CanvasRenderingContext2D>canvas.getContext('2d');

const chartCanvas:CanvasLocal = new CanvasLocal(graphics, canvas);
const dataInput = <HTMLTextAreaElement>document.getElementById('data-input');
const drawButton = <HTMLButtonElement>document.getElementById('draw-button');
const exampleButton = <HTMLButtonElement>document.getElementById('example-button');
const statusText = <HTMLParagraphElement>document.getElementById('status-text');
const errorText = <HTMLParagraphElement>document.getElementById('error-text');

function updateStatus(items: BarItem[]) {
  statusText.textContent = `Barras cargadas: ${items.length}`;
}

function parseInput(text: string): BarItem[] {
  const raw = text.trim();

  if (!raw) {
    throw new Error("Escribe al menos un valor.");
  }

  //si solo vienen numeros separados por comas, genera etiquetas automaticas
  if (!raw.includes("\n") && !/[A-Za-z]/.test(raw)) {
    const values = raw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => !Number.isNaN(value));

    if (values.length === 0) {
      throw new Error("Escribe valores separados por comas.");
    }

    return values.map((value, index) => {
      if (!Number.isFinite(value) || value < 0) {
        throw new Error("Todos los valores deben ser numeros positivos.");
      }

      return {
        label: `Dato ${index + 1}`,
        value
      };
    });
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error("Escribe al menos una barra con formato nombre,valor.");
  }

  //si vienen lineas tipo nombre,valor las respeta
  return lines.map((line) => {
    const parts = line.split(",");

    if (parts.length !== 2) {
      throw new Error(`La linea "${line}" no tiene el formato nombre,valor.`);
    }

    const label = parts[0].trim();
    const value = Number(parts[1].trim());

    if (!label) {
      throw new Error("Cada barra debe tener un nombre.");
    }

    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`El valor de "${label}" debe ser un numero positivo.`);
    }

    return { label, value };
  });
}

function drawChart() {
  try {
    //lee la informacion desde pantalla y la manda al canvas
    const items = parseInput(dataInput.value);
    chartCanvas.setItems(items);
    chartCanvas.paint();
    updateStatus(items);
    errorText.textContent = "";
  } catch (error) {
    if (error instanceof Error) {
      errorText.textContent = error.message;
    } else {
      errorText.textContent = "No se pudo leer la informacion.";
    }
  }
}

drawButton.addEventListener('click', drawChart);

exampleButton.addEventListener('click', () => {
  dataInput.value = "20,50,10,40,25";
  drawChart();
});

dataInput.value = "20,50,10,40,25";

drawChart();
