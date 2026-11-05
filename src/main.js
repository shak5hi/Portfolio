import './style.css';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(DrawSVGPlugin, SplitText);

/* ===================== edit me ===================== */
// The words that flash in the preloader, in order.
const WORDS = ['HIRE', 'ME', 'BEFORE', 'THEY', 'DO'];
// The scrolling line in the top ribbon.
const RIBBON = 'NEW WEBSITE, WHO DIS?? <3<3<3';
/* =================================================== */

const root = document.documentElement;
const reduce = root.classList.contains('no-motion');
const skipIntro = reduce || root.classList.contains('no-intro');
const $ = (s) => document.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';

/* ---------- ribbon ---------- */
const heart = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10.5 1.4 6A2.7 2.7 0 0 1 6 2.6 2.7 2.7 0 0 1 10.6 6Z"/></svg>';
const chunk = `<span>${RIBBON.replace(/</g, '&lt;')}${heart}</span>`;
$('#ribbon-track').innerHTML = chunk.repeat(10);
const ribbonLoop = gsap.to('#ribbon-track', { xPercent: -50, duration: 40, ease: 'none', repeat: -1, paused: reduce });
$('#ribbon-close').addEventListener('click', () => {
  const r = $('#ribbon');
  if (reduce) return r.remove();
  gsap.to(r, { height: 0, duration: 0.5, ease: 'power3.inOut', onComplete: () => { ribbonLoop.kill(); r.remove(); } });
});

/* ---------- menu ---------- */
const menu = $('#menu');
const openBtn = $('#menu-open');
function setMenu(open) {
  if (open) {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    if (!reduce) {
      gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut' });
      gsap.from('.menu__list li', { yPercent: 60, opacity: 0, stagger: 0.07, duration: 0.8, ease: 'expo.out', delay: 0.3 });
    }
    $('#menu-close').focus();
  } else {
    const done = () => { menu.hidden = true; openBtn.setAttribute('aria-expanded', 'false'); openBtn.focus(); };
    if (reduce) return done();
    gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
  }
}
openBtn.addEventListener('click', () => setMenu(true));
$('#menu-close').addEventListener('click', () => setMenu(false));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

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
  return `<g class="flower" transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">${petals}<circle r="7" fill="#f3f3e9"/></g>`;
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
  { x: 1215, y0: 270, y1: 610, amp: 26, seed: 3, w: 11, hook: 24 },
  { x: 1290, y0: 380, y1: 590, amp: 18, seed: 4, w: 8 },
];
const frontLines = [
  { x: 290, y0: 600, y1: 1070, amp: 14, seed: 5, w: 9, hook: 20 },
  { x: 1150, y0: 420, y1: 620, amp: 20, seed: 6, w: 10 },
  { x: 1185, y0: 230, y1: 470, amp: 16, seed: 7, w: 8, hook: -18 },
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
const bigSplits = [];
function prepareHero() {
  document.querySelectorAll('.big').forEach((el) => {
    const split = new SplitText(el, { type: 'chars', charsClass: 'char', mask: 'chars' });
    bigSplits.push(split);
    gsap.set(split.chars, { yPercent: 110 });
  });
  gsap.set('.big, .hero__photo, .ribbon, .nav', { visibility: 'visible' });
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

  const [hello, meet, name] = bigSplits;
  tl.to(hello.chars, { yPercent: 0, duration: 1, stagger: 0.045 }, 0.55)
    .to(meet.chars, { yPercent: 0, duration: 1, stagger: 0.045 }, 0.75)
    .to(name.chars, { yPercent: 0, duration: 1, stagger: 0.045 }, 0.95)
    .add(typeOut($('.mono--name .type'), 0.06), 1.1)
    .add(typeOut($('.mono--tag .type'), 0.028), '>-0.1');

  // letters hop when the pointer passes over them
  bigSplits.forEach((s) =>
    s.chars.forEach((c) =>
      c.addEventListener('pointerenter', () => {
        if (gsap.isTweening(c)) return;
        gsap.fromTo(c, { yPercent: 0 }, { yPercent: -12, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1 });
      })
    )
  );
  return tl;
}

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

/* ---------- run ---------- */
const fontsReady = document.fonts.ready;

if (skipIntro) {
  Promise.all([fontsReady, logoReady]).then(([, logo]) => {
    if (reduce) {
      gsap.set('.big, .hero__photo, .ribbon, .nav', { visibility: 'visible' });
      document.querySelectorAll('.type').forEach((el) => (el.textContent = el.dataset.text));
      return;
    }
    prepareHero();
    heroIn(logo);
  });
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
