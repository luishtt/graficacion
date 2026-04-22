export class CanvasLocal {
    constructor(g, canvas) {
        this.funcionActual = "Math.sin(x)";
        this.graphics = g;
        this.canvas = canvas;
        this.rWidth = 6;
        this.rHeight = 4;
        this.maxX = canvas.width - 1;
        this.maxY = canvas.height - 1;
        this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
        this.recalcularEscala();
    }
    setZoom(factor) {
        this.rWidth *= factor;
        this.rHeight *= factor;
        this.recalcularEscala();
        this.paint(); // Volvemos a dibujar con la nueva escala
    }
    setFunction(nuevaFuncion) {
        this.funcionActual = nuevaFuncion;
        this.paint();
    }
    recalcularEscala() {
        this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
    }
    iX(x) { return Math.round(this.centerX + x / this.pixelSize); }
    iY(y) { return Math.round(this.centerY - y / this.pixelSize); }
    drawLine(x1, y1, x2, y2) {
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.closePath();
        this.graphics.stroke();
    }
    fx(x) {
        try {
            let expresionDinamica = this.funcionActual.replace(/\bx\b/g, `(${x})`);
            return eval(expresionDinamica);
        }
        catch (e) {
            console.error("Error en la función:", e);
            return 0;
        }
    }
    paint() {
        this.graphics.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let LX = this.rWidth / 2;
        let LY = this.rHeight / 2;
        // 2. Dibujar la cuadrícula dinámica
        this.graphics.strokeStyle = 'lightgray';
        for (let x = -LX; x <= LX; x += 0.25) {
            this.drawLine(this.iX(x), this.iY(-LY), this.iX(x), this.iY(LY));
        }
        for (let y = -LY; y <= LY; y += 0.25) {
            this.drawLine(this.iX(-LX), this.iY(y), this.iX(LX), this.iY(y));
        }
        // 3. Ejes principales
        this.graphics.strokeStyle = 'black';
        this.drawLine(this.iX(-LX), this.iY(0), this.iX(LX), this.iY(0)); // Eje X
        this.drawLine(this.iX(0), this.iY(LY), this.iX(0), this.iY(-LY)); // Eje Y
        // 4. Dibujar la función  
        this.graphics.strokeStyle = 'red';
        this.graphics.lineWidth = 2;
        let paso = this.rWidth / 200;
        for (let x = -LX; x <= LX; x += paso) {
            this.drawLine(this.iX(x), this.iY(this.fx(x)), this.iX(x + paso), this.iY(this.fx(x + paso)));
        }
        this.graphics.lineWidth = 1;
    }
}
