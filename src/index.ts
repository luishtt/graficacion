import { Obj3D } from './Obj3D.js';
import { CvWireframe } from './CvWireFrame.js';

interface DatVertex {
  id: number;
  x: number;
  y: number;
  z: number;
}

interface DatModel {
  vertices: DatVertex[];
  faces: string[];
}

// ===============================
// ELEMENTOS
// ===============================
const canvas = document.getElementById('circlechart') as HTMLCanvasElement;
const graphics = canvas.getContext('2d')!;

const fileInput = document.getElementById('file-input') as HTMLInputElement;

const openButton = document.getElementById('open-lid') as HTMLButtonElement;
const closeButton = document.getElementById('close-lid') as HTMLButtonElement;
const animateButton = document.getElementById('animate-lid') as HTMLButtonElement;

const toggleSeparate = document.getElementById('toggle-separate') as HTMLButtonElement;
const separationRange = document.getElementById('separation-range') as HTMLInputElement;

const fileContent = document.getElementById('contenido-archivo') as HTMLPreElement;
const statusText = document.getElementById('status-text') as HTMLParagraphElement;

// ===============================
// ESTADO
// ===============================
let modelText = '';
let currentLidAngle = 78;

let viewTheta = 0.30;
let viewPhi = 1.3;
let viewRhoFactor = 3;

let animationId = 0;
let animationDirection = -1;
let isAutoAnimating = false;

let separationEnabled = false;
let separationValue = 0;

// ===============================
// SELECCIÓN SIMPLE DE PUERTA
// ===============================
function isDoorVertex(v: DatVertex) {
  return v.x > 3.4;
}

// ===============================
// PARSER
// ===============================
function parseDat(content: string): DatModel {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const facesIndex = lines.findIndex(l => l.toLowerCase() === 'faces:');

  const vertices = lines.slice(0, facesIndex)
    .map(l => l.split(/\s+/))
    .filter(p => p.length >= 4)
    .map(p => ({
      id: Number(p[0]),
      x: Number(p[1]),
      y: Number(p[2]),
      z: Number(p[3])
    }));

  const faces = lines.slice(facesIndex + 1);

  return { vertices, faces };
}

// ===============================
// BISAGRA
// ===============================
function getHingeCenter(vertices: DatVertex[]) {
  const minY = Math.min(...vertices.map(v => v.y));
  const hingePoints = vertices.filter(v => v.y <= minY + 0.08);

  const total = hingePoints.reduce(
    (r, v) => ({ y: r.y + v.y, z: r.z + v.z }),
    { y: 0, z: 0 }
  );

  return {
    y: total.y / hingePoints.length,
    z: total.z / hingePoints.length
  };
}

// ===============================
// ROTACIÓN PUERTA
// ===============================
function rotateDoor(model: DatModel, targetAngle: number): DatModel {
  const doorVertices = model.vertices.filter(isDoorVertex);

  if (doorVertices.length === 0) return model;

  const hinge = getHingeCenter(model.vertices);

  const maxY = Math.max(...doorVertices.map(v => v.y));
  const farPoints = doorVertices.filter(v => v.y >= maxY - 0.08);

  const far = farPoints.reduce(
    (r, v) => ({ y: r.y + v.y, z: r.z + v.z }),
    { y: 0, z: 0 }
  );

  const rawAngle = Math.atan2(
    (far.y / farPoints.length) - hinge.y,
    (far.z / farPoints.length) - hinge.z
  ) * 180 / Math.PI;

  const rad = (rawAngle - targetAngle) * Math.PI / 180;

  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    vertices: model.vertices.map(v => {
      if (!isDoorVertex(v)) return v;

      const y = v.y - hinge.y;
      const z = v.z - hinge.z;

      return {
        ...v,
        y: hinge.y + y * cos - z * sin,
        z: hinge.z + y * sin + z * cos
      };
    }),
    faces: [...model.faces]
  };
}

// ===============================
// SEPARACIÓN DE PIEZAS
// ===============================
function separateModel(model: DatModel, amount: number): DatModel {
  return {
    vertices: model.vertices.map(v => {
      let offset = 0;

      if (v.x > 3) offset = amount;
      else if (v.x < 1) offset = -amount;

      return {
        ...v,
        x: v.x + offset
      };
    }),
    faces: [...model.faces]
  };
}

// ===============================
// CONVERTIR VIEW
// ===============================
function convert(model: DatModel): DatModel {
  return {
    vertices: model.vertices.map(v => ({
      ...v,
      y: v.z,
      z: v.y
    })),
    faces: [...model.faces]
  };
}

// ===============================
// RENDER
// ===============================
function renderScene() {
  if (!modelText) return;

  const original = parseDat(modelText);

  let model = rotateDoor(original, currentLidAngle);

  if (separationEnabled) {
    model = separateModel(model, separationValue);
  }

  const viewer = convert(model);

  const obj = new Obj3D();
  obj.read(
    viewer.vertices.map(v =>
      `${v.id} ${v.x} ${v.y} ${v.z}`
    ).join('\n') +
    '\nFaces:\n' +
    viewer.faces.join('\n')
  );

  obj.theta = viewTheta;
  obj.phi = viewPhi;
  obj.rho = Math.min(obj.rhoMax, Math.max(obj.rhoMin, obj.rhoMin * viewRhoFactor));

  const view = new CvWireframe(graphics, canvas);
  view.setObj(obj);
  view.paint();

  statusText.textContent =
    `Puerta: ${Math.round(currentLidAngle)}° | Separación: ${separationValue}`;
}

// ===============================
// CONTROL
// ===============================
function setAngle(a: number) {
  currentLidAngle = a;
  renderScene();
}

// ===============================
// AUTO ANIMACIÓN
// ===============================
function animateLid() {
  isAutoAnimating = true;

  const tick = () => {
    if (!isAutoAnimating) return;

    currentLidAngle += animationDirection * 1.5;

    if (currentLidAngle >= 78) {
      currentLidAngle = 78;
      animationDirection = -1;
    }

    if (currentLidAngle <= 0) {
      currentLidAngle = 0;
      animationDirection = 1;
    }

    renderScene();
    animationId = requestAnimationFrame(tick);
  };

  animateButton.textContent = 'Pausar auto';
  animationId = requestAnimationFrame(tick);
}

function stopAuto() {
  isAutoAnimating = false;
  if (animationId) cancelAnimationFrame(animationId);
  animationId = 0;
  animateButton.textContent = 'Auto abrir/cerrar';
}

// ===============================
// BOTONES
// ===============================
openButton.addEventListener('click', () => {
  stopAuto();
  setAngle(78);
});

closeButton.addEventListener('click', () => {
  stopAuto();
  setAngle(0);
});

animateButton.addEventListener('click', () => {
  if (isAutoAnimating) stopAuto();
  else animateLid();
});

toggleSeparate.addEventListener('click', () => {
  separationEnabled = !separationEnabled;

  toggleSeparate.textContent = separationEnabled
    ? 'Separación ON'
    : 'Separar piezas';

  renderScene();
});

separationRange.addEventListener('input', (e) => {
  separationValue = Number((e.target as HTMLInputElement).value);
  renderScene();
});

// ===============================
// CARGA MODELO
// ===============================
fetch('./data/frigobar_estructurado_limpio.txt')
  .then(r => r.text())
  .then(t => {
    modelText = t;
    fileContent.textContent = t;
    renderScene();
  });