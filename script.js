import { GameManager } from './classes/GameManager.js';
import { Scoreboard } from './classes/Scoreboard.js';

const canvasDiv = document.getElementById('gameCanvas');
const overlay = document.getElementById('gameOverlay');
const debugPanel = document.getElementById('debugPanel');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const fruitsEl = document.getElementById('fruits');

// Use the existing #gameCanvas div as the container for the canvas
const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
canvas.tabIndex = 0;
canvas.style.width = '100%';
canvas.style.height = 'auto';
canvasDiv.appendChild(canvas);

const scoreboard = new Scoreboard(scoreEl, livesEl, fruitsEl);
const gameManager = new GameManager(canvas, overlay, scoreboard, debugPanel);

// Start at the requested level if ?play=LEVEL is present
const params = new URLSearchParams(window.location.search);
if (params.has('play')) {
  const lvl = parseInt(params.get('play'), 10);
  if (!isNaN(lvl) && lvl > 0) {
    gameManager.levelIndex = lvl - 1;
    gameManager.state = 'Playing';
    scoreboard.reset();
    gameManager.loadLevel(gameManager.levelIndex);
    gameManager.hideOverlay();
    gameManager._rafId = requestAnimationFrame(gameManager.gameLoop.bind(gameManager));
  }
}

// Responsive resize
window.addEventListener('resize', () => {
  canvas.width = canvasDiv.clientWidth;
  canvas.height = canvasDiv.clientHeight;
}); 