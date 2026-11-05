// The opening: the beach is drawn in ink, stroke by stroke, the colour is
// washed in, and then the wave comes in and takes the screen.

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { beachScene } from './scene.js';
import { runWave } from './wave.js';

gsap.registerPlugin(DrawSVGPlugin);

export function playIntro({ onReveal } = {}) {
  const root = document.documentElement;
  const intro = document.getElementById('intro');
  const canvas = document.getElementById('splash');
  const skipBtn = document.getElementById('skip');

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    onReveal?.();
  };

  const finish = () => {
    intro.classList.add('is-gone');
    skipBtn.classList.add('is-gone');
    canvas.remove();
    document.body.classList.remove('is-intro');
    reveal();
  };

  if (root.classList.contains('no-intro')) {
    intro.remove();
    skipBtn.remove();
    canvas.remove();
    reveal();
    return;
  }

  document.body.classList.add('is-intro');
  window.scrollTo(0, 0);
  intro.innerHTML = beachScene({ id: 'intro-beach', seed: 7 });
  const svg = intro.querySelector('svg');
  const q = (sel) => svg.querySelectorAll(sel);

  // Starting state: nothing drawn yet.
  gsap.set(q('.ink'), { drawSVG: '0%' });
  gsap.set(q('.sun'), { scale: 0, transformOrigin: '50% 50%' });
  gsap.set(q('.sea'), { opacity: 0 });
  gsap.set(q('.sand'), { opacity: 0 });
  gsap.set(q('.grain'), { opacity: 0 });
  gsap.set(q('.stripe, .paper-fill, .sun-fill, .sea-fill-soft'), { fillOpacity: 0 });

  let wave = null;
  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

  tl.to(q('.horizon'), { drawSVG: '100%', duration: 0.9 })
    .to(q('.sun'), { scale: 1, duration: 0.7, ease: 'back.out(2)' }, '-=0.35')
    .to(q('.sea'), { opacity: 1, duration: 0.6 }, '-=0.4')
    .to(q('.birds .ink'), { drawSVG: '100%', duration: 0.45, stagger: 0.04 }, '-=0.5')
    .to(q('.wavelets .ink'), { drawSVG: '100%', duration: 0.3, stagger: 0.012 }, '-=0.6')
    .to(q('.boat .ink'), { drawSVG: '100%', duration: 0.5, stagger: 0.08 }, '<')
    .to(q('.school .ink'), { drawSVG: '100%', duration: 0.4, stagger: 0.03 }, '-=0.4')
    .to(q('.sand'), { opacity: 1, duration: 0.5 }, '-=0.6')
    .to(q('.foam'), { drawSVG: '100%', duration: 0.8, stagger: 0.1 }, '-=0.4')
    .to(q('.grain'), { opacity: 0.45, duration: 0.4, stagger: { amount: 0.4, from: 'random' } }, '-=0.6')
    .to(q('.print'), { drawSVG: '100%', duration: 0.25, stagger: 0.07 }, '-=0.5')
    .to(q('.prop .ink'), { drawSVG: '100%', duration: 0.5, stagger: 0.03 }, '-=0.6')
    .to(q('.stripe, .paper-fill, .sun-fill, .sea-fill-soft'), { fillOpacity: 1, duration: 0.4 }, '-=0.2')
    // a breath, so the drawing can be seen finished
    .to({}, { duration: 0.5 })
    .call(() => {
      wave = runWave(canvas, {
        onCrash: () => {
          gsap.fromTo(intro, { x: -8, y: 4 }, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1.4, 0.3)' });
        },
        onCovered: () => {
          intro.classList.add('is-gone');
          skipBtn.classList.add('is-gone');
          document.body.classList.remove('is-intro');
          reveal();
        },
        onDone: finish,
      });
    });

  // Dev only: ?slow=0.25 slows every animation down, for checking frames.
  if (import.meta.env.DEV) {
    const m = location.search.match(/slow=([\d.]+)/);
    if (m) gsap.globalTimeline.timeScale(Number(m[1]));
  }

  // Skip: jump straight to the end, from the button, a click or Escape.
  const skip = () => {
    tl.progress(1);
    if (wave) wave.skip();
    else finish();
    window.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') skip();
  };
  skipBtn.addEventListener('click', skip, { once: true });
  window.addEventListener('keydown', onKey);
}
