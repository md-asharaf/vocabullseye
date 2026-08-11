// =====================================================
// ARCHER QUIZ – game.js  (v4 – full rewrite)
// =====================================================

const QUESTIONS_PER_GAME = 12;
let allWords = [], gameQuestions = [], currentQIndex = 0, currentOptions = [];
let score = 0, streak = 0, maxStreak = 0, correctCount = 0;
let muted = false, fiftyUsed = false, hintUsed = false;
let gameState = 'idle';

// ── CANVAS ──────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;

function resizeCanvas() {
  const topH = document.getElementById('topHud').offsetHeight;
  const botH = document.getElementById('bottomHud').offsetHeight;
  W = window.innerWidth;
  H = window.innerHeight - topH - botH;
  canvas.width = W;
  canvas.height = H;

  if (gameState !== 'idle') draw();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', resizeCanvas);

// ── CONSTANTS ───────────────────────────────────
const MAN_COLORS = ['#e74c3c', '#3498db', '#9b59b6', '#1abc9c'];
const ARCHER_COLOR = '#f5a623';

function scaleF() {
  return Math.max(0.42, Math.min(W / 640, H / 380) * 0.88);
}

function getArcherPos() {
  const isMobile = W < 520;
  return { x: isMobile ? W * 0.20 : W * 0.12, y: H * 0.58 };
}

// Shoulder (where bow arm originates)
function getShoulderPos() {
  const ap = getArcherPos(), s = scaleF();
  return { x: ap.x, y: ap.y - (22 + 30) * s };
}

// ── TARGET POSITIONS ────────────────────────────
function getTargetPositions() {
  const s = scaleF();
  const isMobile = W < 520;
  const legLen = 22 * s, bodyLen = 30 * s, headR = 11 * s;
  const stickH = legLen + bodyLen + headR * 2;  // feet → top of head
  const estLabelH = 64;
  const gap = 7 * s + 4;

  const topSafe = stickH + gap + estLabelH + 4;
  const botSafe = H - 12;                 // near canvas bottom (no ground limit)
  let available = Math.max(0, botSafe - topSafe);
  let startY = topSafe;

  if (isMobile) {
    const compressed = available * 0.82; // less compressed to fit long labels
    startY += (available - compressed) / 2;
    available = compressed;
  }

  const baseX = isMobile ? W * 0.70 : W * 0.76;
  const rawBulge = isMobile ? Math.min(W * 0.10, 45) : Math.min(W * 0.16, 115);
  const bulge = Math.min(rawBulge, W * 0.95 - baseX); // cap so middle two never overflow

  const tValues = [0, 0.30, 0.70, 1];
  return Array.from({ length: 4 }, (_, i) => {
    const t = tValues[i];
    const y = startY + t * available;
    const xr = bulge * 4 * t * (1 - t);    // 0, max, max, 0
    return { x: baseX + xr, y };
  });
}

// ── BACKGROUND ──────────────────────────────────
function drawBackground() {
  ctx.fillStyle = '#1de9b6';
  ctx.fillRect(0, 0, W, H);
}

// ── ARCHER – FULLY ANIMATED ────────────────────
function drawArcher(x, feetY, color, s, aimAngle, pullAmt) {
  const legLen = 22 * s, bodyLen = 30 * s, headR = 11 * s;
  const hipY = feetY - legLen;
  const shldrY = hipY - bodyLen;
  const lw = Math.max(2, 3 * s);

  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Legs
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x - 10 * s, feetY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x + 10 * s, feetY); ctx.stroke();
  // Body
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x, shldrY); ctx.stroke();

  const headCY = shldrY - headR;
  const hdLeanX = Math.cos(aimAngle) * 3.5 * s;
  const hdLeanY = Math.sin(aimAngle) * 2 * s;
  const hx = x + hdLeanX, hy = headCY + hdLeanY;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(hx, hy, headR, 0, Math.PI * 2); ctx.fill();
  const exo = Math.cos(aimAngle) * 3.5 * s, eyo = Math.sin(aimAngle) * 1.5 * s;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(hx + exo - 2.5 * s, hy + eyo, 2 * s, 0, Math.PI * 2);
  ctx.arc(hx + exo + 2.5 * s, hy + eyo, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(hx + exo - 2 * s, hy + eyo, 0.9 * s, 0, Math.PI * 2);
  ctx.arc(hx + exo + 3 * s, hy + eyo, 0.9 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color; ctx.lineWidth = lw;

  const bowArmLen = 20 * s;
  const gripX = x + Math.cos(aimAngle) * bowArmLen;
  const gripY = shldrY + Math.sin(aimAngle) * bowArmLen;
  ctx.beginPath(); ctx.moveTo(x, shldrY); ctx.lineTo(gripX, gripY); ctx.stroke();

  const pullDist = (14 + pullAmt * 22) * s;
  const drawX = x - Math.cos(aimAngle) * pullDist;
  const drawY = shldrY - Math.sin(aimAngle) * pullDist * 0.5;
  ctx.beginPath(); ctx.moveTo(x, shldrY); ctx.lineTo(drawX, drawY); ctx.stroke();

  const bowR = 18 * s;
  ctx.save();
  ctx.translate(gripX, gripY);
  ctx.rotate(aimAngle);
  ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = Math.max(2, 2.5 * s);
  ctx.beginPath();
  ctx.arc(0, 0, bowR, -Math.PI / 2, Math.PI / 2); // 180° D-shape
  ctx.stroke();
  const localDraw = -(pullDist); // draw hand is behind (negative local X)
  ctx.strokeStyle = '#dde'; ctx.lineWidth = Math.max(1, 1.4 * s);
  ctx.beginPath();
  ctx.moveTo(0, -bowR);
  ctx.lineTo(localDraw, 0);
  ctx.lineTo(0, bowR);
  ctx.stroke();
  // Arrow nocked on string while pulling
  if (pullAmt > 0.04) {
    ctx.strokeStyle = '#8B4513'; ctx.lineWidth = Math.max(1.2, 1.8 * s);
    ctx.beginPath(); ctx.moveTo(localDraw, 0); ctx.lineTo(bowR * 0.35, 0); ctx.stroke();
    ctx.fillStyle = '#bbb';
    ctx.beginPath();
    ctx.moveTo(bowR * 0.35 + 4 * s, 0); ctx.lineTo(bowR * 0.35 - 2 * s, -3 * s); ctx.lineTo(bowR * 0.35 - 2 * s, 3 * s);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ── TARGET STICKMAN (no bow, no ground shadow) ──
function drawTargetMan(x, feetY, color, s) {
  const legLen = 22 * s, bodyLen = 30 * s, headR = 11 * s, armLen = 18 * s;
  const hipY = feetY - legLen, shldrY = hipY - bodyLen, headCY = shldrY - headR;
  const lw = Math.max(2, 3 * s);

  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x - 10 * s, feetY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x + 10 * s, feetY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, hipY); ctx.lineTo(x, shldrY); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, headCY, headR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 4 * s, headCY - 2 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.arc(x + 4 * s, headCY - 2 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(x - 3.5 * s, headCY - 2 * s, s, 0, Math.PI * 2);
  ctx.arc(x + 4.5 * s, headCY - 2 * s, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(x, shldrY); ctx.lineTo(x - armLen, shldrY + 10 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, shldrY); ctx.lineTo(x + armLen, shldrY + 10 * s); ctx.stroke();
}

// ── LABEL ABOVE STICKMAN ────────────────────────
function drawLabel(x, groundY, text, color, s, eliminated) {
  const legLen = 22 * s, bodyLen = 30 * s, headR = 11 * s;
  const headCY = groundY - legLen - bodyLen - headR;

  const isMobile = W < 520;
  // Increase max width significantly on mobile so labels don't become extremely tall
  const maxW = isMobile ? Math.max(130, W * 0.35) : Math.max(140, W * 0.18);
  const fsize = Math.max(9, Math.min(12, 11 * s));
  ctx.font = `bold ${fsize}px Inter,sans-serif`;

  const lines = wrapText(text, maxW - 12);
  const lineH = fsize * 1.4, padX = 7, padY = 5;
  const boxW = Math.max(...lines.map(l => ctx.measureText(l).width)) + padX * 2;
  const boxH = lines.length * lineH + padY * 2;
  const bx = x - boxW / 2;
  const by = headCY - headR - 7 * s - boxH;

  ctx.save();
  if (eliminated) ctx.globalAlpha = 0.18;
  ctx.fillStyle = eliminated ? '#444' : color;
  roundRect(ctx, bx, by, boxW, boxH, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff';
  lines.forEach((l, i) => ctx.fillText(l, bx + padX, by + padY + fsize + i * lineH));
  if (!eliminated) {
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(x, by + boxH); ctx.lineTo(x, headCY - headR); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function wrapText(text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── DRAG / AIM ──────────────────────────────────
let isDragging = false, dragCurrent = { x: 0, y: 0 };
let currentAimAngle = 0, currentPull = 0;

function getCanvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
  const src = e.touches ? e.touches[0] : e;
  return { x: (src.clientX - rect.left) * sx, y: (src.clientY - rect.top) * sy };
}

// Grip = where the bow is held (at end of bow arm)
function getGripPos() {
  const sh = getShoulderPos(), s = scaleF();
  return {
    x: sh.x + Math.cos(currentAimAngle) * 20 * s,
    y: sh.y + Math.sin(currentAimAngle) * 20 * s
  };
}

canvas.addEventListener('mousedown', onStart);
canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('mouseup', onEnd);
canvas.addEventListener('mouseleave', onEnd);
canvas.addEventListener('touchstart', onStart, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onEnd, { passive: false });

function onStart(e) {
  e.preventDefault();
  if (gameState !== 'aiming') return;
  const pt = getCanvasPoint(e);
  const ap = getArcherPos(), s = scaleF();
  const archerMid = { x: ap.x, y: ap.y - (22 + 30 + 11) * s };
  if (Math.hypot(pt.x - archerMid.x, pt.y - archerMid.y) < 88 * s) {
    isDragging = true; dragCurrent = { ...pt };
    startAimLoop();
  }
}

// Physics constants – MUST be the same in trajectory preview and arrow launch
const MAX_DRAG = 95;   // pixel units at scaleF()=1
const SPEED_MUL = 0.22; // increased to reach further targets

function gravity() {
  return scaleF() * 0.35; // reduced gravity to allow higher arc
}

function onMove(e) {
  e.preventDefault();
  if (!isDragging) return;
  dragCurrent = getCanvasPoint(e);
  const sh = getShoulderPos();
  const dx = sh.x - dragCurrent.x; // positive = drag is LEFT of archer ✓
  const dy = sh.y - dragCurrent.y;

  // 180° constraint: only update aim when dragging to the LEFT of the archer.
  // atan2(dy, dx) with dx>0 is naturally in (-PI/2, PI/2) – right hemisphere.
  if (dx > 0) {
    currentAimAngle = Math.atan2(dy, dx);
  } else {
    // Dragging past the archer body → clamp to straight up/down
    currentAimAngle = dy >= 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  currentPull = Math.min(1, Math.hypot(dx, dy) / (MAX_DRAG * scaleF()));
}

function onEnd(e) {
  e.preventDefault();
  if (!isDragging) return;
  isDragging = false;
  const sh = getShoulderPos();
  const dx = sh.x - dragCurrent.x;
  const dy = sh.y - dragCurrent.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 12) { currentPull = 0; draw(); return; }
  // Velocity: exactly same formula as trajectory preview
  const power = Math.min(dist, MAX_DRAG * scaleF());
  const speed = power * SPEED_MUL;
  currentPull = 0;
  const grip = getGripPos();
  fireArrow(grip.x, grip.y,
    Math.cos(currentAimAngle) * speed,
    Math.sin(currentAimAngle) * speed);
}

// ── TRAJECTORY HINT – 4 tight initial dots only ──
// Uses SAME physics constants as onEnd so preview matches actual flight.
function drawTrajectoryHint(sx, sy, vx, vy) {
  const g = gravity();
  let px = sx, py = sy, pvx = vx, pvy = vy;
  const DOTS = 18, STEPS = 2; // dense tight dots near launch
  for (let d = 0; d < DOTS; d++) {
    if (py > H + 10 || px < -20 || px > W + 20) break;
    const alpha = (1 - d / DOTS) * 0.9;
    ctx.save(); ctx.globalAlpha = alpha;
    // Outer glow
    const gw = ctx.createRadialGradient(px, py, 0, px, py, 10);
    gw.addColorStop(0, 'rgba(255,235,55,0.85)');
    gw.addColorStop(1, 'rgba(255,235,55,0)');
    ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2); ctx.fill();
    // Core dot
    ctx.fillStyle = '#ffe840';
    ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Advance EXACTLY like arrowLoop does
    for (let st = 0; st < STEPS; st++) { px += pvx; py += pvy; pvy += g; }
  }
}

// Reduced gravity → enables high-arc shots to reach elevated targets
function gravity() { return 0.17 * (H / 400); }

// ── ARROW ───────────────────────────────────────
let arrow = null, particles = [];

function fireArrow(x, y, vx, vy) {
  playSound('shoot');
  arrow = { x, y, vx, vy, trail: [], active: true };
  gameState = 'flying';
  arrowLoop();
}

function arrowLoop() {
  if (!arrow || !arrow.active) return;
  const g = gravity();
  arrow.trail.push({ x: arrow.x, y: arrow.y });
  if (arrow.trail.length > 26) arrow.trail.shift();
  arrow.x += arrow.vx; arrow.y += arrow.vy; arrow.vy += g;

  const tpos = getTargetPositions(), s = scaleF();
  const isMobile = W < 520;
  let hit = false;
  for (let i = 0; i < 4; i++) {
    if (!currentOptions[i] || currentOptions[i].eliminated) continue;
    const tp = tpos[i];
    const legLen = 22 * s, bodyLen = 30 * s, headR = 11 * s;
    const topY = tp.y - legLen - bodyLen - headR * 2;
    const hw = isMobile ? 22 * s : 16 * s;  // wider hitbox on mobile
    const hb = { x: tp.x - hw, y: topY, w: hw * 2, h: legLen + bodyLen + headR * 2 };
    if (arrow.x > hb.x && arrow.x < hb.x + hb.w && arrow.y > hb.y && arrow.y < hb.y + hb.h) {
      arrow.active = false; hit = true;
      handleHit(i, arrow.x, arrow.y); break;
    }
  }
  if (!hit && (arrow.y > H + 30 || arrow.x < -60 || arrow.x > W + 60)) {
    arrow.active = false; handleMiss();
  }
  draw();
  if (arrow && arrow.active) requestAnimationFrame(arrowLoop);
}

function drawArrowInFlight() {
  if (!arrow) return;
  const angle = Math.atan2(arrow.vy, arrow.vx), s = scaleF();
  // Trail
  for (let i = 0; i < arrow.trail.length; i++) {
    const t = arrow.trail[i];
    ctx.save(); ctx.globalAlpha = (i / arrow.trail.length) * 0.45;
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // Arrow body
  ctx.save();
  ctx.translate(arrow.x, arrow.y); ctx.rotate(angle);
  const len = 20 * s;
  ctx.strokeStyle = '#7a4010'; ctx.lineWidth = Math.max(2, 2.5 * s); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-len * 0.85, 0); ctx.lineTo(len * 0.45, 0); ctx.stroke();
  ctx.fillStyle = '#bbb';
  ctx.beginPath(); ctx.moveTo(len * 0.45, 0); ctx.lineTo(len * 0.05, -3.5 * s); ctx.lineTo(len * 0.05, 3.5 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.moveTo(-len * 0.85, 0); ctx.lineTo(-len * 0.58, -5 * s); ctx.lineTo(-len * 0.44, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-len * 0.85, 0); ctx.lineTo(-len * 0.58, 5 * s); ctx.lineTo(-len * 0.44, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── PARTICLES ───────────────────────────────────
function spawnParticles(x, y, color) {
  for (let i = 0; i < 22; i++) {
    const a = Math.random() * Math.PI * 2, sp = 2.5 + Math.random() * 5.5;
    particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, life: 1, color, r: 3 + Math.random() * 4 });
  }
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.18; p.life -= 0.033;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.save(); ctx.globalAlpha = p.life * p.life; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

// ── DRAW ────────────────────────────────────────
let _aimLoopActive = false;
function startAimLoop() {
  if (_aimLoopActive) return; _aimLoopActive = true;
  function loop() {
    if (gameState === 'aiming') { draw(); requestAnimationFrame(loop); }
    else _aimLoopActive = false;
  }
  requestAnimationFrame(loop);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  const s = scaleF();
  const ap = getArcherPos();

  // Aim angle: 0 (right) when idle, live when dragging
  const aimAngle = isDragging ? currentAimAngle : 0;

  // Trajectory hint (speed formula IDENTICAL to onEnd for accurate preview)
  if (isDragging && currentPull > 0.06) {
    const grip = getGripPos();
    const speed = currentPull * MAX_DRAG * s * SPEED_MUL;
    drawTrajectoryHint(
      grip.x, grip.y,
      Math.cos(aimAngle) * speed,
      Math.sin(aimAngle) * speed
    );
  }

  // Archer (animated)
  drawArcher(ap.x, ap.y, ARCHER_COLOR, s, aimAngle, isDragging ? currentPull : 0);

  // Target stickmen
  const tpos = getTargetPositions();
  for (let i = 0; i < 4; i++) {
    if (!currentOptions[i]) continue;
    const elim = currentOptions[i].eliminated;
    drawTargetMan(tpos[i].x, tpos[i].y, MAN_COLORS[i], s);
    if (elim) {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3;
      const ex = tpos[i].x, ey = tpos[i].y - 35 * s;
      ctx.beginPath();
      ctx.moveTo(ex - 14 * s, ey - 14 * s); ctx.lineTo(ex + 14 * s, ey + 14 * s);
      ctx.moveTo(ex + 14 * s, ey - 14 * s); ctx.lineTo(ex - 14 * s, ey + 14 * s);
      ctx.stroke(); ctx.restore();
    }
    drawLabel(tpos[i].x, tpos[i].y, currentOptions[i].text, MAN_COLORS[i], s, elim);
  }

  drawArrowInFlight();
  updateParticles(); drawParticles();

  // Keep rendering while particles are alive
  if (particles.length && gameState !== 'flying') requestAnimationFrame(draw);
}

// ── HIT / MISS ──────────────────────────────────
function handleHit(i, ax, ay) {
  const opt = currentOptions[i];
  if (opt.correct) {
    score += 100; streak++; correctCount++;
    if (streak > maxStreak) maxStreak = streak;
    showFeedback('+100 CORRECT!', '#2ecc71'); playSound('correct');
  } else {
    score = Math.max(0, score - 10); streak = 0;
    showFeedback('-10 WRONG!', '#e74c3c'); playSound('wrong');
  }
  spawnParticles(ax, ay, opt.correct ? '#2ecc71' : '#e74c3c');
  updateScoreUI(); gameState = 'result';
  setTimeout(nextQuestion, 1900);
}

function handleMiss() {
  score = Math.max(0, score - 10); streak = 0;
  showFeedback('-10  💨  MISSED!', '#e67e22'); playSound('wrong');
  updateScoreUI(); gameState = 'result';
  setTimeout(nextQuestion, 1500);
}

// ── QUESTIONS ───────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function buildGameQuestions() {
  const pool = shuffle(allWords);
  const sel = pool.slice(0, Math.min(QUESTIONS_PER_GAME, pool.length));
  gameQuestions = [];
  sel.forEach((item, i) => {
    const correctWord = item.word;
    let others = allWords.filter(w => w.word !== item.word);
    others = shuffle(others).slice(0, 3);
    const opts = [
      { text: correctWord, correct: true },
      { text: others[0].word, correct: false },
      { text: others[1].word, correct: false },
      { text: others[2].word, correct: false }
    ];
    gameQuestions.push({
      word: item.word,
      definition: (() => {
        let s = item.definition.replace(/\[cite.*?\]/g, '').trim().toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
      })(),
      mnemonic: item.mnemonic,
      options: shuffle(opts)
    });
  });
}

function loadQuestion(idx) {
  const q = gameQuestions[idx];
  document.getElementById('questionLabel').textContent = `${idx + 1}/${gameQuestions.length}`;
  document.getElementById('questionText').innerHTML = `What word means <span class="q-highlight">"${q.definition}"</span>?`;
  currentOptions = q.options.map(o => ({ ...o, eliminated: false }));
  fiftyUsed = false;
  document.getElementById('fiftyBtn').disabled = false;
  document.getElementById('hintPopup').style.display = 'none';
  arrow = null; particles = [];
  isDragging = false; currentPull = 0; currentAimAngle = 0;
  gameState = 'aiming'; _aimLoopActive = false;
  startAimLoop();
}

function nextQuestion() {
  currentQIndex++; arrow = null; particles = [];
  if (currentQIndex >= gameQuestions.length) { endGame(); return; }
  loadQuestion(currentQIndex);
}

function updateScoreUI() {
  document.getElementById('scoreValue').textContent = score;
  document.getElementById('streakValue').textContent = streak;
}

function showFeedback(text, color) {
  const el = document.getElementById('feedbackFlash');
  el.textContent = text; el.style.color = color;
  el.style.animation = 'none'; el.offsetHeight;
  el.style.animation = 'flashAnim 1.7s ease forwards';
}

// ── AUDIO ────────────────────────────────────────
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playSound(type) {
  if (muted) return; ensureAudio();
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.20, audioCtx.currentTime);
  if (type === 'shoot') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.start(); osc.stop(audioCtx.currentTime + 0.18);
  } else if (type === 'correct') {
    osc.type = 'sine';
    [523, 659, 784].forEach((f, i) => osc.frequency.setValueAtTime(f, audioCtx.currentTime + i * 0.1));
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.42);
    osc.start(); osc.stop(audioCtx.currentTime + 0.42);
  } else {
    osc.type = 'square';
    osc.frequency.setValueAtTime(175, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.start(); osc.stop(audioCtx.currentTime + 0.25);
  }
}

// ── GAME FLOW ────────────────────────────────────
function startGame() {
  score = 0; streak = 0; maxStreak = 0; correctCount = 0; currentQIndex = 0;
  arrow = null; particles = []; currentPull = 0; currentAimAngle = 0;
  updateScoreUI(); buildGameQuestions();
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('gameWrapper').style.display = 'flex';
  resizeCanvas(); loadQuestion(0);
}

function endGame() {
  gameState = 'end';
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalStreak').textContent = maxStreak;
  document.getElementById('finalCorrect').textContent = `${correctCount}/${gameQuestions.length}`;
  document.getElementById('endScreen').style.display = 'flex';
}

// ── BUTTONS ──────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('playAgainBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', () => { if (confirm('Restart?')) startGame(); });
document.getElementById('muteBtn').addEventListener('click', () => {
  muted = !muted; document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
});
document.getElementById('fiftyBtn').addEventListener('click', () => {
  if (fiftyUsed || gameState !== 'aiming') return;
  fiftyUsed = true; document.getElementById('fiftyBtn').disabled = true;
  const wrong = shuffle(currentOptions.filter(o => !o.correct && !o.eliminated));
  wrong.slice(0, 2).forEach(o => { o.eliminated = true; }); draw();
});
document.getElementById('hintBtn').addEventListener('click', () => {
  if (gameState !== 'aiming' && gameState !== 'result') return;
  const q = gameQuestions[currentQIndex];
  if (!q) return;
  document.getElementById('hintContent').innerHTML =
    `<div class="hint-icon">💡</div><div class="hint-text">${q.mnemonic}</div>`;
  const popup = document.getElementById('hintPopup');
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
});
document.addEventListener('click', (e) => {
  const popup = document.getElementById('hintPopup');
  const hintBtn = document.getElementById('hintBtn');
  if (popup.style.display === 'block' && !popup.contains(e.target) && !hintBtn.contains(e.target)) {
    popup.style.display = 'none';
  }
});

// ── INIT ─────────────────────────────────────────
fetch('data.json')
  .then(r => r.json())
  .then(d => { allWords = d; resizeCanvas(); })
  .catch(() => {
    allWords = [
      { word: 'Ambivalence', mnemonic: 'Aam Violence', definition: 'The State of having Conflicting Emotional Attitudes' },
      { word: 'Amorphous', mnemonic: 'Aam(mango)', definition: 'Formless' },
      { word: 'Anachronistic', mnemonic: 'Ana crow', definition: 'Having an Error involving time in a story' },
      { word: 'Analogous', mnemonic: 'ana logo', definition: 'Comparable' },
      { word: 'Anarchist', mnemonic: 'ana christ', definition: 'Person who seeks to overturn the established government' },
      { word: 'Animosity', mnemonic: 'animal+city', definition: 'Active enmity' },
      { word: 'Anomaly', mnemonic: 'Ana Mali', definition: 'Irregularity' },
      { word: 'Antagonism', mnemonic: 'Ant+Gun', definition: 'Opposition' },
      { word: 'Apathy', mnemonic: 'A+Path', definition: 'Lack of caring' },
      { word: 'Appease', mnemonic: 'appy', definition: 'Soothe' },
      { word: 'Apprehension', mnemonic: 'pray+son', definition: 'Fear' },
      { word: 'Arbitrary', mnemonic: 'bee+teri', definition: 'Not based on reason, unfair' },
      { word: 'Archaic', mnemonic: 'arc+kick', definition: 'Old and no longer used' },
      { word: 'Ardent', mnemonic: 'dental', definition: 'Intense' },
      { word: 'Arrogance', mnemonic: 'Arrow+guns', definition: 'Pride' }
    ];
    resizeCanvas();
  });
