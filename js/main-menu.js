// main-menu.js
const state = {
  musicOn: true,
  soundOn: true,
  ballSpeed: 1.0,
  fullscreen: false,
  lastLevel: 1,
};

// --- Background Canvas Animation ---
const bgCanvas = document.getElementById('bg-canvas');
const ctx = bgCanvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 48;
function resizeCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
function createParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: 2 + Math.random() * 2,
      dx: -0.2 + Math.random() * 0.4,
      dy: -0.2 + Math.random() * 0.4,
      alpha: 0.5 + Math.random() * 0.5,
    });
  }
}
createParticles();
function animateParticles() {
  ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  // Gradient pulse
  const grad = ctx.createRadialGradient(bgCanvas.width/2, bgCanvas.height/2, 0, bgCanvas.width/2, bgCanvas.height/2, Math.max(bgCanvas.width, bgCanvas.height)/1.2);
  grad.addColorStop(0, '#0ff2');
  grad.addColorStop(1, '#050510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  // Particles
  for (let p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = '#00e0ff';
    ctx.shadowColor = '#00e0ff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();
    // Move
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > bgCanvas.width) p.dx *= -1;
    if (p.y < 0 || p.y > bgCanvas.height) p.dy *= -1;
  }
  // Connect lines on hover
  for (let i = 0; i < particles.length; i++) {
    for (let j = i+1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dist = Math.hypot(a.x-b.x, a.y-b.y);
      if (dist < 120) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#00e0ff';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// --- Menu Button Interactivity ---
const hoverSound = document.getElementById('menu-hover-sound');
const clickSound = document.getElementById('menu-click-sound');
const music = document.getElementById('menu-music');
if (state.musicOn) music.volume = 0.18;
if (state.musicOn) music.play();

function playHover() { if (state.soundOn) { hoverSound.currentTime = 0; hoverSound.play(); } }
function playClick() { if (state.soundOn) { clickSound.currentTime = 0; clickSound.play(); } }

document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.addEventListener('mouseenter', playHover);
  btn.addEventListener('focus', playHover);
  btn.addEventListener('click', playClick);
});

// --- Modal Logic ---
const modal = document.getElementById('modal-overlay');
function showModal(html) {
  modal.innerHTML = html;
  modal.classList.remove('hidden');
  modal.focus();
}
function hideModal() {
  modal.classList.add('hidden');
  modal.innerHTML = '';
}
modal.addEventListener('click', e => { if (e.target === modal) hideModal(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape') hideModal(); });

// --- Button Actions ---
function fadeOutMenuAndStart(level) {
  const menuPanel = document.getElementById('main-menu-panel');
  menuPanel.style.transition = 'opacity 0.7s, transform 0.7s';
  menuPanel.style.opacity = 0;
  menuPanel.style.transform = 'translateY(-40px) scale(0.98)';
  setTimeout(() => {
    document.getElementById('main-menu-container').style.display = 'none';
    // Redirect to game.html with level param
    window.location.href = `game.html?play=${level}`;
  }, 700);
}

document.getElementById('play-btn').onclick = () => {
  playClick();
  fadeOutMenuAndStart(1);
};
document.getElementById('levels-btn').onclick = () => {
  playClick();
  showModal(`<div class='modal-card'><h2>Level Select</h2><div class='level-grid'>
    <button class='level-select-btn' data-level='1'>Level 1</button>
    <button class='level-select-btn' data-level='2'>Level 2</button>
    <button class='level-select-btn' data-level='3'>Level 3</button>
    <button class='level-select-btn' data-level='4'>Level 4</button>
  </div></div>`);
  document.querySelectorAll('.level-select-btn').forEach(btn => {
    btn.onclick = () => {
      playClick();
      hideModal();
      fadeOutMenuAndStart(btn.dataset.level);
    };
  });
};
document.getElementById('instructions-btn').onclick = () => {
  playClick();
  showModal(`<div class='modal-card'><h2>Instructions</h2>
    <ul>
      <li>Move paddle: <b>Mouse</b> or <b>Arrow Keys/A/D</b></li>
      <li>Break bricks, catch fruits for powerups</li>
      <li>Combo: Hit 3 same-color bricks in 6s for bonus</li>
      <li>Special fruits: 🍏🍊🍓🍇 each have unique effects</li>
      <li>Pause: <b>Esc</b> or <b>P</b></li>
    </ul>
    <button class='modal-close' tabindex="0">Close</button>
  </div>`);
  document.querySelector('.modal-close').onclick = hideModal;
};
document.getElementById('settings-btn').onclick = () => {
  playClick();
  showModal(`<div class='modal-card'><h2>Settings</h2>
    <label><input type='checkbox' id='sound-toggle' ${state.soundOn ? 'checked' : ''}/> Sound</label><br>
    <label><input type='checkbox' id='music-toggle' ${state.musicOn ? 'checked' : ''}/> Music</label><br>
    <label>Ball Speed: <input type='range' id='ball-speed' min='0.5' max='2.5' step='0.05' value='${state.ballSpeed}'/></label><br>
    <label><input type='checkbox' id='fullscreen-toggle' ${state.fullscreen ? 'checked' : ''}/> Fullscreen</label><br>
    <button class='modal-close' tabindex="0">Close</button>
  </div>`);
  document.getElementById('sound-toggle').onchange = e => { state.soundOn = e.target.checked; localStorage.setItem('soundOn', state.soundOn); };
  document.getElementById('music-toggle').onchange = e => { state.musicOn = e.target.checked; music.volume = state.musicOn ? 0.18 : 0; localStorage.setItem('musicOn', state.musicOn); if (state.musicOn) music.play(); else music.pause(); };
  document.getElementById('ball-speed').oninput = e => { state.ballSpeed = parseFloat(e.target.value); localStorage.setItem('ballSpeed', state.ballSpeed); };
  document.getElementById('fullscreen-toggle').onchange = e => { if (e.target.checked) { document.documentElement.requestFullscreen(); state.fullscreen = true; } else { document.exitFullscreen(); state.fullscreen = false; } localStorage.setItem('fullscreen', state.fullscreen); };
  document.querySelector('.modal-close').onclick = hideModal;
};
document.getElementById('credits-btn').onclick = () => {
  playClick();
  showModal(`<div class='modal-card'><h2>Credits</h2>
    <p>Game by <b>Your Name</b><br>Stack: HTML, CSS, JS<br><a href='https://github.com/yourgithub' target='_blank'>GitHub</a><br>v1.0</p>
    <button class='modal-close' tabindex="0">Close</button>
  </div>`);
  document.querySelector('.modal-close').onclick = hideModal;
};
document.getElementById('exit-btn').onclick = () => {
  playClick();
  showModal(`<div class='modal-card'><h2>Thank you for playing!</h2><p>Close this tab or return to the main menu.</p><button class='modal-close' tabindex="0">Close</button></div>`);
  document.querySelector('.modal-close').onclick = hideModal;
};

// --- Accessibility: Focus trap for modal ---
modal.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    const focusables = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length-1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
});

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'p') document.getElementById('play-btn').focus();
  if (e.key.toLowerCase() === 'l') document.getElementById('levels-btn').focus();
}); 