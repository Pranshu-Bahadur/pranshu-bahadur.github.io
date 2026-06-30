const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let w = 0;
let h = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);
let stars = [];
let nodes = [];
let pulses = [];
let t = 0;

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  buildScene();
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function buildScene() {
  stars = Array.from({ length: Math.min(180, Math.floor((w * h) / 10000)) }, () => ({
    x: rand(0, w),
    y: rand(0, h),
    z: rand(0.2, 1),
    tw: rand(0, Math.PI * 2),
  }));

  const cols = Math.max(6, Math.floor(w / 170));
  const rows = Math.max(5, Math.floor(h / 170));
  nodes = [];

  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < cols; ix++) {
      nodes.push({
        x: ((ix + 0.5) / cols) * w + rand(-32, 32),
        y: ((iy + 0.5) / rows) * h + rand(-32, 32),
        r: rand(1.4, 3.2),
        phase: rand(0, Math.PI * 2),
      });
    }
  }

  pulses = Array.from({ length: 8 }, (_, i) => ({
    pathIndex: i,
    progress: rand(0, 1),
    speed: rand(0.0018, 0.0045),
  }));
}

function findNeighbors(index, maxDist) {
  const base = nodes[index];
  const out = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i === index) continue;
    const dx = nodes[i].x - base.x;
    const dy = nodes[i].y - base.y;
    const dist = Math.hypot(dx, dy);
    if (dist < maxDist) out.push({ i, dist });
  }
  out.sort((a, b) => a.dist - b.dist);
  return out.slice(0, 3);
}

function draw() {
  t += 0.016;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.42, Math.max(w, h) * 0.72);
  grad.addColorStop(0, 'rgba(10,18,34,0.08)');
  grad.addColorStop(0.45, 'rgba(7,10,20,0.14)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const s of stars) {
    const alpha = 0.2 + 0.7 * ((Math.sin(t * 1.6 + s.tw) + 1) * 0.5);
    ctx.fillStyle = `rgba(255,255,255,${0.18 * s.z + alpha * 0.18})`;
    ctx.fillRect(s.x, s.y, s.z * 1.8, s.z * 1.8);
  }

  ctx.lineWidth = 1;
  for (let i = 0; i < nodes.length; i++) {
    const ns = findNeighbors(i, Math.min(w, h) * 0.18);
    for (const n of ns) {
      const a = nodes[i];
      const b = nodes[n.i];
      const distAlpha = Math.max(0, 1 - n.dist / (Math.min(w, h) * 0.18));
      ctx.strokeStyle = `rgba(101,244,255,${0.045 + distAlpha * 0.08})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const glow = (Math.sin(t * 1.1 + node.phase) + 1) * 0.5;
    ctx.fillStyle = `rgba(101,244,255,${0.25 + glow * 0.3})`;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fill();
  }

  const usable = Math.max(1, nodes.length - 2);
  pulses.forEach((p, idx) => {
    p.progress += p.speed;
    if (p.progress >= 1) p.progress = 0;
    const aIdx = (p.pathIndex * 7 + idx * 5) % usable;
    const bIdx = (aIdx + 9) % usable;
    const a = nodes[aIdx];
    const b = nodes[bIdx];
    const x = a.x + (b.x - a.x) * p.progress;
    const y = a.y + (b.y - a.y) * p.progress;
    ctx.fillStyle = idx % 2 ? 'rgba(255,79,216,0.85)' : 'rgba(101,244,255,0.9)';
    ctx.shadowBlur = 16;
    ctx.shadowColor = idx % 2 ? 'rgba(255,79,216,0.9)' : 'rgba(101,244,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  const cx = w * 0.5;
  const cy = h * 0.48;
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((t * 0.045) + i * 1.2);
    ctx.strokeStyle = i === 1 ? 'rgba(255,184,77,0.08)' : 'rgba(143,117,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 220 + i * 60, 110 + i * 24, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  requestAnimationFrame(draw);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(draw);
