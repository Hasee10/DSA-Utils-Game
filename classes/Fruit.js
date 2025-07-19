export class Fruit {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.type = type;
    this.yVelocity = 180;
    this.drift = (Math.random() - 0.5) * 60;
    this.caught = false;
    this.emoji = this.getEmoji(type);
  }
  getEmoji(type) {
    switch(type) {
      case 'Apple': return '🍏';
      case 'Orange': return '🍊';
      case 'Strawberry': return '🍓';
      case 'Grapes': return '🍇';
      default: return '🍎';
    }
  }
  update(dt) {
    this.y += this.yVelocity * dt;
    this.x += this.drift * dt;
  }
  render(ctx) {
    ctx.save();
    ctx.font = '24px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 16;
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
} 