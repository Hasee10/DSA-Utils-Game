export class Scoreboard {
  constructor(scoreEl, livesEl, fruitsEl) {
    this.scoreEl = scoreEl;
    this.livesEl = livesEl;
    this.fruitsEl = fruitsEl;
    this.reset();
  }
  reset() {
    this.score = 0;
    this.lives = 3;
    this.fruits = 0;
    this.updateUI();
  }
  addScore(points) {
    this.score += points;
    this.updateUI();
  }
  loseLife() {
    this.lives--;
    this.updateUI();
  }
  addFruit() {
    this.fruits++;
    this.updateUI();
  }
  updateUI() {
    this.scoreEl.textContent = `Score: ${this.score}`;
    this.livesEl.textContent = `Lives: ${this.lives}`;
    this.fruitsEl.textContent = `Fruits: ${this.fruits}`;
  }
} 