// A custom cursor: a small blue flower (the same one tucked into the hair
// in the photo) that turns as it moves. Behind it, a short ink tail that
// curls after it like a brush stroke, and when it moves fast it sheds a few
// petals that tumble and fade. It grows over things you can press and shows
// a little tag over things that have something to say.
// Mouse and trackpad only; touch keeps its own.

import { gsap } from 'gsap';

const BLUE = '#2152e3';

// tail
const SEGMENTS = 9; // points in the tail; fewer = shorter
const FOLLOW = 0.42; // how quickly each point catches the one ahead (per 60fps frame)
const HEAD_WIDTH = 5.5; // px, at the flower; tapers to nothing

// petals
const PETAL_EVERY = 40; // px of travel between petals
const PETAL_LIFE = 950; // ms
const MAX_PETALS = 18;

export function initCursor({ reduce = false } = {}) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  document.documentElement.classList.add('has-cursor');

  const petalsSvg = Array.from({ length: 5 }, (_, i) => `<ellipse cx="0" cy="-9" rx="5.4" ry="9" transform="rotate(${i * 72})"/>`).join('');
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <svg class="cursor__flower" viewBox="-20 -20 40 40">
      <g fill="${BLUE}">${petalsSvg}</g>
      <circle r="4.2" class="cursor__eye"/>
    </svg>
    <span class="cursor__tag"></span>`;
  document.body.appendChild(el);

  const flower = el.querySelector('.cursor__flower');
  const tag = el.querySelector('.cursor__tag');

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const moveX = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'power3' });
  const moveY = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'power3' });
  gsap.set(el, { x: pos.x, y: pos.y, opacity: 0 });

  /* ---------- what the cursor is over ---------- */
  let state = 'none';
  const setState = (next, label = '') => {
    if (next === state && (!label || tag.textContent === label)) return;
    state = next;
    if (label) tag.textContent = label; // keep the old words while it fades out
    el.classList.toggle('has-tag', !!label);
    gsap.to(flower, { scale: next === 'press' ? 1.9 : 1, duration: 0.45, ease: 'back.out(2.5)' });
  };

  window.addEventListener('pointerover', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const say = t.closest('[data-cursor]');
    if (say) return setState('tag', say.dataset.cursor);
    if (t.closest('a, button, [role="button"], label, summary')) return setState('press');
    setState('none');
  });

  window.addEventListener('pointerdown', () => gsap.to(flower, { scale: 0.7, duration: 0.15, ease: 'power2.out' }));
  window.addEventListener('pointerup', () => gsap.to(flower, { scale: state === 'press' ? 1.9 : 1, duration: 0.4, ease: 'back.out(3)' }));

  /* ---------- canvas for the tail and petals ---------- */
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const tail = Array.from({ length: SEGMENTS }, () => ({ x: pos.x, y: pos.y }));
  const petals = [];
  let spin = 0;
  let last = null;
  let travelled = 0;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    moveX(pos.x);
    moveY(pos.y);
    if (!visible) {
      visible = true;
      tail.forEach((p) => ((p.x = pos.x), (p.y = pos.y)));
      gsap.to(el, { opacity: 1, duration: 0.25 });
    }
    if (last) {
      const step = Math.hypot(pos.x - last.x, pos.y - last.y);
      spin += step * 0.9;
      travelled += step;
      // a quick flick sheds a petal; slow moves shed none
      if (!reduce && travelled > PETAL_EVERY && step > 6 && petals.length < MAX_PETALS) {
        travelled = 0;
        shed(pos.x, pos.y, pos.x - last.x, pos.y - last.y);
      }
    }
    last = { x: pos.x, y: pos.y };
    gsap.set(flower, { rotate: spin });
  });

  document.addEventListener('pointerleave', () => {
    visible = false;
    gsap.to(el, { opacity: 0, duration: 0.25 });
  });

  function shed(x, y, dx, dy) {
    const len = Math.hypot(dx, dy) || 1;
    petals.push({
      x,
      y,
      // thrown a little backwards and sideways, then gravity takes over
      vx: (-dx / len) * 0.8 + (Math.random() - 0.5) * 1.6,
      vy: (-dy / len) * 0.8 - 0.6 - Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      born: performance.now(),
      size: 0.8 + Math.random() * 0.5,
    });
  }

  function drawPetal(p, life) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    // petals flutter: squash on one axis as they turn
    ctx.scale(p.size * (0.55 + 0.45 * Math.abs(Math.cos(p.rot * 1.7))), p.size);
    ctx.globalAlpha = Math.min(1, life * 1.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.4, 7.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // the tail as one filled, tapering shape through smoothed points
  function drawTail() {
    const n = tail.length;
    let length = 0;
    for (let i = 1; i < n; i++) length += Math.hypot(tail[i].x - tail[i - 1].x, tail[i].y - tail[i - 1].y);
    if (length < 2) return;

    const left = [];
    const right = [];
    for (let i = 0; i < n; i++) {
      const a = tail[Math.max(0, i - 1)];
      const b = tail[Math.min(n - 1, i + 1)];
      let nx = -(b.y - a.y);
      let ny = b.x - a.x;
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      // thick at the flower, thinning to a point; thinner when the tail is short
      const w = (HEAD_WIDTH / 2) * Math.pow(1 - i / (n - 1), 1.3) * Math.min(1, length / 40);
      left.push([tail[i].x + nx * w, tail[i].y + ny * w]);
      right.push([tail[i].x - nx * w, tail[i].y - ny * w]);
    }
    const outline = left.concat(right.reverse());
    ctx.beginPath();
    ctx.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length - 1; i++) {
      const mx = (outline[i][0] + outline[i + 1][0]) / 2;
      const my = (outline[i][1] + outline[i + 1][1]) / 2;
      ctx.quadraticCurveTo(outline[i][0], outline[i][1], mx, my);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  gsap.ticker.add((time, deltaMs) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (reduce) return;
    ctx.fillStyle = BLUE;
    const dt = Math.min(deltaMs, 50) / (1000 / 60);

    // the tail: the head sits on the flower, each point chases the one ahead
    const head = gsap.getProperty(el, 'x');
    const headY = gsap.getProperty(el, 'y');
    tail[0].x = head;
    tail[0].y = headY;
    const k = 1 - Math.pow(1 - FOLLOW, dt);
    for (let i = 1; i < tail.length; i++) {
      tail[i].x += (tail[i - 1].x - tail[i].x) * k;
      tail[i].y += (tail[i - 1].y - tail[i].y) * k;
    }
    if (visible) drawTail();

    // petals
    const now = performance.now();
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      const life = 1 - (now - p.born) / PETAL_LIFE;
      if (life <= 0) {
        petals.splice(i, 1);
        continue;
      }
      p.vy += 0.06 * dt;
      p.vx *= Math.pow(0.97, dt);
      p.x += p.vx * dt + Math.sin(now / 160 + i) * 0.25;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      drawPetal(p, life);
    }
  });
}
