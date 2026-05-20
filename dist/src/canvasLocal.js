export class CanvasLocal {
    constructor(g, canvas) {
        this.graphics = g;
        this.rWidth = 10;
        this.rHeight = 10;
        this.maxX = canvas.width - 1;
        this.maxY = canvas.height - 1;
        this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
        this.items = [
            { label: "Enero", value: 14 },
            { label: "Febrero", value: 9 },
            { label: "Marzo", value: 18 },
            { label: "Abril", value: 11 }
        ];
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
    clearCanvas() {
        this.graphics.clearRect(0, 0, this.maxX + 1, this.maxY + 1);
        this.graphics.fillStyle = "#0d1522";
        this.graphics.fillRect(0, 0, this.maxX + 1, this.maxY + 1);
    }
    drawBackground() {
        this.graphics.fillStyle = "#0d1522";
        this.graphics.fillRect(0, 0, this.maxX + 1, this.maxY + 1);
    }
    setItems(items) {
        this.items = items;
    }
    getItems() {
        return this.items;
    }
    drawReferenceLine(originX, topY, chartWidth) {
        //linea superior de referencia
        this.graphics.strokeStyle = "#2b2b2b";
        this.graphics.lineWidth = 2;
        this.drawLine(originX, topY, originX + chartWidth - 40, topY);
    }
    drawBar3D(x, y, width, height, color, sideColor, topColor) {
        //cara frontal
        const depth = 22;
        const lift = 14;
        this.graphics.fillStyle = color;
        this.graphics.fillRect(x, y, width, height);
        this.graphics.strokeStyle = "#111111";
        this.graphics.lineWidth = 2;
        this.graphics.strokeRect(x, y, width, height);
        //cara lateral
        this.graphics.beginPath();
        this.graphics.moveTo(x + width, y);
        this.graphics.lineTo(x + width + depth, y - lift);
        this.graphics.lineTo(x + width + depth, y + height - lift);
        this.graphics.lineTo(x + width, y + height);
        this.graphics.closePath();
        this.graphics.fillStyle = sideColor;
        this.graphics.fill();
        this.graphics.stroke();
        //cara superior
        this.graphics.beginPath();
        this.graphics.moveTo(x, y);
        this.graphics.lineTo(x + depth, y - lift);
        this.graphics.lineTo(x + width + depth, y - lift);
        this.graphics.lineTo(x + width, y);
        this.graphics.closePath();
        this.graphics.fillStyle = topColor;
        this.graphics.fill();
        this.graphics.stroke();
    }
    drawBars(originX, originY, chartWidth) {
        if (this.items.length === 0) {
            return;
        }
        //obtiene el valor mayor para escalar las barras
        const maxValue = Math.max(...this.items.map((item) => item.value), 1);
        const barHeight = 34;
        const gap = 18;
        let y = originY - 10;
        const colors = [
            { front: "#f000f0", side: "#c000c0", top: "#ff4dff" },
            { front: "#ff1010", side: "#c10b0b", top: "#ff5b5b" },
            { front: "#0f9d16", side: "#0a6f0f", top: "#3ccf43" },
            { front: "#fff100", side: "#d1c400", top: "#fff76d" },
            { front: "#1428ff", side: "#0f1fb8", top: "#5a67ff" }
        ];
        this.graphics.font = "bold 14px Arial";
        this.graphics.textBaseline = "middle";
        for (let index = 0; index < this.items.length; index++) {
            const item = this.items[index];
            //calcula el ancho segun el valor capturado
            const barWidth = (item.value / maxValue) * chartWidth;
            const palette = colors[index % colors.length];
            const yTop = y;
            this.drawBar3D(originX, yTop, barWidth, barHeight, palette.front, palette.side, palette.top);
            //muestra el valor al final de la barra
            this.graphics.fillStyle = "#f8fafc";
            this.graphics.fillText(item.value.toString(), originX + barWidth + 28, yTop + barHeight / 2 - 2);
            y += barHeight + gap;
        }
    }
    paint() {
        this.clearCanvas();
        this.drawBackground();
        //this.graphics.arc(this.iX(0), this.iY(0), Math.abs(this.iX(4)-this.iX(0)), 0,2*Math.PI, false);
        //this.graphics.stroke();
        //this.graphics.fillText("Lienzo listo desde ts", this.iX(2), this.iY(3.7));
        //debugger;
        //this.drawLine(320, 40, 480, 400);
        //this.drawLine(320, 40, 140, 400);
        //this.drawLine(140, 400, 480, 400);
        /*let lado = 100;
        let side = 0.95 * lado;
        let sideHalf = 0.5 * side;
        let xCenter = 320;
        let yCenter = 240;
          
        let h = sideHalf * Math.sqrt(3);
        let xA, yA, xB, yB, xC, yC,
        xA1, yA1, xB1, yB1, xC1, yC1, p, q;
         q = 0.05;
        p = 1 - q;
        for (let m = 0; m < 4; m++){
          for (let n = 0; n < 4; n++){
            xA = 100+n*lado - sideHalf;
            yA = 100+m*lado - 0.5 * h;
            xB = 100+n*lado+ sideHalf;
            yB = yA;
            xC = 100+n*lado;
            yC = 100+m*lado + 0.5 * h; 
            for (let i = 0; i < 20; i++){
              this.drawLine(xA, yA, xB, yB);
              this.drawLine(xB, yB, xC, yC);
              this.drawLine(xC, yC, xA, yA);
            }
          }
        }*/
        //punto de inicio del grafico de barras
        const originX = 120;
        const topY = 90;
        const chartWidth = this.maxX - originX - 140;
        this.drawReferenceLine(originX, topY, chartWidth);
        this.drawBars(originX, topY + 22, chartWidth);
    }
}
