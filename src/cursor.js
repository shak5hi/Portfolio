// A custom cursor: a small blue flower (the same one tucked into the hair
// in the photo) that turns as it moves and leaves a fading brush-ink trail.
// It grows over things you can press and shows a little tag over things
// that have something to say. Mouse and trackpad only; touch keeps its own.

import { gsap } from 'gsap';

const BLUE = '#2152e3';

export function initCursor({ reduce = false } = {}) {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  document.documentElement.classList.add('has-cursor');

  const petals = Array.from({ length: 5 }, (_, i) => `<ellipse cx="0" cy="-9" rx="5.4" ry="9" transform="rotate(${i * 72})"/>`).join('');
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <svg class="cursor__flower" viewBox="-20 -20 40 40">
      <g fill="${BLUE}">${petals}</g>
      <circle r="4.2" class="cursor__eye"/>
    </svg>
    <span class="cursor__tag"></span>`;
  document.body.appendChild(el);

  const flower = el.querySelector('.cursor__flower');
  const tag = el.querySelector('.cursor__tag');

  // brush trail on a canvas under the flower
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const moveX = gsap.quickTo(el, 'x', { duration: 0.12, ease: 'power3' });
  const moveY = gsap.quickTo(el, 'y', { duration: 0.12, ease: 'power3' });
  gsap.set(el, { x: pos.x, y: pos.y, opacity: 0 });

  const trail = []; // {x, y, t}
  let spin = 0;
  let last = null;
  let visible = false;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    pos.x = e.clientX;
    pos.y = e.clientY;
    moveX(pos.x);
    moveY(pos.y);
    if (!visible) {
      visible = true;
      gsap.to(el, { opacity: 1, duration: 0.25 });
    }
    // the flower turns with the distance travelled
    if (last) spin += Math.hypot(pos.x - last.x, pos.y - last.y) * 0.9;
    last = { x: pos.x, y: pos.y };
    gsap.set(flower, { rotate: spin });
    if (!reduce) trail.push({ x: pos.x, y: pos.y, t: performance.now() });
  });

  document.addEventListener('pointerleave', () => {
    visible = false;
    gsap.to(el, { opacity: 0, duration: 0.25 });
  });

  window.addEventListener('pointerdown', () => gsap.to(flower, { scale: 0.7, duration: 0.15, ease: 'power2.out' }));
  window.addEventListener('pointerup', () => gsap.to(flower, { scale: state === 'press' ? 1.9 : 1, duration: 0.4, ease: 'back.out(3)' }));

  // what the cursor is over
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

  // the trail: a tapering brush stroke that fades over ~350ms
  const LIFE = 350;
  gsap.ticker.add(() => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const now = performance.now();
    while (trail.length && now - trail[0].t > LIFE) trail.shift();
    if (trail.length < 2) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = BLUE;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const life = 1 - (now - b.t) / LIFE;
      ctx.globalAlpha = Math.max(0, life) * 0.85;
      ctx.lineWidth = 1 + life * 5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
