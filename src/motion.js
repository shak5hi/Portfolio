// The motion layer: smooth scroll, the hero's entrance, the living beach
// in the hero card, section reveals, the shoreline walk, the marquee that
// answers the scroll, the bottle that floats away, and the footer.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, SplitText);

const reduce = document.documentElement.classList.contains('no-motion');
let lenis = null;

/* ---------- smooth scroll ---------- */
export function initScroll() {
  if (!reduce) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // In-page links glide (or jump, with reduced motion) and move focus.
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#top' ? document.body : document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(id === '#top' ? 0 : target, { offset: id === '#top' ? 0 : -20, duration: 1.4 });
      else target.scrollIntoView();
      history.replaceState(null, '', id);
    });
  });

  // The bar slips away while reading down and comes back when scrolling up.
  const nav = document.getElementById('nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      nav.classList.toggle('is-hidden', y > 400 && y > lastY);
      lastY = y;
    },
  });
}

export const pauseScroll = () => lenis?.stop();
export const resumeScroll = () => lenis?.start();

/* ---------- hero ---------- */
let heroSplit = null;

export function prepareHero() {
  if (reduce) return;
  heroSplit = new SplitText('#hero-title .line', { type: 'chars', charsClass: 'char' });
  gsap.set(heroSplit.chars, { yPercent: 110, rotate: 8, opacity: 0 });
  gsap.set('.hero__lede, .hero__actions', { y: 28, opacity: 0 });
  gsap.set('.hero__card', { y: 40, opacity: 0, rotate: 2 });
  gsap.set('.nav', { yPercent: -100 });
}

export function playHero() {
  if (reduce) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.nav', { yPercent: 0, duration: 0.9 }, 0)
    .to(heroSplit.chars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, stagger: 0.035 }, 0.1)
    .to('.hero__lede', { y: 0, opacity: 1, duration: 1 }, 0.5)
    .to('.hero__actions', { y: 0, opacity: 1, duration: 1 }, 0.6)
    .to('.hero__card', { y: 0, opacity: 1, rotate: 0, duration: 1.4 }, 0.35)
    .add(() => gsap.set('.nav', { clearProps: 'transform' }));
}

/* the beach in the hero card stays alive: gulls drift, the sea moves,
   the fish swim, and the whole drawing leans toward the pointer */
export function liveBeach() {
  if (reduce) return;
  const svg = document.querySelector('#hero-beach');
  if (!svg) return;
  const q = (s) => svg.querySelectorAll(s);

  q('.bird').forEach((b, i) => {
    gsap.to(b, {
      x: gsap.utils.random(-30, 30),
      y: gsap.utils.random(-14, 14),
      duration: gsap.utils.random(3, 6),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 0.2,
    });
  });
  gsap.to(q('.gull'), { y: '-=12', duration: 2.4, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.6 });
  q('.wavelet').forEach((w) => {
    gsap.to(w, { x: gsap.utils.random(-14, 14), duration: gsap.utils.random(1.6, 3), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  });
  q('.fish').forEach((f, i) => {
    const flip = /scale\(-/.test(f.getAttribute('transform'));
    gsap.to(f, { x: flip ? -60 : 60, duration: 5 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  });
  gsap.to(q('.boat'), { x: 120, duration: 14, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(q('.boat'), { rotate: 3, transformOrigin: '50% 100%', duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  gsap.to(q('.foam'), { y: 6, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.5 });
  gsap.to(q('.sun'), { scale: 1.06, transformOrigin: '50% 50%', duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut' });

  // pointer parallax: the sky moves more than the sand
  const card = document.querySelector('.hero__card');
  const layers = [
    [q('.sun'), 22],
    [q('.birds'), 34],
    [q('.wavelets, .school'), 12],
    [q('.umbrella, .towel'), -10],
  ];
  const movers = layers.map(([els, amt]) => [gsap.quickTo(els, 'x', { duration: 0.8, ease: 'power3' }), amt]);
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    movers.forEach(([to, amt]) => to(nx * amt));
  });
  card.addEventListener('pointerleave', () => movers.forEach(([to]) => to(0)));
}

/* ---------- marquee ---------- */
export function marquee() {
  const track = document.getElementById('marquee');
  if (reduce) return;
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  // scrolling speeds the ribbon up, and scrolling back up reverses it
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const v = self.getVelocity();
      const dir = self.direction;
      gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 300, 5)), duration: 0.3, overwrite: true });
      gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.3, overwrite: false });
    },
  });
}

/* ---------- section reveals ---------- */
export function reveals() {
  const groups = gsap.utils.toArray('[data-reveal]');
  if (reduce) return;
  groups.forEach((g) => {
    const kids = g.children;
    gsap.to(kids, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: g, start: 'top 82%', once: true },
    });
  });

  // big section headings rise word by word
  gsap.utils.toArray('.about h2, .work h2, .shore h2, .faq h2, .contact h2').forEach((h) => {
    const split = new SplitText(h, { type: 'words', wordsClass: 'word' });
    gsap.from(split.words, {
      yPercent: 60,
      opacity: 0,
      rotate: 4,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true },
    });
  });

  // project postcards ink themselves in, then drift a little with the scroll
  gsap.utils.toArray('.project__art').forEach((art) => {
    const inks = art.querySelectorAll('.ink');
    gsap.from(inks, {
      drawSVG: '0%',
      duration: 1.2,
      ease: 'power2.inOut',
      stagger: 0.04,
      scrollTrigger: { trigger: art, start: 'top 75%', once: true },
    });
    gsap.fromTo(
      art.querySelector('svg'),
      { yPercent: -4, scale: 1.08 },
      { yPercent: 4, scale: 1.08, ease: 'none', scrollTrigger: { trigger: art, scrub: true } }
    );
  });

  // the polaroid swings into place
  gsap.from('.polaroid', {
    rotate: -14,
    y: 60,
    duration: 1.4,
    ease: 'elastic.out(1, 0.6)',
    scrollTrigger: { trigger: '.polaroid', start: 'top 85%', once: true },
  });

  // the crab in the FAQ scuttles in from the side
  gsap.from('.faq__aside .doodle', {
    x: -80,
    rotate: -10,
    opacity: 0,
    duration: 1.2,
    ease: 'back.out(1.6)',
    scrollTrigger: { trigger: '.faq', start: 'top 70%', once: true },
  });
}

/* ---------- the shoreline: pinned walk with footprints ---------- */
export function shoreline() {
  const pin = document.getElementById('shore-pin');
  const track = document.getElementById('shore-track');
  const path = document.getElementById('shore-path');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 761px)', () => {
    // draw a wandering line of footprints along the full width of the track
    const width = track.scrollWidth;
    path.setAttribute('viewBox', `0 0 ${width} 80`);
    path.setAttribute('width', width);
    let prints = '';
    const n = Math.floor(width / 46);
    for (let i = 0; i < n; i++) {
      const x = 30 + i * 46;
      const y = 40 + Math.sin(i * 0.45) * 16 + (i % 2 ? -9 : 9);
      const a = Math.cos(i * 0.45) * 18;
      prints += `<g class="step" transform="translate(${x} ${y}) rotate(${a})"><ellipse class="ink thin sun-fill" rx="10" ry="5.5"/><circle cx="12" cy="-3" r="2" fill="#1d4b88"/><circle cx="13" cy="2" r="1.8" fill="#1d4b88"/></g>`;
    }
    path.innerHTML = prints;
    const steps = path.querySelectorAll('.step');
    if (reduce) return;

    const distance = () => track.scrollWidth - window.innerWidth;
    gsap.set(steps, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
    tl.to(track, { x: () => -distance(), ease: 'none', duration: 1 }, 0).to(
      steps,
      { opacity: 1, scale: 1, ease: 'back.out(3)', stagger: { each: 1 / steps.length, ease: 'none' }, duration: 0.05 },
      0
    );

    // each flag waves as the walk reaches it
    const dist = distance();
    gsap.utils.toArray('.stop__flag').forEach((flag) => {
      const at = gsap.utils.clamp(0, 0.95, (flag.closest('.stop').offsetLeft - window.innerWidth * 0.6) / dist);
      tl.fromTo(flag, { rotate: 0 }, { rotate: -12, transformOrigin: '15% 100%', duration: 0.03, yoyo: true, repeat: 1, ease: 'sine.inOut' }, at);
    });

    return () => {
      path.innerHTML = '';
    };
  });
}

/* ---------- faq: answers ease in ---------- */
export function faq() {
  document.querySelectorAll('.qa').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open || reduce) return;
      gsap.from(d.querySelector('.qa__a'), { y: -10, opacity: 0, duration: 0.5, ease: 'power3.out' });
    });
  });
}

/* ---------- the message in a bottle ---------- */
export function bottle() {
  const form = document.getElementById('bottle-form');
  const note = document.getElementById('note');
  const from = document.getElementById('from');
  const status = document.getElementById('bottle-status');
  const body = document.getElementById('bottle-body');
  const cork = document.getElementById('bottle-cork');
  const paper = document.getElementById('bottle-note');
  const water = document.getElementById('bottle-water');

  if (!reduce) {
    gsap.set(cork, { x: 42, rotate: 20, transformOrigin: '50% 50%' });
    gsap.to(body, { y: 5, rotate: -2, transformOrigin: '50% 70%', duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(water, { x: -47.5, duration: 2.4, repeat: -1, ease: 'none' });
    // the note inside fills up as the visitor writes
    gsap.set(paper, { scaleX: 0.3, transformOrigin: '0% 50%' });
    note.addEventListener('input', () => {
      gsap.to(paper, { scaleX: 0.3 + Math.min(note.value.length / 200, 1) * 0.7, duration: 0.4, ease: 'power2.out' });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = note.value.trim();
    if (!text) {
      status.textContent = "the bottle's empty — write a few words first.";
      note.focus();
      if (!reduce) gsap.fromTo(note, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.3)' });
      return;
    }
    const name = from.value.trim();
    const subject = `a message in a bottle${name ? ` from ${name}` : ''}`;
    const mail = `mailto:pysharma0612@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + (name ? `\n\n— ${name}` : ''))}`;

    const send = () => {
      window.location.href = mail;
      status.textContent = 'corked and thrown! your email app should open with the note ready to send.';
    };
    if (reduce) return send();

    gsap
      .timeline()
      .to(cork, { x: 0, rotate: 0, duration: 0.35, ease: 'back.in(2)' })
      .to(body, { rotate: -16, duration: 0.25, ease: 'power2.out' })
      .to(body, { x: 520, y: -30, rotate: 200, duration: 1.1, ease: 'power2.in' })
      .call(send)
      .set(body, { x: -520, y: 0, rotate: 0 })
      .set(cork, { x: 42, rotate: 20 })
      .to(body, { x: 0, duration: 1.4, ease: 'power3.out' }, '+=0.6');
  });
}

/* ---------- footer ---------- */
export function footer() {
  if (reduce) return;
  const split = new SplitText('#footer-name', { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: 100,
    rotate: (i) => (i % 2 ? 10 : -10),
    duration: 1.1,
    ease: 'back.out(1.6)',
    stagger: 0.05,
    scrollTrigger: { trigger: '.footer', start: 'top 80%', once: true },
  });
  split.chars.forEach((c) => {
    c.addEventListener('pointerenter', () => {
      gsap.fromTo(c, { y: 0 }, { y: -30, duration: 0.35, ease: 'power2.out', yoyo: true, repeat: 1 });
    });
  });

  // the ink wave under the name keeps rolling
  const wave = document.getElementById('footer-wave');
  const state = { p: 0 };
  const draw = () => {
    let d = 'M0 30';
    for (let x = 0; x <= 1600; x += 40) d += ` L${x} ${30 + Math.sin(x / 90 + state.p) * 10}`;
    wave.setAttribute('d', `${d} V60 H0 Z`);
  };
  const roll = gsap.to(state, { p: Math.PI * 2, duration: 4, repeat: -1, ease: 'none', onUpdate: draw, paused: true });
  ScrollTrigger.create({ trigger: '.footer', start: 'top bottom', onToggle: (self) => (self.isActive ? roll.play() : roll.pause()) });
}

export { ScrollTrigger };
