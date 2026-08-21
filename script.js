const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const formulationPortal = document.getElementById('formulation-portal');
const formulationFrame = document.getElementById('formulation-frame');
const formulationFrameShell = document.querySelector('.formulation-frame-shell');

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let t = 0;
let streaks = [];

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildStreaks();
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function buildStreaks() {
  streaks = Array.from({ length: Math.max(18, Math.floor(w / 75)) }, () => ({
    x: rand(-w * 0.15, w * 1.15),
    y: rand(h * 0.1, h * 0.85),
    len: rand(80, 240),
    speed: rand(0.25, 0.8),
    alpha: rand(0.04, 0.14),
  }));
}

function project(x, y, z) {
  const depth = 980;
  const scale = depth / (z + depth);
  return {
    x: w / 2 + x * scale,
    y: h / 2 + y * scale,
    s: scale,
  };
}

function quadPoints(rect, y, z, sx = 1, sz = 1) {
  const hw = rect.w * 0.5 * sx;
  const hd = rect.d * 0.5 * sz;
  return [
    project(-hw + rect.x, y, -hd + z),
    project(hw + rect.x, y, -hd + z),
    project(hw + rect.x, y, hd + z),
    project(-hw + rect.x, y, hd + z),
  ];
}

function drawQuad(points, alpha = 0.5, width = 1) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.stroke();
}

function drawGrid(rect, y, z, rows, cols, alpha) {
  const p = quadPoints(rect, y, z);
  drawQuad(p, alpha, 1.1);

  for (let i = 1; i < cols; i++) {
    const u = i / cols;
    const topX = p[0].x + (p[1].x - p[0].x) * u;
    const topY = p[0].y + (p[1].y - p[0].y) * u;
    const botX = p[3].x + (p[2].x - p[3].x) * u;
    const botY = p[3].y + (p[2].y - p[3].y) * u;
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.36})`;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.lineTo(botX, botY);
    ctx.stroke();
  }

  for (let j = 1; j < rows; j++) {
    const v = j / rows;
    const leftX = p[0].x + (p[3].x - p[0].x) * v;
    const leftY = p[0].y + (p[3].y - p[0].y) * v;
    const rightX = p[1].x + (p[2].x - p[1].x) * v;
    const rightY = p[1].y + (p[2].y - p[1].y) * v;
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.36})`;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();
  }
}

function drawExtruded(rect, y, z, height, rows, cols, alpha) {
  const top = quadPoints(rect, y, z);
  const bottom = quadPoints(rect, y + height, z);
  drawQuad(top, alpha, 1.05);
  drawQuad(bottom, alpha * 0.8, 0.95);

  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(top[i].x, top[i].y);
    ctx.lineTo(bottom[i].x, bottom[i].y);
    ctx.stroke();
  }

  for (let i = 1; i < cols; i++) {
    const u = i / cols;
    const a = {
      x: top[0].x + (top[1].x - top[0].x) * u,
      y: top[0].y + (top[1].y - top[0].y) * u,
    };
    const b = {
      x: top[3].x + (top[2].x - top[3].x) * u,
      y: top[3].y + (top[2].y - top[3].y) * u,
    };
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.22})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (let j = 1; j < rows; j++) {
    const v = j / rows;
    const a = {
      x: top[0].x + (top[3].x - top[0].x) * v,
      y: top[0].y + (top[3].y - top[0].y) * v,
    };
    const b = {
      x: top[1].x + (top[2].x - top[1].x) * v,
      y: top[1].y + (top[2].y - top[1].y) * v,
    };
    ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.22})`;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawConnector(x, topY, botY, z, alpha) {
  const a = project(x, topY, z);
  const b = project(x, botY, z);
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSpeedLines() {
  for (const s of streaks) {
    s.x += s.speed;
    if (s.x - s.len > w + 20) s.x = -s.len - rand(0, 120);
    ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.len, s.y);
    ctx.stroke();
  }
}

function drawCentralPulse(cy) {
  const cx = w * 0.5;
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 160);
  g.addColorStop(0, 'rgba(255,255,255,0.92)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.30)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 160, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const r = 58 + i * 22 + Math.sin(t * 1.2 + i) * 4;
    ctx.strokeStyle = `rgba(255,255,255,${0.16 - i * 0.03})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.75, r * 0.4, -0.03, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLayerStack() {
  const osc = Math.sin(t * 0.9) * 8;

  const base = { x: 0, w: 980, d: 430 };
  const mid = { x: 0, w: 860, d: 280 };
  const top = { x: 0, w: 1040, d: 390 };
  const inset = { x: 0, w: 610, d: 175 };

  const y0 = 280 + osc * 0.3;
  const y1 = 82 + osc * 0.55;
  const y2 = -118 + osc * 0.75;
  const y3 = -320 + osc;

  drawGrid(base, y0, 120, 14, 18, 0.62);
  drawGrid(mid, y1, 36, 8, 12, 0.62);
  drawGrid(top, y3, -42, 16, 18, 0.62);
  drawGrid(inset, y3 - 6, -22, 3, 6, 0.86);

  const blocks = [];
  for (let i = -4; i <= 3; i++) {
    blocks.push({ x: i * 118 - 12, w: 92, d: 106 });
  }
  blocks.forEach((b, i) => {
    drawExtruded(b, y1 + 2, 34, 62, 5, 5, i % 3 === 0 ? 0.66 : 0.5);
  });

  const rightSmallTop = [
    { x: 360, w: 42, d: 56 }, { x: 412, w: 42, d: 56 }, { x: 464, w: 42, d: 56 }
  ];
  rightSmallTop.forEach(b => drawExtruded(b, y1 + 6, 30, 38, 3, 2, 0.48));

  const fins = [];
  for (let i = -24; i <= 24; i++) {
    if (Math.abs(i) < 2) continue;
    fins.push({ x: i * 22, w: 12, d: 76 });
  }
  fins.forEach((b, idx) => {
    drawExtruded(b, y2 + 16, 16, 86 + (idx % 5) * 3, 4, 1, 0.34);
  });

  const rightMid = [];
  for (let i = 0; i < 4; i++) rightMid.push({ x: 390 + i * 34, w: 22, d: 72 });
  const leftMid = [];
  for (let i = 0; i < 4; i++) leftMid.push({ x: -468 + i * 34, w: 22, d: 72 });
  [...rightMid, ...leftMid].forEach(b => drawExtruded(b, y2 + 20, 14, 66, 4, 1, 0.5));

  [-430, -250, -70, 110, 290, 470].forEach(x => drawConnector(x, y3, y1 + 62, 26, 0.24));
  [-410, -230, -50, 130, 310, 490].forEach(x => drawConnector(x, y1 + 10, y0, 78, 0.22));

  const glowY = project(0, y2 + 54, 18).y;
  drawCentralPulse(glowY);

  const sweep = (Math.sin(t * 0.75) * 0.5 + 0.5);
  const topPts = quadPoints(top, y3, -42);
  const left = topPts[0].x + (topPts[1].x - topPts[0].x) * sweep;
  const bottom = topPts[3].x + (topPts[2].x - topPts[3].x) * sweep;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, topPts[0].y + (topPts[3].y - topPts[0].y) * 0.02);
  ctx.lineTo(bottom, topPts[3].y + (topPts[0].y - topPts[3].y) * -0.02);
  ctx.stroke();
}

function animate() {
  t += 0.016;
  ctx.clearRect(0, 0, w, h);
  drawSpeedLines();
  drawLayerStack();
  requestAnimationFrame(animate);
}

function openFormulation(event) {
  if (event) event.preventDefault();
  document.body.classList.add('formulation-open');
  formulationPortal.setAttribute('aria-hidden', 'false');
}

function closeFormulation() {
  document.body.classList.remove('formulation-open');
  formulationPortal.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll('[data-open-formulation]').forEach((control) => {
  control.addEventListener('click', openFormulation);
});

document.querySelectorAll('[data-close-formulation]').forEach((control) => {
  control.addEventListener('click', closeFormulation);
});

formulationFrame.addEventListener('load', () => {
  formulationFrameShell.classList.add('is-loaded');
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('formulation-open')) {
    closeFormulation();
  }
});

window.addEventListener('resize', resize);
resize();
animate();
