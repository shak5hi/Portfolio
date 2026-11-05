// The signing pad: record handwriting as ordered strokes, smooth them, and
// export an SVG whose paths keep the writing order (so it can be redrawn).

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

const INK = '#1d4b88';
const svg = document.getElementById('pad');
const inkLayer = document.getElementById('ink');
const wrap = document.getElementById('pad-wrap');
const status = document.getElementById('status');
const btn = (id) => document.getElementById(id);

let size = 10;
const strokes = []; // { size, points: [[x, y, t], ...] }
let current = null;
let currentPath = null;

/* ---------- geometry ---------- */
function toSvg(e) {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [p.x, p.y];
}

const r1 = (n) => Math.round(n * 10) / 10;

// Smooth path through points: quadratic curves through midpoints.
function pathFor(points, dx = 0, dy = 0) {
  const p = points.map(([x, y]) => [x - dx, y - dy]);
  if (p.length === 1) return `M${r1(p[0][0])} ${r1(p[0][1])} l0.01 0`;
  let d = `M${r1(p[0][0])} ${r1(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${r1(p[i][0])} ${r1(p[i][1])} ${r1(mx)} ${r1(my)}`;
  }
  const last = p[p.length - 1];
  return `${d} L${r1(last[0])} ${r1(last[1])}`;
}

/* ---------- drawing ---------- */
svg.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  svg.setPointerCapture(e.pointerId);
  const [x, y] = toSvg(e);
  current = { size, points: [[x, y, performance.now()]], smooth: [x, y] };
  currentPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  currentPath.setAttribute('stroke-width', size);
  inkLayer.appendChild(currentPath);
  currentPath.setAttribute('d', pathFor(current.points));
  wrap.classList.add('has-ink');
});

svg.addEventListener('pointermove', (e) => {
  if (!current) return;
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of events) {
    const [x, y] = toSvg(ev);
    // light smoothing so a shaky mouse still reads as a pen
    const s = current.smooth;
    s[0] += (x - s[0]) * 0.55;
    s[1] += (y - s[1]) * 0.55;
    const last = current.points[current.points.length - 1];
    if (Math.hypot(s[0] - last[0], s[1] - last[1]) < 2) continue;
    current.points.push([s[0], s[1], performance.now()]);
  }
  currentPath.setAttribute('d', pathFor(current.points));
});

function endStroke() {
  if (!current) return;
  delete current.smooth;
  strokes.push(current);
  current = null;
  currentPath = null;
  update();
}
svg.addEventListener('pointerup', endStroke);
svg.addEventListener('pointercancel', endStroke);

/* ---------- controls ---------- */
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => {
    size = Number(b.dataset.size);
    document.querySelectorAll('[data-size]').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  });
});

btn('undo').addEventListener('click', () => {
  strokes.pop();
  inkLayer.lastElementChild?.remove();
  update();
});

btn('clear').addEventListener('click', () => {
  strokes.length = 0;
  inkLayer.innerHTML = '';
  update();
});

btn('replay').addEventListener('click', () => {
  replay(inkLayer.querySelectorAll('path'));
  const big = document.querySelectorAll('#preview-big path');
  replay(big);
});

btn('download').addEventListener('click', () => {
  const blob = new Blob([exportSvg()], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'logo.svg';
  a.click();
  URL.revokeObjectURL(a.href);
});

btn('save').addEventListener('click', async () => {
  btn('save').disabled = true;
  status.textContent = 'saving…';
  try {
    const res = await fetch('/__save-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ svg: exportSvg(), strokes: normalised() }),
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error);
    status.textContent = 'saved! it\'s in public/logo.svg. tell claude it\'s ready.';
  } catch (err) {
    status.textContent = `couldn't save (${err.message}). use "download svg" and put the file in the public folder instead.`;
  } finally {
    btn('save').disabled = strokes.length === 0;
  }
});

function replay(paths) {
  const list = [...paths];
  if (!list.length) return;
  const tl = gsap.timeline();
  list.forEach((p, i) => {
    const s = strokes[i];
    const took = s ? (s.points[s.points.length - 1][2] - s.points[0][2]) / 1000 : 0.4;
    tl.fromTo(p, { drawSVG: '0%' }, { drawSVG: '100%', duration: gsap.utils.clamp(0.12, 1.4, took), ease: 'none' }, i ? '+=0.06' : 0);
  });
}

/* ---------- export ---------- */
function bounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of strokes) {
    const h = s.size / 2;
    for (const [x, y] of s.points) {
      minX = Math.min(minX, x - h);
      minY = Math.min(minY, y - h);
      maxX = Math.max(maxX, x + h);
      maxY = Math.max(maxY, y + h);
    }
  }
  const pad = 6;
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}

// Strokes moved to the logo's own origin, with times relative to the start.
function normalised() {
  const b = bounds();
  const t0 = strokes[0]?.points[0][2] ?? 0;
  return {
    width: r1(b.w),
    height: r1(b.h),
    strokes: strokes.map((s) => ({
      size: s.size,
      points: s.points.map(([x, y, t]) => [r1(x - b.x), r1(y - b.y), Math.round(t - t0)]),
    })),
  };
}

function exportSvg() {
  const b = bounds();
  const paths = strokes
    .map((s, i) => `  <path class="stroke" data-i="${i}" d="${pathFor(s.points, b.x, b.y)}" stroke-width="${s.size}"/>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r1(b.w)} ${r1(b.h)}" fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Shakshi">
${paths}
</svg>
`;
}

function update() {
  const has = strokes.length > 0;
  ['undo', 'clear', 'replay', 'download', 'save'].forEach((id) => (btn(id).disabled = !has));
  wrap.classList.toggle('has-ink', has);
  const out = has ? exportSvg() : '';
  document.getElementById('preview-nav').innerHTML = out;
  document.getElementById('preview-big').innerHTML = out;
  status.textContent = '';
}
