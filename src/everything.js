// The opener of the Builds page (builds.html): a wall of one word in big
// bold type, row after row, cut off at the edges, with a phrase in blue split
// across the two middle rows so the whole thing reads as one sentence:
//   BUILD BUILD … BUILD  BREAK IT. FIX IT.
//   SHIP IT ANYWAY.  BUILD BUILD …
//
// It types itself in like two typewriters working towards each other: from
// the top, word by word, left to right, row by row; and at the same time from
// the bottom, right to left, row by row upwards. Each new word lands a touch
// big (a little stomp) and settles as the next one arrives. When both sides
// meet, the blue phrase types in, word by word. No fades, no bounce.
// Scrolling on, the wall stays where it is and turns see-through while
// whatever comes next scrolls up over it.
//
// The word and the two halves of the phrase live in builds.html
// (data-word, data-hl1, data-hl2).

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TICK = 62; // ms between words on each side
const HL_TICK = 150; // ms between the words of the phrase

export function initEverything({ reduce = false } = {}) {
  const section = document.querySelector('.everything');
  if (!section) return;
  const wall = section.querySelector('.everything__wall');
  const word = (wall.dataset.word || 'BUILD').trim();
  const hl1 = (wall.dataset.hl1 || 'BREAK IT. FIX IT.').trim().split(/\s+/);
  const hl2 = (wall.dataset.hl2 || 'SHIP IT ANYWAY.').trim().split(/\s+/);
  let timers = [];
  const clearTimers = () => {
    timers.forEach((t) => cancelAnimationFrame(t.raf));
    timers = [];
  };

  const span = (text, cls = '') => {
    const s = document.createElement('span');
    s.className = `everything__w${cls ? ' ' + cls : ''}`;
    s.textContent = text;
    return s;
  };

  const build = () => {
    clearTimers();
    wall.innerHTML = '';
    wall.classList.remove('is-done');

    // narrow screens: shrink the type until each half of the phrase fits on
    // its row with a little wall still showing beside it
    wall.style.fontSize = '';
    const ph = span(hl1.join(' ').length >= hl2.join(' ').length ? hl1.join(' ') : hl2.join(' '));
    wall.appendChild(ph);
    const phW = ph.getBoundingClientRect().width;
    ph.remove();
    const room = section.clientWidth * 0.86;
    if (phW > room) wall.style.fontSize = `${(parseFloat(getComputedStyle(wall).fontSize) * room) / phW}px`;

    // how big one word and one row are at the wall's type size
    const probe = span(word + ' ');
    wall.appendChild(probe);
    const wordW = probe.getBoundingClientRect().width;
    const lineH = parseFloat(getComputedStyle(wall).lineHeight);
    probe.remove();

    const avail = section.clientHeight - parseFloat(getComputedStyle(wall).paddingTop);
    const rows = Math.max(6, Math.ceil(avail / lineH) + 1);
    const topRows = Math.max(1, Math.floor((rows - 2) / 2) - (rows % 2 ? 0 : 1));
    const bottomRows = rows - 2 - topRows;
    const perRow = Math.ceil(section.clientWidth / wordW) + 2;
    const words = (n) => Array.from({ length: n }, () => span(word + ' '));

    const top = []; // typed left to right, top row first
    const bottom = []; // typed right to left, bottom row first
    const phrase = [];

    // rows above: flush right, so they're cut off on the left
    for (let r = 0; r < topRows; r++) {
      const line = document.createElement('div');
      line.className = 'everything__line everything__line--top';
      const ws = words(perRow);
      ws.forEach((w) => line.appendChild(w));
      top.push(...ws);
      wall.appendChild(line);
    }

    // the first middle row: more words, then the first half of the phrase at the end
    const first = document.createElement('div');
    first.className = 'everything__line everything__line--first';
    const tail1 = document.createElement('span');
    tail1.className = 'everything__tail';
    const t1 = words(perRow);
    t1.forEach((w) => tail1.appendChild(w));
    top.push(...t1);
    const p1 = document.createElement('span');
    p1.className = 'everything__hl';
    hl1.forEach((h, i) => {
      const w = span(h + (i < hl1.length - 1 ? ' ' : ''));
      p1.appendChild(w);
      phrase.push(w);
    });
    first.append(tail1, p1);
    wall.appendChild(first);

    // the second middle row: the rest of the phrase, then more words
    const last = document.createElement('div');
    last.className = 'everything__line everything__line--last';
    const p2 = document.createElement('span');
    p2.className = 'everything__hl';
    hl2.forEach((h, i) => {
      const w = span(h + (i < hl2.length - 1 ? ' ' : ''));
      p2.appendChild(w);
      phrase.push(w);
    });
    const tail2 = document.createElement('span');
    tail2.className = 'everything__tail';
    const t2 = words(perRow);
    t2.forEach((w) => tail2.appendChild(w));
    last.append(p2, tail2);
    wall.appendChild(last);

    // rows below: nudged left a little each, cut off at both ends
    const below = [];
    for (let r = 0; r < bottomRows; r++) {
      const line = document.createElement('div');
      line.className = 'everything__line everything__line--bottom';
      line.style.marginLeft = `${-((r * 0.41 + 0.55) % 1) * wordW}px`;
      const ws = words(perRow);
      ws.forEach((w) => line.appendChild(w));
      below.push(ws);
      wall.appendChild(line);
    }
    // the bottom typewriter starts at the last row's right end and works up,
    // finishing at the start of the second middle row's words
    for (let r = below.length - 1; r >= 0; r--) bottom.push(...[...below[r]].reverse());
    bottom.push(...[...t2].reverse());

    // only the words you can actually see are worth waiting for
    const box = section.getBoundingClientRect();
    const seen = (w) => {
      const b = w.getBoundingClientRect();
      return b.right > box.left && b.left < box.right && b.top < box.bottom;
    };
    return { top: top.filter(seen), bottom: bottom.filter(seen), phrase };
  };

  const type = ({ top, bottom, phrase }) => {
    if (reduce) {
      wall.classList.add('is-done');
      return;
    }
    // one clock (requestAnimationFrame) drives both typewriters and the
    // phrase, so words land exactly on the beat instead of whenever hundreds
    // of separate timers happen to fire. Each word stomps in through a short
    // CSS animation (big, then settles), so nothing snaps.
    const start = performance.now() + 250;
    const sides = Math.max(top.length, bottom.length);
    const hlAt = sides * TICK + 80;
    const steps = [];
    top.forEach((w, i) => steps.push([i * TICK, w]));
    bottom.forEach((w, i) => steps.push([i * TICK, w]));
    phrase.forEach((w, i) => steps.push([hlAt + i * HL_TICK, w]));
    steps.sort((x, y) => x[0] - y[0]);
    const end = hlAt + phrase.length * HL_TICK + 200;
    let next = 0;
    let raf = 0;
    const frame = (now) => {
      const t = now - start;
      while (next < steps.length && steps[next][0] <= t) steps[next++][1].classList.add('is-on');
      if (t >= end) {
        wall.classList.add('is-done');
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    timers.push({ raf });
  };

  document.fonts.ready.then(() => {
    type(build());
    ScrollTrigger.refresh();
  });

  // scrolling on: the wall turns see-through behind whatever comes next
  if (!reduce) {
    gsap.to(section, {
      '--fade': 1,
      ease: 'none',
      // the wall stays put (it's sticky) while the page scrolls up over it,
      // so measure from the top of the page, over most of one screen
      scrollTrigger: { start: 0, end: () => window.innerHeight * 0.75, scrub: true, invalidateOnRefresh: true },
    });
  }

  // rebuild (already typed) when the window changes size enough to matter
  let lastW = window.innerWidth;
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (Math.abs(window.innerWidth - lastW) < 40) return;
      lastW = window.innerWidth;
      build();
      wall.classList.add('is-done');
    }, 200);
  });
}
