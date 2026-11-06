// Section 6: "hire your unfair advantage." Rows of the sentence in loopy
// handwriting, with four big marker words scribbled over the top. The whole
// stage is one link that opens an email. The rows write themselves in left to
// right, then the marker words land one by one.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SVG = 'http://www.w3.org/2000/svg';
const LINE = 'hire your unfair advantage.';
const ROWS = 12; // phones show all twelve, wide screens the first five
const WORDS = ['hire', 'your', 'unfair', 'advantage'];

// a sentence stretched to fill its box exactly
function row(i) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'hire__row');
  svg.setAttribute('viewBox', '0 0 1800 120');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.setProperty('--r', i);
  svg.innerHTML = `<text x="6" y="84" textLength="1786" lengthAdjust="spacingAndGlyphs">${LINE}</text>`;
  return svg;
}

function word(w) {
  const svg = document.createElementNS(SVG, 'svg');
  const width = w.length * 96;
  svg.setAttribute('class', `hire__word hire__word--${w}`);
  svg.setAttribute('viewBox', `0 0 ${width} 230`);
  svg.innerHTML = `<text x="6" y="200" textLength="${width - 12}" lengthAdjust="spacingAndGlyphs">${w.toUpperCase()}</text>`;
  return svg;
}

export function initHire({ reduce = false } = {}) {
  const stage = document.querySelector('.hire__stage');
  if (!stage) return;

  const rows = document.createElement('span');
  rows.className = 'hire__rows';
  rows.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < ROWS; i++) rows.appendChild(row(i));
  const words = document.createElement('span');
  words.className = 'hire__words';
  words.setAttribute('aria-hidden', 'true');
  WORDS.forEach((w) => words.appendChild(word(w)));
  stage.append(rows, words);

  if (reduce) return;

  const rowEls = rows.querySelectorAll('.hire__row');
  const wordEls = words.querySelectorAll('.hire__word');
  // the order the marker words land in: hire, advantage, unfair, your
  const order = [0, 3, 2, 1].map((i) => wordEls[i]);

  gsap.set(rowEls, { clipPath: 'inset(-40% 100% -60% 0%)' });
  gsap.set(order, { opacity: 0, scale: 1.35, rotation: '+=8' });

  gsap
    .timeline({ scrollTrigger: { trigger: stage, start: 'top 72%', once: true } })
    .to(rowEls, {
      clipPath: 'inset(-40% 0% -60% 0%)',
      duration: 1.1,
      ease: 'power1.inOut',
      stagger: 0.09,
    })
    .to(order, {
      opacity: 1,
      scale: 1,
      rotation: '-=8',
      duration: 0.45,
      ease: 'back.out(2.6)',
      stagger: 0.22,
    }, 0.55);
}
