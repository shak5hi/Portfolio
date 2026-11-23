// The stack pit at the bottom of a case study: when you reach it, one chip
// per tool in the project tumbles in from above and piles up on the floor of
// the page. They come in all sorts of shapes (coins, tiles, pills, nuts,
// tickets) and sizes. Run the mouse through the pile and they get knocked
// about; you can also grab one and throw it.
// Physics by matter-js. The chips are plain DOM elements moved by transform.

import Matter from 'matter-js';
import { STACK } from './stack.js';

const { Engine, Bodies, Body, Composite, Constraint, Sleeping, Query } = Matter;

// the shapes, in turn: w and h are the chip's box as a share of the base
// size d; body() makes the matching physics shape
const SHAPES = [
  { name: 'coin', w: 1, h: 1, body: (x, y, w, h, o) => Bodies.circle(x, y, w / 2, o) },
  { name: 'tile', w: 0.92, h: 0.92, body: (x, y, w, h, o) => Bodies.rectangle(x, y, w, h, { ...o, chamfer: { radius: w * 0.16 } }) },
  { name: 'pill', w: 1.7, h: 0.7, body: (x, y, w, h, o) => Bodies.rectangle(x, y, w, h, { ...o, chamfer: { radius: h * 0.49 } }) },
  // matter's hexagon has a point at the top and bottom: 2r tall, about 1.73r wide
  { name: 'nut', w: 0.98, h: 1.13, body: (x, y, w, h, o) => Bodies.polygon(x, y, 6, h / 2, o) },
  { name: 'ticket', w: 1.5, h: 0.68, body: (x, y, w, h, o) => Bodies.rectangle(x, y, w, h, { ...o, chamfer: { radius: 6 } }) },
];
// paper colours for the chips, in turn (light brand icons always go on ink)
const PAPERS = ['#f8f5ee', '#dfe6fb', '#efe3c8', '#f8f5ee', '#e4ead9'];
// a little variety in size, so the pile isn't a row of twins
const SIZES = [1, 1.14, 0.88, 1.06, 0.94, 1.2, 0.9];

// light brand colours (DuckDB yellow etc.) would vanish on paper: put those on ink
function isLight(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.72;
}

function chipFor(key, i) {
  const s = STACK[key];
  if (!s) return null;
  const color = s.icon ? `#${s.icon.hex}` : s.color;
  const shape = SHAPES[i % SHAPES.length];
  const dark = isLight(color) || i % 7 === 3; // every so often, an ink one
  const chip = document.createElement('div');
  chip.className = `chip chip--${shape.name}` + (dark ? ' chip--dark' : '');
  if (!dark) chip.style.background = PAPERS[i % PAPERS.length];
  chip.setAttribute('aria-hidden', 'true');
  chip.dataset.cursor = s.name;
  chip.innerHTML = s.icon
    ? `<svg class="chip__icon" viewBox="0 0 24 24"><path fill="${color}" d="${s.icon.path}"/></svg><span class="chip__name">${s.name}</span>`
    : `<span class="chip__mono" style="color:${color}">${s.mono}</span><span class="chip__name">${s.name}</span>`;
  return { chip, name: s.name, shape, size: SIZES[i % SIZES.length] };
}

export function initPit(section, keys, { reduce = false } = {}) {
  const box = section.querySelector('.pit__box');
  const list = section.querySelector('.pit__list');
  const items = keys.map((k, i) => chipFor(k, i)).filter(Boolean);

  // a real list for screen readers; the chips themselves are decoration
  list.innerHTML = items.map((it) => `<li>${it.name}</li>`).join('');
  items.forEach((it) => box.appendChild(it.chip));

  if (reduce) {
    section.classList.add('is-static');
    return;
  }

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1.1;
  let W = 0;
  let H = 0;
  let d = 96; // chip diameter
  let walls = [];
  let ceiling = null;
  let bodies = [];
  let dropped = false;
  let running = false;
  let visible = false;
  let last = 0;

  const measure = () => {
    W = box.clientWidth;
    H = box.clientHeight;
    // as big as looks good, but small enough that they all fit in a loose pile
    const area = items.reduce((a, it) => a + it.shape.w * it.shape.h * it.size * it.size, 0) / items.length;
    const fit = Math.sqrt((0.4 * W * H) / items.length / area);
    d = Math.round(Math.max(58, Math.min(116, fit, W / 5)));
    box.style.setProperty('--d', `${d}px`);
  };

  const buildWalls = () => {
    if (walls.length) Composite.remove(engine.world, walls);
    const t = 400;
    const opts = { isStatic: true, friction: 0.4, restitution: 0.2 };
    walls = [
      Bodies.rectangle(W / 2, H + t / 2, W + t * 2, t, opts), // floor
      Bodies.rectangle(-t / 2, H / 2 - H, t, H * 4, opts), // left
      Bodies.rectangle(W + t / 2, H / 2 - H, t, H * 4, opts), // right
    ];
    Composite.add(engine.world, walls);
    if (ceiling) {
      Composite.remove(engine.world, ceiling);
      ceiling = null;
    }
  };

  const drop = () => {
    dropped = true;
    bodies = items.map((it, i) => {
      const w = d * it.shape.w * it.size;
      const h = d * it.shape.h * it.size;
      it.chip.style.width = `${w}px`;
      it.chip.style.height = `${h}px`;
      const x = w / 2 + Math.random() * Math.max(1, W - w);
      const y = -d * (0.8 + i * 0.55) - Math.random() * d;
      const b = it.shape.body(x, y, w, h, {
        restitution: 0.42,
        friction: 0.12,
        frictionAir: 0.008,
        density: 0.002,
      });
      Body.setAngle(b, (Math.random() - 0.5) * 1.2);
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.18);
      b.plugin.el = it.chip;
      b.plugin.w = w;
      b.plugin.h = h;
      it.chip.classList.add('is-live');
      return b;
    });
    Composite.add(engine.world, bodies);
    start();
  };

  // once everything has fallen in, close the lid so nothing gets thrown out
  const maybeCloseLid = () => {
    if (ceiling || !bodies.every((b) => b.position.y > d * 0.6)) return;
    ceiling = Bodies.rectangle(W / 2, -200, W * 3, 400, { isStatic: true });
    Composite.add(engine.world, ceiling);
  };

  const paint = () => {
    for (const b of bodies) {
      const { x, y } = b.position;
      const { w, h } = b.plugin;
      b.plugin.el.style.transform = `translate3d(${(x - w / 2).toFixed(1)}px, ${(y - h / 2).toFixed(1)}px, 0) rotate(${b.angle.toFixed(3)}rad)`;
    }
  };

  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(1000 / 30, now - (last || now)) || 1000 / 60;
    last = now;
    Engine.update(engine, dt);
    maybeCloseLid();
    paint();
    // everything asleep and nobody holding anything: stop until poked
    if (!grab && bodies.length && bodies.every((b) => b.isSleeping)) {
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  };
  const start = () => {
    if (running || !visible) return;
    running = true;
    last = 0;
    requestAnimationFrame(tick);
  };
  const wakeAll = () => bodies.forEach((b) => Sleeping.set(b, false));

  /* ---- grabbing: a soft spring from the pointer to the chip ---- */
  let grab = null;
  const local = (e) => {
    const r = box.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  box.addEventListener('pointerdown', (e) => {
    const chip = e.target.closest('.chip');
    const body = chip && bodies.find((b) => b.plugin.el === chip);
    if (!body) return;
    e.preventDefault();
    chip.setPointerCapture(e.pointerId);
    chip.classList.add('is-held');
    const p = local(e);
    Sleeping.set(body, false);
    const c = Constraint.create({
      pointA: p,
      bodyB: body,
      pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
      stiffness: 0.12,
      damping: 0.08,
      length: 0,
    });
    Composite.add(engine.world, c);
    grab = { c, chip, id: e.pointerId };
    start();
  });
  /* ---- hovering: the pointer shoves whatever it runs into ---- */
  let lastP = null;
  const MAX = 13;
  const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));
  box.addEventListener('pointermove', (e) => {
    const p = local(e);
    const prev = lastP;
    lastP = p;
    if (grab && e.pointerId === grab.id) {
      grab.c.pointA = p;
      return;
    }
    if (!dropped || !prev || e.pointerType === 'touch') return;
    const vx = p.x - prev.x;
    const vy = p.y - prev.y;
    if (Math.abs(vx) + Math.abs(vy) < 0.5) return;
    // whatever is under the pointer, or what it just swept through
    const hit = Query.point(bodies, p).concat(Query.ray(bodies, prev, p, 8).map((c) => c.bodyA));
    const seen = new Set();
    for (const raw of hit) {
      const b = raw.parent || raw;
      if (seen.has(b) || !bodies.includes(b)) continue;
      seen.add(b);
      Sleeping.set(b, false);
      // pushed along with the pointer, popped up a little, set spinning
      Body.setVelocity(b, { x: clamp(b.velocity.x + vx * 0.35), y: clamp(b.velocity.y + vy * 0.35 - 2.5) });
      Body.setAngularVelocity(b, b.angularVelocity + vx * 0.006);
    }
    if (seen.size) start();
  });
  box.addEventListener('pointerleave', () => (lastP = null));
  const release = (e) => {
    if (!grab || e.pointerId !== grab.id) return;
    Composite.remove(engine.world, grab.c);
    grab.chip.classList.remove('is-held');
    grab = null;
  };
  box.addEventListener('pointerup', release);
  box.addEventListener('pointercancel', release);

  /* ---- start when it scrolls into view; pause when it leaves ---- */
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        running = false;
        return;
      }
      if (!dropped && entry.intersectionRatio >= 0.35) drop();
      else if (dropped) {
        wakeAll();
        start();
      }
    },
    { threshold: [0, 0.35] },
  );

  measure();
  buildWalls();
  io.observe(section);

  // keep the walls on the edges of the box when the window changes size
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      const oldD = d;
      measure();
      buildWalls();
      if (d !== oldD)
        bodies.forEach((b) => {
          const k = d / oldD;
          Body.scale(b, k, k);
          b.plugin.w *= k;
          b.plugin.h *= k;
          b.plugin.el.style.width = `${b.plugin.w}px`;
          b.plugin.el.style.height = `${b.plugin.h}px`;
        });
      bodies.forEach((b) => {
        const x = Math.max(d / 2, Math.min(W - d / 2, b.position.x));
        const y = Math.min(H - d / 2, b.position.y);
        Body.setPosition(b, { x, y });
      });
      wakeAll();
      start();
    }, 150);
  });
}
