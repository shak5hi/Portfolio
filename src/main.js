import './style.css';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCursor } from './cursor.js';
import { initSkills } from './skills.js';
import { initWork } from './work.js';
import { initFaq } from './faq.js';

gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger);

/* ===================== edit me ===================== */
// The words that flash in the preloader, in order.
const WORDS = ['HIRE', 'ME', 'BEFORE', 'THEY', 'DO'];
/* =================================================== */

const root = document.documentElement;
const reduce = root.classList.contains('no-motion');
const skipIntro = reduce || root.classList.contains('no-intro');
const $ = (s) => document.querySelector(s);

initCursor({ reduce });
const NS = 'http://www.w3.org/2000/svg';

/* ---------- ink: brush lines around the photo, flowers in the hair ---------- */
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function brushPath({ x, y0, y1, amp, seed, hook = 0 }) {
  const r = rng(seed);
  const pts = [];
  const phase = r() * 6;
  for (let y = y0; y <= y1; y += 26) {
    const k = (y - y0) / (y1 - y0);
    pts.push([x + Math.sin(y / 70 + phase) * amp * (0.6 + k * 0.6) + (r() - 0.5) * 6, y]);
  }
  if (hook) {
    const [lx, ly] = pts[pts.length - 1];
    pts.push([lx + hook * 0.5, ly + 18], [lx + hook, ly + 8], [lx + hook * 0.9, ly - 10]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}

function flower(cx, cy, s, rot) {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    petals += `<ellipse cx="0" cy="-15" rx="9" ry="15" transform="rotate(${i * 72})"/>`;
  }
  return `<g class="flower" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">${petals}<circle r="7" style="fill: var(--paper)"/></g>`;
}

const brushFilter = (id) => `<defs>
  <filter id="${id}" x="-20%" y="-5%" width="140%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.5" numOctaves="2" seed="4" result="warp"/>
    <feDisplacementMap in="SourceGraphic" in2="warp" scale="5" xChannelSelector="R" yChannelSelector="G" result="rough"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="9" result="grain"/>
    <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.8 0 0 0 -0.45" result="dry"/>
    <feComposite in="rough" in2="dry" operator="in"/>
  </filter>
</defs>`;

// viewBox 1360 x 1080: the photo itself spans x 180-1180, y 86-986.
const backLines = [
  { x: 215, y0: 360, y1: 1050, amp: 20, seed: 1, w: 10, hook: -24 },
  { x: 140, y0: 500, y1: 960, amp: 24, seed: 2, w: 8 },
  { x: 1215, y0: 420, y1: 690, amp: 26, seed: 3, w: 11, hook: 24 },
  { x: 1290, y0: 470, y1: 650, amp: 18, seed: 4, w: 8 },
];
const frontLines = [
  { x: 290, y0: 600, y1: 1070, amp: 14, seed: 5, w: 9, hook: 20 },
  { x: 1150, y0: 480, y1: 700, amp: 20, seed: 6, w: 10 },
  { x: 1185, y0: 400, y1: 600, amp: 16, seed: 7, w: 8, hook: -18 },
];

function drawInk(svg, lines, id, extra = '') {
  svg.innerHTML = `${brushFilter(id)}<g filter="url(#${id})">${lines
    .map((l) => `<path d="${brushPath(l)}" stroke-width="${l.w}"/>`)
    .join('')}${extra}</g>`;
}
drawInk($('#ink-back'), backLines, 'brush-back');
drawInk($('#ink-front'), frontLines, 'brush-front');

// little flowers tucked into the hair, placed as fractions of the photo box
const flowers = [
  { x: 0.35, y: 0.21, s: 1, r: 10 },
  { x: 0.28, y: 0.42, s: 0.8, r: -25 },
  { x: 0.68, y: 0.37, s: 0.9, r: 35 },
];
flowers.forEach((f) => {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('viewBox', '-40 -40 80 80');
  el.setAttribute('class', 'hair-flower');
  el.setAttribute('aria-hidden', 'true');
  el.style.left = `${f.x * 100}%`;
  el.style.top = `${f.y * 100}%`;
  el.style.setProperty('--s', f.s);
  el.innerHTML = `${brushFilter('bf' + f.r)}<g filter="url(#bf${f.r})">${flower(0, 0, 1, f.r)}</g>`;
  $('#photo').appendChild(el);
});

/* ---------- logo: inline it so it can write itself ---------- */
const logoReady = fetch('/logo.svg')
  .then((r) => (r.ok ? r.text() : ''))
  .then((svg) => {
    $('#logo').innerHTML = svg;
    return $('#logo svg');
  })
  .catch(() => null);

/* ---------- typing ---------- */
function typeOut(el, speed) {
  const text = el.dataset.text;
  const state = { n: 0 };
  return gsap.to(state, {
    n: text.length,
    duration: text.length * speed,
    ease: 'none',
    onUpdate: () => (el.textContent = text.slice(0, Math.round(state.n))),
  });
}

/* ---------- the hero comes in ---------- */
// HELLO / MEET / SHAKSHI stay still; the photo, ink, logo and typed lines move.
function prepareHero() {
  gsap.set('.big, .hero__photo, .nav, .visitor', { visibility: 'visible' });
  fitName();
}

function heroIn(logo) {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  if (logo) {
    const strokes = logo.querySelectorAll('path');
    gsap.set(strokes, { drawSVG: '0%' });
    let at = 0.3;
    strokes.forEach((p) => {
      const len = p.getTotalLength();
      const dur = gsap.utils.clamp(0.15, 0.9, len / 900);
      tl.to(p, { drawSVG: '100%', duration: dur, ease: 'power1.inOut' }, at);
      at += dur * 0.92;
    });
  }

  tl.from('#ink-back path, #ink-front path', { drawSVG: '0%', duration: 1.1, ease: 'power2.inOut', stagger: 0.08 }, 0.25)
    .from('.hair-flower', { scale: 0, rotate: -90, duration: 0.7, ease: 'back.out(2.4)', stagger: 0.12 }, 0.9)
    .from('.hero__img', { scale: 1.06, duration: 1.6 }, 0);

  if (!savedName) tl.add(typeLine(0.06), 0.6);
  tl.add(typeOut($('.mono--tag .type'), 0.028), savedName ? 0.6 : '>-0.1');
  return tl;
}

/* ---------- {{ first name }}: visitors type right between the brackets ---------- */
const nameLine = $('#name-line');
const nameInput = $('#name-input');
const nameShow = $('#name-show');
const braces = nameLine.querySelectorAll('.brace');
const PLACEHOLDER = nameInput.dataset.placeholder;
const STORE = 'visitor-first-name';

let savedName = '';
try {
  savedName = localStorage.getItem(STORE) || '';
} catch {}

// the slot is exactly as wide as what is in it (the font is monospaced)
function sizeSlot() {
  const focused = document.activeElement === nameInput;
  const shown = nameInput.value || (focused ? '' : nameInput.placeholder);
  nameInput.style.width = `${Math.max(shown.length, focused ? 1 : 0)}ch`;
}

function setLineText(open, hint, close) {
  braces[0].textContent = open;
  nameInput.placeholder = hint;
  braces[1].textContent = close;
  sizeSlot();
}
function fillLine() {
  setLineText(braces[0].dataset.text, PLACEHOLDER, braces[1].dataset.text);
}

// typed out during the intro: "{{ ", then "first name", then " }}"
function typeLine(speed) {
  const parts = [braces[0].dataset.text, PLACEHOLDER, braces[1].dataset.text];
  const total = parts.join('').length;
  const state = { n: 0 };
  setLineText('', '', '');
  return gsap.to(state, {
    n: total,
    duration: total * speed,
    ease: 'none',
    onUpdate() {
      let left = Math.round(state.n);
      const cut = parts.map((p) => {
        const s = p.slice(0, Math.max(0, left));
        left -= p.length;
        return s;
      });
      setLineText(...cut);
    },
  });
}

// size the name in the big type so it fills its spot without running off
function fitName() {
  if (nameShow.hidden) return;
  nameShow.style.fontSize = '';
  const max = nameShow.parentElement.getBoundingClientRect().width;
  const w = nameShow.scrollWidth;
  if (w > max) {
    const size = parseFloat(getComputedStyle(nameShow).fontSize);
    nameShow.style.fontSize = `${(size * max) / w}px`;
  }
}

function showName(name, animate) {
  nameLine.hidden = true;
  nameShow.hidden = false;
  nameShow.textContent = name.toUpperCase();
  nameShow.setAttribute('aria-label', `Hello ${name}. Change your name`);
  fitName();
  if (animate && !reduce) {
    gsap.fromTo(nameShow, { yPercent: 40, opacity: 0, rotate: -3 }, { yPercent: 0, opacity: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.8)' });
  }
}

function commitName() {
  // first word only: letters in any language, hyphens and apostrophes
  const name = (nameInput.value.trim().split(/\s+/)[0] || '').replace(/[^\p{L}\p{M}'-]/gu, '').slice(0, 14);
  try {
    if (name) localStorage.setItem(STORE, name);
    else localStorage.removeItem(STORE);
  } catch {}
  savedName = name;
  if (name) showName(name, true);
  else {
    nameInput.value = '';
    sizeSlot();
  }
}

// tapping anywhere on the line puts the cursor between the brackets
nameLine.addEventListener('mousedown', (e) => {
  if (e.target !== nameInput) e.preventDefault(); // keep focus from jumping off
});
nameLine.addEventListener('click', (e) => {
  if (e.target !== nameInput) nameInput.focus();
});
nameInput.addEventListener('focus', () => {
  nameLine.classList.add('is-typing');
  sizeSlot();
});
nameInput.addEventListener('input', sizeSlot);
nameInput.addEventListener('blur', () => {
  nameLine.classList.remove('is-typing');
  if (nameInput.value.trim()) commitName();
  else sizeSlot();
});
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    nameInput.value = '';
    nameInput.blur();
  }
});
nameLine.addEventListener('submit', (e) => {
  e.preventDefault();
  nameInput.blur();
});

// clicking the big name brings the brackets back to change it
nameShow.addEventListener('click', () => {
  nameShow.hidden = true;
  nameLine.hidden = false;
  fillLine();
  nameInput.value = savedName;
  nameInput.focus();
  nameInput.select();
});

fillLine();
if (savedName) showName(savedName);
window.addEventListener('resize', fitName);

/* ---------- preloader ---------- */
function fitWord(el, word) {
  el.style.fontSize = '100px';
  el.textContent = word;
  const w = el.getBoundingClientRect().width;
  const size = Math.min((window.innerWidth * 0.88 * 100) / w, window.innerHeight * 1.0);
  el.style.fontSize = `${size}px`;
}

// crops of the photo used as the black-and-white flashes
const crops = [
  { pos: '50% 46%', scale: 1.05, origin: '55% 45%' },
  { pos: '50% 44%', scale: 1.9, origin: '56% 38%' },
  { pos: '50% 88%', scale: 1.25, origin: '30% 70%' },
];

function playLoader() {
  const loader = $('#loader');
  const word = $('#loader-word');
  const imgWrap = $('#loader-img');
  const img = imgWrap.querySelector('img');

  const show = (type, opts = {}) => () => {
    loader.classList.toggle('is-invert', !!opts.invert);
    word.style.visibility = type === 'word' ? 'visible' : 'hidden';
    imgWrap.style.visibility = type === 'img' ? 'visible' : 'hidden';
    gsap.set(word, { clearProps: 'transform,maskImage,webkitMaskImage', scaleY: 1 });
    if (type === 'word') {
      fitWord(word, opts.text);
      gsap.fromTo(word, { scale: 1.08 }, { scale: 1, duration: 0.35, ease: 'power3.out' });
    }
    if (type === 'img') {
      const c = crops[opts.crop];
      img.style.objectPosition = c.pos;
      gsap.fromTo(img, { scale: c.scale * 1.12, transformOrigin: c.origin }, { scale: c.scale, duration: 0.6, ease: 'power2.out' });
      gsap.set(imgWrap, { clipPath: 'inset(0% 0 0% 0)' });
    }
  };

  const [a, b, c, d, e] = WORDS;
  const steps = [
    [show('none'), 0.7],
    [show('word', { text: a }), 0.38],
    [show('img', { crop: 0 }), 0.3],
    [show('word', { text: b }), 0.34],
    [show('img', { crop: 1 }), 0.28],
    [show('word', { text: c }), 0.34],
    [show('img', { crop: 2 }), 0.24],
    [show('word', { text: d }), 0.3],
    [show('word', { text: e }), 0.3],
    // faster, harder cuts
    [show('img', { crop: 0 }), 0.14],
    [show('word', { text: a, invert: true }), 0.14],
    [show('img', { crop: 1 }), 0.12],
    [show('word', { text: b }), 0.12],
    [show('word', { text: c, invert: true }), 0.11],
    [show('img', { crop: 2 }), 0.1],
    [show('word', { text: d }), 0.1],
    [show('word', { text: e }), 0.42],
  ];

  const tl = gsap.timeline();
  let t = 0;
  for (const [fn, dur] of steps) {
    tl.call(fn, null, t);
    t += dur;
  }

  // the last word slices into strips and squashes into a band...
  const sliceAt = t - 0.42;
  tl.fromTo(
    word,
    { '--gap': '0px' },
    {
      '--gap': '18px',
      duration: 0.3,
      ease: 'power2.in',
      onStart: () => {
        const m = 'repeating-linear-gradient(to bottom, #000 0 26px, transparent 26px calc(26px + var(--gap)))';
        word.style.maskImage = m;
        word.style.webkitMaskImage = m;
      },
    },
    sliceAt + 0.08
  )
    .to(word, { scaleY: 0.12, duration: 0.18, ease: 'power3.in' }, t - 0.06)
    // ...then a last flash of the photo pinches down to a line and goes dark
    .call(show('img', { crop: 0 }), null, t + 0.12)
    .fromTo(imgWrap, { clipPath: 'inset(46% 0 46% 0)' }, { clipPath: 'inset(49.85% 0 49.85% 0)', duration: 0.3, ease: 'power2.in' }, t + 0.12)
    .call(show('none'), null, t + 0.45);

  return { tl, end: t + 0.7 };
}

/* ---------- section 2: the hand-drawn quote, big, with little scribbles around it ---------- */
// Tiny pen squiggles scattered round the edges, placed as % of the section.
// Each is a wobbly zigzag, like testing a pen in a margin.
const scribbles = [
  { x: 19, y: 6, r: 52, s: 1 },
  { x: 6, y: 21, r: 30, s: 0.85 },
  { x: 15, y: 53, r: -35, s: 0.9 },
  { x: 5, y: 80, r: -22, s: 0.95 },
  { x: 86, y: 10, r: 68, s: 1.05 },
  { x: 93, y: 36, r: 8, s: 0.8 },
  { x: 88, y: 60, r: 4, s: 0.85 },
  { x: 90, y: 75, r: 22, s: 0.8 },
  { x: 30, y: 90, r: -12, s: 0.75 },
  { x: 70, y: 92, r: 15, s: 0.7 },
];

function scribblePath(seed) {
  // 4-5 loose zigzags, each slightly different
  let n = seed * 9301 + 49297;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const peaks = 4 + (seed % 2);
  let d = 'M2 14';
  for (let i = 0; i < peaks; i++) {
    const x = 4 + i * 7;
    d += ` Q${(x + 1.5 + rnd()).toFixed(1)} ${(2 + rnd() * 3).toFixed(1)} ${(x + 3.5).toFixed(1)} ${(9 + rnd() * 3).toFixed(1)}`;
    d += ` Q${(x + 5 + rnd()).toFixed(1)} ${(16 + rnd() * 3).toFixed(1)} ${(x + 7).toFixed(1)} ${(11 + rnd() * 3).toFixed(1)}`;
  }
  return d;
}

function addScribbles(section) {
  const layer = document.createElement('div');
  layer.className = 'sketch__scribbles';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = scribbles
    .map(
      (s, i) =>
        `<svg viewBox="0 0 42 22"${s.y > 25 && s.y < 75 ? ' class="near-words"' : ''} style="left:${s.x}%;top:${s.y}%;transform:translate(-50%,-50%) rotate(${s.r}deg) scale(${s.s})"><path d="${scribblePath(i + 3)}"/></svg>`,
    )
    .join('');
  section.appendChild(layer);
}

// Zoom the drawing to its words so the quote fills the section, centred,
// at every screen size (the paper colour carries on past the drawing's edges).
function frameToInk(svg, paths) {
  if (!svg || !paths.length) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  paths.forEach((p) => {
    const b = p.getBBox();
    // a stray dot counts for nothing (full stops sit inside the words anyway)
    if (b.width + b.height < 4) return;
    const pad = Number(p.getAttribute('stroke-width')) / 2 || 0;
    minX = Math.min(minX, b.x - pad);
    maxX = Math.max(maxX, b.x + b.width + pad);
    minY = Math.min(minY, b.y - pad);
    maxY = Math.max(maxY, b.y + b.height + pad);
  });
  if (!isFinite(minX)) return;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const inkW = maxX - minX;
  const inkH = maxY - minY;
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const fit = () => {
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const aspect = box.width / box.height;
    const phone = box.width < 760;
    // room around the words: more on wide screens so the scribbles have space
    let w = inkW * (phone ? 1.12 : 1.5);
    let h = inkH * (phone ? 1.3 : 1.28);
    if (w / h > aspect) h = w / aspect;
    else w = h * aspect;
    svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  };
  fit();
  new ResizeObserver(fit).observe(svg);
}

fetch('/drawings/section-2.svg')
  .then((r) => (r.ok ? r.text() : ''))
  .then((svg) => {
    const art = $('#sketch-art');
    if (!svg) return;
    art.innerHTML = svg;
    const root = art.querySelector('svg');
    frameToInk(root, root.querySelectorAll('path.stroke'));
    addScribbles($('#sketch'));
  })
  .catch(() => {});

// pinned sections, set up in page order so each pin knows where the last one ends
initSkills({ reduce });
initWork({ reduce });
initFaq({ reduce });

// the paper plane needs three.js; fetch it after the page is up so the hero isn't kept waiting
import('./plane.js').then((m) => m.initPlane({ reduce }));

/* ---------- run ---------- */
const fontsReady = document.fonts.ready;

if (skipIntro) {
  Promise.all([fontsReady, logoReady]).then(([, logo]) => {
    if (reduce) {
      gsap.set('.big, .hero__photo, .nav, .visitor', { visibility: 'visible' });
      document.querySelectorAll('.type').forEach((el) => (el.textContent = el.dataset.text));
      return;
    }
    prepareHero();
    heroIn(logo);
  });
  // fonts may arrive after the name is shown
  fontsReady.then(fitName);
} else {
  document.body.classList.add('is-loading');
  document.body.style.background = '#000';
  fontsReady.then(() => {
    const { tl, end } = playLoader();
    const page = $('#page');
    prepareHero();
    gsap.set(page, { clipPath: 'inset(50% 0 50% 0)' });
    tl.call(
      () => {
        $('#loader').remove();
      },
      null,
      end
    )
      .fromTo(page, { clipPath: 'inset(50% 0% 50% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.inOut', clearProps: 'clipPath', immediateRender: false }, end)
      .call(() => {
        document.body.classList.remove('is-loading');
        document.body.style.background = '';
      }, null, end + 1);

    logoReady.then((logo) => tl.add(heroIn(logo), end + 0.35));
  });
}

// dev only: ?slow=0.25 plays everything at quarter speed
if (import.meta.env.DEV) {
  const m = location.search.match(/slow=([\d.]+)/);
  if (m) gsap.globalTimeline.timeScale(Number(m[1]));
}
