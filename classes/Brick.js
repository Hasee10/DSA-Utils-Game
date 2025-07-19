export class Brick {
  constructor(x, y, width, height, config) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = config.color;
    this.hitPoints = config.hitPoints;
    this.fruitType = config.fruitType;
    this.fruitDropChance = config.fruitDropChance;
    this.scorePerHit = config.scorePerHit;
    this.alive = true;
  }
  hit() {
    this.hitPoints--;
    if (this.hitPoints <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }
  render(ctx) {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
} 