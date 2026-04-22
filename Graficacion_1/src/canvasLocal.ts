
export class CanvasLocal {
  //atributos
  protected graphics: CanvasRenderingContext2D;
  protected rWidth:number;
  protected rHeight:number;
  protected maxX: number;
  protected maxY: number;
  protected pixelSize: number;
  protected centerX: number;
  protected centerY: number;
  
      
  public constructor(g: CanvasRenderingContext2D, canvas: HTMLCanvasElement){
    this.graphics = g;
    this.rWidth = 6;
    this.rHeight= 4;
    this.maxX = canvas.width - 1
    this.maxY = canvas.height - 1;
    this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
    this.centerX = this.maxX/2;
    this.centerY = this.maxY/2;
  }

  iX(x: number):number{return Math.round(this.centerX + x/this.pixelSize);}
  iY(y: number): number{ return Math.round(this.centerY - y / this.pixelSize); }
  
  drawLine(x1: number, y1: number, x2: number, y2:number) {
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.closePath();
    this.graphics.stroke();
  }



  paint() {
    
  this.graphics.clearRect(0, 0, this.maxX + 1, this.maxY + 1);
  
    const tamaño = 3.0;
    const q = 0.05;
    const p = 1 - q;

    let xA = -tamaño / 2, yA = tamaño / 2;
    let xB = tamaño / 2, yB = tamaño / 2;
    let xC = tamaño / 2, yC = -tamaño / 2;
    let xD = -tamaño / 2, yD = -tamaño / 2;
    

    for (let i = 0; i < 50; i++) {
        this.drawLine(this.iX(xA), this.iY(yA), this.iX(xB), this.iY(yB));
        this.drawLine(this.iX(xB), this.iY(yB), this.iX(xC), this.iY(yC));
        this.drawLine(this.iX(xC), this.iY(yC), this.iX(xD), this.iY(yD));
        this.drawLine(this.iX(xD), this.iY(yD), this.iX(xA), this.iY(yA));
        
        const xA1 = p * xA + q * xB;
        const yA1 = p * yA + q * yB;
        const xB1 = p * xB + q * xC;
        const yB1 = p * yB + q * yC;
        const xC1 = p * xC + q * xD;
        const yC1 = p * yC + q * yD;
        const xD1 = p * xD + q * xA;
        const yD1 = p * yD + q * yA;

        xA = xA1; xB = xB1; xC = xC1; xD = xD1;
        yA = yA1; yB = yB1; yC = yC1; yD = yD1; 
  }

}

}