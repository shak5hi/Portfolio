// The section drawing pad: freehand strokes in any colour and size, kept in
// drawing order, saved as an SVG the site can show (and animate) behind a
// section. A draft is kept in this browser so a refresh doesn't lose work.

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { drawIn } from './draw-in.js';

gsap.registerPlugin(DrawSVGPlugin);

const W = 1600;
const H = 900;
const NS = 'http://www.w3.org/2000/svg';
const DRAFT = 'section-drawing-draft';

const COLOURS = [
  ['blue', '#2152e3'],
  ['deep blue', '#1638a8'],
  ['ink', '#141414'],
  ['cream', '#ebe5d5'],
  ['white', '#ffffff'],
  ['red', '#e3352b'],
  ['orange', '#f08a24'],
  ['yellow', '#f2c230'],
  ['green', '#2e9b5f'],
  ['pink', '#f29bb8'],
  ['lilac', '#a98be8'],
  ['brown', '#8a5a3b'],
];
const BACKGROUNDS = [
  ['cream (page colour)', '#ebe5d5'],
  ['white', '#ffffff'],
  ['blue', '#2152e3'],
  ['ink', '#141414'],
  ['pink', '#f6d3dc'],
  ['sky', '#cfe0f5'],
];
const SIZES = [3, 7, 14, 26, 48, 90];

const $ = (s) => document.querySelector(s);
const pad = $('#pad');
const inkLayer = $('#ink');
const bgRect = $('#bg');
const status = $('#status');

let colour = COLOURS[0][1];
let size = SIZES[2];
let tool = 'pen';
let bg = BACKGROUNDS[0][1];
let strokes = []; // { color, size, points: [[x, y, t]] }
let undoStack = [];
let redoStack = [];

/* ---------- geometry ---------- */
function toSvg(e) {
  const pt = pad.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const p = pt.matrixTransform(pad.getScreenCTM().inverse());
  return [p.x, p.y];
}

const r1 = (n) => Math.round(n * 10) / 10;

function pathFor(points) {
  if (points.length === 1) return `M${r1(points[0][0])} ${r1(points[0][1])} l0.01 0`;
  let d = `M${r1(points[0][0])} ${r1(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const mx = (points[i][0] + points[i + 1][0]) / 2;
    const my = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q${r1(points[i][0])} ${r1(points[i][1])} ${r1(mx)} ${r1(my)}`;
  }
  const last = points[points.length - 1];
  return `${d} L${r1(last[0])} ${r1(last[1])}`;
}

/* ---------- render ---------- */
function makePath(s) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', pathFor(s.points));
  p.setAttribute('stroke', s.color);
  p.setAttribute('stroke-width', s.size);
  return p;
}

function render() {
  inkLayer.replaceChildren(...strokes.map(makePath));
  bgRect.setAttribute('fill', bg);
  update();
}

function update() {
  const has = strokes.length > 0;
  for (const id of ['clear', 'replay', 'save', 'download']) $('#' + id).disabled = !has;
  $('#undo').disabled = undoStack.length === 0;
  $('#redo').disabled = redoStack.length === 0;
  // keep the frame readable on dark backgrounds
  const dark = ['#2152e3', '#141414'].includes(bg);
  $('#guide').style.filter = dark ? 'invert(1)' : '';
  saveDraft();
}

/* ---------- history (snapshots of the stroke list; strokes never change) ---------- */
function commit(next, nextBg = bg) {
  undoStack.push({ strokes, bg });
  if (undoStack.length > 200) undoStack.shift();
  redoStack = [];
  strokes = next;
  bg = nextBg;
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push({ strokes, bg });
  ({ strokes, bg } = undoStack.pop());
  render();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push({ strokes, bg });
  ({ strokes, bg } = redoStack.pop());
  render();
}

/* ---------- drawing ---------- */
let current = null;
let currentPath = null;
let smooth = null;

pad.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  pad.setPointerCapture(e.pointerId);
  if (tool === 'erase') return eraseAt(e);
  if (tool === 'move') return startMove(e);
  const [x, y] = toSvg(e);
  smooth = [x, y];
  current = { color: colour, size, points: [[r1(x), r1(y), Math.round(performance.now())]] };
  currentPath = makePath(current);
  inkLayer.appendChild(currentPath);
});

pad.addEventListener('pointermove', (e) => {
  if (tool === 'move') return moveTo(e);
  if (tool === 'erase') {
    if (e.buttons) eraseAt(e);
    return;
  }
  if (!current) return;
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of events) {
    const [x, y] = toSvg(ev);
    smooth[0] += (x - smooth[0]) * 0.55;
    smooth[1] += (y - smooth[1]) * 0.55;
    const last = current.points[current.points.length - 1];
    if (Math.hypot(smooth[0] - last[0], smooth[1] - last[1]) < 2.2) continue;
    current.points.push([r1(smooth[0]), r1(smooth[1]), Math.round(performance.now())]);
  }
  currentPath.setAttribute('d', pathFor(current.points));
});

function endStroke() {
  if (!current) return;
  commit([...strokes, current]);
  current = null;
  currentPath = null;
  update();
}
pad.addEventListener('pointerup', endStroke);
pad.addEventListener('pointercancel', endStroke);

// the eraser removes whole strokes it touches
function eraseAt(e) {
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  if (!hit || hit.parentNode !== inkLayer) return;
  const i = [...inkLayer.children].indexOf(hit);
  if (i < 0) return;
  commit(strokes.filter((_, j) => j !== i));
  render();
}

/* ---------- controls ---------- */
function swatch(container, list, current, onPick) {
  container.replaceChildren(
    ...list.map(([name, value]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = value;
      b.title = name;
      b.setAttribute('aria-label', name);
      b.setAttribute('aria-pressed', String(value === current));
      b.addEventListener('click', () => {
        container.querySelectorAll('.swatch').forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        onPick(value);
      });
      return b;
    })
  );
}

function pickColour(value) {
  colour = value;
  setTool('pen');
}
swatch($('#swatches'), COLOURS, colour, pickColour);
$('#custom').addEventListener('input', (e) => {
  $('#swatches').querySelectorAll('.swatch').forEach((o) => o.setAttribute('aria-pressed', 'false'));
  pickColour(e.target.value);
});

swatch($('#bgs'), BACKGROUNDS, bg, (value) => {
  commit(strokes, value);
  render();
});

function renderSizes() {
  $('#sizes').replaceChildren(
    ...SIZES.map((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'size';
      b.setAttribute('aria-label', `pen size ${s}`);
      b.setAttribute('aria-pressed', String(s === size));
      const dot = document.createElement('span');
      const px = Math.max(3, Math.min(28, s * 0.3 + 2));
      dot.style.width = dot.style.height = `${px}px`;
      b.appendChild(dot);
      b.addEventListener('click', () => {
        size = s;
        renderSizes();
        setTool('pen');
      });
      return b;
    })
  );
}
renderSizes();

function setTool(t) {
  tool = t;
  $('#tool-pen').setAttribute('aria-pressed', String(t === 'pen'));
  $('#tool-erase').setAttribute('aria-pressed', String(t === 'erase'));
  $('#tool-move').setAttribute('aria-pressed', String(t === 'move'));
  pad.classList.toggle('erasing', t === 'erase');
  pad.classList.toggle('moving', t === 'move');
}
$('#tool-pen').addEventListener('click', () => setTool('pen'));
$('#tool-erase').addEventListener('click', () => setTool('erase'));
$('#tool-move').addEventListener('click', () => setTool('move'));

$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);
$('#clear').addEventListener('click', () => {
  commit([]);
  render();
});
$('#guide-toggle').addEventListener('click', (e) => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  $('#guide').style.display = on ? '' : 'none';
});

// the replay always fits in about five seconds, the same as on the site
let replaying = null;
$('#replay').addEventListener('click', () => {
  replaying?.progress(1).kill();
  replaying = drawIn(inkLayer.children, { total: 5 });
});

window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  } else if (mod && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  } else if (e.key === 'e') setTool('erase');
  else if (e.key === 'p') setTool('pen');
  else if (e.key === 'm' && ref.src) setTool('move');
  else if (e.key === '[' || e.key === ']') {
    const i = SIZES.indexOf(size) + (e.key === ']' ? 1 : -1);
    size = SIZES[Math.max(0, Math.min(SIZES.length - 1, i))];
    renderSizes();
  }
});

/* ---------- reference image: a see-through guide to trace over ---------- */
// Never part of the drawing: export builds only from the strokes.
const REF_STORE = 'section-drawing-reference';
const refImg = $('#ref');
const ref = { src: '', w: 0, h: 0, x: 0, y: 0, scale: 1, opacity: 0.35, onTop: false, hidden: false };

function fitSize() {
  // the largest size that shows the whole image inside the frame
  const k = Math.min(W / ref.w, H / ref.h);
  return [ref.w * k, ref.h * k];
}

function placeRef() {
  if (!ref.src) {
    refImg.setAttribute('href', '');
    $('#ref-controls').hidden = true;
    $('#ref-remove').disabled = true;
    $('#tool-move').disabled = true;
    if (tool === 'move') setTool('pen');
    return;
  }
  const [fw, fh] = fitSize();
  const w = fw * ref.scale;
  const h = fh * ref.scale;
  refImg.setAttribute('href', ref.src);
  refImg.setAttribute('width', r1(w));
  refImg.setAttribute('height', r1(h));
  refImg.setAttribute('x', r1(W / 2 - w / 2 + ref.x));
  refImg.setAttribute('y', r1(H / 2 - h / 2 + ref.y));
  refImg.style.opacity = ref.opacity;
  refImg.style.display = ref.hidden ? 'none' : '';
  (ref.onTop ? $('#ref-above') : $('#ref-below')).appendChild(refImg);
  $('#ref-controls').hidden = false;
  $('#ref-remove').disabled = false;
  $('#tool-move').disabled = false;
  $('#ref-opacity').value = Math.round(ref.opacity * 100);
  $('#ref-scale').value = Math.round(ref.scale * 100);
  $('#ref-top').setAttribute('aria-pressed', String(ref.onTop));
  $('#ref-hide').setAttribute('aria-pressed', String(ref.hidden));
  $('#ref-hide').textContent = ref.hidden ? 'show' : 'hide';
}

function saveRef() {
  try {
    if (ref.src) localStorage.setItem(REF_STORE, JSON.stringify(ref));
    else localStorage.removeItem(REF_STORE);
  } catch {
    // too big to keep between visits; it still works for this session
  }
}

// shrink big photos so they stay quick and fit in the browser's storage
function loadRefFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const max = 1800;
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const webp = c.toDataURL('image/webp', 0.82);
    Object.assign(ref, {
      src: webp.startsWith('data:image/webp') ? webp : c.toDataURL('image/jpeg', 0.85),
      w: c.width,
      h: c.height,
      x: 0,
      y: 0,
      scale: 1,
      hidden: false,
    });
    URL.revokeObjectURL(url);
    placeRef();
    saveRef();
    status.textContent = 'reference image loaded. it won’t be saved into your drawing.';
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    status.textContent = 'that file could not be opened as an image.';
  };
  img.src = url;
}

$('#ref-file').addEventListener('change', (e) => {
  loadRefFile(e.target.files[0]);
  e.target.value = '';
});
$('#ref-remove').addEventListener('click', () => {
  ref.src = '';
  placeRef();
  saveRef();
});
$('#ref-opacity').addEventListener('input', (e) => {
  ref.opacity = e.target.value / 100;
  placeRef();
  saveRef();
});
$('#ref-scale').addEventListener('input', (e) => {
  ref.scale = e.target.value / 100;
  placeRef();
  saveRef();
});
$('#ref-top').addEventListener('click', () => {
  ref.onTop = !ref.onTop;
  placeRef();
  saveRef();
});
$('#ref-hide').addEventListener('click', () => {
  ref.hidden = !ref.hidden;
  placeRef();
  saveRef();
});
$('#ref-fit').addEventListener('click', () => {
  Object.assign(ref, { x: 0, y: 0, scale: 1 });
  placeRef();
  saveRef();
});

// drop or paste an image straight onto the canvas
const padWrap = $('.pad-wrap');
padWrap.addEventListener('dragover', (e) => {
  e.preventDefault();
  padWrap.classList.add('drop');
});
padWrap.addEventListener('dragleave', () => padWrap.classList.remove('drop'));
padWrap.addEventListener('drop', (e) => {
  e.preventDefault();
  padWrap.classList.remove('drop');
  loadRefFile(e.dataTransfer.files[0]);
});
window.addEventListener('paste', (e) => {
  const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
  if (item) loadRefFile(item.getAsFile());
});

// the move tool drags the reference image around
let drag = null;
function startMove(e) {
  const [x, y] = toSvg(e);
  drag = { x, y, ox: ref.x, oy: ref.y };
}
function moveTo(e) {
  if (!drag) return;
  const [x, y] = toSvg(e);
  ref.x = drag.ox + (x - drag.x);
  ref.y = drag.oy + (y - drag.y);
  placeRef();
}
function endMove() {
  if (!drag) return;
  drag = null;
  saveRef();
}
pad.addEventListener('pointerup', endMove);
pad.addEventListener('pointercancel', endMove);

try {
  const saved = JSON.parse(localStorage.getItem(REF_STORE) || 'null');
  if (saved && saved.src) Object.assign(ref, saved);
} catch {}
placeRef();

/* ---------- export ---------- */
function exportSvg() {
  const paths = strokes
    .map((s, i) => `  <path class="stroke" data-i="${i}" data-ms="${s.points[s.points.length - 1][2] - s.points[0][2]}" d="${pathFor(s.points)}" stroke="${s.color}" stroke-width="${s.size}"/>`)
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <rect class="bg" x="0" y="0" width="${W}" height="${H}" fill="${bg}"/>
${paths}
</svg>
`;
}

function exportData() {
  const t0 = strokes[0]?.points[0][2] ?? 0;
  return {
    width: W,
    height: H,
    background: bg,
    strokes: strokes.map((s) => ({ color: s.color, size: s.size, points: s.points.map(([x, y, t]) => [x, y, t - t0]) })),
  };
}

$('#download').addEventListener('click', () => {
  const blob = new Blob([exportSvg()], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${$('#name').value || 'drawing'}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#save').addEventListener('click', async () => {
  $('#save').disabled = true;
  status.textContent = 'saving…';
  try {
    const res = await fetch('/__save-drawing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('#name').value, svg: exportSvg(), data: exportData() }),
    });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error);
    status.textContent = `saved to ${out.file}. tell claude it's ready!`;
  } catch (err) {
    status.textContent = `couldn't save (${err.message}). try "download svg" instead.`;
  } finally {
    $('#save').disabled = strokes.length === 0;
  }
});

/* ---------- draft kept in this browser ---------- */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT, JSON.stringify({ bg, strokes }));
  } catch {}
}
try {
  const draft = JSON.parse(localStorage.getItem(DRAFT) || 'null');
  if (draft && Array.isArray(draft.strokes)) {
    strokes = draft.strokes;
    bg = draft.bg || bg;
    swatch($('#bgs'), BACKGROUNDS, bg, (value) => {
      commit(strokes, value);
      render();
    });
  }
} catch {}
render();
