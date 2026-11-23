// Hand-drawn, animated system diagrams for the case studies, in the same blue
// ink as the rest of the site. Boxes and arrows wobble a little as if drawn
// by hand. They draw themselves in when the diagram scrolls into view, and
// then little dots keep running along the arrows to show the data moving.
//
// A diagram is just boxes and arrows on a 1000 x 600 sheet:
//   nodes: { id, x, y, w, h, label, sub, kind }
//          kind: 'box' (default) | 'hot' (filled blue) | 'db' (cylinder)
//                | 'ext' (dashed: outside services) | 'user' (rounded pill)
//   edges: { a, b, label, bend, back, dash, speed }
//          bend: how far the arrow curves (-0.4..0.4), back: dots run both ways
//   notes: { x, y, text, rot } handwritten asides

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

const NS = 'http://www.w3.org/2000/svg';
const W = 1000;
const H = 600;

/* ------------------------------ the diagrams ------------------------------ */

export const DIAGRAMS = {
  getmyhelp: {
    title: 'How a visitor gets through the gate',
    nodes: [
      { id: 'guard', x: 30, y: 50, w: 200, h: 84, label: 'Guard app', sub: 'logs visitor + photo', kind: 'user' },
      { id: 'admin', x: 30, y: 226, w: 200, h: 84, label: 'Admin console', sub: 'web' },
      { id: 'res', x: 30, y: 466, w: 200, h: 84, label: 'Resident app', sub: 'approve · deny', kind: 'user' },
      { id: 'fb', x: 390, y: 40, w: 220, h: 84, label: 'Firebase', sub: 'phone OTP · FCM push', kind: 'ext' },
      { id: 'api', x: 390, y: 236, w: 220, h: 128, label: 'FastAPI', sub: 'REST + 5 WebSocket feeds', kind: 'hot' },
      { id: 'db', x: 420, y: 450, w: 160, h: 120, label: 'Data', sub: 'visits · flats', kind: 'db' },
      { id: 'site', x: 770, y: 50, w: 200, h: 84, label: 'getmyhelp.in', sub: 'Next.js + R3F' },
      { id: 'vps', x: 770, y: 258, w: 200, h: 84, label: 'VPS', sub: 'Nginx · PM2' },
      { id: 'mail', x: 770, y: 466, w: 200, h: 84, label: 'SMTP mail', sub: 'contact forms', kind: 'ext' },
    ],
    edges: [
      { a: 'guard', b: 'api', label: 'new visitor', bend: 0.12 },
      { a: 'api', b: 'res', label: 'ding-dong!', bend: 0.32, speed: 1.4 },
      { a: 'res', b: 'api', label: 'let them in', bend: 0.32 },
      { a: 'admin', b: 'api', back: true },
      { a: 'fb', b: 'api', label: 'OTP token → JWT', back: true },
      { a: 'api', b: 'db', back: true },
      { a: 'vps', b: 'site', label: 'serves', back: true },
      { a: 'vps', b: 'mail', label: 'enquiries' },
    ],
    notes: [{ x: 640, y: 420, text: 'gate → phone → gate,\nin a few seconds', rot: -4 }],
  },

  bento: {
    title: 'From raw signals to one health score',
    nodes: [
      { id: 'gh', x: 30, y: 40, w: 170, h: 70, label: 'GitHub', sub: 'OAuth · webhooks', kind: 'ext' },
      { id: 'vc', x: 30, y: 150, w: 170, h: 70, label: 'Vercel', sub: 'deploys', kind: 'ext' },
      { id: 'se', x: 30, y: 260, w: 170, h: 70, label: 'Sentry', sub: 'errors', kind: 'ext' },
      { id: 'ing', x: 270, y: 135, w: 190, h: 100, label: 'Ingest jobs', sub: 'node-cron · webhooks' },
      { id: 'snap', x: 530, y: 120, w: 150, h: 130, label: 'Snapshots', sub: 'Supabase', kind: 'db' },
      { id: 'score', x: 760, y: 135, w: 210, h: 100, label: 'Scoring engine', sub: '5 rule sets → 0–100', kind: 'hot' },
      { id: 'pickle', x: 760, y: 360, w: 210, h: 90, label: 'Pickle', sub: 'Claude Haiku · cached' },
      { id: 'api', x: 520, y: 360, w: 170, h: 90, label: 'REST API', sub: 'Express' },
      { id: 'dash', x: 270, y: 360, w: 190, h: 90, label: 'Dashboard', sub: 'React + 3D landing', kind: 'user' },
      { id: 'mail', x: 520, y: 505, w: 170, h: 70, label: 'Monday email', sub: 'Resend', kind: 'ext' },
    ],
    edges: [
      { a: 'gh', b: 'ing', bend: -0.1 },
      { a: 'vc', b: 'ing' },
      { a: 'se', b: 'ing', bend: 0.1 },
      { a: 'ing', b: 'snap', label: 'timestamped' },
      { a: 'snap', b: 'score' },
      { a: 'score', b: 'pickle', label: 'scores' },
      { a: 'pickle', b: 'api', label: 'insights' },
      { a: 'api', b: 'dash', back: true },
      { a: 'api', b: 'mail', label: 'weekly' },
    ],
    notes: [{ x: 60, y: 450, text: 'ai runs on a schedule,\nnot per click → ~$0', rot: -5 }],
  },

  byteforge: {
    title: 'Is this the same shop?',
    nodes: [
      { id: 's1', x: 30, y: 110, w: 160, h: 80, label: 'Source 1', sub: 'reference · 1.7M', kind: 'ext' },
      { id: 's23', x: 30, y: 330, w: 160, h: 80, label: 'Source 2 + 3', sub: 'noisy · no ids', kind: 'ext' },
      { id: 'norm', x: 250, y: 215, w: 160, h: 95, label: 'Normalise', sub: 'rd · pvt · &' },
      { id: 'block', x: 460, y: 215, w: 160, h: 95, label: 'Blocking', sub: 'DuckDB · ≤ 20 / key', kind: 'hot' },
      { id: 'feat', x: 680, y: 215, w: 170, h: 95, label: 'Features', sub: '16 · rapidfuzz' },
      { id: 'xgb', x: 680, y: 430, w: 170, h: 95, label: 'XGBoost', sub: 'p(same shop)' },
      { id: 'thr', x: 460, y: 430, w: 160, h: 95, label: 'Threshold', sub: '0.63 · macro F0.5' },
      { id: 'out', x: 260, y: 420, w: 140, h: 120, label: 'Matches', kind: 'db' },
    ],
    edges: [
      { a: 's1', b: 'norm', bend: -0.1 },
      { a: 's23', b: 'norm', bend: 0.1 },
      { a: 'norm', b: 'block' },
      { a: 'block', b: 'feat', label: 'pairs' },
      { a: 'feat', b: 'xgb' },
      { a: 'xgb', b: 'thr' },
      { a: 'thr', b: 'out' },
    ],
    notes: [
      { x: 470, y: 70, text: '“Near SBI ATM” → “nr sbi atm”', rot: -3 },
      { x: 700, y: 140, text: 'precision > recall', rot: 4 },
    ],
  },

  footnote: {
    title: 'Where a piece of writing goes',
    nodes: [
      { id: 'you', x: 30, y: 80, w: 190, h: 84, label: 'Writers + readers', sub: 'the humans', kind: 'user' },
      { id: 'next', x: 300, y: 60, w: 240, h: 124, label: 'Next.js app', sub: '3D vinyl · editor · trails', kind: 'hot' },
      { id: 'api', x: 300, y: 330, w: 240, h: 110, label: 'Express 5 API', sub: 'auth · articles · billing' },
      { id: 'mongo', x: 60, y: 330, w: 150, h: 125, label: 'MongoDB', sub: 'Mongoose', kind: 'db' },
      { id: 'stripe', x: 660, y: 60, w: 230, h: 84, label: 'Stripe', sub: 'checkout · portal', kind: 'ext' },
      { id: 'gem', x: 660, y: 270, w: 230, h: 84, label: 'Gemini 2.5 Flash', sub: 'drafts · covers · music', kind: 'ext' },
      { id: 'tpl', x: 660, y: 450, w: 230, h: 84, label: 'Templates', sub: 'when the AI says no' },
    ],
    edges: [
      { a: 'you', b: 'next', back: true },
      { a: 'next', b: 'api', label: 'REST + JWT', back: true },
      { a: 'api', b: 'mongo', back: true },
      { a: 'api', b: 'gem', label: 'generate' },
      { a: 'api', b: 'tpl', label: 'rate limited?', dash: true, bend: 0.1 },
      { a: 'api', b: 'stripe', label: 'checkout', bend: -0.14 },
      { a: 'stripe', b: 'api', label: 'webhook', bend: -0.14 },
    ],
    notes: [{ x: 70, y: 520, text: 'a missing key turns a feature off,\nit doesn’t crash the server', rot: -3 }],
  },

  'dsa-odyssey': {
    title: 'The engine that notices',
    nodes: [
      { id: 'you', x: 30, y: 60, w: 180, h: 84, label: 'You', sub: 'solve today’s quest', kind: 'user' },
      { id: 'next', x: 290, y: 50, w: 230, h: 104, label: 'Next.js', sub: 'GameContext + reducer' },
      { id: 'api', x: 290, y: 270, w: 230, h: 96, label: 'Express', sub: 'routes → controllers → repos' },
      { id: 'db', x: 330, y: 445, w: 150, h: 125, label: 'SQLite', sub: 'one file', kind: 'db' },
      { id: 'rate', x: 640, y: 50, w: 250, h: 96, label: 'How did it feel?', sub: 'easy · just right · hard', kind: 'user' },
      { id: 'score', x: 640, y: 250, w: 250, h: 110, label: 'Struggle score', sub: '(hard + 0.4 · medium) / rated', kind: 'hot' },
      { id: 'focus', x: 640, y: 460, w: 250, h: 96, label: 'Focus zone', sub: '> 0.35 with ≥ 2 ratings' },
    ],
    edges: [
      { a: 'you', b: 'next' },
      { a: 'next', b: 'rate', label: 'after every problem' },
      { a: 'rate', b: 'score' },
      { a: 'score', b: 'focus' },
      { a: 'focus', b: 'api', bend: -0.1, speed: 0.8 },
      { a: 'next', b: 'api', label: 'JWT', back: true },
      { a: 'api', b: 'db', back: true },
    ],
    notes: [{ x: 505, y: 535, text: '+2 bonus problems\ntomorrow', rot: -6 }],
  },

  skillable: {
    title: 'One platform, a lot of moving parts',
    nodes: [
      { id: 'seek', x: 30, y: 90, w: 190, h: 84, label: 'Job seekers', sub: 'voice · keyboard', kind: 'user' },
      { id: 'emp', x: 30, y: 420, w: 190, h: 84, label: 'Employers', sub: 'post · review · hire', kind: 'user' },
      { id: 'fe', x: 280, y: 245, w: 200, h: 104, label: 'React app', sub: 'Vite · Zustand · Tailwind', kind: 'hot' },
      { id: 'drf', x: 520, y: 90, w: 200, h: 104, label: 'Django REST', sub: 'users · jobs · apps' },
      { id: 'ch', x: 520, y: 400, w: 200, h: 104, label: 'Channels', sub: 'Daphne · WebSockets' },
      { id: 'ai', x: 805, y: 40, w: 175, h: 104, label: 'AI service', sub: 'FastAPI', kind: 'ext' },
      { id: 'pg', x: 830, y: 225, w: 130, h: 120, label: 'Postgres', kind: 'db' },
      { id: 'redis', x: 830, y: 410, w: 130, h: 120, label: 'Redis', kind: 'db' },
    ],
    edges: [
      { a: 'seek', b: 'fe', back: true },
      { a: 'emp', b: 'fe', back: true },
      { a: 'fe', b: 'drf', label: 'REST · JWT', back: true },
      { a: 'fe', b: 'ch', label: 'interview rooms', back: true },
      { a: 'drf', b: 'ai', label: 'resumes' },
      { a: 'drf', b: 'pg', back: true },
      { a: 'ch', b: 'redis', back: true },
    ],
    notes: [{ x: 290, y: 545, text: 'six moving parts, one app. (see: where it broke)', rot: -2 }],
  },
};

/* -------------------------------- drawing -------------------------------- */

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const f = (n) => n.toFixed(1);

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};

// a line from a to b that wanders a touch, like a pen
function wobblyLine(r, [x1, y1], [x2, y2], amp = 1.6) {
  const mx = (x1 + x2) / 2 + (r() - 0.5) * amp * 2;
  const my = (y1 + y2) / 2 + (r() - 0.5) * amp * 2;
  return `Q${f(mx)} ${f(my)} ${f(x2 + (r() - 0.5) * amp)} ${f(y2 + (r() - 0.5) * amp)}`;
}

// a rectangle drawn in one go, corners slightly overshot
function sketchRect(r, x, y, w, h, round = 0) {
  if (round) {
    const k = Math.min(round, h / 2);
    return `M${f(x + k)} ${f(y + r())} L${f(x + w - k)} ${f(y + r() - 0.5)} Q${f(x + w + 1)} ${f(y)} ${f(x + w)} ${f(y + h / 2)} Q${f(x + w - 1)} ${f(y + h + 1)} ${f(x + w - k)} ${f(y + h)} L${f(x + k)} ${f(y + h + r() - 0.5)} Q${f(x - 1)} ${f(y + h)} ${f(x)} ${f(y + h / 2)} Q${f(x + 1)} ${f(y - 1)} ${f(x + k + 3)} ${f(y + 0.5)}`;
  }
  const o = () => (r() - 0.5) * 3;
  let d = `M${f(x - 3 + o())} ${f(y + o())}`;
  d += ' ' + wobblyLine(r, [x, y], [x + w + 2, y + o()]);
  d += ' ' + wobblyLine(r, [x + w, y], [x + w + o(), y + h + 2]);
  d += ' ' + wobblyLine(r, [x + w, y + h], [x - 2, y + h + o()]);
  d += ' ' + wobblyLine(r, [x, y + h], [x + o(), y - 4]);
  return d;
}

function cylinder(r, x, y, w, h) {
  const ry = Math.min(16, h * 0.14);
  const cx = x + w / 2;
  const top = `M${f(x)} ${f(y + ry)} A${f(w / 2)} ${f(ry)} 0 1 1 ${f(x + w)} ${f(y + ry)} A${f(w / 2)} ${f(ry)} 0 1 1 ${f(x)} ${f(y + ry)}`;
  const body = `M${f(x)} ${f(y + ry)} L${f(x + (r() - 0.5) * 2)} ${f(y + h - ry)} A${f(w / 2)} ${f(ry)} 0 0 0 ${f(x + w)} ${f(y + h - ry)} L${f(x + w + (r() - 0.5) * 2)} ${f(y + ry)}`;
  return { top, body, cx, labelY: y + ry * 2 + (h - ry * 2) / 2 };
}

// where an arrow leaves / meets a box: the side facing the other box
function anchor(n, toward) {
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  const dx = toward[0] - cx;
  const dy = toward[1] - cy;
  const gap = 10;
  if (Math.abs(dx) * n.h > Math.abs(dy) * n.w) {
    const sx = Math.sign(dx);
    return [cx + sx * (n.w / 2 + gap), cy + Math.max(-n.h / 3, Math.min(n.h / 3, dy * 0.15))];
  }
  const sy = Math.sign(dy);
  return [cx + Math.max(-n.w / 3, Math.min(n.w / 3, dx * 0.15)), cy + sy * (n.h / 2 + gap)];
}

function edgePath(na, nb, bend = 0) {
  const ca = [na.x + na.w / 2, na.y + na.h / 2];
  const cb = [nb.x + nb.w / 2, nb.y + nb.h / 2];
  const p1 = anchor(na, cb);
  const p2 = anchor(nb, ca);
  const mx = (p1[0] + p2[0]) / 2;
  const my = (p1[1] + p2[1]) / 2;
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const c = [mx - dy * bend, my + dx * bend];
  return { d: `M${f(p1[0])} ${f(p1[1])} Q${f(c[0])} ${f(c[1])} ${f(p2[0])} ${f(p2[1])}`, p1, p2, c };
}

function arrowHead([x, y], [cx, cy]) {
  const a = Math.atan2(y - cy, x - cx);
  const s = 13;
  const l = [x - s * Math.cos(a - 0.45), y - s * Math.sin(a - 0.45)];
  const r = [x - s * Math.cos(a + 0.45), y - s * Math.sin(a + 0.45)];
  return `M${f(l[0])} ${f(l[1])} L${f(x)} ${f(y)} L${f(r[0])} ${f(r[1])}`;
}

function multiline(parent, text, x, y, attrs, lh) {
  const t = el('text', { x, y, ...attrs }, parent);
  text.split('\n').forEach((line, i) => {
    const s = el('tspan', { x, dy: i ? lh : 0 }, t);
    s.textContent = line;
  });
  return t;
}

/* ------------------------------- render it ------------------------------- */

export function renderDiagram(host, key, { reduce = false } = {}) {
  const spec = DIAGRAMS[key];
  if (!spec) return null;
  const nodes = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  const r = rng(hash(key));

  const fig = document.createElement('figure');
  fig.className = 'diagram';
  const scroller = document.createElement('div');
  scroller.className = 'diagram__scroll';
  fig.appendChild(scroller);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'diagram__svg', role: 'img' });
  svg.setAttribute('aria-label', `${spec.title}. ${describe(spec)}`);
  scroller.appendChild(svg);

  const strokes = []; // everything that draws in
  const fades = []; // text that fades in after
  const runners = [];

  const gEdges = el('g', { class: 'diagram__edges' }, svg);
  const gNodes = el('g', { class: 'diagram__nodes' }, svg);
  const gDots = el('g', { class: 'diagram__dots' }, svg);
  const gText = el('g', { class: 'diagram__text' }, svg);

  // boxes
  spec.nodes.forEach((n) => {
    const kind = n.kind || 'box';
    const g = el('g', { class: `node node--${kind}` }, gNodes);
    let labelY = n.y + n.h / 2;
    if (kind === 'db') {
      const c = cylinder(r, n.x, n.y, n.w, n.h);
      el('path', { d: `${c.top} M${n.x} ${n.y + 16} L${n.x} ${n.y + n.h - 16} A${n.w / 2} 16 0 0 0 ${n.x + n.w} ${n.y + n.h - 16} L${n.x + n.w} ${n.y + 16}`, class: 'node__fill' }, g);
      strokes.push(el('path', { d: c.body, class: 'node__line' }, g));
      strokes.push(el('path', { d: c.top, class: 'node__line' }, g));
      labelY = c.labelY;
    } else {
      const round = kind === 'user' ? n.h / 2 : 0;
      el('rect', { x: n.x, y: n.y, width: n.w, height: n.h, rx: round || 3, class: 'node__fill' }, g);
      strokes.push(el('path', { d: sketchRect(r, n.x, n.y, n.w, n.h, round), class: 'node__line' }, g));
      // a second, fainter pass makes it look drawn rather than printed
      if (kind !== 'ext') strokes.push(el('path', { d: sketchRect(r, n.x + 1.5, n.y - 1, n.w - 2, n.h + 1, round), class: 'node__line node__line--ghost' }, g));
    }
    const hasSub = !!n.sub;
    const label = el('text', { x: n.x + n.w / 2, y: labelY + (hasSub ? -4 : 8), class: `node__label node__label--${kind}` }, gText);
    label.textContent = n.label;
    fades.push(label);
    if (hasSub) {
      const sub = el('text', { x: n.x + n.w / 2, y: labelY + 20, class: `node__sub node__sub--${kind}` }, gText);
      sub.textContent = n.sub;
      fades.push(sub);
    }
  });

  // arrows, their labels and the dots that run along them
  spec.edges.forEach((e, i) => {
    const na = nodes[e.a];
    const nb = nodes[e.b];
    if (!na || !nb) return;
    const { d, p1, p2, c } = edgePath(na, nb, e.bend || 0);
    const line = el('path', { d, class: `edge${e.dash ? ' edge--dash' : ''}` }, gEdges);
    if (!e.dash) strokes.push(line);
    else fades.push(line);
    const head = el('path', { d: arrowHead(p2, c), class: 'edge__head' }, gEdges);
    strokes.push(head);
    if (e.back) strokes.push(el('path', { d: arrowHead(p1, c), class: 'edge__head' }, gEdges));

    if (e.label) {
      // halfway along the curve, nudged off the line
      const mx = 0.25 * p1[0] + 0.5 * c[0] + 0.25 * p2[0];
      const my = 0.25 * p1[1] + 0.5 * c[1] + 0.25 * p2[1];
      const vertical = Math.abs(p2[1] - p1[1]) > Math.abs(p2[0] - p1[0]);
      const t = el('text', {
        x: f(mx + (vertical ? 12 : 0)),
        y: f(my + (vertical ? 6 : -12)),
        class: 'edge__label',
        'text-anchor': vertical ? 'start' : 'middle',
        transform: `rotate(${f((r() - 0.5) * 6)} ${f(mx)} ${f(my)})`,
      }, gText);
      t.textContent = e.label;
      fades.push(t);
    }

    if (!reduce) {
      const dur = (2.6 + r() * 1.4) / (e.speed || 1);
      const add = (reverse, delay) => {
        const dot = el('circle', { r: 5.5, class: 'dot' }, gDots);
        const m = el('animateMotion', {
          dur: `${f(dur)}s`,
          repeatCount: 'indefinite',
          path: d,
          begin: `${f(delay)}s`,
          calcMode: 'spline',
          keyTimes: '0;1',
          keySplines: '0.45 0 0.35 1',
          ...(reverse ? { keyPoints: '1;0' } : { keyPoints: '0;1' }),
        }, dot);
        runners.push({ dot, m });
      };
      add(false, i * 0.35);
      if (e.back) add(true, i * 0.35 + dur / 2);
    }
  });

  // handwritten asides
  (spec.notes || []).forEach((n) => {
    const t = multiline(gText, n.text, n.x, n.y, { class: 'diagram__note', transform: `rotate(${n.rot || 0} ${n.x} ${n.y})` }, 24);
    fades.push(t);
  });

  const cap = document.createElement('figcaption');
  cap.innerHTML = `<span class="diagram__fig">fig.</span> ${spec.title}`;
  fig.appendChild(cap);
  host.appendChild(fig);

  if (reduce) return fig;

  // hide until it scrolls in, then draw
  gsap.set(strokes, { drawSVG: '0%' });
  gsap.set(fades, { opacity: 0 });
  gsap.set(gDots, { opacity: 0 });
  gsap.set(svg.querySelectorAll('.node__fill'), { opacity: 0 });
  const tl = gsap.timeline({ paused: true });
  tl.to(svg.querySelectorAll('.node__fill'), { opacity: 1, duration: 0.6, stagger: 0.05 }, 0)
    .to(strokes, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.035 }, 0)
    .to(fades, { opacity: 1, duration: 0.5, stagger: 0.02 }, 0.6)
    .to(gDots, { opacity: 1, duration: 0.6 }, '-=0.3');
  ScrollTrigger.create({ trigger: fig, start: 'top 78%', once: true, onEnter: () => tl.play() });

  // the dots only need to run while you can see them
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) svg.unpauseAnimations?.();
    else svg.pauseAnimations?.();
  });
  io.observe(fig);
  return fig;
}

// a plain-text version of the diagram, for screen readers
function describe(spec) {
  const name = Object.fromEntries(spec.nodes.map((n) => [n.id, n.label]));
  return spec.edges
    .map((e) => `${name[e.a]} ${e.back ? 'and' : 'to'} ${name[e.b]}${e.label ? ` (${e.label})` : ''}`)
    .join('; ');
}
