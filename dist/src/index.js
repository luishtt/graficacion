var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Obj3D } from './Obj3D.js';
import { CvWireframe } from './CvWireFrame.js';
const canvas = document.getElementById('circlechart');
const graphics = canvas.getContext('2d');
const fileInput = document.getElementById('file-input');
const openButton = document.getElementById('open-lid');
const closeButton = document.getElementById('close-lid');
const animateButton = document.getElementById('animate-lid');
const resetButton = document.getElementById('reset-view');
const eyeDown = document.getElementById('eyeDown');
const eyeUp = document.getElementById('eyeUp');
const eyeLeft = document.getElementById('eyeLeft');
const eyeRight = document.getElementById('eyeRight');
const incrDist = document.getElementById('incrDist');
const decrDist = document.getElementById('decrDist');
const fileContent = document.getElementById('contenido-archivo');
const statusText = document.getElementById('status-text');
const lidGroups = ['Tapa', 'Pantalla', 'Logo_tapa_', 'Logo_frontal'];
const lidReferenceGroups = ['Tapa', 'Pantalla'];
let modelText = '';
let currentLidAngle = 78;
let viewTheta = 0.30;
let viewPhi = 1.3;
let viewRhoFactor = 3;
let animationId = 0;
let animationDirection = -1;
function parseDat(content) {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const facesIndex = lines.findIndex((line) => line.toLowerCase() === 'faces:');
    if (facesIndex === -1) {
        throw new Error('El archivo no tiene la seccion Faces:');
    }
    const vertices = lines.slice(0, facesIndex)
        .map((line) => line.split(/\s+/))
        .filter((parts) => parts.length >= 4 && parts.slice(0, 4).every((value) => Number.isFinite(Number(value))))
        .map((parts) => ({
        id: Number(parts[0]),
        x: Number(parts[1]),
        y: Number(parts[2]),
        z: Number(parts[3])
    }));
    const faces = lines.slice(facesIndex + 1)
        .filter((line) => /^-?\d/.test(line));
    return { vertices, faces };
}
function serializeDat(model) {
    const vertices = model.vertices.map((vertex) => `${vertex.id} ${vertex.x.toFixed(5)} ${vertex.y.toFixed(5)} ${vertex.z.toFixed(5)}`);
    return `${vertices.join('\n')}\nFaces:\n${model.faces.join('\n')}\n`;
}
function parseStructuredRanges(content) {
    const ranges = [];
    const pattern = /^#\s*Colección:\s*(.+?)\s*\(Vértices\s+(\d+)-(\d+)\)/i;
    for (const line of content.split(/\r?\n/)) {
        const match = line.trim().match(pattern);
        if (match) {
            ranges.push({
                name: match[1].trim(),
                start: Number(match[2]),
                end: Number(match[3])
            });
        }
    }
    return ranges;
}
function getGroupIds(ranges, groupNames) {
    const ids = new Set();
    for (const range of ranges) {
        if (groupNames.indexOf(range.name) === -1)
            continue;
        for (let id = range.start; id <= range.end; id++) {
            ids.add(id);
        }
    }
    return ids;
}
function getHingeCenter(vertices) {
    const minY = Math.min(...vertices.map((vertex) => vertex.y));
    const hingePoints = vertices.filter((vertex) => vertex.y <= minY + 0.08);
    const total = hingePoints.reduce((result, vertex) => ({ y: result.y + vertex.y, z: result.z + vertex.z }), { y: 0, z: 0 });
    return {
        y: total.y / hingePoints.length,
        z: total.z / hingePoints.length
    };
}
function getLidRawAngle(vertices) {
    const hinge = getHingeCenter(vertices);
    const maxY = Math.max(...vertices.map((vertex) => vertex.y));
    const farPoints = vertices.filter((vertex) => vertex.y >= maxY - 0.08);
    const far = farPoints.reduce((result, vertex) => ({ y: result.y + vertex.y, z: result.z + vertex.z }), { y: 0, z: 0 });
    const farY = far.y / farPoints.length;
    const farZ = far.z / farPoints.length;
    return Math.atan2(farY - hinge.y, farZ - hinge.z) * 180 / Math.PI;
}
function rotateLid(model, ranges, targetAngle) {
    const lidIds = getGroupIds(ranges, lidGroups);
    const referenceIds = getGroupIds(ranges, lidReferenceGroups);
    if (lidIds.size === 0 || referenceIds.size === 0)
        return model;
    const referenceVertices = model.vertices.filter((vertex) => referenceIds.has(vertex.id));
    const hinge = getHingeCenter(referenceVertices);
    const rawAngle = getLidRawAngle(referenceVertices);
    const radians = (rawAngle - targetAngle) * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return {
        vertices: model.vertices.map((vertex) => {
            if (!lidIds.has(vertex.id))
                return vertex;
            const relativeY = vertex.y - hinge.y;
            const relativeZ = vertex.z - hinge.z;
            return Object.assign(Object.assign({}, vertex), { y: hinge.y + relativeY * cos - relativeZ * sin, z: hinge.z + relativeY * sin + relativeZ * cos });
        }),
        faces: [...model.faces]
    };
}
function convertForViewer(model) {
    return {
        vertices: model.vertices.map((vertex) => (Object.assign(Object.assign({}, vertex), { y: vertex.z, z: vertex.y }))),
        faces: [...model.faces]
    };
}
function renderScene() {
    if (!modelText)
        return;
    try {
        const ranges = parseStructuredRanges(modelText);
        const originalModel = parseDat(modelText);
        const model = rotateLid(originalModel, ranges, currentLidAngle);
        const viewerModel = convertForViewer(model);
        const object = new Obj3D();
        object.read(serializeDat(viewerModel));
        object.theta = viewTheta;
        object.phi = viewPhi;
        object.rho = Math.min(object.rhoMax, Math.max(object.rhoMin, object.rhoMin * viewRhoFactor));
        const view = new CvWireframe(graphics, canvas);
        view.setObj(object);
        view.paint();
        const lidVertices = getGroupIds(ranges, lidGroups).size;
        statusText.textContent = ranges.length > 0
            ? `Vertices: ${model.vertices.length} | Tapa: ${lidVertices} | Angulo: ${Math.round(currentLidAngle)}°`
            : `Vertices: ${model.vertices.length} | El archivo no tiene grupos para mover la tapa`;
    }
    catch (error) {
        statusText.textContent = error instanceof Error ? error.message : 'No se pudo leer el archivo';
    }
}
function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = 0;
    }
    animateButton.textContent = 'Animar tapa';
}
function setLidAngle(angle) {
    currentLidAngle = angle;
    renderScene();
}
function animateLid() {
    const tick = () => {
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
    animateButton.textContent = 'Pausar';
    animationId = requestAnimationFrame(tick);
}
function updateView(dTheta, dPhi, rhoFactor) {
    viewTheta += dTheta;
    viewPhi += dPhi;
    viewRhoFactor *= rhoFactor;
    renderScene();
}
function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        var _a, _b;
        stopAnimation();
        modelText = String((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result) !== null && _b !== void 0 ? _b : '');
        fileContent.textContent = modelText;
        currentLidAngle = 78;
        renderScene();
    };
    reader.readAsText(file);
}
function loadDefaultModel() {
    return __awaiter(this, void 0, void 0, function* () {
        modelText = yield fetch('./data/frigobar_estructurado_limpio.txt').then((response) => response.text());
        fileContent.textContent = modelText;
        renderScene();
    });
}
fileInput.addEventListener('change', () => {
    var _a;
    const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
    if (file)
        loadFile(file);
}, false);
openButton.addEventListener('click', () => {
    stopAnimation();
    setLidAngle(78);
}, false);
closeButton.addEventListener('click', () => {
    stopAnimation();
    setLidAngle(0);
}, false);
animateButton.addEventListener('click', () => {
    if (animationId)
        stopAnimation();
    else
        animateLid();
}, false);
resetButton.addEventListener('click', () => {
    stopAnimation();
    currentLidAngle = 78;
    viewTheta = 0.30;
    viewPhi = 1.3;
    viewRhoFactor = 3;
    renderScene();
}, false);
eyeDown.addEventListener('click', () => updateView(0, 0.1, 1), false);
eyeUp.addEventListener('click', () => updateView(0, -0.1, 1), false);
eyeLeft.addEventListener('click', () => updateView(-0.1, 0, 1), false);
eyeRight.addEventListener('click', () => updateView(0.1, 0, 1), false);
incrDist.addEventListener('click', () => updateView(0, 0, 1.2), false);
decrDist.addEventListener('click', () => updateView(0, 0, 0.85), false);
loadDefaultModel();
