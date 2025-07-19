export class Paddle {
  constructor(canvasWidth, canvasHeight, scale = 1.0) {
    this.baseWidth = 120;
    this.width = this.baseWidth * scale;
    this.height = 18;
    this.x = (canvasWidth - this.width) / 2;
    this.y = canvasHeight - 40;
    this.speed = 480;
    this.dx = 0;
    this.canvasWidth = canvasWidth;
    this.mouseTargetX = null;
    this.glow = false;
    this._initInput();
  }
  setWidth(newWidth) {
    const minW = 60;
    const maxW = Math.min(this._getCanvasWidth(), 220);
    this.width = Math.max(minW, Math.min(newWidth, maxW));
    this.x = Math.max(0, Math.min(this.x, this._getCanvasWidth() - this.width));
  }
  _getCanvasWidth() {
    const canvas = document.querySelector('canvas');
    return canvas ? canvas.width : this.canvasWidth;
  }
  _initInput() {
    if (this._keydown) document.removeEventListener('keydown', this._keydown);
    if (this._keyup) document.removeEventListener('keyup', this._keyup);
    if (this._mousemove) document.removeEventListener('mousemove', this._mousemove);
    this._keydown = e => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') this.dx = 1;
    };
    this._keyup = e => {
      if ((e.key === 'ArrowLeft' || e.key === 'a') && this.dx === -1) this.dx = 0;
      if ((e.key === 'ArrowRight' || e.key === 'd') && this.dx === 1) this.dx = 0;
    };
    this._mousemove = e => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const canvasW = canvas.width;
      const displayW = rect.width;
      // Map mouse X to canvas coordinates
      let mouseX = ((e.clientX - rect.left) / displayW) * canvasW;
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        let target = mouseX - this.width / 2;
        target = Math.max(0, Math.min(target, canvasW - this.width));
        this.mouseTargetX = target;
      } else {
        this.mouseTargetX = null;
      }
    };
    document.addEventListener('keydown', this._keydown);
    document.addEventListener('keyup', this._keyup);
    document.addEventListener('mousemove', this._mousemove);
  }
  update(dt) {
    const canvasW = this._getCanvasWidth();
    // Keyboard
    if (this.dx !== 0) {
      this.x += this.dx * this.speed * dt;
    }
    // Mouse
    if (this.mouseTargetX !== null) {
      this.x += (this.mouseTargetX - this.x) * 0.3;
    }
    // Clamp
    this.x = Math.max(0, Math.min(this.x, canvasW - this.width));
  }
  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#00c6ff';
    ctx.shadowBlur = this.glow ? 32 : 12;
    ctx.fillStyle = '#1ecfff';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
} 