export class Ball {
  constructor(canvasWidth, canvasHeight, speed = 480) {
    this.radius = 13;
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 80;
    this.speed = speed;
    this.angle = -Math.PI / 4;
    this.dx = Math.cos(this.angle) * this.speed;
    this.dy = Math.sin(this.angle) * this.speed;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.glow = true;
  }
  update(dt, paddle) {
    this.x += this.dx * dt;
    this.y += this.dy * dt;
    // Wall collision
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.dx *= -1;
    }
    if (this.x + this.radius > this.canvasWidth) {
      this.x = this.canvasWidth - this.radius;
      this.dx *= -1;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.dy *= -1;
    }
    // Paddle collision
    if (
      this.y + this.radius >= paddle.y &&
      this.x + this.radius >= paddle.x &&
      this.x - this.radius <= paddle.x + paddle.width &&
      this.y + this.radius <= paddle.y + paddle.height + 16 &&
      this.dy > 0
    ) {
      this.y = paddle.y - this.radius;
      this.dy *= -1;
      // Add some angle based on where it hit the paddle
      const hitPos = (this.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      this.dx = this.speed * hitPos * 0.85;
      this.dy = -Math.abs(Math.sqrt(this.speed * this.speed - this.dx * this.dx));
      paddle.glow = true;
      setTimeout(() => paddle.glow = false, 120);
    }
  }
  render(ctx) {
    ctx.save();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = this.glow ? 32 : 12;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
} 