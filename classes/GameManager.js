import { Paddle } from './Paddle.js';
import { Ball } from './Ball.js';
import { Brick } from './Brick.js';
import { Fruit } from './Fruit.js';
import { Scoreboard } from './Scoreboard.js';
import { levels } from '../levels.js';

const BRICK_TYPES = {
  green:   { color: '#39ff14', hitPoints: 1, fruitType: 'Apple',      fruitDropChance: 0.2, scorePerHit: 50 },
  orange:  { color: '#ff9900', hitPoints: 2, fruitType: 'Orange',     fruitDropChance: 0.3, scorePerHit: 75 },
  red:     { color: '#ff3366', hitPoints: 3, fruitType: 'Strawberry', fruitDropChance: 0.4, scorePerHit: 100 },
  purple:  { color: '#a259ff', hitPoints: 4, fruitType: 'Grapes',     fruitDropChance: 0.5, scorePerHit: 150 }
};
const BRICK_COLOR_NAMES = Object.keys(BRICK_TYPES);

function randomInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export class GameManager {
  constructor(canvas, overlay, scoreboard, debugPanel) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.scoreboard = scoreboard;
    this.debugPanel = debugPanel;
    this.state = 'MainMenu';
    this.levelIndex = 0;
    this.lastTimestamp = 0;
    this.entities = { paddle: null, balls: [], bricks: [], fruits: [] };
    this.level = null;
    this.fps = 0;
    this._rafId = null;
    this._speedBoostTimeout = null;
    this.comboState = {
      active: false,
      lastHits: [],
      timer: null,
      color: null
    };
    this._init();
  }
  _init() {
    // Build a modern main menu with level selection
    let menuHtml = `<div class='main-menu'><div class='main-title'>Fruit Smash: Break to Harvest</div><div class='level-select'>`;
    for (const lvl of levels) {
      menuHtml += `<button class='level-btn' data-level='${lvl.level}'>Play Level ${lvl.level}: ${lvl.name}</button>`;
    }
    menuHtml += `</div></div>`;
    this.showOverlay(menuHtml);
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.onclick = (e) => {
        const lvlNum = parseInt(btn.getAttribute('data-level'));
        this.state = 'Playing';
        this.levelIndex = levels.findIndex(l => l.level === lvlNum);
        this.scoreboard.reset();
        this.loadLevel(this.levelIndex);
        this.hideOverlay();
        this._rafId = requestAnimationFrame(this.gameLoop.bind(this));
      };
    });
  }
  startGame() {
    this.state = 'Playing';
    this.levelIndex = 0;
    this.scoreboard.reset();
    this.loadLevel(this.levelIndex);
    this.hideOverlay();
    this._rafId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  loadLevel(idx) {
    this.level = levels[idx];
    // Only resize canvas for levels 2 and 4
    if (this.level.level === 2 || this.level.level === 4) {
      if (this.level.canvasSize) {
        this.canvas.width = this.level.canvasSize.width;
        this.canvas.height = this.level.canvasSize.height;
        this.ctx = this.canvas.getContext('2d');
      }
    }
    // Paddle
    this.entities.paddle = new Paddle(this.canvas.width, this.canvas.height, this.level.paddleScale || 1.0);
    // Balls (start with one)
    const ballSpeed = 320 * (this.level.ballSpeedMultiplier || this.level.ballSpeed || 1.0);
    this.entities.balls = [new Ball(this.canvas.width, this.canvas.height, ballSpeed)];
    // Bricks
    this.entities.bricks = [];
    this._diamondGlowBricks = [];
    if (this.level.brickLayout && this.level.level === 3) {
      // Level 3: D & W shapes in a 16x10 grid
      const grid = this.level.brickLayout;
      const rows = grid.length;
      const cols = grid[0].length;
      const brickW = Math.floor((this.canvas.width - 80) / cols);
      const brickH = Math.floor((this.canvas.height/2 - 40) / rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const code = grid[r][c];
          if (!code || code === 0) continue;
          let colorName = 'green';
          if (code === 3) colorName = 'purple';
          else if (code === 1) {
            // D: red for outline, orange for vertical, green for inside
            if (c === 0 || r === 0 || r === rows-5) colorName = 'red';
            else if (c === 4) colorName = 'orange';
            else colorName = 'green';
          } else if (code === 2) {
            // W: red for outline, orange for vertical, green for diagonals
            if (c === cols-1 || c === 8 || r === rows-5) colorName = 'red';
            else if (c === 9 || c === 15) colorName = 'orange';
            else colorName = 'green';
          }
          const config = { ...BRICK_TYPES[colorName] };
          config.fruitDropChance = (config.fruitDropChance || 0) + (this.level.fruitDropBoost || 0);
          this.entities.bricks.push(new Brick(
            40 + c * brickW,
            40 + r * brickH,
            brickW - 8, brickH - 8, config));
        }
      }
    } else if (this.level.brickLayout) {
      // Level 2+ brick layout
      const rows = this.level.brickLayout.length;
      const cols = this.level.brickLayout[0].length;
      const brickW = Math.floor((this.canvas.width - 80) / cols);
      const brickH = 32;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const code = this.level.brickLayout[r][c];
          if (!code || code === 0) continue;
          let colorName = '';
          let config = null;
          if (code === 'G') colorName = 'green';
          else if (code === 'O') colorName = 'orange';
          else if (code === 'R') colorName = 'red';
          else continue;
          config = { ...BRICK_TYPES[colorName] };
          // For Level 2, boost fruit drop for red bricks
          if (this.level.level === 2 && colorName === 'red') config.fruitDropChance = 1.0;
          const brick = new Brick(40 + c * brickW, 40 + r * brickH, brickW - 8, brickH - 8, config);
          this.entities.bricks.push(brick);
          // Track diamond bricks for glow
          if (this.level.level === 2) this._diamondGlowBricks.push(brick);
        }
      }
      // Fade-in animation for diamond
      if (this.level.level === 2) {
        this._diamondFade = 0;
        let fadeStep = 0;
        const fadeInterval = setInterval(() => {
          this._diamondFade = Math.min(1, this._diamondFade + 0.08);
          fadeStep++;
          if (this._diamondFade >= 1) clearInterval(fadeInterval);
        }, 40);
      }
    } else if (this.level.layoutType === 'chaoticSymmetry' && this.level.level === 4) {
      // Level 4: Chaotic Symmetry, 20x12 grid
      const rows = 12, cols = 20;
      const brickW = Math.floor((this.canvas.width - 80) / cols);
      const brickH = Math.floor((this.canvas.height/2 - 40) / rows);
      const density = 0.65; // 60-70% filled
      const colorPool = [];
      // Fill color pool by frequency
      for (let i = 0; i < 70; i++) colorPool.push('purple'); // 50%
      for (let i = 0; i < 42; i++) colorPool.push('red');    // 30%
      for (let i = 0; i < 21; i++) colorPool.push('orange'); // 15%
      for (let i = 0; i < 7; i++)  colorPool.push('green');  // 5%
      // Seeded random for symmetry
      const rng = (seed => () => (seed = (seed * 9301 + 49297) % 233280) / 233280)(Date.now() % 100000);
      const brickGrid = Array.from({length: rows}, () => Array(cols).fill(null));
      for (let r = 0; r < rows-3; r++) { // avoid bottom 3 rows
        for (let c = 0; c < Math.floor(cols/2); c++) {
          if (rng() < density) {
            // Pick color
            const colorName = colorPool[Math.floor(rng() * colorPool.length)];
            // Place brick and its mirror
            brickGrid[r][c] = colorName;
            brickGrid[r][cols-1-c] = colorName;
          }
        }
      }
      // Place bricks
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const colorName = brickGrid[r][c];
          if (!colorName) continue;
          const config = { ...BRICK_TYPES[colorName] };
          config.fruitDropChance = (config.fruitDropChance || 0) + (this.level.fruitDropBoost || 0);
          const brick = new Brick(
            40 + c * brickW,
            40 + r * brickH,
            brickW - 8, brickH - 8, config);
          // Store original position for regen
          brick._original = { x: 40 + c * brickW, y: 40 + r * brickH, color: colorName, r, c };
          this.entities.bricks.push(brick);
        }
      }
      // For regen: map from (r,c) to brick
      this._regenMap = {};
      for (const brick of this.entities.bricks) {
        if (brick._original) {
          this._regenMap[brick._original.r + ',' + brick._original.c] = brick;
        }
      }
    } else {
      // Level 1 fallback
      const rows = this.level.layout.length;
      const cols = this.level.layout[0].length;
      const brickW = Math.floor((this.canvas.width - 80) / cols);
      const brickH = 32;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const colorIdx = this.level.layout[r][c];
          if (colorIdx === 0 && !this.level.bricks[0]) continue;
          if (colorIdx === 1 && !this.level.bricks[1]) continue;
          if (colorIdx !== 0 && colorIdx !== 1) continue;
          const colorName = this.level.bricks[colorIdx];
          const config = { ...BRICK_TYPES[colorName] };
          this.entities.bricks.push(new Brick(40 + c * brickW, 40 + r * brickH, brickW - 8, brickH - 8, config));
        }
      }
    }
    // Fruits will be handled on brick break
    this.entities.fruits = [];
    // Remove any speed boost
    if (this._speedBoostTimeout) clearTimeout(this._speedBoostTimeout);
    // Combo state reset for Level 3
    if (this.level.level === 3) {
      this.comboState = { active: false, lastHits: [], timer: null, color: null };
    }
    // Show level intro overlay
    let intro = `<div class='level-intro'>`;
    if (this.level.level === 3) intro += '🍓 Level 3: Berry Storm 🍓';
    else if (this.level.level === 2) intro += '🍊 Level 2: Citrus Rush 🍊';
    else intro += `Fruit Smash: Break to Harvest`;
    intro += `</div>`;
    this.showOverlay(intro);
    setTimeout(() => this.hideOverlay(), 1800);
  }
  gameLoop(ts) {
    const dt = (ts - this.lastTimestamp) / 1000 || 0;
    this.lastTimestamp = ts;
    if (this.state === 'Playing') {
      // Update
      this.entities.paddle.update(dt);
      // Ball update and check for lost balls
      for (let i = this.entities.balls.length - 1; i >= 0; i--) {
        const ball = this.entities.balls[i];
        ball.update(dt, this.entities.paddle);
        if (ball.y - ball.radius > this.canvas.height) {
          if (this.entities.balls.length === 1) {
            // Only one ball: remove it, will handle respawn below
            this.entities.balls.splice(i, 1);
          } else {
            // More than one ball: remove this ball, do not respawn, do not lose life
            this.entities.balls.splice(i, 1);
          }
        }
      }
      // After all removals, if no balls left and lives > 0, lose a life and respawn
      if (this.entities.balls.length === 0) {
        this.scoreboard.loseLife();
        if (this.scoreboard.lives <= 0) {
          this.gameOver();
          return;
        }
        // Respawn main ball above paddle
        const paddle = this.entities.paddle;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const speed = 320 * (this.level.ballSpeedMultiplier || this.level.ballSpeed || 1.0);
        const newBall = new Ball(w, h, speed);
        newBall.x = paddle.x + paddle.width / 2;
        newBall.y = paddle.y - newBall.radius - 2;
        newBall.dx = Math.cos(-Math.PI / 4) * newBall.speed;
        newBall.dy = Math.sin(-Math.PI / 4) * newBall.speed;
        this.entities.balls.push(newBall);
      }
      // Ball-brick collision
      for (const ball of this.entities.balls) {
        for (const brick of this.entities.bricks) {
          if (!brick.alive) continue;
          if (this._ballHitsBrick(ball, brick)) {
            ball.dy *= -1;
            const destroyed = brick.hit();
            // Combo mechanic for all levels with combo enabled
            if (this.level.combo && this.level.combo.enabled) {
              this._trackCombo(brick, ts);
            }
            // Play sound for red bricks (Level 2/3/4)
            if ((this.level.level === 2 || this.level.level === 3 || this.level.level === 4) && brick.color === BRICK_TYPES.red.color) {
              if (window && window.Audio) {
                const thunk = new Audio('assets/sfx/thunk.mp3');
                thunk.volume = 0.5;
                thunk.play();
              }
            }
            if (destroyed) {
              // Always add 10 points for breaking a brick, regardless of level or brick type
              this.scoreboard.addScore(10);
              // Always drop a fruit
              this.entities.fruits.push(new Fruit(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                brick.fruitType
              ));
            }
            break; // Only one brick per ball per frame
          }
        }
      }
      // Fruits update and catch/miss logic
      for (let i = this.entities.fruits.length - 1; i >= 0; i--) {
        const fruit = this.entities.fruits[i];
        fruit.update(dt);
        // Fruit trail FX for Level 3
        if (this.level.level === 3) {
          fruit.trail = true;
        }
        // Catch
        if (
          fruit.y + fruit.radius >= this.entities.paddle.y &&
          fruit.x >= this.entities.paddle.x &&
          fruit.x <= this.entities.paddle.x + this.entities.paddle.width &&
          fruit.y + fruit.radius <= this.entities.paddle.y + this.entities.paddle.height + 16
        ) {
          this._applyFruitEffect(fruit.type);
          this.scoreboard.addFruit();
          this.entities.fruits.splice(i, 1);
          continue;
        }
        // Miss (falls below paddle)
        if (fruit.y - fruit.radius > this.canvas.height) {
          this.entities.fruits.splice(i, 1);
          // No life lost for missed fruit
        }
      }
      // Level progression: if all bricks are broken, go to next level or win
      if (this.entities.bricks.every(b => !b.alive)) {
        if (this.levelIndex + 1 < levels.length) {
          if (this.level.level === 1) {
            // After Level 1, prompt to continue or return
            this.state = 'BetweenLevels';
            this.showOverlay(`
              <div class='level-intro'>Level 1 Complete!<br>Continue to Level 2?</div>
              <button id='continueBtn'>Continue</button>
              <button id='mainMenuBtn'>Main Menu</button>
            `);
            document.getElementById('continueBtn').onclick = () => {
              this.levelIndex++;
              this.hideOverlay();
              setTimeout(() => this.loadLevel(this.levelIndex), 300);
              this.state = 'Playing';
            };
            document.getElementById('mainMenuBtn').onclick = () => {
              this.state = 'MainMenu';
              this._init();
            };
            return;
          } else {
            // For later levels, auto-advance
            this.levelIndex++;
            this.loadLevel(this.levelIndex);
          }
        } else {
          this.state = 'GameOver';
          this.showOverlay('Congratulations!<br>All levels complete.<br><button id="restartBtn">Restart</button>');
          document.getElementById('restartBtn').onclick = () => this.startGame();
          return;
        }
      }
      // Render
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      // Diamond glow for Level 2
      if (this.level.level === 2 && this._diamondGlowBricks && this._diamondGlowBricks.length) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.25 * (this._diamondFade || 1);
        for (const brick of this._diamondGlowBricks) {
          this.ctx.shadowColor = '#FFA500';
          this.ctx.shadowBlur = 32;
          this.ctx.fillStyle = 'rgba(255,165,0,0.15)';
          this.ctx.fillRect(brick.x - 6, brick.y - 6, brick.width + 12, brick.height + 12);
        }
        this.ctx.restore();
      }
      // Combo border FX for all levels with combo enabled
      if (this.level.combo && this.level.combo.enabled && this.comboState.active) {
        this.ctx.save();
        this.ctx.shadowColor = this.comboState.color || '#ff33cc';
        this.ctx.shadowBlur = 32;
        this.ctx.lineWidth = 8;
        this.ctx.strokeStyle = this.comboState.color || '#ff33cc';
        this.ctx.globalAlpha = 0.5;
        this.ctx.strokeRect(8, 8, this.canvas.width-16, this.canvas.height-16);
        this.ctx.restore();
      }
      this.entities.paddle.render(this.ctx);
      for (const ball of this.entities.balls) ball.render(this.ctx);
      for (const brick of this.entities.bricks) {
        if (brick.alive) brick.render(this.ctx);
      }
      for (const fruit of this.entities.fruits) {
        fruit.render(this.ctx);
      }
      // Combo HUD label for all levels with combo enabled
      if (this.level.combo && this.level.combo.enabled && this.comboState.active) {
        this.ctx.save();
        this.ctx.font = 'bold 1.5rem Orbitron, Roboto Mono, monospace';
        this.ctx.fillStyle = this.comboState.color || '#ff33cc';
        this.ctx.shadowColor = this.comboState.color || '#ff33cc';
        this.ctx.shadowBlur = 16;
        this.ctx.fillText('COMBO ACTIVE!', this.canvas.width/2-110, 38);
        this.ctx.restore();
      }
      // Shockwave FX for Level 4
      if (this.level.level === 4 && this._shockwave) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.25 * this._shockwave;
        this.ctx.fillStyle = '#a020f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
      }
    }
    this._rafId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  _ballHitsBrick(ball, brick) {
    // Simple AABB/circle collision
    const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
    const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    return (dx * dx + dy * dy) < (ball.radius * ball.radius);
  }
  _applyFruitEffect(type) {
    const paddle = this.entities.paddle;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (type === 'Apple') {
      // Increase paddle size
      paddle.setWidth(paddle.width + 32);
    } else if (type === 'Orange') {
      // Decrease paddle size
      paddle.setWidth(paddle.width - 32);
    } else if (type === 'Strawberry') {
      // Add an extra ball
      const mainBall = this.entities.balls[0];
      const newBall = new Ball(w, h, mainBall.speed);
      newBall.x = mainBall.x;
      newBall.y = mainBall.y;
      newBall.dx = -mainBall.dx;
      newBall.dy = mainBall.dy;
      this.entities.balls.push(newBall);
    } else if (type === 'Grapes') {
      // Speed boost for all balls for 10s
      if (this.entities.balls.length === 1) {
        // Only main ball
        const ball = this.entities.balls[0];
        ball.speed *= 1.5;
        const angle = Math.atan2(ball.dy, ball.dx);
        ball.dx = Math.cos(angle) * ball.speed;
        ball.dy = Math.sin(angle) * ball.speed;
        if (this._speedBoostTimeout) clearTimeout(this._speedBoostTimeout);
        this._speedBoostTimeout = setTimeout(() => {
          ball.speed /= 1.5;
          const angle2 = Math.atan2(ball.dy, ball.dx);
          ball.dx = Math.cos(angle2) * ball.speed;
          ball.dy = Math.sin(angle2) * ball.speed;
        }, 10000);
      } else {
        // Multiple balls
        for (const ball of this.entities.balls) {
          ball.speed *= 1.5;
          const angle = Math.atan2(ball.dy, ball.dx);
          ball.dx = Math.cos(angle) * ball.speed;
          ball.dy = Math.sin(angle) * ball.speed;
        }
        if (this._speedBoostTimeout) clearTimeout(this._speedBoostTimeout);
        this._speedBoostTimeout = setTimeout(() => {
          for (const ball of this.entities.balls) {
            ball.speed /= 1.5;
            const angle = Math.atan2(ball.dy, ball.dx);
            ball.dx = Math.cos(angle) * ball.speed;
            ball.dy = Math.sin(angle) * ball.speed;
          }
        }, 10000);
      }
    }
  }
  _trackCombo(brick, ts) {
    // Track last 3 hits by color and time
    const now = ts || performance.now();
    this.comboState.lastHits.push({ color: brick.color, time: now });
    if (this.comboState.lastHits.length > 3) this.comboState.lastHits.shift();
    // Check for combo: 3 of same color within timer
    if (this.comboState.lastHits.length === 3) {
      const [a, b, c] = this.comboState.lastHits;
      if (a.color === b.color && b.color === c.color && (c.time - a.time) < (this.level.combo?.timer || 6000)) {
        // Combo triggered
        this.comboState.active = true;
        this.comboState.color = a.color;
        this.scoreboard.addScore(this.level.combo?.bonusScore || 200);
        // Ball glow effect
        for (const ball of this.entities.balls) {
          ball.glow = true;
          ball.radius = 16;
        }
        setTimeout(() => {
          this.comboState.active = false;
          this.comboState.color = null;
          for (const ball of this.entities.balls) {
            ball.glow = false;
            ball.radius = 12;
          }
        }, 3000);
      }
    }
  }
  showOverlay(html) {
    this.overlay.classList.remove('hidden');
    this.overlay.querySelector('#overlayContent').innerHTML = html;
  }
  hideOverlay() {
    this.overlay.classList.add('hidden');
  }
  pauseGame() {
    this.state = 'Paused';
    this.showOverlay('Paused<br><button id="resumeBtn">Resume</button>');
    document.getElementById('resumeBtn').onclick = () => this.resumeGame();
  }
  resumeGame() {
    this.state = 'Playing';
    this.hideOverlay();
    this._rafId = requestAnimationFrame(this.gameLoop.bind(this));
  }
  gameOver() {
    this.state = 'GameOver';
    this.showOverlay(`<div class='game-over-card'>
      <div class='game-over-title'>Game Over</div>
      <button class='restart-btn' id='restartBtn'>Restart</button>
    </div>`);
    document.getElementById('restartBtn').onclick = () => this.startGame();
  }
} 